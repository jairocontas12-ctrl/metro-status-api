// Metro Status API - Versão 2.2 (Janeiro 2026)
// Scraping atualizado para estrutura atual do site

const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Cache em memória
let cachedData = null;
let lastFetch = null;
const CACHE_DURATION = 60000; // 1 minuto

// URL do site do Metrô (Janeiro 2026)
const METRO_URL = 'https://www.metro.sp.gov.br/direto-do-metro';

// Mapeamento de status
const STATUS_MAP = {
  'Operação Normal': { code: 0, description: 'Operação Normal' },
  'Operação normal': { code: 0, description: 'Operação Normal' },
  'Velocidade Reduzida': { code: 1, description: 'Velocidade Reduzida' },
  'Operação Encerrada': { code: 2, description: 'Operação Encerrada' },
  'Operação encerrada': { code: 2, description: 'Operação Encerrada' },
  'Paralisada': { code: 3, description: 'Paralisada' }
};

/**
 * Busca status de todas as linhas
 */
async function getLineStatus() {
  try {
    console.log('🔍 Buscando dados do Metrô...');
    
    const response = await axios.get(METRO_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const $ = cheerio.load(response.data);
    const lines = [];

    console.log('📄 HTML recebido, fazendo scraping...');

    // ESTRUTURA ATUAL: <ol> com <li> items
    // Cada <li> tem: número, nome da cor, status
    $('ol li').each((index, element) => {
      const $item = $(element);
      const fullText = $item.text().trim();
      
      // Extrair informações do texto
      // Formato: "1 Azul Operação Normal"
      const parts = fullText.split('\n').map(s => s.trim()).filter(Boolean);
      
      if (parts.length >= 3) {
        const number = parts[0];
        const color = parts[1];
        const status = parts[2];
        
        const statusInfo = STATUS_MAP[status] || { code: 0, description: status };
        
        lines.push({
          name: `Linha ${number} - ${color}`,
          number: number,
          status: statusInfo.code,
          statusDescription: status,
          description: status,
          lastUpdate: new Date().toISOString()
        });
        
        console.log(`✅ Linha ${number} - ${color}: ${status}`);
      }
    });

    // Fallback: tentar estrutura alternativa se não encontrou nada
    if (lines.length === 0) {
      console.log('⚠️ Tentando estrutura alternativa...');
      
      // Tentar capturar todo o texto e parsear
      const mainContent = $('#main').text() || $('main').text() || $('body').text();
      
      // Procurar padrões como "1 Azul Operação Normal"
      const linePattern = /(\d+)\s+(Azul|Verde|Vermelha|Amarela|Lilás|Prata|Coral|Diamante|Esmeralda|Turquesa|Safira|Jade)\s+(.+?)(?=\d+\s+[A-Z]|Atualizado|$)/gi;
      let match;
      
      while ((match = linePattern.exec(mainContent)) !== null) {
        const number = match[1];
        const color = match[2];
        const status = match[3].trim();
        
        const statusInfo = STATUS_MAP[status] || { code: 0, description: status };
        
        lines.push({
          name: `Linha ${number} - ${color}`,
          number: number,
          status: statusInfo.code,
          statusDescription: status,
          description: status,
          lastUpdate: new Date().toISOString()
        });
        
        console.log(`✅ [Fallback] Linha ${number} - ${color}: ${status}`);
      }
    }

    if (lines.length === 0) {
      console.error('❌ Nenhuma linha encontrada!');
      throw new Error('Nenhuma linha encontrada no scraping');
    }

    console.log(`✅ Total: ${lines.length} linhas encontradas`);
    return lines;

  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
    throw error;
  }
}

/**
 * Obtém dados com cache
 */
async function getCachedLineStatus() {
  const now = Date.now();
  
  if (cachedData && lastFetch && (now - lastFetch) < CACHE_DURATION) {
    console.log('📦 Retornando dados do cache');
    return { lines: cachedData, cached: true };
  }

  try {
    const lines = await getLineStatus();
    cachedData = lines;
    lastFetch = now;
    return { lines, cached: false };
  } catch (error) {
    if (cachedData) {
      console.warn('⚠️ Usando cache devido a erro:', error.message);
      return { 
        lines: cachedData, 
        cached: true,
        warning: 'Dados em cache devido a erro na atualização'
      };
    }
    throw error;
  }
}

/**
 * ROTAS DA API
 */

// GET / - Todas as linhas
app.get('/', async (req, res) => {
  try {
    const data = await getCachedLineStatus();
    res.json({
      lines: data.lines,
      lastUpdate: new Date().toISOString(),
      cached: data.cached,
      ...(data.warning && { warning: data.warning })
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar dados do metrô',
      message: error.message,
      details: 'O site do Metrô pode estar temporariamente indisponível'
    });
  }
});

// GET /line/:number - Linha específica por número
app.get('/line/:number', async (req, res) => {
  try {
    const { number } = req.params;
    const data = await getCachedLineStatus();
    
    const line = data.lines.find(l => l.number === number);
    
    if (!line) {
      return res.status(404).json({
        error: 'Linha não encontrada',
        availableLines: data.lines.map(l => ({ number: l.number, name: l.name }))
      });
    }
    
    res.json({ ...line, cached: data.cached });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar linha', message: error.message });
  }
});

// GET /line/name/:name - Linha específica por nome
app.get('/line/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const data = await getCachedLineStatus();
    
    const line = data.lines.find(l => 
      l.name.toLowerCase().includes(name.toLowerCase())
    );
    
    if (!line) {
      return res.status(404).json({
        error: 'Linha não encontrada',
        availableLines: data.lines.map(l => l.name)
      });
    }
    
    res.json(line);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar linha', message: error.message });
  }
});

// GET /health - Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.2',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cacheAge: lastFetch ? Date.now() - lastFetch : null,
    hasCachedData: !!cachedData,
    metroUrl: METRO_URL
  });
});

// GET /stats - Estatísticas
app.get('/stats', async (req, res) => {
  try {
    const data = await getCachedLineStatus();
    
    const stats = {
      totalLines: data.lines.length,
      byStatus: {},
      operational: 0,
      nonOperational: 0,
      lastUpdate: new Date().toISOString(),
      cached: data.cached
    };
    
    data.lines.forEach(line => {
      stats.byStatus[line.status] = (stats.byStatus[line.status] || 0) + 1;
      if (line.status === 0) stats.operational++;
      else stats.nonOperational++;
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar estatísticas', message: error.message });
  }
});

// GET /status/:statusCode - Linhas por status
app.get('/status/:statusCode', async (req, res) => {
  try {
    const code = parseInt(req.params.statusCode);
    const data = await getCachedLineStatus();
    
    const filtered = data.lines.filter(l => l.status === code);
    
    if (filtered.length === 0) {
      return res.status(404).json({
        error: 'Nenhuma linha com este status',
        availableStatuses: [...new Set(data.lines.map(l => l.status))]
      });
    }
    
    res.json({ statusCode: code, count: filtered.length, lines: filtered });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar por status', message: error.message });
  }
});

// GET /problems - Apenas problemas
app.get('/problems', async (req, res) => {
  try {
    const data = await getCachedLineStatus();
    const problems = data.lines.filter(l => l.status !== 0);
    
    res.json({
      hasProblems: problems.length > 0,
      count: problems.length,
      lines: problems,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar problemas', message: error.message });
  }
});

// POST /refresh - Forçar atualização
app.post('/refresh', async (req, res) => {
  try {
    cachedData = null;
    lastFetch = null;
    const data = await getCachedLineStatus();
    
    res.json({
      message: 'Cache atualizado',
      linesCount: data.lines.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar', message: error.message });
  }
});

// GET /info - Informações da API
app.get('/info', (req, res) => {
  res.json({
    name: 'Metro Status API - São Paulo',
    version: '2.2.0',
    updated: 'Janeiro 2026',
    description: 'API em tempo real - Metrô de SP',
    sourceUrl: METRO_URL,
    endpoints: {
      'GET /': 'Todas as linhas',
      'GET /line/:number': 'Linha por número',
      'GET /line/name/:name': 'Linha por nome',
      'GET /health': 'Health check',
      'GET /stats': 'Estatísticas',
      'GET /status/:code': 'Por status',
      'GET /problems': 'Só problemas',
      'GET /info': 'Esta página',
      'POST /refresh': 'Forçar atualização'
    },
    statusCodes: {
      0: 'Normal', 1: 'Vel. Reduzida', 2: 'Encerrada', 3: 'Paralisada'
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    suggestion: 'Acesse /info para ver rotas disponíveis'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚇 Metro Status API v2.2 (Jan 2026)');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🌐 URL: ${METRO_URL}`);
  console.log('✅ Cache: 1 minuto');
  console.log('✅ Scraping: Estrutura atual + fallback');
  console.log('🎯 Acesse /info para detalhes\n');
});

module.exports = { app, getLineStatus };

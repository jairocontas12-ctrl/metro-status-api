// Metro Status API - Versão Atualizada (Janeiro 2026)
// URL e scraping atualizados para o novo site do Metrô

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

// URL ATUALIZADA do site do Metrô (Janeiro 2026)
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
 * Busca status de todas as linhas (scraping do site oficial)
 */
async function getLineStatus() {
  try {
    const response = await axios.get(METRO_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    const $ = cheerio.load(response.data);
    const lines = [];

    // Novo scraping baseado na estrutura atual do site
    $('ol li').each((index, element) => {
      const $item = $(element);
      
      // Extrair número e nome da linha
      const numberText = $item.find('.numero-linha').text().trim();
      const colorText = $item.find('.nome-linha').text().trim();
      
      // Extrair status
      const statusText = $item.find('.status-linha').text().trim() || 'Operação Normal';
      
      if (numberText && colorText) {
        const statusInfo = STATUS_MAP[statusText] || { 
          code: 99, 
          description: statusText 
        };

        const lineName = `Linha ${numberText} - ${colorText}`;

        lines.push({
          name: lineName,
          number: numberText,
          status: statusInfo.code,
          statusDescription: statusText,
          description: statusText,
          lastUpdate: new Date().toISOString()
        });
      }
    });

    // Se não encontrou nada com a nova estrutura, tenta estrutura antiga
    if (lines.length === 0) {
      $('.cards-item').each((index, element) => {
        const $card = $(element);
        
        const name = $card.find('.titulos, .titulo, h3, h2').first().text().trim();
        const statusText = $card.find('.operacao, .status').first().text().trim();
        const description = $card.find('.description, .descricao').first().text().trim();
        
        if (name) {
          const statusInfo = STATUS_MAP[statusText] || { 
            code: 99, 
            description: statusText || 'Operação Normal'
          };

          lines.push({
            name: name,
            number: extractLineNumber(name),
            status: statusInfo.code,
            statusDescription: statusText || 'Operação Normal',
            description: description || statusText || 'Operação Normal',
            lastUpdate: new Date().toISOString()
          });
        }
      });
    }

    if (lines.length === 0) {
      throw new Error('Nenhuma linha encontrada no scraping');
    }

    return lines;

  } catch (error) {
    console.error('Erro ao buscar dados do metrô:', error.message);
    throw error;
  }
}

/**
 * Extrai número da linha
 */
function extractLineNumber(name) {
  const match = name.match(/Linha\s+(\d+)/i) || name.match(/(\d+)\s*-/);
  return match ? match[1] : null;
}

/**
 * Obtém dados com cache
 */
async function getCachedLineStatus() {
  const now = Date.now();
  
  if (cachedData && lastFetch && (now - lastFetch) < CACHE_DURATION) {
    return { lines: cachedData, cached: true };
  }

  try {
    const lines = await getLineStatus();
    cachedData = lines;
    lastFetch = now;
    return { lines, cached: false };
  } catch (error) {
    if (cachedData) {
      console.warn('Usando cache devido a erro:', error.message);
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
    version: '2.1.0',
    updated: 'Janeiro 2026',
    description: 'API em tempo real - Metrô, CPTM e Via Quatro',
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
      0: 'Normal', 1: 'Vel. Reduzida', 2: 'Encerrada', 3: 'Paralisada', 99: 'Desconhecido'
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
  console.log('🚇 Metro Status API v2.1 (Atualizado Jan 2026)');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🌐 URL Metrô: ${METRO_URL}`);
  console.log('✅ Cache ativo (1 min)');
  console.log('✅ 9 endpoints disponíveis');
  console.log('🎯 Acesse /info para detalhes\n');
});

module.exports = { app, getLineStatus };

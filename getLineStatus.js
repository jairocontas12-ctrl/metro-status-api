const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const config = require('./configs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =====================================================
// CACHE
// =====================================================
let cache = {
  data: null,
  timestamp: null,
  duration: config.CACHE_DURATION || 60000
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================
function normalizeText(str) {
  return String(str || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStatusCode(statusText) {
  const text = normalizeText(statusText).toLowerCase();

  // você pode ajustar conforme quiser
  if (
    text.includes('normal') ||
    text.includes('opera') && text.includes('normal')
  ) return 0;

  if (
    text.includes('reduzida') ||
    text.includes('velocidade reduzida')
  ) return 1;

  if (
    text.includes('encerrada') ||
    text.includes('fechada')
  ) return 2;

  if (
    text.includes('paralisada') ||
    text.includes('interrompida')
  ) return 3;

  return 99; // desconhecido
}

function buildDefaultLines(reason = 'Sem status detectável no HTML') {
  const now = new Date().toISOString();

  // linhas do Metrô (as do site oficial)
  const base = [
    { number: '1', color: 'Azul' },
    { number: '2', color: 'Verde' },
    { number: '3', color: 'Vermelha' },
    { number: '15', color: 'Prata' }
  ];

  return base.map((l) => ({
    name: `Linha ${l.number} - ${l.color}`,
    number: l.number,
    status: 99,
    statusDescription: reason,
    lastUpdate: now,
    source: config.METRO_URL
  }));
}

function isCacheValid() {
  if (!cache.data || !cache.timestamp) return false;
  return (Date.now() - cache.timestamp) < cache.duration;
}

// =====================================================
// SCRAPER "ADAPTATIVO"
// =====================================================
async function scrapeMetroStatus() {
  const metroUrl = config.METRO_URL;

  if (!metroUrl || typeof metroUrl !== 'string') {
    throw new Error('METRO_URL não está definido corretamente no configs.js');
  }

  console.log('Buscando dados do site do Metrô:', metroUrl);

  const response = await axios.get(metroUrl, {
    timeout: config.REQUEST_TIMEOUT || 15000,
    headers: {
      'User-Agent': config.USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    validateStatus: (status) => status >= 200 && status < 400
  });

  const html = response.data;
  const $ = cheerio.load(html);

  const nowIso = new Date().toISOString();
  const lines = [];

  // -----------------------------------------------------
  // TENTATIVA 1:
  // procurar por textos que contenham "Linha X" e um status conhecido
  // (isso é mais resiliente do que depender de "ol li")
  // -----------------------------------------------------
  const fullText = normalizeText($.text());

  // tenta achar padrões comuns:
  // Ex: "Linha 1 - Azul ... Operação Normal"
  // Ex: "Linha 2-Verde ... Velocidade reduzida"
  const regex = /Linha\s*(\d{1,2})\s*[-–]?\s*([A-Za-zÀ-ÿ]+)?([\s\S]{0,120})/gi;

  let match;
  const found = new Map();

  while ((match = regex.exec(fullText)) !== null) {
    const num = normalizeText(match[1]);
    const color = normalizeText(match[2]);

    const chunk = normalizeText((match[2] || '') + ' ' + (match[3] || ''));
    const lowerChunk = chunk.toLowerCase();

    const hasStatusWord =
      lowerChunk.includes('normal') ||
      lowerChunk.includes('reduzida') ||
      lowerChunk.includes('velocidade reduzida') ||
      lowerChunk.includes('paralisada') ||
      lowerChunk.includes('interrompida') ||
      lowerChunk.includes('encerrada') ||
      lowerChunk.includes('fechada');

    if (!num) continue;

    // evita duplicar
    if (!found.has(num) && hasStatusWord) {
      // extrai status description com um “resumo”
      let desc = chunk;

      // corta se ficar muito grande
      if (desc.length > 140) desc = desc.slice(0, 140) + '...';

      const finalColor = color ? color : 'Sem cor';
      found.set(num, {
        name: `Linha ${num} - ${finalColor}`,
        number: num,
        status: getStatusCode(desc),
        statusDescription: desc,
        lastUpdate: nowIso,
        source: metroUrl
      });
    }
  }

  // adiciona o que achou
  for (const item of found.values()) {
    lines.push(item);
  }

  // -----------------------------------------------------
  // Se não encontrou nada confiável no HTML:
  // devolve linhas padrão com status "desconhecido"
  // (em vez de quebrar sua API)
  // -----------------------------------------------------
  if (lines.length === 0) {
    console.log('Nenhuma linha com status detectável no HTML. Retornando fallback.');
    return buildDefaultLines('Sem status detectável no HTML (página pode ser apenas informativa)');
  }

  console.log(`Encontradas ${lines.length} linhas com status`);
  return lines;
}

// =====================================================
// GET DATA (CACHE + FALLBACK)
// =====================================================
async function getData() {
  if (isCacheValid()) {
    console.log('Usando cache');
    return {
      lines: cache.data,
      lastUpdate: new Date(cache.timestamp).toISOString(),
      cached: true
    };
  }

  try {
    const lines = await scrapeMetroStatus();
    cache.data = lines;
    cache.timestamp = Date.now();

    return {
      lines,
      lastUpdate: new Date().toISOString(),
      cached: false
    };
  } catch (error) {
    console.error('Erro ao buscar dados do Metrô:', error.message);

    // se já tiver cache, devolve cache
    if (cache.data) {
      return {
        lines: cache.data,
        lastUpdate: new Date(cache.timestamp).toISOString(),
        cached: true,
        warning: 'Falha ao atualizar, retornando dados do cache'
      };
    }

    // se não tiver cache, devolve fallback em vez de quebrar
    const fallback = buildDefaultLines(`Erro ao acessar fonte: ${error.message}`);
    cache.data = fallback;
    cache.timestamp = Date.now();

    return {
      lines: fallback,
      lastUpdate: new Date().toISOString(),
      cached: false,
      warning: 'Retornando fallback por falha na fonte'
    };
  }
}

// =====================================================
// ROTAS
// =====================================================
app.get('/', async (req, res) => {
  try {
    const data = await getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar dados',
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    cache: {
      hasData: cache.data !== null,
      lastCacheUpdate: cache.timestamp ? new Date(cache.timestamp).toISOString() : null
    }
  });
});

app.get('/stats', async (req, res) => {
  try {
    const data = await getData();
    res.json({
      totalLines: data.lines.length,
      lastUpdate: data.lastUpdate,
      cached: data.cached
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('API rodando na porta ' + PORT);
  console.log('Rotas disponíveis: /  |  /health  |  /stats');
});

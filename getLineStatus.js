const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const config = require("./configs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Cache em memória (seguro e simples)
let cache = {
  data: null,
  timestamp: null,
  duration: config.CACHE_DURATION || 60000
};

// Guarda infos pra debug quando der problema
let lastDebug = {
  lastUrlTried: null,
  lastError: null,
  lastHtmlPreview: null,
  lastCandidatesCount: 0,
  lastParsedLinesCount: 0,
  lastAttemptAt: null
};

function normalizeText(text) {
  return String(text || "")
    .replace(/\u00A0/g, " ") // &nbsp;
    .replace(/\s+/g, " ")
    .trim();
}

function getStatusCode(statusText) {
  const t = normalizeText(statusText).toLowerCase();

  if (t.includes("normal")) return 0;

  if (
    t.includes("reduzida") ||
    t.includes("velocidade reduzida") ||
    t.includes("parcial") ||
    t.includes("atenção") ||
    t.includes("atencao") ||
    t.includes("lent") ||
    t.includes("operação parcial") ||
    t.includes("operacao parcial")
  ) {
    return 1;
  }

  if (t.includes("encerrad")) return 2;

  if (
    t.includes("paralisad") ||
    t.includes("interromp") ||
    t.includes("suspens") ||
    t.includes("bloquead")
  ) {
    return 3;
  }

  return 99;
}

/**
 * Extrai Linha, cor e status de textos variados
 * Exemplos:
 * "Linha 1 - Azul Operação Normal"
 * "1 - Azul - Operação Normal"
 * "Linha 4 Amarela Velocidade Reduzida"
 */
function parseLineFromText(fullText) {
  const text = normalizeText(fullText);

  // formato com hífen
  const regexHyphen = /(?:linha\s*)?(\d+)\s*[-–]\s*([A-Za-zÀ-ÿ]+)\s*(.+)$/i;
  const m1 = text.match(regexHyphen);
  if (m1) {
    const number = normalizeText(m1[1]);
    const color = normalizeText(m1[2]);
    const statusText = normalizeText(m1[3]);

    if (!number || !color || !statusText) return null;

    return { number, color, statusText };
  }

  // formato solto: "Linha 1 Azul Operação Normal"
  const regexLoose = /(?:linha\s*)?(\d+)\s+([A-Za-zÀ-ÿ]+)\s+(.+)$/i;
  const m2 = text.match(regexLoose);
  if (m2) {
    const number = normalizeText(m2[1]);
    const color = normalizeText(m2[2]);
    const statusText = normalizeText(m2[3]);

    if (!number || !color || !statusText) return null;

    return { number, color, statusText };
  }

  return null;
}

/**
 * Coleta candidatos do DOM usando várias estratégias
 * (isso deixa o scraping resistente a mudanças no HTML)
 */
function collectCandidates($) {
  const candidates = [];

  // Estratégia 1: listas comuns
  $("ol li, ul li").each((_, el) => {
    const t = normalizeText($(el).text());
    if (t) candidates.push(t);
  });

  // Estratégia 2: caça textos curtos que contenham "Linha X"
  if (candidates.length === 0) {
    $("body *").each((_, el) => {
      const t = normalizeText($(el).text());
      if (!t) return;

      // evita capturar textos enormes repetidos
      if (t.length > 160) return;

      if (/linha\s*\d+/i.test(t) || /^\d+\s*[-–]/.test(t)) {
        candidates.push(t);
      }
    });
  }

  return Array.from(new Set(candidates));
}

async function fetchHtml(url) {
  const safeUrl = String(url || "").trim();

  if (!safeUrl || (!safeUrl.startsWith("http://") && !safeUrl.startsWith("https://"))) {
    throw new Error(`URL inválida: "${safeUrl}"`);
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };

  // Retry leve (2 tentativas)
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await axios.get(safeUrl, {
        timeout: 15000,
        headers
      });

      return String(res.data);
    } catch (err) {
      lastError = err;
      if (attempt === 1) await new Promise((r) => setTimeout(r, 450));
    }
  }

  throw lastError || new Error("Falha ao buscar HTML");
}

async function scrapeFromUrl(url) {
  lastDebug.lastUrlTried = url;
  lastDebug.lastAttemptAt = new Date().toISOString();
  lastDebug.lastError = null;
  lastDebug.lastHtmlPreview = null;
  lastDebug.lastCandidatesCount = 0;
  lastDebug.lastParsedLinesCount = 0;

  const html = await fetchHtml(url);

  // preview pra debug quando precisar
  lastDebug.lastHtmlPreview = normalizeText(html).slice(0, 350);

  const $ = cheerio.load(html);
  const candidates = collectCandidates($);

  lastDebug.lastCandidatesCount = candidates.length;

  const lines = [];

  for (const text of candidates) {
    const parsed = parseLineFromText(text);
    if (!parsed) continue;

    lines.push({
      name: `Linha ${parsed.number} - ${parsed.color}`,
      number: parsed.number,
      status: getStatusCode(parsed.statusText),
      statusDescription: parsed.statusText,
      lastUpdate: new Date().toISOString()
    });
  }

  // remove duplicados por number
  const uniqueByNumber = new Map();
  for (const line of lines) uniqueByNumber.set(line.number, line);

  const finalLines = Array.from(uniqueByNumber.values()).sort((a, b) => {
    const na = Number(a.number);
    const nb = Number(b.number);
    if (Number.isNaN(na) || Number.isNaN(nb)) return 0;
    return na - nb;
  });

  lastDebug.lastParsedLinesCount = finalLines.length;

  return finalLines;
}

async function scrapeMetroStatus() {
  const urls = Array.isArray(config.METRO_URLS) ? config.METRO_URLS : [];

  if (urls.length === 0) {
    throw new Error("Nenhuma URL configurada em METRO_URLS no configs.js");
  }

  let lastError = null;

  for (const url of urls) {
    try {
      console.log("Tentando fonte:", url);

      const lines = await scrapeFromUrl(url);

      if (lines.length > 0) {
        console.log("OK! Linhas encontradas:", lines.length);
        return lines;
      }

      throw new Error("Nenhuma linha encontrada nesta fonte");
    } catch (err) {
      lastError = err;
      lastDebug.lastError = err.message;
      console.log("Falhou nesta fonte:", url, "| Motivo:", err.message);
    }
  }

  throw lastError || new Error("Falha em todas as fontes");
}

function isCacheValid() {
  if (!cache.data || !cache.timestamp) return false;
  return Date.now() - cache.timestamp < cache.duration;
}

async function getData() {
  // Cache válido
  if (isCacheValid()) {
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
    // Fallback pro cache antigo (se existir)
    if (cache.data) {
      return {
        lines: cache.data,
        lastUpdate: new Date(cache.timestamp).toISOString(),
        cached: true,
        warning: "Falha ao atualizar agora, retornando cache antigo"
      };
    }

    throw error;
  }
}

// ==========================
// ROTAS
// ==========================

app.get("/", async (req, res) => {
  try {
    const data = await getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Erro ao buscar dados",
      message: error.message
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    cache: {
      hasData: cache.data !== null,
      isValid: isCacheValid()
    }
  });
});

app.get("/stats", async (req, res) => {
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

// Rota de debug (pra você ver se o site mudou)
app.get("/debug", (req, res) => {
  res.json({
    sources: config.METRO_URLS,
    lastDebug
  });
});

// ==========================
// START
// ==========================
app.listen(PORT, () => {
  console.log("API rodando na porta " + PORT);
  console.log("Pronto para receber requisicoes");
});

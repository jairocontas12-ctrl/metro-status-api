const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const config = require("./configs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let cache = {
  data: null,
  timestamp: null,
  duration: 60000, // 60s
};

function normalizeText(text) {
  return String(text || "")
    .replace(/\u00A0/g, " ")
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
    t.includes("lent")
  ) {
    return 1;
  }

  if (t.includes("encerrad")) return 2;

  if (t.includes("paralisad") || t.includes("interromp") || t.includes("suspens")) {
    return 3;
  }

  return 99;
}

function parseLineFromText(fullText) {
  const text = normalizeText(fullText);

  // Ex: "Linha 1 - Azul Operação Normal" | "1 - Azul Operação Normal"
  const regexHyphen = /(?:linha\s*)?(\d+)\s*[-–]\s*([A-Za-zÀ-ÿ]+)\s*(.+)$/i;
  const m1 = text.match(regexHyphen);
  if (m1) {
    const number = normalizeText(m1[1]);
    const color = normalizeText(m1[2]);
    const statusText = normalizeText(m1[3]);

    if (!number || !color || !statusText) return null;

    return { number, color, statusText };
  }

  // fallback: "Linha 1 Azul Operação Normal"
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

function collectCandidates($) {
  const candidates = [];

  // tenta listas comuns
  $("ol li, ul li").each((_, el) => {
    const t = normalizeText($(el).text());
    if (t) candidates.push(t);
  });

  // fallback: caça qualquer texto curto que tenha "Linha"
  $("body *").each((_, el) => {
    const t = normalizeText($(el).text());
    if (!t) return;

    // evita pegar blocos enormes repetidos
    if (t.length > 140) return;

    if (/linha\s*\d+/i.test(t) || /^\d+\s*[-–]/.test(t)) {
      candidates.push(t);
    }
  });

  // remove duplicados
  return Array.from(new Set(candidates));
}

async function scrapeMetroStatus() {
  console.log("Buscando dados do site do Metro...");

  const metroUrl = String(config.METRO_URL || "").trim();

  if (!metroUrl || (!metroUrl.startsWith("http://") && !metroUrl.startsWith("https://"))) {
    throw new Error(`METRO_URL inválida: "${metroUrl}"`);
  }

  const response = await axios.get(metroUrl, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const $ = cheerio.load(String(response.data));
  const candidates = collectCandidates($);

  const lines = [];

  for (const text of candidates) {
    const parsed = parseLineFromText(text);
    if (!parsed) continue;

    lines.push({
      name: `Linha ${parsed.number} - ${parsed.color}`,
      number: parsed.number,
      status: getStatusCode(parsed.statusText),
      statusDescription: parsed.statusText,
      lastUpdate: new Date().toISOString(),
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

  if (finalLines.length === 0) {
    throw new Error("Nenhuma linha encontrada (a estrutura do site pode ser diferente)");
  }

  console.log(`Encontradas ${finalLines.length} linhas`);
  return finalLines;
}

function isCacheValid() {
  if (!cache.data || !cache.timestamp) return false;
  return Date.now() - cache.timestamp < cache.duration;
}

async function getData() {
  if (isCacheValid()) {
    console.log("Usando cache");
    return {
      lines: cache.data,
      lastUpdate: new Date(cache.timestamp).toISOString(),
      cached: true,
    };
  }

  try {
    const lines = await scrapeMetroStatus();
    cache.data = lines;
    cache.timestamp = Date.now();

    return {
      lines,
      lastUpdate: new Date().toISOString(),
      cached: false,
    };
  } catch (error) {
    // fallback se já tinha cache
    if (cache.data) {
      return {
        lines: cache.data,
        lastUpdate: new Date(cache.timestamp).toISOString(),
        cached: true,
      };
    }
    throw error;
  }
}

// ROTAS
app.get("/", async (req, res) => {
  try {
    const data = await getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Erro ao buscar dados",
      message: error.message,
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    cache: {
      hasData: cache.data !== null,
    },
  });
});

app.get("/stats", async (req, res) => {
  try {
    const data = await getData();
    res.json({
      totalLines: data.lines.length,
      lastUpdate: data.lastUpdate,
      cached: data.cached,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// START
app.listen(PORT, () => {
  console.log("API rodando na porta " + PORT);
  console.log("Pronto para receber requisicoes");
});

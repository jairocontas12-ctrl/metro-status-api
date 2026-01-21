const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const config = require("./configs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================
// CACHE (STATUS)
// ============================
let cache = {
  data: null,
  timestamp: null,
  duration: config.CACHE_DURATION || 30000,
};

// ============================
// CACHE (MOTIVOS) - separado
// ============================
let reasonCache = {
  map: new Map(), // key normalizada -> { motivo, ocorridoEm, situacao }
  timestamp: null,
  duration: config.REASON_CACHE_DURATION || 45000, // 45s padrão
};

let lastDebug = {
  source: "CCM/ARTESP",
  lastUrl: null,
  lastOccUrl: null,
  lastError: null,
  lastOccError: null,
  lastAttemptAt: null,
  lastOccAttemptAt: null,
  parsedCount: 0,
  occParsedCount: 0,
};

// ============================
// HELPERS
// ============================
function normalizeText(str) {
  return String(str || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normKey(str) {
  return normalizeText(str)
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ");
}

// 0 = normal | 1 = reduzida/parcial | 2 = encerrada | 3 = paralisada | 99 = desconhecido
function statusToCode(statusText) {
  const t = normalizeText(statusText).toLowerCase();

  if (t.includes("normal")) return 0;

  if (
    t.includes("reduzida") ||
    t.includes("parcial") ||
    t.includes("programada") ||
    t.includes("maiores intervalos") ||
    t.includes("aten") // atenção/atencao
  ) {
    return 1;
  }

  if (t.includes("encerrad")) return 2;

  if (t.includes("paralisad") || t.includes("interrompid") || t.includes("suspens")) {
    return 3;
  }

  return 99;
}

// "Linha 10 - Turquesa" ou "Linha 10-Turquesa"
function parseLineHeader(text) {
  const t = normalizeText(text);
  const m = t.match(/^Linha\s*(\d{1,2})\s*[-–]\s*(.+)$/i);
  if (!m) return null;

  return {
    number: m[1],
    color: normalizeText(m[2]),
    name: `Linha ${m[1]}-${normalizeText(m[2])}`,
  };
}

function tryFindOperator($, headingEl) {
  // tenta achar um H2 acima como "Metrô", "CPTM", "ViaMobilidade", etc
  let op = normalizeText($(headingEl).prevAll("h2").first().text());
  if (op) return op;

  // fallback: procura dentro de um container
  const section = $(headingEl).closest("section, article, div");
  op = normalizeText(section.find("h2").first().text());
  return op || "";
}

function extractInfoFromContainer(textBlock) {
  const t = String(textBlock || "");

  let status = "";
  const ms = t.match(/Situaç[aã]o:\s*([^\n\r]+)/i);
  if (ms) status = normalizeText(ms[1]);

  let updated = "";
  const mu = t.match(/Atualizado\s*([^\n\r]+)/i);
  if (mu) updated = normalizeText(mu[1]);

  let stationsCount = null;
  const me = t.match(/(\d+)\s*estaç/i);
  if (me) stationsCount = Number(me[1]);

  return { status, updated, stationsCount };
}

function findBestContainer($, headingEl) {
  // sobe alguns níveis procurando um bloco que contenha "Situação:" ou "Atualizado"
  let cur = $(headingEl);
  for (let i = 0; i < 7; i++) {
    const parent = cur.parent();
    if (!parent || parent.length === 0) break;

    const text = parent.text();
    if (/Situaç[aã]o\s*:/i.test(text) || /Atualizado/i.test(text)) {
      return parent;
    }
    cur = parent;
  }
  return $(headingEl).parent();
}

// ============================
// FETCH CCM/ARTESP - OCORRÊNCIAS (MOTIVO AO VIVO)
// ============================
function isReasonCacheValid() {
  if (!reasonCache.timestamp) return false;
  return Date.now() - reasonCache.timestamp < reasonCache.duration;
}

/**
 * Pega a ocorrência mais recente por linha no CCM/ARTESP (ocorrências)
 * e monta um Map: chave normalizada -> { motivo, ocorridoEm, situacao }
 *
 * Observação: isso NÃO é “histórico”. É só o último evento publicado.
 */
async function fetchCCMOcorrenciasLatest() {
  const occUrl = String(config.CCM_OCCURRENCES_URL || "").trim();

  // Se não configurar, simplesmente retorna vazio (não derruba a API)
  if (!occUrl || (!occUrl.startsWith("http://") && !occUrl.startsWith("https://"))) {
    return { url: occUrl || null, map: new Map(), parsed: 0 };
  }

  lastDebug.lastOccUrl = occUrl;
  lastDebug.lastOccAttemptAt = new Date().toISOString();
  lastDebug.lastOccError = null;

  const html = (
    await axios.get(occUrl, {
      timeout: config.REQUEST_TIMEOUT || 15000,
      headers: {
        "User-Agent": config.USER_AGENT,
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    })
  ).data;

  const $ = cheerio.load(String(html));
  const map = new Map();
  let parsed = 0;

  // Tenta capturar uma tabela padrão
  const rows = $("table tbody tr");

  rows.each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 4) return;

    const ocorridoEm = normalizeText($(tds[0]).text());
    const linhaTxt = normalizeText($(tds[1]).text()); // ex: "Linha 9 - Esmeralda"
    const situacao = normalizeText($(tds[3]).text());

    if (!linhaTxt) return;

    // Descrição às vezes fica em uma linha “detalhe” logo após o tr
    let descricao = "";
    const next = $(tr).next();
    const nextTds = next.find("td");
    const nextText = normalizeText(next.text());

    // Heurística: detalhe costuma ser linha com poucas colunas e texto grande
    if (nextText && nextText.length > 10 && nextTds.length <= 2) {
      descricao = nextText;
    }

    // fallback: tenta extrair algo entre aspas (quando o layout coloca assim)
    if (!descricao) {
      const raw = normalizeText($(tr).text());
      const m = raw.match(/"([^"]{8,})"/);
      if (m) descricao = normalizeText(m[1]);
    }

    const key = normKey(linhaTxt); // normaliza
    if (!map.has(key)) {
      map.set(key, { motivo: descricao || "", ocorridoEm, situacao });
      parsed += 1;
    }
  });

  return { url: occUrl, map, parsed };
}

async function getReasonsMap() {
  if (isReasonCacheValid() && reasonCache.map.size > 0) return { map: reasonCache.map, source: "cache" };

  try {
    const { url, map, parsed } = await fetchCCMOcorrenciasLatest();
    reasonCache.map = map;
    reasonCache.timestamp = Date.now();
    lastDebug.occParsedCount = parsed;
    return { map, source: url ? "CCM/ARTESP" : "disabled" };
  } catch (err) {
    lastDebug.lastOccError = err.message;

    // fallback: usa cache anterior se existir
    if (reasonCache.map && reasonCache.map.size > 0) {
      return { map: reasonCache.map, source: "cache_fallback" };
    }

    return { map: new Map(), source: "error" };
  }
}

// ============================
// FETCH CCM/ARTESP - STATUS
// ============================
async function fetchCCMStatus() {
  const url = String(config.CCM_STATUS_URL || "").trim();
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    throw new Error(`CCM_STATUS_URL inválida no configs.js: "${url}"`);
  }

  lastDebug.lastUrl = url;
  lastDebug.lastAttemptAt = new Date().toISOString();
  lastDebug.lastError = null;

  // pega mapa de motivos (ao vivo) uma vez
  const reasons = await getReasonsMap();

  const html = (
    await axios.get(url, {
      timeout: config.REQUEST_TIMEOUT || 15000,
      headers: {
        "User-Agent": config.USER_AGENT,
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    })
  ).data;

  const $ = cheerio.load(String(html));

  // procura headings do tipo "Linha X - Cor"
  const headingEls = [];
  $("h1, h2, h3, h4, h5, strong").each((_, el) => {
    const t = normalizeText($(el).text());
    if (/^Linha\s*\d{1,2}\s*[-–]/i.test(t)) headingEls.push(el);
  });

  const lines = [];

  for (const el of headingEls) {
    const headerText = normalizeText($(el).text());
    const parsed = parseLineHeader(headerText);
    if (!parsed) continue;

    const operator = tryFindOperator($, el);
    const container = findBestContainer($, el);
    const containerText = container.text();

    const info = extractInfoFromContainer(containerText);

    // se não achou "Situação:", tenta achar palavras importantes dentro do bloco
    let statusText = info.status;
    if (!statusText) {
      const ms2 = containerText.match(
        /(Operaç[aã]o\s+(Normal|Parcial|Paralisada|Encerrada)|Velocidade\s+Reduzida|Atividade\s+Programada|Maiores\s+Intervalos)/i
      );
      if (ms2) statusText = normalizeText(ms2[0]);
    }

    if (!statusText) statusText = "Indisponível";

    const code = statusToCode(statusText);
    const isProblem = code !== 0;

    // tenta casar com o mapa de ocorrências
    let reason = "";
    let reasonAt = "";
    let reasonStatus = "";

    if (isProblem && reasons.map && reasons.map.size > 0) {
      const wanted1 = normKey(parsed.name); // "linha 9-esmeralda"
      const wanted2 = normKey(`linha ${parsed.number}`); // "linha 9"

      // procura chave que contenha o número da linha
      for (const [k, v] of reasons.map.entries()) {
        if (k.includes(wanted1) || k.includes(wanted2)) {
          reason = v.motivo || "";
          reasonAt = v.ocorridoEm || "";
          reasonStatus = v.situacao || "";
          break;
        }
      }
    }

    lines.push({
      id: `linha-${parsed.number}-${parsed.color.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      operator: operator || "Desconhecido",
      name: parsed.name,
      number: parsed.number,
      color: parsed.color,
      statusCode: code,
      status: statusText,
      updatedInfo: info.updated || "",
      stationsCount: info.stationsCount,

      // NOVO: MOTIVO AO VIVO (se houver falha)
      reason: isProblem ? (reason || "Motivo não informado pela fonte oficial") : "",
      reasonAt: isProblem ? (reasonAt || "") : "",
      reasonStatus: isProblem ? (reasonStatus || "") : "",
      reasonSource: isProblem ? String(config.CCM_OCCURRENCES_URL || "") : "",

      source: url,
      lastUpdate: new Date().toISOString(),
    });
  }

  // remove duplicados
  const unique = new Map();
  for (const l of lines) unique.set(`${l.number}-${l.color}`, l);

  const finalLines = Array.from(unique.values()).sort((a, b) => {
    const na = Number(a.number);
    const nb = Number(b.number);
    if (Number.isNaN(na) || Number.isNaN(nb)) return 0;
    return na - nb;
  });

  lastDebug.parsedCount = finalLines.length;

  if (finalLines.length === 0) {
    throw new Error("Nenhuma linha encontrada no CCM (layout pode ter mudado)");
  }

  return finalLines;
}

// ============================
// CACHE STATUS
// ============================
function isCacheValid() {
  if (!cache.data || !cache.timestamp) return false;
  return Date.now() - cache.timestamp < cache.duration;
}

async function getData() {
  if (isCacheValid()) {
    return {
      source: "cache",
      lines: cache.data,
      lastUpdate: new Date(cache.timestamp).toISOString(),
      cached: true,
    };
  }

  try {
    const lines = await fetchCCMStatus();

    cache.data = lines;
    cache.timestamp = Date.now();

    return {
      source: "CCM/ARTESP",
      lines,
      lastUpdate: new Date().toISOString(),
      cached: false,
    };
  } catch (err) {
    lastDebug.lastError = err.message;

    if (cache.data) {
      return {
        source: "cache_fallback",
        lines: cache.data,
        lastUpdate: new Date(cache.timestamp).toISOString(),
        cached: true,
        warning: "Falha ao atualizar agora, retornando cache antigo",
        error: err.message,
      };
    }

    throw err;
  }
}

// ============================
// ROTAS
// ============================
app.get("/", async (req, res) => {
  try {
    const data = await getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dados", message: error.message });
  }
});

app.get("/api/status", async (req, res) => {
  try {
    const data = await getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dados", message: error.message });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    cache: {
      hasData: cache.data !== null,
      isValid: isCacheValid(),
      lastCacheUpdate: cache.timestamp ? new Date(cache.timestamp).toISOString() : null,
    },
    reasonsCache: {
      hasData: reasonCache.map && reasonCache.map.size > 0,
      isValid: isReasonCacheValid(),
      lastReasonsUpdate: reasonCache.timestamp ? new Date(reasonCache.timestamp).toISOString() : null,
    },
  });
});

app.get("/stats", async (req, res) => {
  try {
    const data = await getData();
    res.json({
      source: data.source,
      totalLines: data.lines.length,
      lastUpdate: data.lastUpdate,
      cached: data.cached,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/debug", (req, res) => {
  res.json({
    config: {
      CCM_STATUS_URL: config.CCM_STATUS_URL,
      CCM_OCCURRENCES_URL: config.CCM_OCCURRENCES_URL || null,
      CACHE_DURATION: cache.duration,
      REASON_CACHE_DURATION: reasonCache.duration,
      REQUEST_TIMEOUT: config.REQUEST_TIMEOUT || 15000,
    },
    lastDebug,
  });
});

app.listen(PORT, () => {
  console.log("API rodando na porta " + PORT);
  console.log("Rotas: / | /api/status | /health | /stats | /debug");
});

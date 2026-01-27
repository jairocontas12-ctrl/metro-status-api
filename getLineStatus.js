getLineStatus.js

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
// CACHE
// ============================
let cache = {
  data: null,
  timestamp: null,
  duration: config.CACHE_DURATION || 30000,
};

let lastDebug = {
  source: "CCM/ARTESP",
  lastUrl: null,
  lastError: null,
  lastAttemptAt: null,
  parsedCount: 0,
  occurrencesParsed: 0, // ✅ NOVO
};

// ============================
// ✅ NOVO: ÚLTIMO STATUS VÁLIDO POR LINHA (fallback por linha)
// ============================
const LAST_GOOD_TTL_MS =
  typeof config.LAST_GOOD_TTL_MS === "number" && config.LAST_GOOD_TTL_MS > 0
    ? config.LAST_GOOD_TTL_MS
    : 15 * 60 * 1000;

const lastGoodByLineKey = new Map();

function makeLineKey(number, color) {
  return `${String(number || "").trim()}-${String(color || "").trim().toLowerCase()}`;
}

function isLastGoodValid(entry) {
  if (!entry || !entry.savedAt) return false;
  return Date.now() - entry.savedAt <= LAST_GOOD_TTL_MS;
}

// ============================
// HELPERS
// ============================
function normalizeText(str) {
  return String(str || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isUnavailableStatusText(statusText) {
  const t = normalizeText(statusText).toLowerCase();
  if (!t) return true;
  if (t.includes("indispon")) return true;
  if (t.includes("dados indispon")) return true;
  if (t === "-" || t === "n/a") return true;
  return false;
}

function statusToCode(statusText) {
  const t = normalizeText(statusText).toLowerCase();

  if (t.includes("normal")) return 0;

  if (
    t.includes("reduzida") ||
    t.includes("parcial") ||
    t.includes("programada") ||
    t.includes("maiores intervalos") ||
    t.includes("aten")
  ) {
    return 1;
  }

  if (t.includes("encerrad")) return 2;

  if (t.includes("paralisad") || t.includes("interrompid") || t.includes("suspens")) {
    return 3;
  }

  return 99;
}

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
  let op = normalizeText($(headingEl).prevAll("h2").first().text());
  if (op) return op;

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

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ============================
// ✅ NOVO: BUSCAR OCORRÊNCIAS (MOTIVO)
// ============================
function parseDateTime(text) {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) return "";
  
  const [, dd, mm, yyyy, HH, MM] = m;
  const date = new Date(+yyyy, +mm - 1, +dd, +HH, +MM);
  
  return date.toISOString();
}

async function fetchCCMOccurrences() {
  const url = config.CCM_OCCURRENCES_URL || "";
  
  if (!url.startsWith("http")) {
    return new Map();
  }

  try {
    const html = (await axios.get(url, {
      timeout: config.REQUEST_TIMEOUT || 15000,
      headers: {
        "User-Agent": config.USER_AGENT,
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    })).data;

    const $ = cheerio.load(String(html));
    const occMap = new Map();

    const bodyText = $("body").text();
    const lines = bodyText.split("\n").map(l => normalizeText(l)).filter(Boolean);

    const rowRegex = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s+Linha\s+(\d{1,2})\s*[-–]\s*([^\s]+.*?)\s+(Operação\s+Normal|Operação\s+Parcial|Velocidade\s+Reduzida|Atividade\s+Programada|Operação\s+Encerrada|Dados\s+Indisponíveis|Operação\s+Diferenciada)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(rowRegex);
      
      if (!match) continue;

      const [, dateTime, number, , status] = match;
      
      const nextLine = lines[i + 1] || "";
      const reason = nextLine.startsWith('"') && nextLine.endsWith('"') 
        ? normalizeText(nextLine.replace(/^"|"$/g, ""))
        : "";

      if (status.toLowerCase().includes("encerrada")) continue;

      if (!occMap.has(number)) {
        occMap.set(number, {
          reason: reason || "",
          reasonAt: dateTime || "",
          reasonStatus: status || "",
          reasonSource: url,
        });
      }
    }

    return occMap;

  } catch (e) {
    console.error("❌ Erro ao buscar ocorrências:", e.message);
    return new Map();
  }
}

// ============================
// FETCH CCM/ARTESP
// ============================
async function fetchCCMStatus() {
  const url = String(config.CCM_STATUS_URL || "").trim();
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    throw new Error(`CCM_STATUS_URL inválida no configs.js: "${url}"`);
  }

  lastDebug.lastUrl = url;
  lastDebug.lastAttemptAt = new Date().toISOString();
  lastDebug.lastError = null;

  // ✅ NOVO: Busca ocorrências em paralelo
  let occurrencesMap = new Map();
  try {
    occurrencesMap = await fetchCCMOccurrences();
    lastDebug.occurrencesParsed = occurrencesMap.size;
  } catch (e) {
    lastDebug.occurrencesParsed = 0;
  }

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

    let statusText = info.status;
    if (!statusText) {
      const ms2 = containerText.match(
        /(Operaç[aã]o\s+(Normal|Parcial|Paralisada|Encerrada)|Velocidade\s+Reduzida|Atividade\s+Programada|Maiores\s+Intervalos|Dados\s+Indispon[ií]veis)/i
      );
      if (ms2) statusText = normalizeText(ms2[0]);
    }

    if (!statusText) statusText = "Indisponível";

    // ============================
    // FALLBACK POR LINHA
    // ============================
    const lineKey = makeLineKey(parsed.number, parsed.color);
    const rawStatusText = statusText;
    let finalStatusText = statusText;
    let dataQuality = "live";
    let note = "";

    if (isUnavailableStatusText(statusText)) {
      const lastGoodEntry = lastGoodByLineKey.get(lineKey);
      if (isLastGoodValid(lastGoodEntry)) {
        const lg = lastGoodEntry.line;

        finalStatusText = lg.status;
        dataQuality = "fallback_last_good";
        note = "CCM retornou dados indisponíveis; exibindo última info válida";

        if (!info.updated) {
          info.updated = lg.updatedInfo || "";
        }
      } else {
        dataQuality = "unavailable";
        note = "CCM retornou dados indisponíveis";
      }
    }

    // ✅ NOVO: Busca ocorrência pelo número da linha
    const occ = occurrencesMap.get(parsed.number) || {};
    const reason = occ.reason || "";
    const reasonAt = occ.reasonAt ? parseDateTime(occ.reasonAt) : "";
    const reasonStatus = occ.reasonStatus || "";
    const reasonSource = occ.reasonSource || config.CCM_OCCURRENCES_URL || "";

    const lineObj = {
      id: `linha-${parsed.number}-${parsed.color.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      operator: operator || "Desconhecido",
      name: parsed.name,
      number: parsed.number,
      color: parsed.color,

      statusCode: statusToCode(finalStatusText),
      status: finalStatusText,
      updatedInfo: info.updated || "",
      stationsCount: info.stationsCount,
      source: url,
      lastUpdate: new Date().toISOString(),

      dataQuality,
      note,
      rawStatus: rawStatusText,
      
      // ✅ NOVOS CAMPOS (OCORRÊNCIAS)
      reason: reason,
      reasonAt: reasonAt,
      reasonStatus: reasonStatus,
      reasonSource: reasonSource,
    };

    if (!isUnavailableStatusText(lineObj.status)) {
      lastGoodByLineKey.set(lineKey, {
        line: deepClone(lineObj),
        savedAt: Date.now(),
      });
    }

    lines.push(lineObj);
  }

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
// CACHE
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

      meta: {
        lastGoodTtlMs: LAST_GOOD_TTL_MS,
      },
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

        meta: {
          lastGoodTtlMs: LAST_GOOD_TTL_MS,
        },
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

    lastGood: {
      ttlMs: LAST_GOOD_TTL_MS,
      count: lastGoodByLineKey.size,
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
      CCM_OCCURRENCES_URL: config.CCM_OCCURRENCES_URL, // ✅ NOVO
      CACHE_DURATION: cache.duration,
      REQUEST_TIMEOUT: config.REQUEST_TIMEOUT || 15000,
      LAST_GOOD_TTL_MS,
    },
    lastDebug,

    lastGoodKeys: Array.from(lastGoodByLineKey.keys()),
  });
});

app.listen(PORT, () => {
  console.log("API rodando na porta " + PORT);
  console.log("Rotas: / | /api/status | /health | /stats | /debug");
});

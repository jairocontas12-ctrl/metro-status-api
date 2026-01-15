// scripts/monitor.js
// Monitora sua API via /debug
// Se parsedCount = 0 ou houver erro -> falha (e o GitHub Action envia WhatsApp)

const DEBUG_URL = process.env.API_DEBUG_URL;

function pick(obj, path, fallback = null) {
  try {
    return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "GitHubActions-MetroMonitor" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao acessar ${url}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Resposta não é JSON válido (verifique se /debug está retornando JSON)");
  }
}

async function main() {
  if (!DEBUG_URL) {
    throw new Error("API_DEBUG_URL não definido. Crie esse Secret no GitHub Actions.");
  }

  console.log("🔎 Monitorando:", DEBUG_URL);

  const data = await fetchJson(DEBUG_URL);

  // Seu /debug retorna algo como:
  // { config: {...}, lastDebug: { parsedCount, lastError, ... } }
  const parsedCount =
    pick(data, "lastDebug.parsedCount", 0) ??
    pick(data, "parsedCount", 0) ??
    0;

  const lastError =
    pick(data, "lastDebug.lastError", null) ??
    pick(data, "lastError", null);

  if (lastError) {
    throw new Error(`Erro detectado no /debug: ${lastError}`);
  }

  if (!parsedCount || Number(parsedCount) <= 0) {
    throw new Error("parsedCount = 0 (provável mudança no layout do CCM/ARTESP ou falha de scraping)");
  }

  console.log("✅ Monitor OK | parsedCount:", parsedCount);
}

main().catch((err) => {
  console.error("❌ Monitor FALHOU:", err.message);
  process.exit(1);
});

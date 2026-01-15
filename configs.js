// configs.js
module.exports = {
  // Fonte oficial (CCM/ARTESP) - Status Metroferroviário (Metrô + CPTM + concessões)
  CCM_STATUS_URL: "https://ccm.artesp.sp.gov.br/metroferroviario/status-linhas/",

  // Cache recomendado (30s ~ 60s)
  CACHE_DURATION: 30000,

  // Timeout de requisição
  REQUEST_TIMEOUT: 15000,

  // User-Agent (evita bloqueios simples)
  USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
};

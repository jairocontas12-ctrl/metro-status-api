// configs.js
module.exports = {
  // Fonte oficial (CCM/ARTESP) - Status Metroferroviário (Metrô + CPTM + concessões)
  CCM_STATUS_URL: "https://ccm.artesp.sp.gov.br/metroferroviario/status-linhas/",

  // Fonte oficial (CCM/ARTESP) - Ocorrências (onde geralmente aparece o "motivo" quando há falha)
  CCM_OCCURRENCES_URL: "https://ccm.artesp.sp.gov.br/metroferroviario/ocorrencias/",

  // Cache do STATUS (30s ~ 60s)
  CACHE_DURATION: 30000,

  // Cache do MOTIVO (separado, para não bater no CCM a cada request)
  // Pode deixar igual ao cache do status ou um pouco maior.
  REASON_CACHE_DURATION: 45000,

  // Timeout de requisição
  REQUEST_TIMEOUT: 15000,

  // User-Agent (evita bloqueios simples)
  USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
};

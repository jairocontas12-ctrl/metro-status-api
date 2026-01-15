// configs.js
module.exports = {
  // Página oficial "Direto do Metrô"
  // Obs: essa página pode não ter o status no HTML (às vezes é só informativa)
  METRO_URL: 'https://www.metro.sp.gov.br/sua-viagem/direto-metro/',

  // Cache (ms)
  CACHE_DURATION: 60000, // 1 minuto

  // Timeout da requisição
  REQUEST_TIMEOUT: 15000,

  // User-Agent
  USER_AGENT:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
};

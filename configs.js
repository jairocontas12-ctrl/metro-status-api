// Configurações da API
module.exports = {
  // Lista de fontes (fallback automático)
  // Se uma falhar ou mudar o HTML, tenta a próxima
  METRO_URLS: [
    "https://www.metro.sp.gov.br/sistemas/direto-do-metro-via4/diretodometro.asp",
    "https://www.diretodostrens.com.br/"
  ],

  // Cache (ms)
  CACHE_DURATION: 60000 // 1 minuto
};


const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Status - Metrô e Trens (SP)",
      version: "1.1.0",
      description: `
API não-oficial para consultar o status operacional das linhas metroferroviárias de São Paulo.

## Características
- Dados atualizados em tempo real (CCM/ARTESP)
- Informações sobre todas as linhas (Metrô, CPTM e concessionárias)
- Quando há falha, tenta anexar o motivo (texto oficial, quando publicado)

## Uso Permitido
Esta API é fornecida "como está" para uso educacional e informativo.
Os dados são obtidos de fontes públicas e podem não ser 100% precisos.

## Boas Práticas
- Faça cache dos resultados (mínimo 30s a 60s)
- Evite muitas requisições seguidas (ex.: 60/min ou menos)
`,
      contact: {
        name: "Suporte API",
        url: "https://github.com/jairocontas12-ctrl/metro-status-api",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      { url: "http://localhost:3000", description: "Servidor de Desenvolvimento" },
    ],
    tags: [
      { name: "Status", description: "Endpoints para consultar status das linhas" },
      { name: "Saúde", description: "Health check da API" },
      { name: "Debug", description: "Informações de depuração" },
    ],
  },

  // IMPORTANTE: aqui apontamos para o arquivo que realmente contém as rotas
  apis: ["./getLineStatus.js"],
};

module.exports = swaggerJsdoc(options);

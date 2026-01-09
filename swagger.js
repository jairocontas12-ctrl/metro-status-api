const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Status - Metrô e CPTM São Paulo',
      version: '1.0.0',
      description: `
        API não-oficial para consultar o status operacional das linhas de Metrô e CPTM de São Paulo.
        
        ## Características
        
        - Dados atualizados em tempo real
        - Informações sobre todas as linhas
        - Histórico de status
        - Gratuita e open-source
        
        ## Uso Permitido
        
        Esta API é fornecida "como está" para uso educacional e informativo. 
        Os dados são obtidos de fontes públicas e podem não ser 100% precisos.
        
        ## Uso Comercial
        
        Para uso comercial, entre em contato e considere contribuir com o projeto.
        
        ## Boas Práticas
        
        - Faça cache dos resultados por pelo menos 1 minuto
        - Não faça mais de 60 requisições por minuto
        - Use os headers de cache adequadamente
        
        ## Contribuições
        
        Este projeto é open-source. Contribuições são bem-vindas!
        GitHub: https://github.com/seu-usuario/metro-status-api
      `,
      contact: {
        name: 'Suporte API',
        url: 'https://github.com/seu-usuario/metro-status-api',
        email: 'contato@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.metrostatus.com.br',
        description: 'Servidor de Produção'
      }
    ],
    tags: [
      {
        name: 'Status',
        description: 'Endpoints para consultar status das linhas'
      },
      {
        name: 'Linhas',
        description: 'Informações sobre as linhas'
      },
      {
        name: 'Saúde',
        description: 'Health check da API'
      }
    ]
  },
  apis: ['./routes/*.js', './server.js']
};

module.exports = swaggerJsdoc(options);

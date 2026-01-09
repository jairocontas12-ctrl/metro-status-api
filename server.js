const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const apiRoutes = require('./routes/api');
const cron = require('node-cron');
const { obterStatusLinhas } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Documentação Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'API Metrô/CPTM - Documentação',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Rotas da API
app.use('/api', apiRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Página inicial da API
 *     description: Retorna informações básicas sobre a API
 *     tags: [Saúde]
 *     responses:
 *       200:
 *         description: Informações da API
 */
app.get('/', (req, res) => {
  res.json({
    nome: 'API de Status - Metrô e CPTM São Paulo',
    versao: '1.0.0',
    descricao: 'API não-oficial para consultar status das linhas',
    documentacao: `${req.protocol}://${req.get('host')}/docs`,
    endpoints: {
      status_geral: '/api/status',
      status_metro: '/api/status/metro',
      status_cptm: '/api/status/cptm',
      todas_linhas: '/api/linhas',
      linha_especifica: '/api/linhas/{id}',
      buscar_por_codigo: '/api/codigo/{codigo}'
    },
    github: 'https://github.com/seu-usuario/metro-status-api',
    autor: 'Seu Nome'
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check da API
 *     description: Verifica se a API está funcionando
 *     tags: [Saúde]
 *     responses:
 *       200:
 *         description: API está funcionando
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    erro: 'Endpoint não encontrado',
    codigo: 404,
    detalhes: `A rota ${req.path} não existe. Consulte /docs para ver os endpoints disponíveis.`
  });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    erro: 'Erro interno do servidor',
    codigo: 500,
    detalhes: err.message
  });
});

// Atualização automática a cada 2 minutos
cron.schedule('*/2 * * * *', async () => {
  try {
    console.log('Atualizando dados das linhas...');
    await obterStatusLinhas();
    console.log('Dados atualizados com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚇 API de Status - Metrô e CPTM São Paulo               ║
║                                                            ║
║   Servidor rodando em: http://localhost:${PORT}              ║
║   Documentação: http://localhost:${PORT}/docs               ║
║                                                            ║
║   Endpoints disponíveis:                                   ║
║   • GET /api/status          - Status de todas as linhas   ║
║   • GET /api/status/metro    - Status do Metrô             ║
║   • GET /api/status/cptm     - Status da CPTM              ║
║   • GET /api/linhas          - Lista todas as linhas       ║
║   • GET /api/linhas/{id}     - Detalhes de uma linha       ║
║   • GET /api/codigo/{numero} - Busca por número            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================
// CONFIGURAÇÃO CORS
// ===========================
app.use(cors({
  origin: '*', // Permite qualquer domínio (incluindo seu WordPress)
  methods: ['GET'],
  credentials: false
}));

app.use(express.json());

// ===========================
// DADOS DAS LINHAS
// ===========================
function getLinhasStatus() {
  // Aqui você pode integrar com scraping do site oficial
  // Por enquanto, retorna dados de exemplo
  
  return {
    updatedAt: new Date().toISOString(),
    source: "Metro SP API",
    lines: [
      // METRÔ
      {
        number: "1",
        name: "Linha 1 - Azul",
        operator: "Metrô",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "2",
        name: "Linha 2 - Verde",
        operator: "Metrô",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "3",
        name: "Linha 3 - Vermelha",
        operator: "Metrô",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "4",
        name: "Linha 4 - Amarela",
        operator: "Metrô",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "5",
        name: "Linha 5 - Lilás",
        operator: "Metrô",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "15",
        name: "Linha 15 - Prata",
        operator: "Metrô",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      
      // CPTM
      {
        number: "7",
        name: "Linha 7 - Rubi",
        operator: "CPTM",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "8",
        name: "Linha 8 - Diamante",
        operator: "CPTM",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "9",
        name: "Linha 9 - Esmeralda",
        operator: "CPTM",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "10",
        name: "Linha 10 - Turquesa",
        operator: "CPTM",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "11",
        name: "Linha 11 - Coral",
        operator: "CPTM",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "12",
        name: "Linha 12 - Safira",
        operator: "CPTM",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      },
      {
        number: "13",
        name: "Linha 13 - Jade",
        operator: "CPTM",
        status: "Operação Normal",
        details: "Circulação normal em toda a linha"
      }
    ]
  };
}

// ===========================
// ROTAS
// ===========================

// Healthcheck
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Metro SP API - Funcionando!',
    endpoints: {
      status: '/status',
      health: '/'
    }
  });
});

// Rota principal - Status das linhas
app.get('/status', (req, res) => {
  try {
    const data = getLinhasStatus();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados',
      message: error.message 
    });
  }
});

// Rota alternativa (alguns podem usar /api/status)
app.get('/api/status', (req, res) => {
  try {
    const data = getLinhasStatus();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar dados',
      message: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Rota ${req.path} não encontrada`,
    availableRoutes: ['/', '/status', '/api/status']
  });
});

// ===========================
// INICIAR SERVIDOR
// ===========================
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  console.log(`✅ CORS habilitado para todos os domínios`);
  console.log(`📡 Endpoints disponíveis:`);
  console.log(`   - GET / (healthcheck)`);
  console.log(`   - GET /status (dados das linhas)`);
  console.log(`   - GET /api/status (dados das linhas)`);
});

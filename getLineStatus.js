const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const config = require('./configs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Cache
let cache = {
    data: null,
    timestamp: null,
    duration: 60000 // 1 minuto
};

// Função principal de scraping
async function scrapeMetroStatus() {
    try {
        console.log('🔍 Buscando dados do site do Metrô...');
        
        const response = await axios.get(config.METRO_URL, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        const $ = cheerio.load(response.data);
        const lines = [];

        // Método primário: estrutura <ol><li>
        $('ol li').each((index, element) => {
            try {
                const $item = $(element);
                const fullText = $item.text().trim();
                
                const parts = fullText.split('\n').filter(text => text.trim().length > 0);
                
                if (parts.length >= 3) {
                    const number = parts[0].trim();
                    const color = parts[1].trim();
                    const statusText = parts[2].trim();
                    
                    const line = {
                        name: `Linha ${number} - ${color}`,
                        number: number,
                        status: getStatusCode(statusText),
                        statusDescription: statusText,
                        description: statusText,
                        lastUpdate: new Date().toISOString()
                    };
                    
                    lines.push(line);
                    console.log(`✅ Linha ${number} - ${color}: ${statusText}`);
                }
            } catch (err) {
                console.error('Erro ao processar item:', err.message);
            }
        });

        // Método fallback: regex
        if (lines.length === 0) {
            console.log('⚠️ Método primário falhou, tentando regex...');
            
            const bodyText = $('body').text();
            const pattern = /(\d+)\s+(Azul|Verde|Vermelha|Amarela|Lilás|Prata|Coral|Diamante|Esmeralda|Turquesa|Safira|Jade|Rubi)\s+(.+?)(?=\d+\s+(?:Azul|Verde|Vermelha|Amarela|Lilás|Prata|Coral|Diamante|Esmeralda|Turquesa|Safira|Jade|Rubi)|$)/gi;
            
            let match;
            while ((match = pattern.exec(bodyText)) !== null) {
                const line = {
                    name: `Linha ${match[1]} - ${match[2]}`,
                    number: match[1],
                    status: getStatusCode(match[3]),
                    statusDescription: match[3].trim(),
                    description: match[3].trim(),
                    lastUpdate: new Date().toISOString()
                };
                
                lines.push(line);
                console.log(`✅ Linha ${match[1]} - ${match[2]}: ${match[3].trim()}`);
            }
        }

        if (lines.length === 0) {
            throw new Error('Nenhuma linha encontrada no scraping');
        }

        console.log(`✅ Total de ${lines.length} linhas encontradas`);
        return lines;

    } catch (error) {
        console.error('❌ Erro no scraping:', error.message);
        throw error;
    }
}

// Converter status textual para código
function getStatusCode(statusText) {
    const text = statusText.toLowerCase();
    
    if (text.includes('operação normal') || text.includes('normal')) {
        return 0;
    } else if (text.includes('velocidade reduzida') || text.includes('reduzida')) {
        return 1;
    } else if (text.includes('paralisada') || text.includes('paralizada')) {
        return 3;
    } else if (text.includes('encerrada') || text.includes('fechada')) {
        return 2;
    }
    
    return 99;
}

// Verificar se cache é válido
function isCacheValid() {
    if (!cache.data || !cache.timestamp) {
        return false;
    }
    
    const now = Date.now();
    const age = now - cache.timestamp;
    
    return age < cache.duration;
}

// Obter dados (com cache)
async function getData() {
    if (isCacheValid()) {
        console.log('✅ Usando dados do cache');
        return {
            lines: cache.data,
            lastUpdate: new Date(cache.timestamp).toISOString(),
            cached: true
        };
    }

    try {
        console.log('🔄 Cache expirado, buscando dados novos...');
        const lines = await scrapeMetroStatus();
        
        cache.data = lines;
        cache.timestamp = Date.now();
        
        return {
            lines: lines,
            lastUpdate: new Date().toISOString(),
            cached: false
        };
    } catch (error) {
        if (cache.data) {
            console.log('⚠️ Erro ao buscar dados, usando cache antigo');
            return {
                lines: cache.data,
                lastUpdate: new Date(cache.timestamp).toISOString(),
                cached: true,
                warning: 'Dados em cache devido a erro'
            };
        }
        
        throw error;
    }
}

// ROTAS
app.get('/', async (req, res) => {
    try {
        const data = await getData();
        res.json(data);
    } catch (error) {
        console.error('Erro na rota /:', error);
        res.status(500).json({
            error: 'Erro ao buscar dados do metrô',
            message: error.message
        });
    }
});

app.get('/health', async (req, res) => {
    const uptime = process.uptime();
    const hasCachedData = cache.data !== null;
    
    res.json({
        status: 'ok',
        uptime: Math.floor(uptime),
        cache: {
            hasData: hasCachedData,
            age: cache.timestamp ? Math.floor((Date.now() - cache.timestamp) / 1000) : null,
            expires: cache.timestamp ? Math.floor((cache.timestamp + cache.duration - Date.now()) / 1000) : null
        },
        metroUrl: config.METRO_URL
    });
});

app.get('/line/:number', async (req, res) => {
    try {
        const data = await getData();
        const line = data.lines.find(l => l.number === req.params.number);
        
        if (!line) {
            return res.status(404).json({
                error: 'Linha não encontrada',
                number: req.params.number
            });
        }
        
        res.json(line);
    } catch (error) {
        console.error('Erro na rota /line/:number:', error);
        res.status(500).json({
            error: 'Erro ao buscar linha',
            message: error.message
        });
    }
});

app.get('/line/name/:name', async (req, res) => {
    try {
        const data = await getData();
        const searchName = req.params.name.toLowerCase();
        const line = data.lines.find(l => 
            l.name.toLowerCase().includes(searchName)
        );
        
        if (!line) {
            return res.status(404).json({
                error: 'Linha não encontrada',
                name: req.params.name
            });
        }
        
        res.json(line);
    } catch (error) {
        console.error('Erro na rota /line/name/:name:', error);
        res.status(500).json({
            error: 'Erro ao buscar linha',
            message: error.message
        });
    }
});

app.get('/stats', async (req, res) => {
    try {
        const data = await getData();
        
        const stats = {
            totalLines: data.lines.length,
            byStatus: {},
            operational: 0,
            nonOperational: 0,
            lastUpdate: data.lastUpdate
        };
        
        data.lines.forEach(line => {
            const status = line.status;
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            
            if (status === 0) {
                stats.operational++;
            } else {
                stats.nonOperational++;
            }
        });
        
        res.json(stats);
    } catch (error) {
        console.error('Erro na rota /stats:', error);
        res.status(500).json({
            error: 'Erro ao gerar estatísticas',
            message: error.message
        });
    }
});

app.get('/status/:code', async (req, res) => {
    try {
        const data = await getData();
        const statusCode = parseInt(req.params.code);
        
        const filtered = data.lines.filter(l => l.status === statusCode);
        
        res.json({
            statusCode: statusCode,
            count: filtered.length,
            lines: filtered,
            lastUpdate: data.lastUpdate
        });
    } catch (error) {
        console.error('Erro na rota /status/:code:', error);
        res.status(500).json({
            error: 'Erro ao filtrar por status',
            message: error.message
        });
    }
});

app.get('/problems', async (req, res) => {
    try {
        const data = await getData();
        const problems = data.lines.filter(l => l.status !== 0);
        
        res.json({
            hasProblems: problems.length > 0,
            count: problems.length,
            lines: problems,
            lastUpdate: data.lastUpdate
        });
    } catch (error) {
        console.error('Erro na rota /problems:', error);
        res.status(500).json({
            error: 'Erro ao buscar problemas',
            message: error.message
        });
    }
});

app.post('/refresh', async (req, res) => {
    try {
        console.log('🔄 Forçando atualização do cache...');
        cache.timestamp = null;
        
        const data = await getData();
        
        res.json({
            message: 'Cache atualizado com sucesso',
            data: data
        });
    } catch (error) {
        console.error('Erro na rota /refresh:', error);
        res.status(500).json({
            error: 'Erro ao atualizar cache',
            message: error.message
        });
    }
});

app.get('/info', (req, res) => {
    res.json({
        name: 'Metro SP Status API',
        version: '2.2.0',
        description: 'API para consultar status em tempo real do Metrô e CPTM de São Paulo',
        endpoints: {
            '/': 'Todas as linhas',
            '/health': 'Status da API',
            '/line/:number': 'Linha específica por número',
            '/line/name/:name': 'Buscar linha por nome/cor',
            '/stats': 'Estatísticas gerais',
            '/status/:code': 'Linhas por código de status',
            '/problems': 'Apenas linhas com problemas',
            '/refresh': 'Forçar atualização (POST)',
            '/info': 'Esta página'
        },
        cache: {
            duration: cache.duration / 1000 + 's',
            hasData: cache.data !== null
        },
        source: config.METRO_URL
    });
});

app.listen(PORT, () => {
    console.log(`🚀 API rodando na porta ${PORT}`);
    console.log(`📡 URL do Metrô: ${config.METRO_URL}`);
    console.log(`⏰ Cache: ${cache.duration / 1000} segundos`);
    console.log(`✅ Pronto para receber requisições!`);
});
```

---

## 🚀 COMO SUBSTITUIR NO GITHUB:

1. **Vá em:** https://github.com/jairocontas12-ctrl/metro-sp-api
2. **Clique em:** getLineStatus.js
3. **Clique no lápis ✏️** (Edit)
4. **CTRL+A** (seleciona tudo)
5. **DELETE** (apaga)
6. **CTRL+V** (cola o código acima ⬆️)
7. **Scroll para baixo**
8. **Commit changes**

---

## ⏰ DEPOIS DO COMMIT:

1. **Aguarde 2-3 minutos** (Render faz deploy)
2. **Teste:**
```
   https://metro-sp-api.onrender.com/health

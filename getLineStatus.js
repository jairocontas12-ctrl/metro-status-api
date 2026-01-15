const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const config = require('./configs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let cache = {
    data: null,
    timestamp: null,
    duration: 60000
};

async function scrapeMetroStatus() {
    try {
        console.log('Buscando dados do site do Metro');
        
        const response = await axios.get(config.METRO_URL, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const lines = [];

        $('ol li').each((index, element) => {
            try {
                const $item = $(element);
                const fullText = $item.text().trim();
                const parts = fullText.split('\n').filter(text => text.trim().length > 0);
                
                if (parts.length >= 3) {
                    const number = parts[0].trim();
                    const color = parts[1].trim();
                    const statusText = parts[2].trim();
                    
                    lines.push({
                        name: 'Linha ' + number + ' - ' + color,
                        number: number,
                        status: getStatusCode(statusText),
                        statusDescription: statusText,
                        lastUpdate: new Date().toISOString()
                    });
                }
            } catch (err) {
                console.error('Erro:', err.message);
            }
        });

        if (lines.length === 0) {
            throw new Error('Nenhuma linha encontrada');
        }

        console.log('Encontradas ' + lines.length + ' linhas');
        return lines;

    } catch (error) {
        console.error('Erro no scraping:', error.message);
        throw error;
    }
}

function getStatusCode(statusText) {
    const text = statusText.toLowerCase();
    
    if (text.includes('normal')) {
        return 0;
    } else if (text.includes('reduzida')) {
        return 1;
    } else if (text.includes('paralisada')) {
        return 3;
    } else if (text.includes('encerrada')) {
        return 2;
    }
    
    return 99;
}

function isCacheValid() {
    if (!cache.data || !cache.timestamp) {
        return false;
    }
    return (Date.now() - cache.timestamp) < cache.duration;
}

async function getData() {
    if (isCacheValid()) {
        console.log('Usando cache');
        return {
            lines: cache.data,
            lastUpdate: new Date(cache.timestamp).toISOString(),
            cached: true
        };
    }

    try {
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
            return {
                lines: cache.data,
                lastUpdate: new Date(cache.timestamp).toISOString(),
                cached: true
            };
        }
        throw error;
    }
}

app.get('/', async (req, res) => {
    try {
        const data = await getData();
        res.json(data);
    } catch (error) {
        res.status(500).json({
            error: 'Erro ao buscar dados',
            message: error.message
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        cache: {
            hasData: cache.data !== null
        }
    });
});

app.get('/stats', async (req, res) => {
    try {
        const data = await getData();
        res.json({
            totalLines: data.lines.length,
            lastUpdate: data.lastUpdate
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log('API rodando na porta ' + PORT);
    console.log('Pronto para receber requisicoes');
});

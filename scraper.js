const axios = require('axios');
const cheerio = require('cheerio');

// ========================================
// CONFIGURAÇÕES
// ========================================

const CONFIG = {
  CACHE_DURATION: 60000, // 1 minuto
  REQUEST_TIMEOUT: 15000, // 15 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000,
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

let cacheGlobal = {
  dados: null,
  timestamp: null,
};

// ========================================
// DADOS BASE DAS LINHAS
// ========================================

const linhasMetro = [
  {
    id: 'linha-1-azul',
    nome: 'Linha 1 - Azul',
    numero: '1',
    apelido: 'Azul',
    tipo: 'metro',
    cor: { primaria: '#0455A1', secundaria: null },
    estacoes: ['Jabaquara', 'Conceição', 'São Judas', 'Saúde', 'Praça da Árvore', 'Santa Cruz', 'Vila Mariana', 'Ana Rosa', 'Paraíso', 'Vergueiro', 'São Joaquim', 'Liberdade', 'Sé', 'São Bento', 'Luz', 'Tiradentes', 'Armênia', 'Portuguesa-Tietê', 'Carandiru', 'Santana', 'Jardim São Paulo-Ayrton Senna', 'Parada Inglesa', 'Tucuruvi']
  },
  {
    id: 'linha-2-verde',
    nome: 'Linha 2 - Verde',
    numero: '2',
    apelido: 'Verde',
    tipo: 'metro',
    cor: { primaria: '#007E5E', secundaria: null },
    estacoes: ['Vila Prudente', 'Tamanduateí', 'Sacomã', 'Alto do Ipiranga', 'Santos-Imigrantes', 'Chácara Klabin', 'Ana Rosa', 'Paraíso', 'Brigadeiro', 'Trianon-Masp', 'Consolação', 'Clínicas', 'Sumaré', 'Vila Madalena']
  },
  {
    id: 'linha-3-vermelha',
    nome: 'Linha 3 - Vermelha',
    numero: '3',
    apelido: 'Vermelha',
    tipo: 'metro',
    cor: { primaria: '#EE372F', secundaria: null },
    estacoes: ['Palmeiras-Barra Funda', 'Marechal Deodoro', 'Santa Cecília', 'República', 'Anhangabaú', 'Sé', 'Pedro II', 'Brás', 'Bresser-Mooca', 'Belém', 'Tatuapé', 'Carrão', 'Penha', 'Vila Matilde', 'Guilhermina-Esperança', 'Patriarca-Vila Ré', 'Artur Alvim', 'Corinthians-Itaquera']
  },
  {
    id: 'linha-4-amarela',
    nome: 'Linha 4 - Amarela',
    numero: '4',
    apelido: 'Amarela',
    tipo: 'metro',
    cor: { primaria: '#FDD000', secundaria: null },
    estacoes: ['Luz', 'República', 'Higienópolis-Mackenzie', 'Paulista', 'Faria Lima', 'Pinheiros', 'Butantã', 'São Paulo-Morumbi', 'Vila Sônia']
  },
  {
    id: 'linha-5-lilas',
    nome: 'Linha 5 - Lilás',
    numero: '5',
    apelido: 'Lilás',
    tipo: 'metro',
    cor: { primaria: '#9B3894', secundaria: null },
    estacoes: ['Capão Redondo', 'Campo Limpo', 'Vila das Belezas', 'Giovanni Gronchi', 'Santo Amaro', 'Largo Treze', 'Adolfo Pinheiro', 'Alto da Boa Vista', 'Borba Gato', 'Brooklin', 'Campo Belo', 'Eucaliptos', 'Moema', 'AACD-Servidor', 'Hospital São Paulo', 'Santa Cruz', 'Chácara Klabin']
  },
  {
    id: 'linha-15-prata',
    nome: 'Linha 15 - Prata',
    numero: '15',
    apelido: 'Prata',
    tipo: 'metro',
    cor: { primaria: '#A3A3A3', secundaria: null },
    estacoes: ['Vila Prudente', 'Oratório', 'São Lucas', 'Camilo Haddad', 'Vila Tolstói', 'Vila União', 'Jardim Planalto', 'Sapopemba', 'Fazenda da Juta', 'São Mateus', 'Jardim Colonial']
  }
];

const linhasCPTMBase = [
  {
    id: 'linha-7-rubi',
    nome: 'Linha 7 - Rubi',
    numero: '7',
    apelido: 'Rubi',
    tipo: 'cptm',
    cor: { primaria: '#CA016B', secundaria: null },
    estacoes: ['Luz', 'Palmeiras-Barra Funda', 'Água Branca', 'Lapa', 'Piqueri', 'Pirituba', 'Vila Clarice', 'Jaraguá', 'Perus', 'Caieiras', 'Franco da Rocha', 'Baltazar Fidélis', 'Francisco Morato', 'Botujuru', 'Campo Limpo Paulista', 'Várzea Paulista', 'Jundiaí']
  },
  {
    id: 'linha-8-diamante',
    nome: 'Linha 8 - Diamante',
    numero: '8',
    apelido: 'Diamante',
    tipo: 'cptm',
    cor: { primaria: '#97A098', secundaria: null },
    estacoes: ['Júlio Prestes', 'Palmeiras-Barra Funda', 'Lapa', 'Domingos de Morais', 'Imperatriz Leopoldina', 'Presidente Altino', 'Osasco', 'Comandante Sampaio', 'Quitaúna', 'General Miguel Costa', 'Carapicuíba', 'Santa Terezinha', 'Antônio João', 'Barueri', 'Jardim Belval', 'Jardim Silveira', 'Jandira', 'Sagrado Coração', 'Engenheiro Cardoso', 'Itapevi', 'Santa Rita', 'Amador Bueno']
  },
  {
    id: 'linha-9-esmeralda',
    nome: 'Linha 9 - Esmeralda',
    numero: '9',
    apelido: 'Esmeralda',
    tipo: 'cptm',
    cor: { primaria: '#01A9A7', secundaria: null },
    estacoes: ['Osasco', 'Presidente Altino', 'Ceasa', 'Villa-Lobos-Jaguaré', 'Cidade Universitária', 'Pinheiros', 'Hebraica-Rebouças', 'Cidade Jardim', 'Vila Olímpia', 'Berrini', 'Morumbi', 'Granja Julieta', 'Santo Amaro', 'Socorro', 'Jurubatuba', 'Autódromo', 'Primavera-Interlagos', 'Grajaú']
  },
  {
    id: 'linha-10-turquesa',
    nome: 'Linha 10 - Turquesa',
    numero: '10',
    apelido: 'Turquesa',
    tipo: 'cptm',
    cor: { primaria: '#049FC3', secundaria: null },
    estacoes: ['Brás', 'Tatuapé', 'Ipiranga', 'Tamanduateí', 'São Caetano do Sul', 'Utinga', 'Prefeito Saladino', 'Prefeito Celso Daniel-Santo André', 'Capuava', 'Mauá', 'Guapituba', 'Ribeirão Pires', 'Rio Grande da Serra']
  },
  {
    id: 'linha-11-coral',
    nome: 'Linha 11 - Coral',
    numero: '11',
    apelido: 'Coral',
    tipo: 'cptm',
    cor: { primaria: '#F68368', secundaria: null },
    estacoes: ['Luz', 'Brás', 'Tatuapé', 'Corinthians-Itaquera', 'Dom Bosco', 'José Bonifácio', 'Guaianases', 'Antonio Gianetti Neto', 'Ferraz de Vasconcelos', 'Poá', 'Calmon Viana', 'Suzano', 'Jundiapeba', 'Braz Cubas', 'Mogi das Cruzes', 'Estudantes']
  },
  {
    id: 'linha-12-safira',
    nome: 'Linha 12 - Safira',
    numero: '12',
    apelido: 'Safira',
    tipo: 'cptm',
    cor: { primaria: '#133C8D', secundaria: null },
    estacoes: ['Brás', 'Tatuapé', 'Engenheiro Goulart', 'USP Leste', 'Comendador Ermelino', 'São Miguel Paulista', 'Jardim Helena-Vila Mara', 'Itaim Paulista', 'Jardim Romano', 'Engenheiro Manuel Feio', 'Itaquaquecetuba', 'Aracaré', 'Calmon Viana']
  },
  {
    id: 'linha-13-jade',
    nome: 'Linha 13 - Jade',
    numero: '13',
    apelido: 'Jade',
    tipo: 'cptm',
    cor: { primaria: '#00AB4E', secundaria: null },
    estacoes: ['Engenheiro Goulart', 'Aeroporto-Guarulhos']
  }
];

// ========================================
// UTILITÁRIOS
// ========================================

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fazerRequestComRetry(url, tentativas = CONFIG.RETRY_ATTEMPTS) {
  for (let i = 0; i < tentativas; i++) {
    try {
      console.log(`🔄 Tentativa ${i + 1}/${tentativas}: ${url}`);
      
      const response = await axios.get(url, {
        timeout: CONFIG.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
        }
      });
      
      console.log(`✅ Sucesso: ${url}`);
      return response;
      
    } catch (error) {
      console.error(`❌ Tentativa ${i + 1} falhou: ${error.message}`);
      
      if (i < tentativas - 1) {
        const delayTime = CONFIG.RETRY_DELAY * (i + 1);
        console.log(`⏳ Aguardando ${delayTime}ms...`);
        await delay(delayTime);
      } else {
        throw error;
      }
    }
  }
}

// ========================================
// SCRAPING CPTM (API OFICIAL)
// ========================================

async function buscarStatusCPTM() {
  try {
    console.log('\n🚂 CPTM: Buscando API oficial...');
    
    const response = await fazerRequestComRetry('https://open-linhas-api-roli.rota.os.sp.gov.br/status');
    
    const statusPorLinha = {};
    
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach(item => {
        let status = 'normal';
        let mensagem = 'Operação normal';
        
        const statusAPI = item.status ? item.status.toLowerCase() : '';
        const nomeLinhaAPI = item.name || item.linha || item.id || '';
        
        if (statusAPI.includes('encerrad') || statusAPI.includes('fechad')) {
          status = 'paralisada';
          mensagem = 'Operação encerrada';
        } else if (statusAPI.includes('parad') || statusAPI.includes('paralisa')) {
          status = 'paralisada';
          mensagem = 'Linha paralisada';
        } else if (statusAPI.includes('reduz') || statusAPI.includes('lent')) {
          status = 'reduzida';
          mensagem = 'Operação com velocidade reduzida';
        } else if (statusAPI.includes('parcial')) {
          status = 'reduzida';
          mensagem = 'Operação parcial';
        } else if (statusAPI.includes('normal')) {
          status = 'normal';
          mensagem = 'Operação normal';
        }
        
        const numeroLinha = nomeLinhaAPI.match(/\d+/);
        if (numeroLinha) {
          statusPorLinha[numeroLinha[0]] = { status, mensagem };
          console.log(`  ✓ Linha ${numeroLinha[0]}: ${status}`);
        }
      });
      
      console.log('✅ CPTM: Dados obtidos!\n');
      return statusPorLinha;
    }
    
    throw new Error('API retornou dados vazios');
    
  } catch (error) {
    console.error(`❌ CPTM: ${error.message}\n`);
    return null;
  }
}

// ========================================
// SCRAPING METRÔ (SITE OFICIAL)
// ========================================

async function buscarStatusMetro() {
  try {
    console.log('🚇 METRÔ: Buscando site oficial...');
    
    const response = await fazerRequestComRetry('https://www.metro.sp.gov.br/');
    const $ = cheerio.load(response.data);
    const statusPorLinha = {};
    
    const seletoresPossiveis = [
      '.linha-status',
      '.status-linha', 
      '[class*="linha"]',
      '[class*="status"]',
      '[data-linha]',
      '.situacao-linha',
    ];
    
    let encontrouDados = false;
    
    for (const seletor of seletoresPossiveis) {
      $(seletor).each((i, elem) => {
        const texto = $(elem).text().toLowerCase();
        
        const numeroMatch = texto.match(/linha\s*(\d+)/);
        if (numeroMatch) {
          const numero = numeroMatch[1];
          let status = 'normal';
          let mensagem = 'Operação normal';
          
          if (texto.includes('encerrad') || texto.includes('fechad')) {
            status = 'paralisada';
            mensagem = 'Operação encerrada';
          } else if (texto.includes('parad') || texto.includes('paralisa')) {
            status = 'paralisada';
            mensagem = 'Linha paralisada';
          } else if (texto.includes('reduz') || texto.includes('lent')) {
            status = 'reduzida';
            mensagem = 'Operação com velocidade reduzida';
          } else if (texto.includes('parcial')) {
            status = 'reduzida';
            mensagem = 'Operação parcial';
          }
          
          statusPorLinha[numero] = { status, mensagem };
          encontrouDados = true;
          console.log(`  ✓ Linha ${numero}: ${status}`);
        }
      });
      
      if (encontrouDados) break;
    }
    
    if (encontrouDados) {
      console.log('✅ METRÔ: Dados obtidos!\n');
      return statusPorLinha;
    }
    
    throw new Error('Não foi possível extrair dados do site');
    
  } catch (error) {
    console.error(`❌ METRÔ: ${error.message}\n`);
    return null;
  }
}

// ========================================
// FUNÇÃO PRINCIPAL (SEM FALLBACK)
// ========================================

async function obterStatusLinhas() {
  const agora = Date.now();
  if (cacheGlobal.dados && cacheGlobal.timestamp && (agora - cacheGlobal.timestamp) < CONFIG.CACHE_DURATION) {
    console.log('💾 Cache\n');
    return cacheGlobal.dados;
  }
  
  console.log('\n🚇🚂 ===== BUSCANDO STATUS =====\n');
  
  const statusCPTM = await buscarStatusCPTM();
  await delay(1000);
  const statusMetro = await buscarStatusMetro();
  
  // Processa CPTM (SEM FALLBACK)
  const linhasCPTM = linhasCPTMBase.map(linha => {
    if (statusCPTM && statusCPTM[linha.numero]) {
      return {
        ...linha,
        status: statusCPTM[linha.numero].status,
        mensagem: statusCPTM[linha.numero].mensagem,
        ultima_atualizacao: new Date().toISOString(),
        fonte: 'API Oficial CPTM (Governo SP)'
      };
    } else {
      return {
        ...linha,
        status: 'indisponivel',
        mensagem: '⚠️ Não foi possível obter informações oficiais da CPTM',
        ultima_atualizacao: new Date().toISOString(),
        fonte: 'Indisponível',
        erro: 'API oficial não respondeu'
      };
    }
  });
  
  // Processa Metrô (SEM FALLBACK)
  const linhasMetroComStatus = linhasMetro.map(linha => {
    if (statusMetro && statusMetro[linha.numero]) {
      return {
        ...linha,
        status: statusMetro[linha.numero].status,
        mensagem: statusMetro[linha.numero].mensagem,
        ultima_atualizacao: new Date().toISOString(),
        fonte: 'Site Oficial Metrô SP'
      };
    } else {
      return {
        ...linha,
        status: 'indisponivel',
        mensagem: '⚠️ Não foi possível obter informações oficiais do Metrô',
        ultima_atualizacao: new Date().toISOString(),
        fonte: 'Indisponível',
        erro: 'Site oficial não respondeu ou bloqueou acesso'
      };
    }
  });
  
  const todasLinhas = [...linhasMetroComStatus, ...linhasCPTM];
  
  cacheGlobal = {
    dados: todasLinhas,
    timestamp: agora
  };
  
  console.log('✅ ===== CONCLUÍDO =====\n');
  
  return todasLinhas;
}

module.exports = {
  obterStatusLinhas,
  buscarStatusCPTM,
  buscarStatusMetro,
  linhasMetro,
  linhasCPTM: linhasCPTMBase
};

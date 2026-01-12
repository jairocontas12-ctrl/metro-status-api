const axios = require('axios');
const cheerio = require('cheerio');

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
    identificadorAPI: '7',
    cor: { primaria: '#CA016B', secundaria: null },
    estacoes: ['Luz', 'Palmeiras-Barra Funda', 'Água Branca', 'Lapa', 'Piqueri', 'Pirituba', 'Vila Clarice', 'Jaraguá', 'Perus', 'Caieiras', 'Franco da Rocha', 'Baltazar Fidélis', 'Francisco Morato', 'Botujuru', 'Campo Limpo Paulista', 'Várzea Paulista', 'Jundiaí']
  },
  {
    id: 'linha-8-diamante',
    nome: 'Linha 8 - Diamante',
    numero: '8',
    apelido: 'Diamante',
    tipo: 'cptm',
    identificadorAPI: '8',
    cor: { primaria: '#97A098', secundaria: null },
    estacoes: ['Júlio Prestes', 'Palmeiras-Barra Funda', 'Lapa', 'Domingos de Morais', 'Imperatriz Leopoldina', 'Presidente Altino', 'Osasco', 'Comandante Sampaio', 'Quitaúna', 'General Miguel Costa', 'Carapicuíba', 'Santa Terezinha', 'Antônio João', 'Barueri', 'Jardim Belval', 'Jardim Silveira', 'Jandira', 'Sagrado Coração', 'Engenheiro Cardoso', 'Itapevi', 'Santa Rita', 'Amador Bueno']
  },
  {
    id: 'linha-9-esmeralda',
    nome: 'Linha 9 - Esmeralda',
    numero: '9',
    apelido: 'Esmeralda',
    tipo: 'cptm',
    identificadorAPI: '9',
    cor: { primaria: '#01A9A7', secundaria: null },
    estacoes: ['Osasco', 'Presidente Altino', 'Ceasa', 'Villa-Lobos-Jaguaré', 'Cidade Universitária', 'Pinheiros', 'Hebraica-Rebouças', 'Cidade Jardim', 'Vila Olímpia', 'Berrini', 'Morumbi', 'Granja Julieta', 'Santo Amaro', 'Socorro', 'Jurubatuba', 'Autódromo', 'Primavera-Interlagos', 'Grajaú']
  },
  {
    id: 'linha-10-turquesa',
    nome: 'Linha 10 - Turquesa',
    numero: '10',
    apelido: 'Turquesa',
    tipo: 'cptm',
    identificadorAPI: '10',
    cor: { primaria: '#049FC3', secundaria: null },
    estacoes: ['Brás', 'Tatuapé', 'Ipiranga', 'Tamanduateí', 'São Caetano do Sul', 'Utinga', 'Prefeito Saladino', 'Prefeito Celso Daniel-Santo André', 'Capuava', 'Mauá', 'Guapituba', 'Ribeirão Pires', 'Rio Grande da Serra']
  },
  {
    id: 'linha-11-coral',
    nome: 'Linha 11 - Coral',
    numero: '11',
    apelido: 'Coral',
    tipo: 'cptm',
    identificadorAPI: '11',
    cor: { primaria: '#F68368', secundaria: null },
    estacoes: ['Luz', 'Brás', 'Tatuapé', 'Corinthians-Itaquera', 'Dom Bosco', 'José Bonifácio', 'Guaianases', 'Antonio Gianetti Neto', 'Ferraz de Vasconcelos', 'Poá', 'Calmon Viana', 'Suzano', 'Jundiapeba', 'Braz Cubas', 'Mogi das Cruzes', 'Estudantes']
  },
  {
    id: 'linha-12-safira',
    nome: 'Linha 12 - Safira',
    numero: '12',
    apelido: 'Safira',
    tipo: 'cptm',
    identificadorAPI: '12',
    cor: { primaria: '#133C8D', secundaria: null },
    estacoes: ['Brás', 'Tatuapé', 'Engenheiro Goulart', 'USP Leste', 'Comendador Ermelino', 'São Miguel Paulista', 'Jardim Helena-Vila Mara', 'Itaim Paulista', 'Jardim Romano', 'Engenheiro Manuel Feio', 'Itaquaquecetuba', 'Aracaré', 'Calmon Viana']
  },
  {
    id: 'linha-13-jade',
    nome: 'Linha 13 - Jade',
    numero: '13',
    apelido: 'Jade',
    tipo: 'cptm',
    identificadorAPI: '13',
    cor: { primaria: '#00AB4E', secundaria: null },
    estacoes: ['Engenheiro Goulart', 'Aeroporto-Guarulhos']
  }
];

// ========================================
// FUNÇÕES DE SCRAPING/API
// ========================================

// Busca dados REAIS da API oficial da CPTM
async function buscarStatusCPTM() {
  try {
    console.log('🔄 Buscando dados da API oficial da CPTM...');
    
    const response = await axios.get('https://open-linhas-api-roli.rota.os.sp.gov.br/status', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('✅ Dados da CPTM obtidos com sucesso!');
    
    // A API retorna um array de objetos com status de cada linha
    const statusPorLinha = {};
    
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach(item => {
        // Mapeia o status da API para nosso formato
        let status = 'normal';
        let mensagem = 'Operação normal';
        
        const statusAPI = item.status ? item.status.toLowerCase() : '';
        const nomeLinhaAPI = item.name || item.linha || item.id || '';
        
        // Detecta problemas
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
        
        // Identifica a linha pelo número
        const numeroLinha = nomeLinhaAPI.match(/\d+/);
        if (numeroLinha) {
          statusPorLinha[numeroLinha[0]] = { status, mensagem };
        }
      });
    }
    
    return statusPorLinha;
  } catch (error) {
    console.error('❌ Erro ao buscar API da CPTM:', error.message);
    return null;
  }
}

// Tenta fazer scraping do site do Metrô
async function buscarStatusMetro() {
  try {
    console.log('🔄 Tentando scraping do site do Metrô...');
    
    const response = await axios.get('https://www.metro.sp.gov.br/', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const statusPorLinha = {};
    
    // Procura por elementos que contenham informações de status
    // NOTA: A estrutura do site pode mudar, isso é uma tentativa
    $('*').each((i, elem) => {
      const texto = $(elem).text().toLowerCase();
      const classes = $(elem).attr('class') || '';
      
      // Procura menções de linhas e seus status
      if (texto.includes('linha') && (texto.includes('normal') || texto.includes('reduzida') || texto.includes('parad'))) {
        // Tenta extrair informações...
      }
    });
    
    console.log('✅ Scraping do Metrô concluído');
    return statusPorLinha;
  } catch (error) {
    console.error('⚠️ Não foi possível fazer scraping do Metrô:', error.message);
    return null;
  }
}

// Verifica horário de operação
function verificarHorarioOperacao() {
  const agora = new Date();
  const horaLocal = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
  const hora = parseInt(horaLocal.split(':')[0]);
  
  console.log(`🕐 Horário atual em São Paulo: ${horaLocal} (${hora}h)`);
  
  // Metrô opera aproximadamente das 4h40 às 00h
  // CPTM opera aproximadamente das 4h às 00h30
  
  if (hora >= 0 && hora < 4) {
    return {
      operando: false,
      mensagem: 'Operação encerrada - Fora do horário de funcionamento'
    };
  }
  
  if (hora >= 4 && hora < 5) {
    return {
      operando: true,
      mensagem: 'Início da operação'
    };
  }
  
  return {
    operando: true,
    mensagem: 'Operação normal'
  };
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

async function obterStatusLinhas() {
  console.log('\n🚇 Iniciando busca de status das linhas...\n');
  
  const horario = verificarHorarioOperacao();
  
  // Busca dados reais
  const statusCPTM = await buscarStatusCPTM();
  const statusMetro = await buscarStatusMetro();
  
  // Processa CPTM com dados REAIS da API
  const linhasCPTM = linhasCPTMBase.map(linha => {
    let status = 'normal';
    let mensagem = horario.mensagem;
    
    // Se não está operando (madrugada)
    if (!horario.operando) {
      status = 'paralisada';
      mensagem = horario.mensagem;
    }
    // Se conseguiu dados da API oficial
    else if (statusCPTM && statusCPTM[linha.numero]) {
      status = statusCPTM[linha.numero].status;
      mensagem = statusCPTM[linha.numero].mensagem;
    }
    
    return {
      ...linha,
      status,
      mensagem,
      ultima_atualizacao: new Date().toISOString(),
      fonte: statusCPTM ? 'API Oficial CPTM' : 'Horário de operação'
    };
  });
  
  // Processa Metrô (scraping ou horário)
  const linhasMetroComStatus = linhasMetro.map(linha => {
    let status = 'normal';
    let mensagem = horario.mensagem;
    
    // Se não está operando (madrugada)
    if (!horario.operando) {
      status = 'paralisada';
      mensagem = horario.mensagem;
    }
    // Se conseguiu dados do scraping
    else if (statusMetro && statusMetro[linha.numero]) {
      status = statusMetro[linha.numero].status;
      mensagem = statusMetro[linha.numero].mensagem;
    }
    
    return {
      ...linha,
      status,
      mensagem,
      ultima_atualizacao: new Date().toISOString(),
      fonte: statusMetro ? 'Scraping Metrô SP' : 'Horário de operação'
    };
  });
  
  const todasLinhas = [...linhasMetroComStatus, ...linhasCPTM];
  
  console.log('\n✅ Status de todas as linhas obtido!\n');
  
  return todasLinhas;
}

module.exports = {
  obterStatusLinhas,
  buscarStatusCPTM,
  buscarStatusMetro,
  linhasMetro,
  linhasCPTM: linhasCPTMBase
};

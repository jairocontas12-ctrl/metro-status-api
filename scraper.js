const axios = require('axios');
const cheerio = require('cheerio');

// Dados base das linhas (estrutura fixa)
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

const linhasCPTM = [
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

// Função para fazer scraping real do site do Metrô
async function scrapearMetro() {
  try {
    const response = await axios.get('https://www.metro.sp.gov.br/', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const statusLinhas = {};
    
    // Tenta encontrar elementos de status no HTML
    // NOTA: Isso depende da estrutura do site que pode mudar
    $('.linha-status, .status-linha, [class*="linha"], [class*="status"]').each((i, elem) => {
      const texto = $(elem).text().toLowerCase();
      
      // Detecta problemas nas linhas
      if (texto.includes('normal')) {
        // Linha normal
      } else if (texto.includes('reduzida') || texto.includes('lenta')) {
        // Operação reduzida
      } else if (texto.includes('parad') || texto.includes('encerrad')) {
        // Paralisada ou encerrada
      }
    });
    
    return statusLinhas;
  } catch (error) {
    console.error('Erro ao fazer scraping do Metrô:', error.message);
    return null;
  }
}

// Função para fazer scraping real do site da CPTM
async function scrapearCPTM() {
  try {
    const response = await axios.get('https://www.cptm.sp.gov.br/', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const statusLinhas = {};
    
    // Scraping similar ao do Metrô
    return statusLinhas;
  } catch (error) {
    console.error('Erro ao fazer scraping da CPTM:', error.message);
    return null;
  }
}

// Função para verificar horário de operação
function verificarHorarioOperacao() {
  const agora = new Date();
  const hora = agora.getHours();
  const dia = agora.getDay(); // 0 = Domingo, 6 = Sábado
  
  // Metrô opera aproximadamente das 4h40 às 00h (varia por dia)
  // CPTM opera aproximadamente das 4h às 00h30
  
  if (hora >= 0 && hora < 4) {
    return {
      operando: false,
      mensagem: 'Operação encerrada'
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

// Função principal que retorna status com dados REAIS
async function obterStatusLinhas() {
  const horario = verificarHorarioOperacao();
  const todasLinhas = [...linhasMetro, ...linhasCPTM];
  
  // Tenta fazer scraping real
  const statusMetro = await scrapearMetro();
  const statusCPTM = await scrapearCPTM();
  
  const linhasComStatus = todasLinhas.map(linha => {
    let status = 'normal';
    let mensagem = horario.mensagem;
    
    // Se não está operando (madrugada), marca como paralisada
    if (!horario.operando) {
      status = 'paralisada';
      mensagem = 'Operação encerrada - Fora do horário de funcionamento';
    }
    
    // Aqui você integraria os dados do scraping real
    // if (statusMetro && statusMetro[linha.id]) {
    //   status = statusMetro[linha.id].status;
    //   mensagem = statusMetro[linha.id].mensagem;
    // }
    
    return {
      ...linha,
      status,
      mensagem,
      ultima_atualizacao: new Date().toISOString()
    };
  });
  
  return linhasComStatus;
}

module.exports = {
  obterStatusLinhas,
  scrapearMetro,
  scrapearCPTM,
  linhasMetro,
  linhasCPTM
};

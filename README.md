# 🚇 API de Status - Metrô e CPTM São Paulo

API REST não-oficial para consultar o status operacional em tempo real das linhas de Metrô e CPTM de São Paulo.

## 📋 Características

- ✅ Status em tempo real de todas as linhas
- ✅ Informações detalhadas de cada linha
- ✅ Documentação interativa com Swagger
- ✅ Cache inteligente para performance
- ✅ Atualização automática dos dados
- ✅ 100% gratuito e open-source
- ✅ Fácil de hospedar e personalizar

## 🚀 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Swagger/OpenAPI** - Documentação interativa
- **Axios** - Cliente HTTP
- **Cheerio** - Web scraping
- **Node-cron** - Agendamento de tarefas

## 📦 Instalação

### Pré-requisitos

- Node.js 14+ instalado
- npm ou yarn

### Passo a passo

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/metro-status-api.git
cd metro-status-api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o servidor:
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

5. Acesse a documentação:
```
http://localhost:3000/docs
```

## 📚 Endpoints Disponíveis

### Status Geral
```http
GET /api/status
```
Retorna o status de todas as linhas (Metrô + CPTM)

**Resposta:**
```json
{
  "total_linhas": 13,
  "linhas_normais": 11,
  "linhas_com_problemas": 2,
  "ultima_atualizacao": "2026-01-09T18:30:00.000Z",
  "linhas": [...]
}
```

### Status por Tipo
```http
GET /api/status/metro
GET /api/status/cptm
```
Retorna apenas linhas de Metrô ou CPTM

### Listar Todas as Linhas
```http
GET /api/linhas
```
Lista todas as linhas cadastradas

### Detalhes de Uma Linha
```http
GET /api/linhas/{id}
```
Exemplo: `/api/linhas/linha-1-azul`

**Resposta:**
```json
{
  "id": "linha-1-azul",
  "nome": "Linha 1 - Azul",
  "numero": "1",
  "apelido": "Azul",
  "tipo": "metro",
  "cor": {
    "primaria": "#0455A1",
    "secundaria": null
  },
  "status": "normal",
  "mensagem": "Operação normal",
  "ultima_atualizacao": "2026-01-09T18:30:00.000Z",
  "estacoes": ["Jabaquara", "Conceição", ...]
}
```

### Buscar por Código/Número
```http
GET /api/codigo/{numero}
```
Exemplo: `/api/codigo/1` (retorna Linha 1 - Azul)

### Health Check
```http
GET /health
```
Verifica se a API está funcionando

## 🎨 Linhas Disponíveis

### Metrô
- 🔵 Linha 1 - Azul
- 🟢 Linha 2 - Verde
- 🔴 Linha 3 - Vermelha
- 🟡 Linha 4 - Amarela
- 🟣 Linha 5 - Lilás
- ⚪ Linha 15 - Prata (Monotrilho)

### CPTM
- 🔴 Linha 7 - Rubi
- ⚪ Linha 8 - Diamante
- 🔵 Linha 9 - Esmeralda
- 🔵 Linha 10 - Turquesa
- 🟠 Linha 11 - Coral
- 🔵 Linha 12 - Safira
- 🟢 Linha 13 - Jade

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
PORT=3000
CACHE_DURATION=60000
METRO_URL=https://www.metro.sp.gov.br/
CPTM_URL=https://www.cptm.sp.gov.br/
NODE_ENV=development
```

### Cache

A API usa cache em memória por padrão (1 minuto). Os dados são atualizados automaticamente a cada 2 minutos via cron job.

## 🌐 Deploy Gratuito

### Opções de Hospedagem Grátis

1. **Render** (Recomendado)
   - Deploy gratuito
   - HTTPS automático
   - [render.com](https://render.com)

2. **Railway**
   - 500 horas grátis/mês
   - [railway.app](https://railway.app)

3. **Vercel**
   - Deploy com GitHub
   - [vercel.com](https://vercel.com)

4. **Heroku**
   - Plano hobby gratuito
   - [heroku.com](https://heroku.com)

### Deploy no Render

1. Faça push do código no GitHub
2. Crie conta no Render
3. Clique em "New Web Service"
4. Conecte seu repositório
5. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Deploy!

## 🛠️ Personalização

### Adicionar Scraping Real

Edite o arquivo `scraper.js` para implementar web scraping real:

```javascript
async function scrapearMetro() {
  const response = await axios.get('https://www.metro.sp.gov.br/');
  const $ = cheerio.load(response.data);
  
  // Seu código de scraping aqui
  const status = $('.status-linha').text();
  
  return status;
}
```

### Adicionar Novas Linhas

Edite o array `linhasMetro` ou `linhasCPTM` em `scraper.js`:

```javascript
const linhasMetro = [
  {
    id: 'linha-6-laranja',
    nome: 'Linha 6 - Laranja',
    numero: '6',
    apelido: 'Laranja',
    tipo: 'metro',
    cor: { primaria: '#FF6600', secundaria: null },
    estacoes: [...]
  }
];
```

## 📖 Documentação Interativa

Acesse `/docs` para ver a documentação completa no Swagger UI:
- Teste os endpoints diretamente no navegador
- Veja exemplos de requisições e respostas
- Schemas de dados detalhados

## ⚠️ Aviso Legal

Esta é uma API **não-oficial** criada para fins educacionais e informativos. Os dados são obtidos de fontes públicas e podem não ser 100% precisos. Para informações oficiais, consulte:

- Metrô SP: https://www.metro.sp.gov.br/
- CPTM: https://www.cptm.sp.gov.br/

## 🤝 Contribuindo

Contribuições são bem-vindas! 

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📝 Melhorias Futuras

- [ ] Implementar scraping real dos sites oficiais
- [ ] Adicionar histórico de status
- [ ] Notificações em tempo real via WebSocket
- [ ] Integração com redes sociais (Twitter/X)
- [ ] Previsão de problemas usando ML
- [ ] Dashboard web interativo
- [ ] Aplicativo móvel

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

Seu Nome
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- Email: contato@example.com

## ⭐ Suporte

Se este projeto foi útil para você, considere dar uma estrela no GitHub!

---

Feito com ❤️ em São Paulo

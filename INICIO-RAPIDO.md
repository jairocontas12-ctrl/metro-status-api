# ⚡ INÍCIO RÁPIDO - 5 Minutos para Rodar

## 🎯 O que você vai ter:

✅ API REST completa com 6 endpoints
✅ Documentação interativa Swagger
✅ Status de 13 linhas (Metrô + CPTM)
✅ Atualização automática a cada 2 minutos
✅ Pronto para deploy gratuito

---

## 📦 Passo 1: Instalar (2 minutos)

```bash
# 1. Entre na pasta do projeto
cd metro-status-api

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de configuração
cp .env.example .env
```

---

## 🚀 Passo 2: Rodar (1 minuto)

```bash
# Inicie o servidor
npm start
```

Você verá:
```
╔════════════════════════════════════════════════════════════╗
║   🚇 API de Status - Metrô e CPTM São Paulo               ║
║   Servidor rodando em: http://localhost:3000              ║
║   Documentação: http://localhost:3000/docs               ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🎉 Passo 3: Testar (2 minutos)

### Abra no navegador:

1. **Documentação Interativa:**
   ```
   http://localhost:3000/docs
   ```
   👆 Aqui você pode testar todos os endpoints!

2. **Ver status de todas as linhas:**
   ```
   http://localhost:3000/api/status
   ```

3. **Ver apenas Metrô:**
   ```
   http://localhost:3000/api/status/metro
   ```

4. **Ver apenas CPTM:**
   ```
   http://localhost:3000/api/status/cptm
   ```

---

## 🧪 Testar com CURL

```bash
# Status geral
curl http://localhost:3000/api/status

# Apenas Metrô
curl http://localhost:3000/api/status/metro

# Linha específica
curl http://localhost:3000/api/linhas/linha-1-azul

# Buscar por número
curl http://localhost:3000/api/codigo/1
```

---

## 📱 Usar no seu código

### JavaScript / Frontend:
```javascript
// Buscar status
fetch('http://localhost:3000/api/status')
  .then(res => res.json())
  .then(data => console.log(data));
```

### React:
```jsx
useEffect(() => {
  fetch('http://localhost:3000/api/status/metro')
    .then(res => res.json())
    .then(data => setLinhas(data));
}, []);
```

### Node.js:
```javascript
const axios = require('axios');

const data = await axios.get('http://localhost:3000/api/status');
console.log(data.data);
```

---

## 🌐 Passo 4: Deploy (GRÁTIS)

### Opção 1: Render (Mais Fácil)
1. Faça push no GitHub
2. Vá em https://render.com
3. New Web Service > Conecte repo
4. Deploy! ✅

### Opção 2: Railway
```bash
npm install -g @railway/cli
railway login
railway up
```

### Opção 3: Vercel
```bash
npm install -g vercel
vercel
```

📖 **Mais detalhes em:** `DEPLOY.md`

---

## 📚 Arquivos Importantes

- `README.md` - Documentação completa
- `DEPLOY.md` - Guia de hospedagem
- `EXEMPLOS.js` - Exemplos de uso
- `server.js` - Servidor principal
- `scraper.js` - Coleta de dados
- `routes/api.js` - Endpoints da API

---

## 🎨 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Info da API |
| GET | `/docs` | Documentação Swagger |
| GET | `/health` | Status do servidor |
| GET | `/api/status` | Todas as linhas |
| GET | `/api/status/metro` | Só Metrô |
| GET | `/api/status/cptm` | Só CPTM |
| GET | `/api/linhas` | Lista linhas |
| GET | `/api/linhas/{id}` | Detalhes de uma linha |
| GET | `/api/codigo/{num}` | Busca por número |

---

## 🔧 Personalizar

### Mudar porta:
```bash
# No arquivo .env
PORT=8080
```

### Adicionar mais linhas:
Edite `scraper.js` e adicione no array `linhasMetro` ou `linhasCPTM`

### Implementar scraping real:
Edite as funções `scrapearMetro()` e `scrapearCPTM()` em `scraper.js`

---

## 💡 Dicas

✅ Use a documentação Swagger em `/docs` para testar
✅ Os dados são mockados por padrão (você pode implementar scraping real)
✅ Cache automático de 1 minuto
✅ Atualização automática a cada 2 minutos
✅ CORS habilitado para todos os domínios

---

## 🆘 Problemas?

### Erro "EADDRINUSE"
A porta 3000 já está em uso. Mude no .env:
```
PORT=3001
```

### Dependências não instalaram
```bash
rm -rf node_modules package-lock.json
npm install
```

### API não responde
Verifique se está rodando:
```bash
curl http://localhost:3000/health
```

---

## 📞 Suporte

- Abra issue no GitHub
- Veja `README.md` para mais detalhes
- Consulte exemplos em `EXEMPLOS.js`

---

## ✨ Próximos Passos

1. ✅ Rode localmente
2. ✅ Teste os endpoints
3. ✅ Veja a documentação
4. 🚀 Faça deploy gratuito
5. 🎨 Personalize para suas necessidades
6. 📱 Use em seu app/site
7. ⭐ Dê uma estrela no GitHub!

---

**Criado com ❤️ - 100% Gratuito e Open Source**

Agora é só rodar `npm start` e começar a usar! 🎉

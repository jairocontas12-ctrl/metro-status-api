# 🚀 Guia de Deploy - Hospedagem Gratuita

Este guia mostra como fazer deploy da API em serviços gratuitos.

## 🎯 Render (Recomendado - Mais Fácil)

### Passo a passo:

1. **Crie uma conta no Render**
   - Acesse: https://render.com
   - Faça login com GitHub

2. **Prepare seu código**
   ```bash
   # Certifique-se que está tudo commitado
   git add .
   git commit -m "Preparar para deploy"
   git push origin main
   ```

3. **Crie um novo Web Service**
   - Dashboard do Render > "New +"
   - Selecione "Web Service"
   - Conecte seu repositório do GitHub

4. **Configure o serviço**
   ```
   Name: metro-status-api
   Region: Oregon (US West)
   Branch: main
   Root Directory: (deixe vazio)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

5. **Defina as variáveis de ambiente**
   - Clique em "Advanced"
   - Adicione:
     ```
     PORT=3000
     NODE_ENV=production
     ```

6. **Deploy!**
   - Clique em "Create Web Service"
   - Aguarde alguns minutos
   - Sua API estará online em: `https://seu-app.onrender.com`

### ✅ Vantagens do Render:
- Deploy automático quando você faz push
- HTTPS gratuito
- 750 horas/mês gratuitas
- Logs em tempo real
- Fácil de usar

---

## 🚂 Railway

### Passo a passo:

1. **Instale o Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Faça login**
   ```bash
   railway login
   ```

3. **Inicialize o projeto**
   ```bash
   railway init
   ```

4. **Configure variáveis**
   ```bash
   railway variables set PORT=3000
   railway variables set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Obtenha a URL**
   ```bash
   railway domain
   ```

### ✅ Vantagens do Railway:
- 500 horas gratuitas/mês
- Deploy super rápido
- CLI poderosa
- Banco de dados integrado

---

## ▲ Vercel

### Passo a passo:

1. **Instale o Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Faça login**
   ```bash
   vercel login
   ```

3. **Crie arquivo vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

4. **Deploy**
   ```bash
   vercel
   ```

5. **Deploy em produção**
   ```bash
   vercel --prod
   ```

### ✅ Vantagens da Vercel:
- Deploy instantâneo
- CDN global
- Integração perfeita com GitHub
- Preview de cada commit

---

## 🟣 Heroku

### Passo a passo:

1. **Crie arquivo Procfile** (sem extensão)
   ```
   web: node server.js
   ```

2. **Instale o Heroku CLI**
   - Download: https://devcenter.heroku.com/articles/heroku-cli

3. **Faça login**
   ```bash
   heroku login
   ```

4. **Crie o app**
   ```bash
   heroku create nome-do-seu-app
   ```

5. **Configure variáveis**
   ```bash
   heroku config:set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **Abra seu app**
   ```bash
   heroku open
   ```

### ✅ Vantagens do Heroku:
- Muito estável
- Addons poderosos
- Escalável
- Boa documentação

---

## 🐳 Docker (Para qualquer hospedagem)

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

### Comandos:

```bash
# Build
docker build -t metro-api .

# Run
docker run -p 3000:3000 metro-api

# Com Docker Compose
docker-compose up -d
```

---

## 🌐 Domínio Personalizado

### Opções gratuitas:

1. **Freenom** (domínios .tk, .ml, .ga, .cf, .gq)
   - Site: https://freenom.com

2. **Subdomínio do Render/Vercel**
   - Render: `seu-app.onrender.com`
   - Vercel: `seu-app.vercel.app`

3. **Usar serviço DNS gratuito**
   - Cloudflare (recomendado)
   - No-IP
   - DuckDNS

### Configurar domínio no Render:

1. Settings > Custom Domain
2. Adicione seu domínio
3. Configure DNS (CNAME):
   ```
   Type: CNAME
   Name: api (ou @)
   Value: seu-app.onrender.com
   ```

---

## 📊 Monitoramento Gratuito

### UptimeRobot
- Site: https://uptimerobot.com
- Monitora se sua API está online
- Envia alertas por email/SMS
- Gratuito para até 50 monitores

### Configuração:
1. Crie conta
2. Adicione novo monitor
3. Type: HTTP(s)
4. URL: `https://seu-app.onrender.com/health`
5. Interval: 5 minutos

---

## 🔒 Segurança

### Adicione rate limiting:

```javascript
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de requisições
});

app.use('/api/', limiter);
```

### Adicione helmet para headers de segurança:

```javascript
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## 📈 Analytics Gratuito

### Google Analytics
- Rastreie uso da API
- Veja endpoints mais usados

### Mixpanel
- Analytics em tempo real
- Até 100k eventos/mês grátis

---

## 💡 Dicas Importantes

1. **Sempre use HTTPS** em produção
2. **Configure CORS** adequadamente
3. **Use variáveis de ambiente** para senhas
4. **Faça backup** do código regularmente
5. **Monitore logs** para erros
6. **Teste** antes de fazer deploy
7. **Use cache** para economizar recursos

---

## 🆘 Problemas Comuns

### Erro: "Application Error"
- Verifique os logs
- Confirme que `npm start` funciona localmente
- Verifique variáveis de ambiente

### Erro: "Port already in use"
- Use `process.env.PORT || 3000`
- Não force a porta 3000

### API muito lenta
- Implemente cache
- Use CDN
- Otimize queries

### Deploy falhou
- Verifique package.json
- Confirme que dependencies estão corretas
- Veja logs de build

---

## 📞 Suporte

Se tiver problemas:
- Abra uma issue no GitHub
- Consulte docs da plataforma
- Procure no Stack Overflow

Boa sorte com seu deploy! 🚀

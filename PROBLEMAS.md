# 🔧 SOLUÇÃO DE PROBLEMAS

## ❌ Erro: "Não é possível acessar localhost"

### Causa:
O servidor não está rodando.

### ✅ Solução:

**1. Verifique se você instalou as dependências:**

```bash
# Entre na pasta do projeto
cd metro-status-api

# Instale as dependências
npm install
```

Você deve ver algo assim:
```
added 150 packages in 15s
```

**2. Inicie o servidor:**

```bash
npm start
```

Você DEVE ver esta tela:
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚇 API de Status - Metrô e CPTM São Paulo               ║
║                                                            ║
║   Servidor rodando em: http://localhost:3000              ║
║   Documentação: http://localhost:3000/docs               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

**3. Agora SIM, acesse no navegador:**
```
http://localhost:3000/docs
```

---

## ⚠️ Outros Erros Comuns:

### Erro: "npm: command not found"

**Solução:** Instale o Node.js primeiro
- Windows: https://nodejs.org/
- Mac: `brew install node`
- Linux: `sudo apt install nodejs npm`

Depois rode: `node --version` para confirmar

---

### Erro: "Cannot find module 'express'"

**Solução:** Você esqueceu de instalar as dependências!

```bash
npm install
```

---

### Erro: "EADDRINUSE: address already in use"

**Solução:** A porta 3000 já está em uso.

**Opção 1:** Encontre e mate o processo:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <número_do_pid> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Opção 2:** Mude a porta no arquivo `.env`:
```env
PORT=3001
```

E acesse: `http://localhost:3001/docs`

---

### Erro: "ENOENT: no such file or directory"

**Solução:** Você não está na pasta correta!

```bash
# Verifique onde você está
pwd

# Entre na pasta correta
cd metro-status-api

# Confirme que os arquivos estão lá
ls -la
```

Você deve ver:
- server.js
- package.json
- routes/
- etc...

---

## ✅ CHECKLIST - Faça nesta ordem:

- [ ] 1. Extraí o ZIP?
- [ ] 2. Entrei na pasta `metro-status-api`?
- [ ] 3. Rodei `npm install`?
- [ ] 4. Rodei `npm start`?
- [ ] 5. Vi a mensagem de sucesso no terminal?
- [ ] 6. Acessei `http://localhost:3000/docs` no navegador?

---

## 🧪 Teste Rápido:

Execute estes comandos um por um:

```bash
# 1. Verifique se Node.js está instalado
node --version
# Deve mostrar: v18.x.x ou similar

# 2. Verifique se npm está instalado
npm --version
# Deve mostrar: 9.x.x ou similar

# 3. Entre na pasta
cd metro-status-api

# 4. Liste os arquivos
ls
# Deve mostrar: server.js, package.json, etc

# 5. Instale
npm install
# Aguarde instalar tudo

# 6. Rode
npm start
# O servidor deve iniciar

# 7. Em outro terminal, teste
curl http://localhost:3000/health
# Deve retornar: {"status":"OK",...}
```

---

## 🆘 Ainda não funciona?

### Me envie:

1. **Qual comando você rodou:**
```bash
cd metro-status-api
npm install
npm start
```

2. **Qual foi o erro EXATO que apareceu:**
(Copie e cole tudo que apareceu em vermelho)

3. **Qual sistema operacional:**
- [ ] Windows
- [ ] Mac
- [ ] Linux

4. **Versão do Node:**
```bash
node --version
```

---

## 💡 Dica Extra:

Se estiver com muitos problemas, use o **Docker** (mais fácil):

```bash
# Crie arquivo Dockerfile na pasta do projeto
# (já explico o conteúdo abaixo)

# Rode:
docker build -t metro-api .
docker run -p 3000:3000 metro-api
```

Aí é só acessar: http://localhost:3000/docs

---

## 🎯 Resumão do Processo Correto:

```bash
# Passo 1: Extrair ZIP
unzip metro-status-api.zip

# Passo 2: Entrar na pasta
cd metro-status-api

# Passo 3: Instalar
npm install

# Passo 4: Rodar
npm start

# Passo 5: Acessar navegador
# http://localhost:3000/docs
```

**É isso! Não pule nenhum passo!** 🚀

---

## ⚡ Atalho Rápido (Tudo de Uma Vez):

```bash
cd metro-status-api && npm install && npm start
```

Pronto! Agora deve funcionar! 🎉

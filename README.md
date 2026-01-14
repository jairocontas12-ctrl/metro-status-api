# 🚇 Metro Status API - São Paulo

API em tempo real para consultar o status das linhas de Metrô, CPTM e Via Quatro de São Paulo.

## 🚀 Características

- ✅ **Dados em tempo real** do site oficial
- ✅ **Cache inteligente** (1 minuto)
- ✅ **Fallback automático** se o site cair
- ✅ **9 endpoints úteis**
- ✅ **Health check** para monitoramento
- ✅ **Pronto para produção**

## 📡 API URL

```
https://metro-sp-api.onrender.com
```

## 🎯 Endpoints

### 1. Todas as linhas
```bash
GET /
```

### 2. Linha específica
```bash
GET /line/1
GET /line/name/azul
```

### 3. Estatísticas e monitoramento
```bash
GET /health
GET /stats
GET /problems
```

### 4. Filtros
```bash
GET /status/0
```

### 5. Documentação
```bash
GET /info
```

## 🔧 Instalação Local

```bash
git clone https://github.com/jairocontas12-ctrl/metro-sp-api.git
cd metro-sp-api
npm install
npm start
```

## 📝 Licença

MIT - Jairo Contas

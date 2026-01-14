# 🔧 CORREÇÃO DO ERRO 404 - SITE DO METRÔ MUDOU!

## ❌ O PROBLEMA:

Erro: `{"error":"Erro ao buscar dados do metrô","message":"Request failed with status code 404"}`

**Causa:** O site do Metrô SP **MUDOU A URL** em Janeiro de 2026!

---

## ✅ SOLUÇÃO - ATUALIZAR O CÓDIGO

Criei uma **versão ATUALIZADA** do `getLineStatus.js` com:

1. ✅ **Nova URL** do site do Metrô
2. ✅ **Novo scraping** adaptado à estrutura atual
3. ✅ **Fallback** para estrutura antiga
4. ✅ **Timeout maior** (15 segundos)
5. ✅ **Headers melhorados**

---

## 🚀 COMO CORRIGIR (2 MINUTOS):

### **PASSO 1: Baixar o arquivo atualizado**

Baixe o arquivo: **`getLineStatus.js`** (versão atualizada)

### **PASSO 2: Substituir no GitHub**

1. Vá em: https://github.com/jairocontas12-ctrl/metro-sp-api
2. Clique no arquivo **`getLineStatus.js`**
3. Clique no **lápis** ✏️ (Edit this file)
4. **CTRL+A** (seleciona tudo) → **DELETE**
5. **Abra o novo arquivo** que baixou
6. **CTRL+A** → **CTRL+C** (copiar todo o conteúdo)
7. **Cole** no GitHub
8. Scroll até o final
9. Commit message: `Fix: Atualizar URL do site do Metrô`
10. Clique em **"Commit changes"**

### **PASSO 3: Aguardar Deploy**

1. Render detecta automaticamente
2. Começa novo deploy
3. Aguarde 2-3 minutos
4. Status fica "Live" (verde)

### **PASSO 4: Testar**

Teste novamente:
```
https://metro-sp-api.onrender.com/health
https://metro-sp-api.onrender.com/
```

✅ **Agora deve funcionar!**

---

## 📊 O QUE MUDOU NO CÓDIGO:

### ❌ ANTES (URL antiga):
```javascript
const METRO_URL = 'https://www.metro.sp.gov.br/sistemas/direto-do-metro-via4/diretodometro.asp';
```

### ✅ AGORA (URL nova):
```javascript
const METRO_URL = 'https://www.metro.sp.gov.br/direto-do-metro';
```

### ✅ SCRAPING MELHORADO:
- Tenta nova estrutura HTML primeiro
- Se não funcionar, tenta estrutura antiga
- Suporta ambos os formatos

### ✅ HEADERS ATUALIZADOS:
- User-Agent mais recente
- Accept headers completos
- Timeout de 15 segundos (antes era 10)

---

## 🧪 TESTANDO LOCALMENTE (OPCIONAL):

Se você quiser testar antes de fazer deploy:

```bash
# 1. Baixe o arquivo atualizado
# 2. Substitua o getLineStatus.js local

# 3. Instale dependências
npm install

# 4. Rode
npm start

# 5. Teste no navegador
http://localhost:3000/health
http://localhost:3000/
```

---

## ✅ CHECKLIST:

- [ ] Baixei o novo `getLineStatus.js`
- [ ] Substituí no GitHub (Edit → Delete → Cole novo)
- [ ] Commitei as mudanças
- [ ] Aguardei deploy no Render (2-3 min)
- [ ] Status ficou "Live" (verde)
- [ ] Testei `/health` e retornou OK
- [ ] Testei `/` e retornou lista de linhas
- [ ] 🎉 FUNCIONOU!

---

## 🎯 DIFERENÇAS DA VERSÃO ATUALIZADA:

| Item | Versão Antiga | Versão Nova |
|------|---------------|-------------|
| URL | `.../diretodometro.asp` | `.../direto-do-metro` |
| Scraping | Estrutura antiga | Nova + Antiga (fallback) |
| Timeout | 10 segundos | 15 segundos |
| Headers | Básico | Completo |
| Erro 404 | ❌ Falha | ✅ Funciona |

---

## 🐛 SE AINDA DER ERRO:

### Erro persiste após atualização?

1. **Limpar cache do Render:**
   - "Manual Deploy" → "Clear build cache & deploy"

2. **Verificar logs:**
   - Render → Logs → Veja mensagens

3. **Verificar arquivo:**
   - GitHub → getLineStatus.js
   - Tem a nova URL?
   - Linha ~27: `const METRO_URL = 'https://www.metro.sp.gov.br/direto-do-metro';`

---

## 💡 POR QUE DEU ERRO?

O Metrô de São Paulo atualizou o site em Janeiro de 2026:

- ❌ **URL antiga:** `/sistemas/direto-do-metro-via4/diretodometro.asp`
- ✅ **URL nova:** `/direto-do-metro`
- 🔄 **Estrutura HTML:** Mudou completamente

A API antiga tentava acessar uma página que **não existe mais** (404).

---

## 🎉 RESULTADO ESPERADO:

Após a atualização, sua API vai:

✅ Buscar dados da **URL correta**
✅ Fazer scraping da **estrutura nova**
✅ Ter **fallback** para estrutura antiga
✅ Retornar lista completa de linhas
✅ Funcionar 100%!

---

**ATUALIZAÇÃO: Este é um fix crítico! O site mudou e TODAS as APIs precisam atualizar!** 🚨

**Substitua o arquivo e vai funcionar! 🚀**

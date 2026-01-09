// ====================================
// EXEMPLOS DE USO DA API
// ====================================

// 1. Usando com fetch (JavaScript puro)
async function obterStatusGeral() {
  const response = await fetch('http://localhost:3000/api/status');
  const data = await response.json();
  console.log(data);
}

// 2. Usando com axios (Node.js)
const axios = require('axios');

async function obterLinhasMetro() {
  const response = await axios.get('http://localhost:3000/api/status/metro');
  console.log(response.data);
}

// 3. Buscar linha específica
async function obterLinha1() {
  const response = await fetch('http://localhost:3000/api/linhas/linha-1-azul');
  const linha = await response.json();
  console.log(`Status da ${linha.nome}: ${linha.status}`);
}

// 4. Exibir no HTML
async function exibirStatusNoHTML() {
  const response = await fetch('http://localhost:3000/api/status');
  const data = await response.json();
  
  const container = document.getElementById('status-container');
  
  data.linhas.forEach(linha => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3 style="color: ${linha.cor.primaria}">${linha.nome}</h3>
      <p>Status: ${linha.status}</p>
      <p>${linha.mensagem}</p>
    `;
    container.appendChild(div);
  });
}

// 5. Polling - Atualizar a cada minuto
setInterval(async () => {
  const response = await fetch('http://localhost:3000/api/status');
  const data = await response.json();
  console.log('Dados atualizados:', data);
}, 60000);

// 6. Filtrar linhas com problemas
async function linhasComProblemas() {
  const response = await fetch('http://localhost:3000/api/status');
  const data = await response.json();
  
  const problemas = data.linhas.filter(l => l.status !== 'normal');
  
  if (problemas.length > 0) {
    console.log('⚠️ Linhas com problemas:');
    problemas.forEach(l => {
      console.log(`- ${l.nome}: ${l.mensagem}`);
    });
  } else {
    console.log('✅ Todas as linhas operando normalmente!');
  }
}

// 7. Exemplo com React
import React, { useState, useEffect } from 'react';

function StatusMetro() {
  const [linhas, setLinhas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/status/metro');
        const data = await response.json();
        setLinhas(data);
        setLoading(false);
      } catch (error) {
        console.error('Erro:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Status do Metrô</h1>
      {linhas.map(linha => (
        <div key={linha.id} style={{ borderLeft: `5px solid ${linha.cor.primaria}` }}>
          <h3>{linha.nome}</h3>
          <p className={`status-${linha.status}`}>{linha.mensagem}</p>
        </div>
      ))}
    </div>
  );
}

// 8. Exemplo com Vue.js
const app = Vue.createApp({
  data() {
    return {
      linhas: [],
      loading: true
    }
  },
  mounted() {
    this.carregarDados();
    setInterval(this.carregarDados, 60000);
  },
  methods: {
    async carregarDados() {
      const response = await fetch('http://localhost:3000/api/status');
      const data = await response.json();
      this.linhas = data.linhas;
      this.loading = false;
    }
  }
});

// 9. Criar notificação quando houver problemas
async function notificarProblemas() {
  const response = await fetch('http://localhost:3000/api/status');
  const data = await response.json();
  
  const problemas = data.linhas.filter(l => l.status !== 'normal');
  
  if (problemas.length > 0 && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('⚠️ Problemas no Transporte', {
        body: `${problemas.length} linha(s) com problemas`,
        icon: '/icon.png'
      });
    }
  }
}

// 10. Buscar linha por número
async function buscarLinhaPorNumero(numero) {
  const response = await fetch(`http://localhost:3000/api/codigo/${numero}`);
  if (response.ok) {
    const linha = await response.json();
    return linha;
  }
  return null;
}

// Exemplo de uso:
buscarLinhaPorNumero('1').then(linha => {
  console.log(linha); // Retorna Linha 1 - Azul
});

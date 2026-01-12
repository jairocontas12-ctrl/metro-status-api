const express = require('express');
const router = express.Router();
const { obterStatusLinhas, linhasMetro, linhasCPTM } = require('../scraper');

// Cache simples em memória
let cacheStatus = null;
let ultimaAtualizacao = null;
const CACHE_DURATION = 60000; // 1 minuto

/**
 * @swagger
 * components:
 *   schemas:
 *     Linha:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: linha-1-azul
 *         nome:
 *           type: string
 *           example: Linha 1 - Azul
 *         numero:
 *           type: string
 *           example: "1"
 *         apelido:
 *           type: string
 *           example: Azul
 *         tipo:
 *           type: string
 *           enum: [metro, cptm]
 *           example: metro
 *         cor:
 *           type: object
 *           properties:
 *             primaria:
 *               type: string
 *               example: "#0455A1"
 *             secundaria:
 *               type: string
 *               nullable: true
 *         status:
 *           type: string
 *           enum: [normal, reduzida, paralisada]
 *           example: normal
 *         mensagem:
 *           type: string
 *           example: Operação normal
 *         ultima_atualizacao:
 *           type: string
 *           format: date-time
 *     StatusGeral:
 *       type: object
 *       properties:
 *         total_linhas:
 *           type: integer
 *         linhas_normais:
 *           type: integer
 *         linhas_com_problemas:
 *           type: integer
 *         ultima_atualizacao:
 *           type: string
 *           format: date-time
 *         linhas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Linha'
 *     Erro:
 *       type: object
 *       properties:
 *         erro:
 *           type: string
 *         codigo:
 *           type: integer
 *         detalhes:
 *           type: string
 */

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Retorna o status de todas as linhas
 *     description: Obtém o status operacional atual de todas as linhas de Metrô e CPTM
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Status obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatusGeral'
 *       500:
 *         description: Erro ao obter status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
router.get('/status', async (req, res) => {
  try {
    // Verifica cache
    const agora = Date.now();
    if (cacheStatus && ultimaAtualizacao && (agora - ultimaAtualizacao) < CACHE_DURATION) {
      return res.json(cacheStatus);
    }

    // Obtém novos dados
    const linhas = await obterStatusLinhas();
    
    const linhasNormais = linhas.filter(l => l.status === 'normal').length;
    const linhasComProblemas = linhas.length - linhasNormais;
    
    const resultado = {
      total_linhas: linhas.length,
      linhas_normais: linhasNormais,
      linhas_com_problemas: linhasComProblemas,
      ultima_atualizacao: new Date().toISOString(),
      linhas
    };

    // Atualiza cache
    cacheStatus = resultado;
    ultimaAtualizacao = agora;

    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      erro: 'Erro ao obter status das linhas',
      codigo: 500,
      detalhes: error.message
    });
  }
});

/**
 * @swagger
 * /api/status/{tipo}:
 *   get:
 *     summary: Retorna o status das linhas por tipo
 *     description: Obtém o status apenas das linhas de Metrô ou CPTM
 *     tags: [Status]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [metro, cptm]
 *         description: Tipo de linha (metro ou cptm)
 *     responses:
 *       200:
 *         description: Status obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Linha'
 *       400:
 *         description: Tipo inválido
 *       500:
 *         description: Erro ao obter status
 */
router.get('/status/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    
    if (!['metro', 'cptm'].includes(tipo)) {
      return res.status(400).json({
        erro: 'Tipo inválido',
        codigo: 400,
        detalhes: 'Use "metro" ou "cptm"'
      });
    }

    const linhas = await obterStatusLinhas();
    const linhasFiltradas = linhas.filter(l => l.tipo === tipo);

    res.json(linhasFiltradas);
  } catch (error) {
    res.status(500).json({
      erro: 'Erro ao obter status',
      codigo: 500,
      detalhes: error.message
    });
  }
});

/**
 * @swagger
 * /api/linhas:
 *   get:
 *     summary: Lista todas as linhas disponíveis
 *     description: Retorna informações básicas de todas as linhas cadastradas
 *     tags: [Linhas]
 *     responses:
 *       200:
 *         description: Lista de linhas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Linha'
 */
router.get('/linhas', (req, res) => {
  const todasLinhas = [...linhasMetro, ...linhasCPTM];
  res.json(todasLinhas);
});

/**
 * @swagger
 * /api/linhas/{id}:
 *   get:
 *     summary: Retorna detalhes de uma linha específica
 *     description: Obtém informações detalhadas sobre uma linha pelo seu ID
 *     tags: [Linhas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da linha (ex linha-1-azul)
 *         example: linha-1-azul
 *     responses:
 *       200:
 *         description: Detalhes da linha
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Linha'
 *       404:
 *         description: Linha não encontrada
 */
router.get('/linhas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const linhas = await obterStatusLinhas();
    const linha = linhas.find(l => l.id === id);

    if (!linha) {
      return res.status(404).json({
        erro: 'Linha não encontrada',
        codigo: 404,
        detalhes: `Linha com ID "${id}" não existe`
      });
    }

    res.json(linha);
  } catch (error) {
    res.status(500).json({
      erro: 'Erro ao obter linha',
      codigo: 500,
      detalhes: error.message
    });
  }
});

/**
 * @swagger
 * /api/codigo/{codigo}:
 *   get:
 *     summary: Busca linha pelo código/número
 *     description: Retorna informações da linha pelo número (ex 1, 2, 7, etc)
 *     tags: [Linhas]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código/número da linha
 *         example: "1"
 *     responses:
 *       200:
 *         description: Linha encontrada
 *       404:
 *         description: Linha não encontrada
 */
router.get('/codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const linhas = await obterStatusLinhas();
    const linha = linhas.find(l => l.numero === codigo);

    if (!linha) {
      return res.status(404).json({
        erro: 'Linha não encontrada',
        codigo: 404,
        detalhes: `Linha com código "${codigo}" não existe`
      });
    }

    res.json(linha);
  } catch (error) {
    res.status(500).json({
      erro: 'Erro ao buscar linha',
      codigo: 500,
      detalhes: error.message
    });
  }
});

module.exports = router;

// Mock data for Pesquisa de Mercado MVP
// Realistic data based on SNIFF product categories

// Helper: generate dates
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

// ============ DASHBOARD ============
export const mockKPIs = {
  produtosMonitorados: 847,
  concorrentesRastreados: 156,
  oportunidadesAtivas: 23,
  alertasHoje: 8,
};

export const mockTendencia = Array.from({ length: 30 }, (_, i) => ({
  data: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  vendas: Math.floor(80 + Math.random() * 40 + i * 1.5),
  mercado: Math.floor(200 + Math.random() * 60 + i * 2),
}));

export const mockMarketplaceShare = [
  { name: 'Mercado Livre', value: 42, color: '#FFE600' },
  { name: 'Shopee', value: 28, color: '#EE4D2D' },
  { name: 'Amazon', value: 18, color: '#FF9900' },
  { name: 'Magalu', value: 8, color: '#0086FF' },
  { name: 'Temu', value: 4, color: '#F55B23' },
];

export const mockOportunidadesTop = [
  { categoria: 'Tacas Cristal', score: 92, potencial: 'R$ 45K/mes' },
  { categoria: 'Jarras Inox', score: 87, potencial: 'R$ 32K/mes' },
  { categoria: 'Potes Hermeticos', score: 84, potencial: 'R$ 28K/mes' },
  { categoria: 'Sousplats Premium', score: 78, potencial: 'R$ 22K/mes' },
  { categoria: 'Comedouro Pet Inox', score: 75, potencial: 'R$ 18K/mes' },
];

export const mockAlertas = [
  { id: 1, tipo: 'preco', msg: 'Concorrente baixou Taca Cristal 450ml em 15%', tempo: '2h atras', urgencia: 'alta' },
  { id: 2, tipo: 'estoque', msg: 'Jarra Inox 1.5L: concorrente sem estoque', tempo: '4h atras', urgencia: 'media' },
  { id: 3, tipo: 'tendencia', msg: 'Busca por "pote hermetico vidro" +23% esta semana', tempo: '6h atras', urgencia: 'baixa' },
  { id: 4, tipo: 'oportunidade', msg: 'Gap encontrado: Sousplat Ceramica Rosa - 0 vendedores', tempo: '8h atras', urgencia: 'alta' },
  { id: 5, tipo: 'preco', msg: 'Seu preco esta 8% acima da media em Comedouro Pet 300ml', tempo: '12h atras', urgencia: 'media' },
];

// ============ COMPRADORES ============
export const mockSegmentos = [
  { id: 'recorrente', nome: 'Recorrente', total: 1847, ticket: 'R$ 89', freq: '3.2x/ano', cor: '#22C55E', percentual: 35 },
  { id: 'caca_ofertas', nome: 'Caca-Ofertas', total: 2103, ticket: 'R$ 42', freq: '1.8x/ano', cor: '#EAB308', percentual: 40 },
  { id: 'premium', nome: 'Premium', total: 524, ticket: 'R$ 185', freq: '2.1x/ano', cor: '#A855F7', percentual: 10 },
  { id: 'novo', nome: 'Novo', total: 789, ticket: 'R$ 56', freq: '1.0x/ano', cor: '#3B82F6', percentual: 15 },
];

export const mockComportamento = Array.from({ length: 12 }, (_, i) => ({
  mes: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i],
  recorrente: Math.floor(140 + Math.random() * 40 + (i > 9 ? 30 : 0)),
  caca_ofertas: Math.floor(170 + Math.random() * 50 + (i === 10 ? 80 : 0)),
  premium: Math.floor(35 + Math.random() * 15),
  novo: Math.floor(55 + Math.random() * 25),
}));

export const mockRFM = [
  { cliente: 'Joao S.', recencia: 5, frequencia: 12, monetario: 'R$ 1.240', segmento: 'Champion' },
  { cliente: 'Maria L.', recencia: 8, frequencia: 8, monetario: 'R$ 890', segmento: 'Loyal' },
  { cliente: 'Pedro R.', recencia: 15, frequencia: 3, monetario: 'R$ 320', segmento: 'At Risk' },
  { cliente: 'Ana C.', recencia: 2, frequencia: 1, monetario: 'R$ 156', segmento: 'New' },
  { cliente: 'Carlos M.', recencia: 45, frequencia: 6, monetario: 'R$ 670', segmento: 'Hibernating' },
  { cliente: 'Lucia F.', recencia: 3, frequencia: 15, monetario: 'R$ 2.100', segmento: 'Champion' },
  { cliente: 'Roberto A.', recencia: 10, frequencia: 5, monetario: 'R$ 445', segmento: 'Potential' },
  { cliente: 'Patricia D.', recencia: 60, frequencia: 2, monetario: 'R$ 89', segmento: 'Lost' },
];

// ============ CONCORRENCIA ============
export const mockConcorrentes = [
  { id: 1, nome: 'Casa & Decor Premium', marketplace: 'Mercado Livre', produtos: 234, precoMedio: 'R$ 67', reputacao: 'MercadoLider', vendas30d: 1250, tendencia: 'up' },
  { id: 2, nome: 'Vidros & Cristais BR', marketplace: 'Mercado Livre', produtos: 189, precoMedio: 'R$ 54', reputacao: 'MercadoLider Gold', vendas30d: 2100, tendencia: 'up' },
  { id: 3, nome: 'PetShop Central', marketplace: 'Shopee', produtos: 567, precoMedio: 'R$ 38', reputacao: 'Preferido', vendas30d: 3400, tendencia: 'stable' },
  { id: 4, nome: 'Utilidades Express', marketplace: 'Amazon', produtos: 123, precoMedio: 'R$ 72', reputacao: '4.5 estrelas', vendas30d: 890, tendencia: 'down' },
  { id: 5, nome: 'Loja do Chef', marketplace: 'Magalu', produtos: 78, precoMedio: 'R$ 95', reputacao: 'Ouro', vendas30d: 420, tendencia: 'up' },
];

export const mockPosicionamento = [
  { nome: 'SNIFF', preco: 65, qualidade: 88 },
  { nome: 'Casa & Decor', preco: 67, qualidade: 82 },
  { nome: 'Vidros & Cristais', preco: 54, qualidade: 75 },
  { nome: 'PetShop Central', preco: 38, qualidade: 70 },
  { nome: 'Utilidades Express', preco: 72, qualidade: 78 },
  { nome: 'Loja do Chef', preco: 95, qualidade: 90 },
];

export const mockHistoricoPrecos = Array.from({ length: 30 }, (_, i) => ({
  data: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  sniff: 65 + Math.random() * 5 - 2,
  concorrente1: 67 + Math.random() * 8 - 4,
  concorrente2: 54 + Math.random() * 6 - 3,
  mercado: 62 + Math.random() * 4 - 2,
}));

// ============ ELASTICIDADE ============
export const mockElasticidade = Array.from({ length: 20 }, (_, i) => {
  const preco = 30 + i * 5;
  const demanda = Math.max(5, Math.floor(200 * Math.exp(-0.015 * preco) + Math.random() * 10));
  return { preco: `R$ ${preco}`, demanda, receita: preco * demanda };
});

export const mockReceitaOtima = Array.from({ length: 20 }, (_, i) => {
  const preco = 30 + i * 5;
  const demanda = Math.max(5, Math.floor(200 * Math.exp(-0.015 * preco)));
  return { preco: `R$ ${preco}`, receita: preco * demanda };
});

export const mockSugestoesPreco = [
  { produto: 'Taca Cristal 450ml', precoAtual: 'R$ 68', precoSugerido: 'R$ 62', impacto: '+18% vendas', confianca: 92 },
  { produto: 'Jarra Inox 1.5L', precoAtual: 'R$ 89', precoSugerido: 'R$ 85', impacto: '+12% vendas', confianca: 87 },
  { produto: 'Pote Hermetico 1L', precoAtual: 'R$ 34', precoSugerido: 'R$ 32', impacto: '+22% vendas', confianca: 94 },
  { produto: 'Sousplat Ceramica', precoAtual: 'R$ 45', precoSugerido: 'R$ 48', impacto: '+5% margem', confianca: 78 },
  { produto: 'Comedouro Pet 300ml', precoAtual: 'R$ 28', precoSugerido: 'R$ 25', impacto: '+30% vendas', confianca: 90 },
];

// ============ DEMANDA ============
export const mockForecast = Array.from({ length: 60 }, (_, i) => {
  const isProjecao = i >= 30;
  const base = 120 + Math.sin(i / 5) * 30;
  return {
    data: new Date(Date.now() + (i - 30) * 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    realizado: isProjecao ? null : Math.floor(base + Math.random() * 20),
    projecao: isProjecao ? Math.floor(base + Math.random() * 15) : null,
    min: isProjecao ? Math.floor(base - 15) : null,
    max: isProjecao ? Math.floor(base + 35) : null,
  };
});

export const mockSazonalidade = (() => {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const cats = ['Tacas','Jarras','Potes','Pet','Sousplats'];
  return meses.map((mes, mi) => {
    const row = { mes };
    cats.forEach(cat => {
      const base = 50;
      const seasonal = cat === 'Tacas' ? (mi === 11 || mi === 0 ? 95 : mi === 5 ? 30 : base) :
                       cat === 'Pet' ? (base + 10) :
                       cat === 'Potes' ? (mi >= 0 && mi <= 2 ? 80 : base) : base;
      row[cat] = Math.floor(seasonal + Math.random() * 10);
    });
    return row;
  });
})();

export const mockAlertasEstoque = [
  { produto: 'Taca Cristal 450ml', estoqueAtual: 45, previsao30d: 120, status: 'critico', acao: 'Repor urgente' },
  { produto: 'Jarra Inox 1.5L', estoqueAtual: 230, previsao30d: 180, status: 'ok', acao: 'Estoque suficiente' },
  { produto: 'Pote Hermetico 1L', estoqueAtual: 67, previsao30d: 95, status: 'atencao', acao: 'Programar reposicao' },
  { produto: 'Comedouro Pet 300ml', estoqueAtual: 12, previsao30d: 85, status: 'critico', acao: 'Repor urgente' },
  { produto: 'Sousplat Ceramica', estoqueAtual: 156, previsao30d: 60, status: 'ok', acao: 'Estoque suficiente' },
];

// ============ OPORTUNIDADES ============
export const mockGapsMercado = [
  { x: 85, y: 30, z: 45, nome: 'Taca Cristal Rosa', demanda: 85, oferta: 30, oportunidade: 45 },
  { x: 72, y: 55, z: 28, nome: 'Jarra Termica 2L', demanda: 72, oferta: 55, oportunidade: 28 },
  { x: 90, y: 20, z: 55, nome: 'Pote Vidro Bambu', demanda: 90, oferta: 20, oportunidade: 55 },
  { x: 60, y: 40, z: 35, nome: 'Comedouro Elevado', demanda: 60, oferta: 40, oportunidade: 35 },
  { x: 95, y: 15, z: 60, nome: 'Kit Sousplat x6', demanda: 95, oferta: 15, oportunidade: 60 },
  { x: 45, y: 65, z: 12, nome: 'Porta-Tempero Girat.', demanda: 45, oferta: 65, oportunidade: 12 },
];

export const mockCategoriasTrending = [
  { categoria: 'Mesa Posta', crescimento: 34, volume: 12500 },
  { categoria: 'Pet Premium', crescimento: 28, volume: 8900 },
  { categoria: 'Organizacao', crescimento: 22, volume: 15600 },
  { categoria: 'Cozinha Gourmet', crescimento: 19, volume: 9800 },
  { categoria: 'Decoracao Casa', crescimento: 15, volume: 22000 },
];

export const mockOportunidadesTabela = [
  { id: 1, produto: 'Kit Sousplat Ceramica x6', score: 95, demandaMensal: 450, concorrentes: 3, precoMedio: 'R$ 120', margemEst: '45%', marketplace: 'Mercado Livre' },
  { id: 2, produto: 'Pote Vidro Tampa Bambu 1.5L', score: 92, demandaMensal: 380, concorrentes: 5, precoMedio: 'R$ 48', margemEst: '52%', marketplace: 'Amazon' },
  { id: 3, produto: 'Taca Cristal Rose 350ml', score: 88, demandaMensal: 620, concorrentes: 8, precoMedio: 'R$ 35', margemEst: '40%', marketplace: 'Shopee' },
  { id: 4, produto: 'Comedouro Elevado Inox M', score: 85, demandaMensal: 290, concorrentes: 12, precoMedio: 'R$ 65', margemEst: '38%', marketplace: 'Mercado Livre' },
  { id: 5, produto: 'Jarra Termica Premium 2L', score: 82, demandaMensal: 510, concorrentes: 15, precoMedio: 'R$ 95', margemEst: '35%', marketplace: 'Amazon' },
  { id: 6, produto: 'Porta-Tempero Girat. 12pcs', score: 78, demandaMensal: 340, concorrentes: 20, precoMedio: 'R$ 78', margemEst: '42%', marketplace: 'Magalu' },
];

// ============ RELATORIOS ============
export const mockComparativo = [
  { periodo: 'Semana 1', vendas: 245, meta: 300, anterior: 210 },
  { periodo: 'Semana 2', vendas: 312, meta: 300, anterior: 280 },
  { periodo: 'Semana 3', vendas: 287, meta: 300, anterior: 255 },
  { periodo: 'Semana 4', vendas: 356, meta: 300, anterior: 310 },
];

export const mockHistoricoReports = [
  { id: 1, nome: 'Relatorio Mensal - Janeiro 2026', tipo: 'Mensal', gerado: '01/02/2026', tamanho: '2.4 MB' },
  { id: 2, nome: 'Analise Concorrencia Q4-2025', tipo: 'Trimestral', gerado: '15/01/2026', tamanho: '5.1 MB' },
  { id: 3, nome: 'Oportunidades Detectadas - Fev 2026', tipo: 'Sob demanda', gerado: '10/02/2026', tamanho: '1.8 MB' },
  { id: 4, nome: 'Elasticidade de Precos - Tacas', tipo: 'Produto', gerado: '05/02/2026', tamanho: '890 KB' },
];

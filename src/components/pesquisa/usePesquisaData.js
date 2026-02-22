import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  mockKPIs, mockTendencia, mockMarketplaceShare, mockOportunidadesTop, mockAlertas,
  mockSegmentos, mockComportamento, mockRFM,
  mockConcorrentes, mockPosicionamento, mockHistoricoPrecos,
  mockElasticidade, mockReceitaOtima, mockSugestoesPreco,
  mockForecast, mockSazonalidade, mockAlertasEstoque,
  mockGapsMercado, mockCategoriasTrending, mockOportunidadesTabela,
  mockComparativo, mockHistoricoReports,
} from './mockData';

export default function usePesquisaData(supabase) {
  const [concorrentes, setConcorrentes] = useState([]);
  const [precoHistorico, setPrecoHistorico] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [demanda, setDemanda] = useState([]);
  const [segmentos, setSegmentos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        supabase.from('pesquisa_concorrentes').select('*').order('created_at', { ascending: false }),
        supabase.from('pesquisa_preco_historico').select('*').order('data', { ascending: false }),
        supabase.from('pesquisa_oportunidades').select('*').order('score', { ascending: false }),
        supabase.from('pesquisa_demanda').select('*').order('data', { ascending: false }),
        supabase.from('pesquisa_segmentos').select('*'),
        supabase.from('pesquisa_alertas').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      const hasData = results.some(r => r.data && r.data.length > 0);

      if (hasData) {
        setConcorrentes(results[0].data || []);
        setPrecoHistorico(results[1].data || []);
        setOportunidades(results[2].data || []);
        setDemanda(results[3].data || []);
        setSegmentos(results[4].data || []);
        setAlertas(results[5].data || []);
        setUsingMock(false);
      } else {
        loadMockData();
      }
    } catch (e) {
      console.warn('usePesquisaData: Supabase tables not available, using mock data', e);
      loadMockData();
    }
    setLoading(false);
  }, [supabase]);

  const loadMockData = () => {
    setConcorrentes(mockConcorrentes);
    setPrecoHistorico(mockHistoricoPrecos);
    setOportunidades(mockOportunidadesTabela);
    setDemanda(mockForecast);
    setSegmentos(mockSegmentos);
    setAlertas(mockAlertas);
    setUsingMock(true);
  };

  useEffect(() => { load(); }, [load]);

  return {
    // Raw data
    concorrentes, precoHistorico, oportunidades, demanda, segmentos, alertas,
    loading, usingMock,
    reload: load,
    // Mock data pass-through for views (always available)
    mock: {
      kpis: mockKPIs,
      tendencia: mockTendencia,
      marketplaceShare: mockMarketplaceShare,
      oportunidadesTop: mockOportunidadesTop,
      alertas: mockAlertas,
      segmentos: mockSegmentos,
      comportamento: mockComportamento,
      rfm: mockRFM,
      concorrentes: mockConcorrentes,
      posicionamento: mockPosicionamento,
      historicoPrecos: mockHistoricoPrecos,
      elasticidade: mockElasticidade,
      receitaOtima: mockReceitaOtima,
      sugestoesPreco: mockSugestoesPreco,
      forecast: mockForecast,
      sazonalidade: mockSazonalidade,
      alertasEstoque: mockAlertasEstoque,
      gapsMercado: mockGapsMercado,
      categoriasTrending: mockCategoriasTrending,
      oportunidadesTabela: mockOportunidadesTabela,
      comparativo: mockComparativo,
      historicoReports: mockHistoricoReports,
    },
  };
}

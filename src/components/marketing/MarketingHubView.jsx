import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Calendar, Clock, Target, TrendingUp, Star, Gift, ShoppingCart, Heart,
  Zap, Tag, Filter, Check, ChevronRight, AlertCircle, Award, Eye,
  Package, ChevronDown, X, CheckCircle2
} from 'lucide-react';

const PURPLE = '#6B1B8E';
const GOLD = '#F4B942';

const CATEGORY_CONFIG = {
  comemorativo: { label: 'Comemorativo', color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
  sazonal: { label: 'Sazonal', color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' },
  promocional: { label: 'Promocional', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  marketplace: { label: 'Marketplace', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
};

const IMPORTANCE_LABELS = { 1: 'Baixa', 2: 'Moderada', 3: 'Media', 4: 'Alta', 5: 'Critica' };

const ECOMMERCE_EVENTS_2026 = [
  // JANEIRO
  { id: 1, date: '2026-01-01', name: 'Ano Novo / Liquidacoes de Verao', category: 'sazonal', importance: 3, description: 'Inicio das liquidacoes de verao. Consumidores em busca de ofertas pos-festas.', tips: 'Descontos progressivos e queima de estoque do ano anterior.', prepDays: 7 },
  { id: 2, date: '2026-01-05', name: 'Volta as Aulas', category: 'sazonal', importance: 4, description: 'Campanha prolongada. Alta demanda em papelaria, tech, mochilas e moda infantil.', tips: 'Kits e combos vendem bem. Frete gratis para material escolar.', prepDays: 30 },
  // FEVEREIRO
  { id: 3, date: '2026-02-14', name: "Valentine's Day (Internacional)", category: 'comemorativo', importance: 2, description: 'Data relevante para vendas internacionais e nichos especificos.', tips: 'Cross-border selling. Presentes criativos.', prepDays: 14 },
  { id: 4, date: '2026-02-14', name: 'Carnaval', category: 'sazonal', importance: 3, description: 'Fantasias, acessorios, bebidas, protetor solar, decoracao.', tips: 'Flash sales pre-Carnaval. Kits de fantasia.', prepDays: 21 },
  // MARCO
  { id: 5, date: '2026-03-08', name: 'Dia Internacional da Mulher', category: 'comemorativo', importance: 4, description: 'Presentes, moda feminina, cosmeticos, bem-estar.', tips: 'Campanhas de empoderamento. Kits de auto-cuidado.', prepDays: 14 },
  { id: 6, date: '2026-03-15', name: 'Dia do Consumidor', category: 'promocional', importance: 5, description: 'Considerada a "Black Friday do 1o semestre". Alta de vendas em todas as categorias.', tips: 'Semana do Consumidor com ofertas escalonadas. Cupons exclusivos.', prepDays: 21 },
  // ABRIL
  { id: 7, date: '2026-04-03', name: 'Sexta-feira Santa', category: 'comemorativo', importance: 2, description: 'Feriado nacional. Queda no trafego mas oportunidade em nichos.', tips: 'Antecipar entregas antes do feriado.', prepDays: 7 },
  { id: 8, date: '2026-04-05', name: 'Pascoa', category: 'comemorativo', importance: 4, description: 'Chocolates, cestas, presentes, decoracao. Alta conversao.', tips: 'Cestas gourmet e kits personalizados. Anunciar 30 dias antes.', prepDays: 30 },
  { id: 9, date: '2026-04-28', name: 'Dia do Frete Gratis', category: 'promocional', importance: 3, description: 'Data criada pelo e-commerce brasileiro. Alta conversao com frete gratis.', tips: 'Frete gratis sem minimo gera alto volume.', prepDays: 14 },
  // MAIO
  { id: 10, date: '2026-05-01', name: 'Dia do Trabalho', category: 'comemorativo', importance: 2, description: 'Feriado prolongado. Vendas de viagem e lazer.', tips: 'Promocoes relampago no feriado.', prepDays: 7 },
  { id: 11, date: '2026-05-10', name: 'Dia das Maes', category: 'comemorativo', importance: 5, description: '2a data mais importante do e-commerce BR. Presentes, moda, cosmeticos, eletro.', tips: 'Guia de presentes por faixa de preco. Entrega expressa obrigatoria.', prepDays: 30 },
  // JUNHO
  { id: 12, date: '2026-06-05', name: 'Dia do Meio Ambiente', category: 'comemorativo', importance: 2, description: 'Produtos sustentaveis em alta.', tips: 'Destaque produtos eco-friendly e embalagens sustentaveis.', prepDays: 7 },
  { id: 13, date: '2026-06-12', name: 'Dia dos Namorados', category: 'comemorativo', importance: 5, description: '3a data mais importante. Presentes, experiencias, moda, joias, tech.', tips: 'Kits para casal. Entrega garantida ate 12/06. Embalagem presente.', prepDays: 30 },
  { id: 14, date: '2026-06-24', name: 'Festa Junina / Sao Joao', category: 'sazonal', importance: 3, description: 'Alimentos tipicos, decoracao, moda festa junina.', tips: 'Kits de festa junina. Decoracao tematica.', prepDays: 21 },
  // JULHO
  { id: 15, date: '2026-07-01', name: 'Liquidacao de Inverno / Ferias', category: 'sazonal', importance: 3, description: 'Liquidacao de inverno e ferias escolares. Viagens, brinquedos, moda.', tips: 'Queima de estoque inverno. Cross-sell com itens de ferias.', prepDays: 14 },
  { id: 16, date: '2026-07-20', name: 'Dia do Amigo', category: 'comemorativo', importance: 2, description: 'Presentes entre amigos. Social selling.', tips: '"Leve 2 pague 1" e campanhas nas redes sociais.', prepDays: 7 },
  { id: 17, date: '2026-07-26', name: 'Dia dos Avos', category: 'comemorativo', importance: 2, description: 'Presentes para avos. Nicho de conforto e bem-estar.', tips: 'Produtos de conforto, saude e bem-estar.', prepDays: 7 },
  // AGOSTO
  { id: 18, date: '2026-08-09', name: 'Dia dos Pais', category: 'comemorativo', importance: 5, description: '4a data mais importante. Tech, moda, ferramentas, bebidas premium.', tips: 'Guia de presentes segmentado por perfil. Kits premium.', prepDays: 30 },
  { id: 19, date: '2026-08-11', name: 'Dia do Estudante', category: 'comemorativo', importance: 1, description: 'Tech e papelaria com desconto para estudantes.', tips: 'Cupons exclusivos para estudantes.', prepDays: 7 },
  // SETEMBRO
  { id: 20, date: '2026-09-01', name: 'Semana Brasil', category: 'promocional', importance: 4, description: 'Black Friday brasileira oficial. Descontos coordenados pelo varejo nacional.', tips: 'Participar da campanha oficial. Ofertas competitivas.', prepDays: 21 },
  { id: 21, date: '2026-09-07', name: 'Independencia do Brasil', category: 'comemorativo', importance: 2, description: 'Feriado nacional. Campanhas patrioticas.', tips: 'Produtos verde-amarelo. Ofertas de feriado prolongado.', prepDays: 7 },
  { id: 22, date: '2026-09-15', name: 'Dia do Cliente', category: 'promocional', importance: 4, description: 'Semana do Cliente com ofertas especiais. Alta conversao em fidelizacao.', tips: 'Descontos exclusivos para clientes recorrentes. Programa de fidelidade.', prepDays: 14 },
  // OUTUBRO
  { id: 23, date: '2026-10-04', name: 'Dia dos Animais', category: 'comemorativo', importance: 3, description: 'Pet shops e produtos para animais. Mercado pet em alta no BR.', tips: 'Kits pet. Lancamento de produtos novos pet.', prepDays: 14 },
  { id: 24, date: '2026-10-12', name: 'Dia das Criancas', category: 'comemorativo', importance: 5, description: 'Brinquedos, games, roupas infantis. Altissimo volume de vendas.', tips: 'Lancamentos antecipados. Frete gratis em brinquedos.', prepDays: 30 },
  { id: 25, date: '2026-10-15', name: 'Dia do Professor', category: 'comemorativo', importance: 1, description: 'Presentes para professores. Nicho especifico.', tips: 'Canecas, livros, papelaria premium.', prepDays: 7 },
  { id: 26, date: '2026-10-31', name: 'Halloween', category: 'sazonal', importance: 2, description: 'Fantasias, decoracao, doces. Crescente no Brasil.', tips: 'Kits de fantasia e decoracao tematica.', prepDays: 14 },
  // NOVEMBRO
  { id: 27, date: '2026-11-20', name: 'Consciencia Negra', category: 'comemorativo', importance: 2, description: 'Data de inclusao e diversidade.', tips: 'Destacar marcas e empreendedores negros.', prepDays: 7 },
  { id: 28, date: '2026-11-27', name: 'Black Friday', category: 'marketplace', importance: 5, description: 'MAIOR data do e-commerce BR. Todos os marketplaces em alta. Recorde de vendas.', tips: 'Preparar estoque 60 dias antes. Ads antecipados. Frete gratis.', prepDays: 60 },
  { id: 29, date: '2026-11-30', name: 'Cyber Monday', category: 'marketplace', importance: 4, description: 'Extensao da Black Friday focada em tech e eletronicos.', tips: 'Ofertas flash 24h. Foco em tech e eletronicos.', prepDays: 60 },
  // DEZEMBRO
  { id: 30, date: '2026-12-25', name: 'Natal', category: 'comemorativo', importance: 5, description: 'Maior data em valor de ticket medio. Presentes, decoracao, alimentos gourmet.', tips: 'Entrega garantida antes do Natal. Embalagem premium. Gift cards.', prepDays: 45 },
  { id: 31, date: '2026-12-31', name: 'Reveillon / Ano Novo', category: 'sazonal', importance: 3, description: 'Moda branca, decoracao, bebidas, viagens.', tips: 'Flash sales ultimas horas. Preparar liquidacao de janeiro.', prepDays: 14 },
];

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay();

const parseDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const MarketingHubView = () => {
  const today = useMemo(() => new Date(), []);
  const currentYear = 2026;
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('calendar'); // calendar | timeline
  const [plannedEvents, setPlannedEvents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('portal-sniff-planned-events') || '{}');
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('portal-sniff-planned-events', JSON.stringify(plannedEvents));
  }, [plannedEvents]);

  const togglePlanned = useCallback((eventId) => {
    setPlannedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  }, []);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return ECOMMERCE_EVENTS_2026;
    return ECOMMERCE_EVENTS_2026.filter(e => e.category === activeFilter);
  }, [activeFilter]);

  const monthEvents = useMemo(() => {
    return filteredEvents.filter(e => {
      const d = parseDate(e.date);
      return d.getMonth() === selectedMonth;
    });
  }, [selectedMonth, filteredEvents]);

  const nextEvent = useMemo(() => {
    const now = today.getTime();
    return ECOMMERCE_EVENTS_2026
      .filter(e => parseDate(e.date).getTime() >= now)
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())[0] || null;
  }, [today]);

  const daysUntilNext = useMemo(() => {
    if (!nextEvent) return 0;
    const diff = parseDate(nextEvent.date).getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [nextEvent, today]);

  const stats = useMemo(() => {
    const total = ECOMMERCE_EVENTS_2026.length;
    const planned = Object.values(plannedEvents).filter(Boolean).length;
    const critical = ECOMMERCE_EVENTS_2026.filter(e => e.importance >= 4).length;
    const next30 = ECOMMERCE_EVENTS_2026.filter(e => {
      const diff = (parseDate(e.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }).length;
    return { total, planned, critical, next30 };
  }, [plannedEvents, today]);

  const getEventsForDay = useCallback((month, day) => {
    return filteredEvents.filter(e => {
      const d = parseDate(e.date);
      return d.getMonth() === month && d.getDate() === day;
    });
  }, [filteredEvents]);

  const urgencyColor = daysUntilNext <= 7 ? '#EF4444' : daysUntilNext <= 15 ? '#F59E0B' : daysUntilNext <= 30 ? '#3B82F6' : '#10B981';

  // Importance stars renderer
  const ImportanceStars = ({ level }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} className={i <= level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
      ))}
    </div>
  );

  // Mini month calendar
  const MiniMonth = ({ month }) => {
    const days = getDaysInMonth(currentYear, month);
    const firstDay = getFirstDayOfWeek(currentYear, month);
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === currentYear;
    const isSelected = selectedMonth === month;
    const eventsThisMonth = filteredEvents.filter(e => parseDate(e.date).getMonth() === month);
    const hasHighImportance = eventsThisMonth.some(e => e.importance >= 4);

    return (
      <button
        onClick={() => setSelectedMonth(month)}
        className={`rounded-2xl p-3 transition-all duration-300 text-left cursor-pointer border-2 hover:shadow-lg hover:scale-[1.02] ${
          isSelected
            ? 'border-[#F4B942] bg-gradient-to-br from-purple-50 to-yellow-50 shadow-lg shadow-purple-200/50'
            : isCurrentMonth
              ? 'border-purple-300 bg-white shadow-md'
              : 'border-gray-100 bg-white hover:border-purple-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-bold ${isSelected ? 'text-[#6B1B8E]' : 'text-gray-700'}`}>
            {MONTH_NAMES[month]}
          </span>
          <div className="flex items-center gap-1">
            {hasHighImportance && <Zap size={10} className="text-yellow-500 fill-yellow-500" />}
            {eventsThisMonth.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-[#6B1B8E] text-white' : 'bg-gray-100 text-gray-600'}`}>
                {eventsThisMonth.length}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px">
          {DAY_HEADERS.map((d, i) => (
            <span key={i} className="text-[8px] text-center text-gray-400 font-medium">{d}</span>
          ))}
          {Array.from({ length: firstDay }, (_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(month, day);
            const isToday = isCurrentMonth && today.getDate() === day;
            const hasEvent = dayEvents.length > 0;
            const maxImportance = hasEvent ? Math.max(...dayEvents.map(e => e.importance)) : 0;

            return (
              <div key={day} className="relative flex items-center justify-center">
                <span className={`text-[9px] w-4 h-4 flex items-center justify-center rounded-full transition-all ${
                  isToday
                    ? 'bg-[#6B1B8E] text-white font-bold'
                    : hasEvent && maxImportance >= 4
                      ? 'bg-red-100 text-red-700 font-bold'
                      : hasEvent
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-gray-500'
                }`}>
                  {day}
                </span>
                {hasEvent && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-px">
                    {dayEvents.slice(0, 2).map((ev, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full" style={{ backgroundColor: CATEGORY_CONFIG[ev.category]?.color }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </button>
    );
  };

  // Event card component
  const EventCard = ({ event, compact = false }) => {
    const cat = CATEGORY_CONFIG[event.category];
    const eventDate = parseDate(event.date);
    const isPast = eventDate.getTime() < today.getTime();
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isPlanned = !!plannedEvents[event.id];
    const prepStart = new Date(eventDate.getTime() - event.prepDays * 24 * 60 * 60 * 1000);
    const shouldStartPrep = prepStart.getTime() <= today.getTime() && !isPast;

    if (compact) {
      return (
        <div
          onClick={() => setSelectedEvent(event)}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:shadow-md border ${
            isPast ? 'opacity-50 border-gray-100' : 'border-gray-100 hover:border-purple-200'
          }`}
        >
          <div className="w-1 h-10 rounded-full" style={{ backgroundColor: cat?.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 truncate">{event.name}</span>
              {shouldStartPrep && (
                <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold animate-pulse">PREPARAR</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                {eventDate.getDate().toString().padStart(2, '0')}/{(eventDate.getMonth() + 1).toString().padStart(2, '0')}
              </span>
              <ImportanceStars level={event.importance} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isPast && (
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                daysUntil <= 7 ? 'bg-red-100 text-red-700' : daysUntil <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {daysUntil}d
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); togglePlanned(event.id); }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isPlanned ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
              }`}
            >
              {isPlanned ? <CheckCircle2 size={14} /> : <Check size={14} />}
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Year progress
  const yearProgress = useMemo(() => {
    const start = new Date(currentYear, 0, 1).getTime();
    const end = new Date(currentYear, 11, 31).getTime();
    return Math.min(100, Math.max(0, ((today.getTime() - start) / (end - start)) * 100));
  }, [today]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calendario E-commerce 2026</h2>
          <p className="text-sm text-gray-500 mt-1">Planeje suas campanhas nas datas mais importantes do ano</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-[#6B1B8E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Calendario
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'timeline' ? 'bg-[#6B1B8E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Stats + Countdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Countdown - larger card */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#6B1B8E] to-[#4A1063] rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[#F4B942]" />
              <span className="text-purple-200 text-xs font-medium uppercase tracking-wider">Proxima Data</span>
            </div>
            {nextEvent ? (
              <>
                <h3 className="text-lg font-bold mb-1">{nextEvent.name}</h3>
                <p className="text-purple-200 text-xs mb-4">
                  {parseDate(nextEvent.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black" style={{ color: urgencyColor }}>{daysUntilNext}</span>
                  <span className="text-purple-200 text-sm mb-1">dias restantes</span>
                </div>
                <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, 100 - (daysUntilNext / (nextEvent.prepDays || 30)) * 100)}%`,
                      backgroundColor: urgencyColor
                    }}
                  />
                </div>
                <p className="text-[10px] text-purple-300 mt-1">
                  {daysUntilNext <= nextEvent.prepDays ? 'Periodo de preparacao ativo' : `Preparacao inicia em ${daysUntilNext - nextEvent.prepDays} dias`}
                </p>
              </>
            ) : (
              <p className="text-purple-200">Nenhum evento futuro</p>
            )}
          </div>
        </div>

        {/* Stats cards */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar size={16} className="text-[#6B1B8E]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500">Total de Datas</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.planned}<span className="text-sm text-gray-400 font-normal">/{stats.total}</span></p>
          <p className="text-xs text-gray-500">Planejadas</p>
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(stats.planned / stats.total) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle size={16} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.next30}</p>
          <p className="text-xs text-gray-500">Proximos 30 dias</p>
        </div>
      </div>

      {/* Year Progress */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Progresso do Ano 2026</span>
          <span className="text-xs font-bold text-[#6B1B8E]">{yearProgress.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#6B1B8E] to-[#F4B942] rounded-full transition-all duration-700" style={{ width: `${yearProgress}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
            <span key={i} className={`text-[9px] ${i === today.getMonth() ? 'text-[#6B1B8E] font-bold' : 'text-gray-400'}`}>{m}</span>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeFilter === 'all' ? 'bg-[#6B1B8E] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas ({ECOMMERCE_EVENTS_2026.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const count = ECOMMERCE_EVENTS_2026.filter(e => e.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(activeFilter === key ? 'all' : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === key ? 'text-white shadow-md' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeFilter === key ? cfg.color : cfg.bg,
                color: activeFilter === key ? 'white' : cfg.color,
                border: `1px solid ${activeFilter === key ? cfg.color : cfg.border}`,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeFilter === key ? 'white' : cfg.color }} />
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {viewMode === 'calendar' ? (
        <>
          {/* 12-Month Calendar Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }, (_, i) => (
              <MiniMonth key={i} month={i} />
            ))}
          </div>

          {/* Selected Month Events */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedMonth(prev => prev > 0 ? prev - 1 : 11)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight size={16} className="text-gray-600 rotate-180" />
                </button>
                <h3 className="text-lg font-bold text-gray-800">{MONTH_NAMES[selectedMonth]}</h3>
                <button
                  onClick={() => setSelectedMonth(prev => prev < 11 ? prev + 1 : 0)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {monthEvents.length} evento{monthEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-4">
              {monthEvents.length > 0 ? (
                <div className="space-y-2">
                  {monthEvents
                    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
                    .map(event => (
                      <EventCard key={event.id} event={event} compact />
                    ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum evento em {MONTH_NAMES[selectedMonth]}</p>
                  <p className="text-xs mt-1">
                    {activeFilter !== 'all' && 'Tente remover o filtro de categoria'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Timeline View */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-1">
              {filteredEvents
                .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
                .map((event, idx) => {
                  const eventDate = parseDate(event.date);
                  const isPast = eventDate.getTime() < today.getTime();
                  const cat = CATEGORY_CONFIG[event.category];
                  const isPlanned = !!plannedEvents[event.id];
                  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const prevEvent = idx > 0 ? filteredEvents.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())[idx - 1] : null;
                  const showMonthHeader = !prevEvent || parseDate(prevEvent.date).getMonth() !== eventDate.getMonth();

                  return (
                    <React.Fragment key={event.id}>
                      {showMonthHeader && (
                        <div className="flex items-center gap-3 py-3 pl-10">
                          <span className="text-xs font-bold text-[#6B1B8E] uppercase tracking-wider">{MONTH_NAMES[eventDate.getMonth()]}</span>
                          <div className="flex-1 h-px bg-purple-100" />
                        </div>
                      )}
                      <div
                        onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                        className={`flex items-start gap-4 py-3 px-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${isPast ? 'opacity-50' : ''}`}
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0">
                          <div
                            className={`w-[38px] h-[38px] rounded-full flex items-center justify-center border-2 ${
                              isPlanned ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
                            }`}
                            style={!isPlanned ? { borderColor: cat?.color + '60' } : undefined}
                          >
                            <span className="text-[10px] font-bold text-gray-700">
                              {eventDate.getDate().toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-gray-800">{event.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cat?.bg, color: cat?.color, border: `1px solid ${cat?.border}` }}>
                              {cat?.label}
                            </span>
                            {event.importance >= 4 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">
                                {event.importance === 5 ? 'CRITICA' : 'ALTA'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>

                          {/* Expanded details */}
                          {selectedEvent?.id === event.id && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-2 animate-fadeIn">
                              <div className="flex items-center gap-2">
                                <Target size={12} className="text-[#6B1B8E]" />
                                <span className="text-xs font-medium text-gray-700">Dicas:</span>
                              </div>
                              <p className="text-xs text-gray-600 ml-5">{event.tips}</p>
                              <div className="flex items-center gap-4 ml-5 mt-2">
                                <span className="text-[10px] text-gray-500">
                                  Preparar {event.prepDays} dias antes
                                </span>
                                <ImportanceStars level={event.importance} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!isPast && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                              daysUntil <= 7 ? 'bg-red-100 text-red-700' : daysUntil <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {daysUntil}d
                            </span>
                          )}
                          {isPast && <span className="text-[10px] text-gray-400">Passada</span>}
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePlanned(event.id); }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isPlanned ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
                            }`}
                            title={isPlanned ? 'Planejado' : 'Marcar como planejado'}
                          >
                            {isPlanned ? <CheckCircle2 size={14} /> : <Check size={14} />}
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#6B1B8E]" /> Hoje
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400" /> Importancia Alta
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-green-500" /> Planejado
        </span>
        <span className="flex items-center gap-1.5">
          <Zap size={12} className="text-yellow-500 fill-yellow-500" /> Evento Critico
        </span>
      </div>
    </div>
  );
};

export default MarketingHubView;

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Image, Sparkles, Copy, Check, X, Camera, ShoppingBag,
  Instagram, Loader2, AlertCircle, RotateCcw, Zap, ChevronDown
} from 'lucide-react';

const PURPLE = '#6B1B8E';

const MODES = [
  {
    id: 'capa',
    label: 'Foto de Capa',
    subtitle: 'Hero shot para listings',
    icon: Camera,
    color: '#6B1B8E',
    bg: 'from-purple-500 to-purple-700',
    description: 'Gera prompts para a foto principal do anuncio: fundo branco, iluminacao profissional, produto centralizado.',
    count: 4,
  },
  {
    id: 'ecommerce',
    label: 'Fotos E-commerce',
    subtitle: 'Fotos adjacentes do listing',
    icon: ShoppingBag,
    color: '#F59E0B',
    bg: 'from-amber-500 to-orange-600',
    description: 'Gera prompts para fotos complementares: lifestyle, detalhes, escala, angulos, embalagem.',
    count: 6,
  },
  {
    id: 'social',
    label: 'Instagram & TikTok',
    subtitle: 'Conteudo para redes sociais',
    icon: Instagram,
    color: '#EC4899',
    bg: 'from-pink-500 to-rose-600',
    description: 'Gera prompts para fotos de redes sociais: flat lay, lifestyle, UGC, reels, trending.',
    count: 5,
  },
];

const resizeImage = (file, maxSize = 1200) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        resolve(base64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const GeradorPromptsView = () => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleImageSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    setResults(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  const handleGenerate = useCallback(async () => {
    if (!imageFile || !selectedMode) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const base64 = await resizeImage(imageFile);
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, mode: selectedMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar prompts');
      setResults(data.prompts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [imageFile, selectedMode]);

  const handleCopy = useCallback((text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  const handleReset = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setResults(null);
    setError(null);
    setSelectedMode(null);
  }, []);

  const activeModeConfig = MODES.find(m => m.id === selectedMode);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gerador de Prompts IA</h2>
          <p className="text-sm text-gray-500 mt-1">Suba uma foto do produto e gere prompts profissionais para criar imagens com IA</p>
        </div>
        {(imageFile || results) && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Recomecar
          </button>
        )}
      </div>

      {/* Step 1: Select Mode */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-[#6B1B8E] text-white text-xs font-bold flex items-center justify-center">1</span>
          <span className="text-sm font-semibold text-gray-700">Escolha o tipo de foto</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`relative rounded-2xl p-5 text-left transition-all border-2 ${
                  isSelected
                    ? 'border-[#6B1B8E] bg-purple-50 shadow-lg shadow-purple-100'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#6B1B8E] flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mode.bg} flex items-center justify-center mb-3`}>
                  <mode.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-800">{mode.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">{mode.subtitle}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{mode.description}</p>
                <div className="mt-3 flex items-center gap-1">
                  <Sparkles size={10} className="text-[#F4B942]" />
                  <span className="text-[10px] font-medium text-gray-400">Gera {mode.count} prompts</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Upload Image */}
      {selectedMode && (
        <div className="animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-[#6B1B8E] text-white text-xs font-bold flex items-center justify-center">2</span>
            <span className="text-sm font-semibold text-gray-700">Suba a foto do produto</span>
          </div>

          {!imagePreview ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                dragOver ? 'border-[#6B1B8E] bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <Upload size={40} className={`mx-auto mb-3 ${dragOver ? 'text-[#6B1B8E]' : 'text-gray-300'}`} />
              <p className="font-medium text-gray-600">Arraste uma foto aqui ou clique para selecionar</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WebP - a imagem sera redimensionada automaticamente</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="flex gap-5 items-start">
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-48 h-48 object-cover rounded-2xl border-2 border-gray-100 shadow-sm"
                />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); setResults(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeModeConfig?.bg} flex items-center justify-center`}>
                    {activeModeConfig && <activeModeConfig.icon size={16} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{activeModeConfig?.label}</p>
                    <p className="text-[10px] text-gray-400">{imageFile?.name} - {(imageFile?.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="mt-3 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#6B1B8E] to-[#4A1063] text-white hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Gerando {activeModeConfig?.count} prompts...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Gerar Prompts com IA
                    </>
                  )}
                </button>
                {loading && (
                  <p className="text-[10px] text-gray-400 mt-2">A IA esta analisando seu produto e criando prompts personalizados...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
          <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Erro ao gerar prompts</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {results && results.length > 0 && (
        <div className="animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
              <Check size={14} />
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {results.length} prompts gerados para {activeModeConfig?.label}
            </span>
          </div>
          <div className="space-y-4">
            {results.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#6B1B8E] text-white text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-gray-700">{item.titulo || `Prompt ${idx + 1}`}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(item.prompt, idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      copiedIdx === idx
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-500 hover:bg-purple-100 hover:text-[#6B1B8E]'
                    }`}
                  >
                    {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                    {copiedIdx === idx ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-700 leading-relaxed font-mono bg-gray-50 p-3 rounded-xl">
                    {item.prompt}
                  </p>
                  {item.negativo && (
                    <div className="mt-3 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-0.5 flex-shrink-0">Negativo:</span>
                      <p className="text-xs text-gray-400">{item.negativo}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Copy All Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                const allPrompts = results.map((r, i) => `[${i + 1}] ${r.titulo}\n${r.prompt}${r.negativo ? `\nNegative: ${r.negativo}` : ''}`).join('\n\n---\n\n');
                handleCopy(allPrompts, 'all');
              }}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                copiedIdx === 'all'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-[#6B1B8E] text-white hover:bg-[#5a1678]'
              }`}
            >
              {copiedIdx === 'all' ? <Check size={14} /> : <Copy size={14} />}
              {copiedIdx === 'all' ? 'Todos copiados!' : 'Copiar Todos os Prompts'}
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      {!results && !loading && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
          <Zap size={18} className="text-[#6B1B8E] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#6B1B8E]">Como funciona</p>
            <p className="text-xs text-purple-600 mt-0.5">
              1. Escolha o tipo de foto que precisa &rarr; 2. Suba a foto do produto &rarr; 3. A IA analisa e gera prompts profissionais prontos para Midjourney, DALL-E ou Flux.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeradorPromptsView;

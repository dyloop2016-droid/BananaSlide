import React, { useState, useRef, useEffect } from 'react';
import { Layout, History, Plus, Layers, Wand2, DownloadCloud, Key, X, ZoomIn } from 'lucide-react';
import { GenerationSettings, SlideData, ModelType, AspectRatio, ImageSize, GeneratorType } from './types';
import SettingsPanel from './components/SettingsPanel';
import SlideRow from './components/SlideRow';
import HistoryView from './components/HistoryView';
import { ImageGeneratorFactory } from './services/imageGeneratorFactory';
import { fileToBase64 } from './services/generators/geminiGenerator';

// Add type definition for window.aistudio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

// Default Settings
const DEFAULT_SETTINGS: GenerationSettings = {
  pptStyle: '',
  colorScheme: '',
  designRequirements: '',
  referenceImage: null,
  model: ModelType.PRO,
  aspectRatio: AspectRatio.WIDESCREEN,
  customAspectRatio: '21:9', // Default custom value
  imageSize: ImageSize.K1,
  generatorType: GeneratorType.GEMINI
};

const createEmptySlide = (): SlideData => ({
  id: crypto.randomUUID(),
  contentPrompt: '',
  contentImage: null,
  generatedImages: [],
  variantCount: 2,
  status: 'idle'
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'history'>('workspace');
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  // Initialize with 2 empty slides
  const [slides, setSlides] = useState<SlideData[]>([createEmptySlide(), createEmptySlide()]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const batchInputRef = useRef<HTMLInputElement>(null);

  // --- API Key Check ---
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const has = await window.aistudio.hasSelectedApiKey();
        setApiKeyReady(has);
      } else {
        setApiKeyReady(true);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setApiKeyReady(true);
    }
  };

  // --- Slide Management ---

  const addSlide = () => {
    setSlides(prev => [...prev, createEmptySlide()]);
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newSlides: SlideData[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        try {
          const file = e.target.files[i];
          const base64 = await fileToBase64(file);
          newSlides.push({
            id: crypto.randomUUID(),
            contentPrompt: '', 
            contentImage: base64,
            generatedImages: [],
            variantCount: 2,
            status: 'idle'
          });
        } catch (err) {
          console.error("Error reading file", err);
        }
      }
      setSlides(prev => [...prev, ...newSlides]);
    }
  };

  const updateSlide = (id: string, updates: Partial<SlideData>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSlide = (id: string) => {
    setSlides(prev => prev.filter(s => s.id !== id));
  };

  // --- Generation Logic ---

  const generateSlide = async (id: string) => {
    const slideIndex = slides.findIndex(s => s.id === id);
    if (slideIndex === -1) return;
    const slide = slides[slideIndex];

    updateSlide(id, { status: 'generating', errorMessage: undefined });

    try {
      // Create generator based on selected API service
      const generator = ImageGeneratorFactory.createGenerator(settings.generatorType);
      
      const images = await generator.generateVariations(
        settings, 
        slide.contentPrompt, 
        slide.contentImage,
        slide.variantCount
      );
      updateSlide(id, { status: 'success', generatedImages: images });
    } catch (error: any) {
      const errorMsg = error.toString();
      if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("403") || errorMsg.includes("API key")) {
        setApiKeyReady(false);
        updateSlide(id, { status: 'error', errorMessage: "请检查 API Key 配置" });
      } else {
        updateSlide(id, { status: 'error', errorMessage: error.message || "生成失败" });
      }
    }
  };

  const handleBatchGenerate = async () => {
    setIsBatchGenerating(true);
    const targets = slides.filter(s => s.generatedImages.length === 0 || s.status === 'error' || s.status === 'idle');
    
    for (const slide of targets) {
      await generateSlide(slide.id);
      if (!apiKeyReady) break; 
    }
    setIsBatchGenerating(false);
  };

  const handleDownloadAll = () => {
    let delay = 0;
    slides.forEach((slide, sIdx) => {
      slide.generatedImages.forEach((img, iIdx) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = `data:image/png;base64,${img}`;
          link.download = `slide-${sIdx + 1}-v${iIdx + 1}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, delay);
        delay += 300; 
      });
    });
  };

  const hasGeneratedImages = slides.some(s => s.generatedImages.length > 0);

  // --- API Key Selection Screen ---
  if (!apiKeyReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-2000"></div>
        
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white max-w-md w-full text-center relative z-10">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-200 transform rotate-3">
             <Layers size={40} className="text-white drop-shadow-md" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">BananaSlide 工作台</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            欢迎使用 AI 幻灯片设计助手。为了使用 Gemini Pro 高级绘图模型，请先连接您的 Google Cloud API Key。
          </p>

          <button 
            onClick={handleConnectKey}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            <Key size={20} />
            连接 API Key
          </button>

          <p className="mt-6 text-xs text-gray-400 leading-normal">
            请确保选择已关联 Billing 的 Google Cloud 项目。<br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 underline">
              查看计费说明文档
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50 font-sans relative">
      {/* Header / Navigation */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-30 shadow-sm sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white p-2 rounded-xl shadow-lg shadow-yellow-200/50">
             <Layers size={22} className="text-gray-900" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">BananaSlide工作台</h1>
            <p className="text-[10px] text-yellow-600 font-bold tracking-wide mt-0.5">AI PRESENTATION DESIGNER</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100/80 p-1 rounded-lg gap-1">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 md:px-5 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'workspace' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
          >
            <Layout size={16} strokeWidth={2} />
            <span className="hidden md:inline">设计工作台</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 md:px-5 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
          >
            <History size={16} strokeWidth={2} />
            <span className="hidden md:inline">历史记录</span>
          </button>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
            <button 
              onClick={() => batchInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-all text-xs font-semibold"
              title="批量上传图片"
            >
              <Layers size={16} />
              <span className="hidden xl:inline">批量上传</span>
            </button>
            <input type="file" ref={batchInputRef} multiple accept="image/*" className="hidden" onChange={handleBatchUpload} />

            <button 
              onClick={handleBatchGenerate}
              disabled={isBatchGenerating || slides.length === 0}
              title="批量生成所有页面"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all ${
                isBatchGenerating || slides.length === 0 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-md'
              }`}
            >
              <Wand2 size={16} className={isBatchGenerating ? "animate-spin" : ""} />
              <span className="hidden xl:inline">{isBatchGenerating ? '生成中...' : '批量生成'}</span>
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1"></div>

            <button 
              onClick={handleDownloadAll}
              disabled={!hasGeneratedImages}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
                hasGeneratedImages 
                ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md cursor-pointer' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <DownloadCloud size={16} />
              <span className="hidden xl:inline">批量下载结果</span>
            </button>
        </div>
      </header>

      {/* Main Content Area - Scrollable including settings */}
      <main className="flex-1 overflow-y-auto bg-gray-50 scroll-smooth">
        {activeTab === 'workspace' ? (
          <div className="flex flex-col min-h-full">
            
            {/* Settings Panel is now part of the scroll flow */}
            <SettingsPanel settings={settings} onSettingsChange={setSettings} />

            {/* Canvas Area */}
            <div className="flex-1 px-4 md:px-6 py-6">
              <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
                {slides.length === 0 ? (
                  <div className="border-3 border-dashed border-gray-200 rounded-3xl h-[60vh] flex flex-col items-center justify-center text-gray-400 bg-white">
                      <div className="bg-gray-50 p-6 rounded-full mb-4">
                          <Layout size={48} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-700">开始您的 PPT 设计</h3>
                      <p className="text-sm mt-2 text-gray-500 max-w-xs text-center">点击下方 “添加空白页面” 或上方 “批量上传” 开启您的创作之旅</p>
                  </div>
                ) : (
                  slides.map((slide, index) => (
                    <SlideRow 
                      key={slide.id} 
                      slide={slide} 
                      index={index} 
                      onUpdate={updateSlide}
                      onDelete={deleteSlide}
                      onGenerate={generateSlide}
                      onPreview={setPreviewImage}
                    />
                  ))
                )}
                
                {/* Bottom Add Button */}
                <button 
                  onClick={addSlide}
                  className="w-full py-6 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-yellow-600 hover:border-yellow-400 hover:bg-yellow-50/50 transition-all group font-semibold"
                >
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  添加新页面
                </button>
              </div>
            </div>

          </div>
        ) : (
          <HistoryView slides={slides} />
        )}
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={32} />
          </button>
          <div className="relative max-w-full max-h-full overflow-auto flex items-center justify-center">
            <img 
              src={`data:image/png;base64,${previewImage}`} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
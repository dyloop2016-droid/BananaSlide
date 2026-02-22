import React, { useState, useRef, useEffect } from 'react';
import { Layout, History, Plus, Layers, Wand2, DownloadCloud, X } from 'lucide-react';
import { GenerationSettings, SlideData, ModelType, AspectRatio, ImageSize, GeneratorType, ApiKeys, VolcengineModel, VolcengineResolution } from './types';
import SettingsPanel from './components/SettingsPanel';
import SlideRow from './components/SlideRow';
import HistoryView from './components/HistoryView';
import { ImageGeneratorFactory } from './services/imageGeneratorFactory';
import { fileToBase64 } from './services/generators/geminiGenerator';

const DEFAULT_SETTINGS: GenerationSettings = {
  pptStyle: '',
  colorScheme: '',
  designRequirements: '',
  referenceImage: null,
  model: ModelType.PRO,
  aspectRatio: AspectRatio.WIDESCREEN,
  customAspectRatio: '21:9',
  imageSize: ImageSize.K1,
  generatorType: GeneratorType.GEMINI,
  volcengineModel: VolcengineModel.SEEDDREAM_4_5,
  volcengineResolution: VolcengineResolution.K2
};

const DEFAULT_API_KEYS: ApiKeys = {
  geminiApiKey: '',
  volcengineAccessKey: '',
  volcengineSecretKey: '',
  volcengineEndpoint: ''
};

const loadSavedApiKeys = (): ApiKeys => {
  try {
    const saved = localStorage.getItem('bananaslide-apikeys');
    if (saved) {
      return { ...DEFAULT_API_KEYS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load API keys', e);
  }
  return DEFAULT_API_KEYS;
};

const loadSavedSettings = (): GenerationSettings => {
  try {
    const saved = localStorage.getItem('bananaslide-settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
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
  const [settings, setSettings] = useState<GenerationSettings>(loadSavedSettings);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(loadSavedApiKeys);
  const [slides, setSlides] = useState<SlideData[]>([createEmptySlide(), createEmptySlide()]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const batchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('bananaslide-apikeys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    const { referenceImage, ...settingsToSave } = settings;
    localStorage.setItem('bananaslide-settings', JSON.stringify(settingsToSave));
  }, [settings]);

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

  const generateSlide = async (id: string) => {
    const slideIndex = slides.findIndex(s => s.id === id);
    if (slideIndex === -1) return;
    const slide = slides[slideIndex];

    updateSlide(id, { status: 'generating', errorMessage: undefined });

    try {
      console.log('生成图片 - API类型:', settings.generatorType);
      console.log('生成图片 - 火山引擎Key长度:', apiKeys.volcengineSecretKey?.length || 0);
      console.log('生成图片 - Gemini Key长度:', apiKeys.geminiApiKey?.length || 0);

      const generator = ImageGeneratorFactory.createGenerator(settings.generatorType, apiKeys);

      const images = await generator.generateVariations(
        settings,
        slide.contentPrompt,
        slide.contentImage,
        slide.variantCount
      );
      updateSlide(id, { status: 'success', generatedImages: images });
    } catch (error: any) {
      const errorMsg = error.toString();
      console.error('生成图片错误:', errorMsg);
      if (errorMsg.includes("API key") || errorMsg.includes("Key") || errorMsg.includes("未设置")) {
        const detailMsg = apiKeys.volcengineSecretKey ?
          `API Key已填写，长度: ${apiKeys.volcengineSecretKey.length}，但仍提示错误: ${error.message}` :
          "请在设置中填写火山方舟 API Key";
        updateSlide(id, { status: 'error', errorMessage: detailMsg });
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

  return (
    <div className="h-full flex flex-col bg-gray-50/50 font-sans relative">
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

      <main className="flex-1 overflow-y-auto bg-gray-50 scroll-smooth">
        {activeTab === 'workspace' ? (
          <div className="flex flex-col min-h-full">
            
            <SettingsPanel 
              settings={settings} 
              apiKeys={apiKeys}
              onSettingsChange={setSettings} 
              onApiKeysChange={setApiKeys}
            />

            <div className="flex-1 px-4 md:px-6 py-6">
              <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
                {slides.length === 0 ? (
                  <div className="border-3 border-dashed border-gray-200 rounded-3xl h-[60vh] flex flex-col items-center justify-center text-gray-400 bg-white">
                      <div className="bg-gray-50 p-6 rounded-full mb-4">
                          <Layout size={48} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-700">开始您的 PPT 设计</h3>
                      <p className="text-sm mt-2 text-gray-500 max-w-xs text-center">点击下方 "添加空白页面" 或上方 "批量上传" 开启您的创作之旅</p>
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

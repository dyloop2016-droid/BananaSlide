import React, { useRef, useState } from 'react';
import { GenerationSettings, ModelType, AspectRatio, ImageSize, GeneratorType, ApiKeys, VolcengineModel, VolcengineResolution, VOLCENGINE_ASPECT_RATIOS } from '../types';
import { Upload, X, Palette, LayoutTemplate, PenTool, Image as ImageIcon, Settings2, Cloud, Cpu, Key, Eye, EyeOff } from 'lucide-react';
import { fileToBase64 } from '../services/generators/geminiGenerator';

interface SettingsPanelProps {
  settings: GenerationSettings;
  apiKeys: ApiKeys;
  onSettingsChange: (newSettings: GenerationSettings) => void;
  onApiKeysChange: (newApiKeys: ApiKeys) => void;
}

const STYLE_PRESETS = ["极简商务", "科技未来", "创意手绘", "学术严谨", "扁平插画", "新拟态"];
const COLOR_PRESETS = ["深蓝/白", "黑金奢华", "活力橙/灰", "莫兰迪色系", "清新森林绿", "暗黑模式"];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, apiKeys, onSettingsChange, onApiKeysChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showVolcengineKey, setShowVolcengineKey] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        onSettingsChange({ ...settings, referenceImage: base64 });
      } catch (err) {
        console.error("Failed to upload reference image", err);
      }
    }
  };

  const removeReferenceImage = () => {
    onSettingsChange({ ...settings, referenceImage: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 md:p-6 shadow-sm">
      <div className="max-w-[1600px] mx-auto">
        {/* API Configuration Section */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-gray-600" />
            <span className="text-sm font-bold text-gray-700">API 服务配置</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* API Service Selection */}
            <div className="lg:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">API 服务</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSettingsChange({ ...settings, generatorType: GeneratorType.GEMINI })}
                  className={`flex flex-col items-center p-2 rounded-lg border transition-all ${settings.generatorType === GeneratorType.GEMINI ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Cloud size={18} className="mb-1" />
                  <span className="text-[10px] font-semibold">Gemini</span>
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, generatorType: GeneratorType.VOLCENGINE })}
                  className={`flex flex-col items-center p-2 rounded-lg border transition-all ${settings.generatorType === GeneratorType.VOLCENGINE ? 'bg-orange-50 border-orange-400 text-orange-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Cpu size={18} className="mb-1" />
                  <span className="text-[10px] font-semibold">火山引擎</span>
                </button>
              </div>
            </div>

            {/* Gemini API Key Input */}
            {settings.generatorType === GeneratorType.GEMINI && (
              <div className="lg:col-span-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Gemini API Key</label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? "text" : "password"}
                    value={apiKeys.geminiApiKey}
                    onChange={(e) => onApiKeysChange({ ...apiKeys, geminiApiKey: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入 Gemini API Key..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title={showGeminiKey ? "隐藏密钥" : "显示密钥"}
                  >
                    {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">从 Google AI Studio 获取 API Key</p>
              </div>
            )}

            {/* Volcengine API Settings */}
            {settings.generatorType === GeneratorType.VOLCENGINE && (
              <>
                <div className="lg:col-span-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">火山方舟 API Key</label>
                  <div className="relative">
                    <input
                      type={showVolcengineKey ? "text" : "password"}
                      value={apiKeys.volcengineSecretKey}
                      onChange={(e) => onApiKeysChange({ ...apiKeys, volcengineSecretKey: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="输入 API Key (如: fc...6215)..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowVolcengineKey(!showVolcengineKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={showVolcengineKey ? "隐藏密钥" : "显示密钥"}
                    >
                      {showVolcengineKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">在火山方舟 → 快捷API接入 → STEP1 获取</p>
                </div>
                <div className="lg:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">模型</label>
                  <select
                    value={settings.volcengineModel}
                    onChange={(e) => onSettingsChange({ ...settings, volcengineModel: e.target.value as VolcengineModel })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={VolcengineModel.SEEDDREAM_4_5}>Seedream 4.5</option>
                    <option value={VolcengineModel.SEEDDREAM_4_0}>Seedream 4.0</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column 1: Reference Image */}
          <div className="lg:col-span-2 flex flex-col space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-800 truncate">
                <ImageIcon size={14} className="text-gray-700" />
                风格参考图
            </label>
            <div 
              className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-all group min-h-[120px] ${settings.referenceImage ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
              onClick={() => !settings.referenceImage && fileInputRef.current?.click()}
            >
              {settings.referenceImage ? (
                <>
                  <img src={`data:image/png;base64,${settings.referenceImage}`} alt="Ref" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeReferenceImage(); }}
                        className="bg-white rounded-full p-2 shadow-lg hover:bg-red-50 text-red-500"
                      >
                        <X size={16} />
                      </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 p-2">
                    <Upload size={24} className="mx-auto mb-2 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    <span className="text-xs font-medium block">点击上传参考图</span>
                    <span className="text-[10px] text-gray-300">支持整体风格复刻</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          {/* Column 2: Style & Color */}
          <div className="lg:col-span-3 space-y-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <LayoutTemplate size={14} className="text-yellow-600" />
                PPT 风格
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm"
                placeholder="如：现代极简..."
                value={settings.pptStyle}
                onChange={(e) => onSettingsChange({ ...settings, pptStyle: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5">
                {STYLE_PRESETS.slice(0, 4).map(preset => (
                  <button
                    key={preset}
                    onClick={() => onSettingsChange({ ...settings, pptStyle: preset })}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors font-medium ${settings.pptStyle === preset ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <Palette size={14} className="text-orange-600" />
                配色方案
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                placeholder="如：深蓝/白..."
                value={settings.colorScheme}
                onChange={(e) => onSettingsChange({ ...settings, colorScheme: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.slice(0, 4).map(preset => (
                  <button
                    key={preset}
                    onClick={() => onSettingsChange({ ...settings, colorScheme: preset })}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors font-medium ${settings.colorScheme === preset ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Detailed Requirements */}
          <div className="lg:col-span-4 flex flex-col space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <PenTool size={14} className="text-gray-700" />
              详细设计要求
            </label>
            <textarea
              className="flex-1 w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm resize-none placeholder-gray-400"
              placeholder="请输入具体的排版、字体、留白等细节要求..."
              value={settings.designRequirements}
              onChange={(e) => onSettingsChange({ ...settings, designRequirements: e.target.value })}
            />
          </div>

          {/* Column 4: Config */}
          <div className="lg:col-span-3 space-y-4 border-l border-gray-100 pl-6 flex flex-col justify-center">
              {settings.generatorType === GeneratorType.GEMINI && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gemini 模型</span>
                  <select
                    value={settings.model}
                    onChange={(e) => onSettingsChange({ ...settings, model: e.target.value as ModelType })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1.5 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={ModelType.FLASH}>Gemini 2.5 Flash (快速)</option>
                    <option value={ModelType.PRO}>Gemini 3 Pro (高质量)</option>
                  </select>
                </div>
              )}

              {settings.generatorType === GeneratorType.GEMINI && (
                <div className={`space-y-1.5 ${settings.model !== ModelType.PRO ? 'opacity-40 pointer-events-none' : ''}`}>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">图像品质</span>
                   <div className="flex bg-gray-100 p-0.5 rounded-md">
                      {[ImageSize.K1, ImageSize.K2, ImageSize.K4].map((size) => (
                        <button
                          key={size}
                          onClick={() => onSettingsChange({ ...settings, imageSize: size })}
                          className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${settings.imageSize === size ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {size}
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {settings.generatorType === GeneratorType.VOLCENGINE && (
                <div className="space-y-1.5">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">分辨率</span>
                   <div className="flex bg-gray-100 p-0.5 rounded-md">
                      {[VolcengineResolution.K2, VolcengineResolution.K4].map((res) => (
                        <button
                          key={res}
                          onClick={() => onSettingsChange({ ...settings, volcengineResolution: res })}
                          className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${settings.volcengineResolution === res ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {res}
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {settings.generatorType === GeneratorType.VOLCENGINE && (
                <div className="space-y-1.5">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">图片比例</span>
                 <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-md">
                    {VOLCENGINE_ASPECT_RATIOS.slice(0, 6).map((ratio) => (
                        <button
                        key={ratio.val}
                        onClick={() => onSettingsChange({...settings, aspectRatio: ratio.val})}
                        className={`flex-1 min-w-[35px] py-1 rounded text-[10px] font-medium transition-all ${settings.aspectRatio === ratio.val ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                 </div>
                </div>
              )}

              {settings.generatorType === GeneratorType.GEMINI && (
              <div className="space-y-1.5">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">图像比例</span>
                 <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-md">
                    {[
                      { val: AspectRatio.WIDESCREEN, label: '16:9' },
                      { val: AspectRatio.VERTICAL, label: '9:16' },
                      { val: AspectRatio.LANDSCAPE, label: '4:3' },
                      { val: AspectRatio.PORTRAIT, label: '3:4' },
                      { val: AspectRatio.SQUARE, label: '1:1' },
                    ].map((ratio) => (
                        <button
                        key={ratio.val}
                        onClick={() => onSettingsChange({...settings, aspectRatio: ratio.val})}
                        className={`flex-1 min-w-[35px] py-1 rounded text-[10px] font-medium transition-all ${settings.aspectRatio === ratio.val ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {ratio.label}
                      </button>
                    ))}

                    <button
                        onClick={() => onSettingsChange({...settings, aspectRatio: AspectRatio.CUSTOM})}
                        className={`flex-1 min-w-[35px] py-1 rounded text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${settings.aspectRatio === AspectRatio.CUSTOM ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        title="自定义比例"
                    >
                      <Settings2 size={10} />
                      更多
                    </button>
                 </div>

                 {settings.aspectRatio === AspectRatio.CUSTOM && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        <input
                            type="text"
                            className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-900 focus:ring-2 focus:ring-yellow-500 placeholder-gray-400"
                            placeholder="宽:高 (例如 21:9)"
                            value={settings.customAspectRatio || ''}
                            onChange={(e) => onSettingsChange({...settings, customAspectRatio: e.target.value})}
                        />
                        <p className="text-[9px] text-gray-400 mt-0.5 text-right">格式: 宽:高</p>
                    </div>
                 )}
              </div>
              )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

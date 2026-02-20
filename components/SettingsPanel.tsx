import React, { useRef } from 'react';
import { GenerationSettings, ModelType, AspectRatio, ImageSize, GeneratorType } from '../types';
import { Upload, X, Palette, LayoutTemplate, PenTool, Image as ImageIcon, Settings2, Cloud, Sparkles, Zap } from 'lucide-react';
import { fileToBase64 } from '../services/generators/geminiGenerator';

interface SettingsPanelProps {
  settings: GenerationSettings;
  onSettingsChange: (newSettings: GenerationSettings) => void;
}

const STYLE_PRESETS = ["极简商务", "科技未来", "创意手绘", "学术严谨", "扁平插画", "新拟态"];
const COLOR_PRESETS = ["深蓝/白", "黑金奢华", "活力橙/灰", "莫兰迪色系", "清新森林绿", "暗黑模式"];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column 1: Reference Image (2 cols) - Moved to LEFT */}
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

          {/* Column 2: Style & Color (3 cols) */}
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

          {/* Column 3: Detailed Requirements (4 cols) */}
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

          {/* Column 4: Config (3 cols) */}
          <div className="lg:col-span-3 space-y-4 border-l border-gray-100 pl-6 flex flex-col justify-center">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">API 服务</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onSettingsChange({ ...settings, generatorType: GeneratorType.GEMINI })}
                    className={`flex flex-col items-center p-2 rounded-md border transition-all ${settings.generatorType === GeneratorType.GEMINI ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Cloud size={16} className="mb-1" />
                    <span className="text-[10px] font-medium">Gemini</span>
                  </button>
                  <button
                    onClick={() => onSettingsChange({ ...settings, generatorType: GeneratorType.DALLE })}
                    className={`flex flex-col items-center p-2 rounded-md border transition-all ${settings.generatorType === GeneratorType.DALLE ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Sparkles size={16} className="mb-1" />
                    <span className="text-[10px] font-medium">DALL-E</span>
                  </button>
                  <button
                    onClick={() => onSettingsChange({ ...settings, generatorType: GeneratorType.STABILITY })}
                    className={`flex flex-col items-center p-2 rounded-md border transition-all ${settings.generatorType === GeneratorType.STABILITY ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Zap size={16} className="mb-1" />
                    <span className="text-[10px] font-medium">Stability</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">模型</span>
                <select 
                  value={settings.model}
                  onChange={(e) => onSettingsChange({ ...settings, model: e.target.value as ModelType })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-2 py-1.5 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-yellow-500"
                >
                  <option value={ModelType.FLASH}>Gemini 2.5 Flash (Nano)</option>
                  <option value={ModelType.PRO}>Gemini 3 Pro (High Quality)</option>
                </select>
              </div>

              <div className={`space-y-1.5 ${settings.model !== ModelType.PRO ? 'opacity-40 pointer-events-none' : ''}`}>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">品质</span>
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

              <div className="space-y-1.5">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">比例</span>
                 <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-md">
                    {[
                      { val: AspectRatio.WIDESCREEN, label: '16:9' },
                      { val: AspectRatio.VERTICAL, label: '9:16' },
                      { val: AspectRatio.LANDSCAPE, label: '4:3' },
                      { val: AspectRatio.PORTRAIT, label: '3:4' },
                      { val: AspectRatio.ULTRAWIDE, label: '18:8' },
                      { val: AspectRatio.ULTRATALL, label: '8:18' },
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
                    
                    {/* Custom Button */}
                    <button
                        onClick={() => onSettingsChange({...settings, aspectRatio: AspectRatio.CUSTOM})}
                        className={`flex-1 min-w-[35px] py-1 rounded text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${settings.aspectRatio === AspectRatio.CUSTOM ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        title="自定义比例"
                    >
                      <Settings2 size={10} />
                      自定义
                    </button>
                 </div>
                 
                 {/* Custom Ratio Input */}
                 {settings.aspectRatio === AspectRatio.CUSTOM && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        <input 
                            type="text" 
                            className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-900 focus:ring-2 focus:ring-yellow-500 placeholder-gray-400"
                            placeholder="宽:高 (例如 21:9)"
                            value={settings.customAspectRatio || ''}
                            onChange={(e) => onSettingsChange({...settings, customAspectRatio: e.target.value})}
                        />
                        <p className="text-[9px] text-gray-400 mt-0.5 text-right">格式: 宽:高 (例如 1200:600)</p>
                    </div>
                 )}
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
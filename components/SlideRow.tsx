import React, { useRef } from 'react';
import { SlideData } from '../types';
import { Loader2, Upload, Trash2, Download, RefreshCw, X, Sparkles, ZoomIn } from 'lucide-react';
import { fileToBase64 } from '../services/geminiService';

interface SlideRowProps {
  slide: SlideData;
  index: number;
  onUpdate: (id: string, updates: Partial<SlideData>) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
  onPreview: (image: string) => void;
}

const SlideRow: React.FC<SlideRowProps> = ({ slide, index, onUpdate, onDelete, onGenerate, onPreview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        onUpdate(slide.id, { contentImage: base64 });
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  };

  const downloadImage = (base64: string, idx: number) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `slide-${index + 1}-v${idx + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-0 flex flex-col md:flex-row relative transition-all hover:shadow-lg overflow-hidden group">
      {/* Page Number Badge */}
      <div className="absolute top-0 left-0 bg-yellow-500 text-white text-xs px-4 py-1.5 rounded-br-2xl font-bold border-r border-b border-yellow-400 z-10 shadow-sm tracking-widest">
        PAGE {index + 1}
      </div>

      <button 
        onClick={() => onDelete(slide.id)}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all z-50"
        title="删除页面"
      >
        <Trash2 size={18} />
      </button>

      {/* Left Column: Inputs */}
      <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col gap-5 p-6 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
        <div className="mt-6">
          <label className="block text-xs font-bold text-gray-600 uppercase mb-2">本页内容描述</label>
          <textarea
            value={slide.contentPrompt}
            onChange={(e) => onUpdate(slide.id, { contentPrompt: e.target.value })}
            placeholder="输入具体的标题、正文、数据或核心观点..."
            className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 h-36 resize-none shadow-sm transition-shadow text-gray-900 font-medium placeholder-gray-400"
          />
        </div>

        <div>
           <label className="block text-xs font-bold text-gray-600 uppercase mb-2">待优化素材 (可选)</label>
           <div 
             className="bg-white border border-gray-300 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-yellow-400 transition-colors relative shadow-sm"
             onClick={() => !slide.contentImage && fileInputRef.current?.click()}
           >
             {slide.contentImage ? (
               <>
                 <img src={`data:image/png;base64,${slide.contentImage}`} className="w-12 h-12 object-cover rounded-lg border border-gray-100" alt="content" />
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-gray-900 truncate">已上传参考图</p>
                   <p className="text-xs text-gray-500">将基于此进行优化排版</p>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); onUpdate(slide.id, { contentImage: null }); }}
                   className="p-1 hover:bg-gray-100 rounded-full"
                 >
                   <X size={16} className="text-gray-500" />
                 </button>
               </>
             ) : (
                <>
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                    <Upload size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">点击上传图片</p>
                    <p className="text-xs text-gray-400">支持图表、草图</p>
                  </div>
                </>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
           </div>
        </div>

        <div className="mt-auto space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
             <span className="text-xs font-semibold text-gray-500">生成方案数量</span>
             <div className="flex bg-gray-200 rounded-lg p-0.5">
               <button 
                onClick={() => onUpdate(slide.id, { variantCount: 1 })}
                className={`text-xs px-3 py-1 rounded-md transition-all ${slide.variantCount === 1 ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 1 张
               </button>
               <button 
                onClick={() => onUpdate(slide.id, { variantCount: 2 })}
                className={`text-xs px-3 py-1 rounded-md transition-all ${slide.variantCount === 2 ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 2 张
               </button>
             </div>
          </div>
          
          <button
            onClick={() => onGenerate(slide.id)}
            disabled={slide.status === 'generating'}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm ${
              slide.status === 'generating' 
                ? 'bg-yellow-50 text-yellow-500 cursor-not-allowed border border-yellow-200' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            {slide.status === 'generating' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                正在设计中...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                开始生成
              </>
            )}
          </button>
          {slide.status === 'error' && (
             <p className="text-xs text-red-500 text-center bg-red-50 py-1 rounded">{slide.errorMessage || "生成失败，请检查网络或重试"}</p>
          )}
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="flex-1 p-6 bg-white min-h-[300px] flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">生成结果预览</h3>
          {slide.status === 'success' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              设计完成
            </span>
          )}
        </div>
        
        <div className={`flex-1 grid gap-6 ${slide.variantCount === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {Array.from({ length: slide.variantCount }).map((_, idx) => {
             const image = slide.generatedImages[idx];
             return (
               <div key={idx} className="flex flex-col gap-2">
                 {/* Image Container */}
                 <div 
                    className="relative group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center min-h-[200px] hover:border-yellow-400 transition-colors cursor-zoom-in"
                    onClick={() => image && onPreview(image)}
                 >
                   {image ? (
                     <>
                       <img src={`data:image/png;base64,${image}`} alt={`Result ${idx}`} className="w-full h-full object-contain" />
                       {/* Hover Overlay for Zoom hint */}
                       <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm">
                            <ZoomIn size={24} />
                          </div>
                       </div>
                     </>
                   ) : (
                      <div className="text-center p-4 cursor-default">
                        {slide.status === 'generating' ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 border-4 border-yellow-100 border-t-yellow-500 rounded-full animate-spin"></div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">AI 正在绘图...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-300">
                             <RefreshCw size={24} strokeWidth={1.5} />
                             <span className="text-xs">等待生成</span>
                          </div>
                        )}
                      </div>
                   )}
                 </div>

                 {/* Download Button below image */}
                 {image && (
                   <button
                     onClick={() => downloadImage(image, idx)}
                     className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
                   >
                     <Download size={14} />
                     下载此图
                   </button>
                 )}
               </div>
             )
          })}
        </div>
      </div>
    </div>
  );
};

export default SlideRow;
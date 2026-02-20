import React from 'react';
import { SlideData } from '../types';
import { Download } from 'lucide-react';

interface HistoryViewProps {
  slides: SlideData[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ slides }) => {
  const completedSlides = slides.filter(s => s.status === 'success' && s.generatedImages.length > 0);

  const downloadImage = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (completedSlides.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <p className="text-lg font-medium">暂无生成历史</p>
        <p className="text-sm">请在工作台生成PPT页面后查看</p>
      </div>
    );
  }

  return (
    <div className="p-8 overflow-y-auto h-full bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">生成历史记录</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {completedSlides.map((slide) => (
          slide.generatedImages.map((img, idx) => (
            <div key={`${slide.id}-${idx}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-100 relative group">
                <img src={`data:image/png;base64,${img}`} alt="History" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button 
                      onClick={() => downloadImage(img, `history-slide-${slide.id}-${idx}.png`)}
                      className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-gray-100"
                    >
                      <Download size={14} /> 下载
                    </button>
                 </div>
              </div>
              <div className="p-4">
                 <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Slide ID: {slide.id.slice(0, 4)}</p>
                 <p className="text-sm text-gray-700 line-clamp-2" title={slide.contentPrompt}>{slide.contentPrompt || "无文字描述"}</p>
              </div>
            </div>
          ))
        ))}
      </div>
    </div>
  );
};

export default HistoryView;

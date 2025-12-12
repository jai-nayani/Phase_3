import React, { useCallback, useState } from 'react';
import { Upload, Link as LinkIcon, ArrowRight, Globe, Layers } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  onUrlSelect: (url: string) => void;
  isAnalyzing: boolean;
  onInteraction?: () => void;
  isDarkMode?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  onUrlSelect, 
  isAnalyzing, 
  onInteraction,
  isDarkMode = true 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        onFileSelect(files);
      } else {
        alert('Please upload image files.');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onInteraction?.();
      onFileSelect(Array.from(e.target.files));
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput && !isAnalyzing) {
      onInteraction?.();
      onUrlSelect(urlInput);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    if (e.target.value) {
      onInteraction?.();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12 animate-fade-in">
      
      {/* URL Input Section */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium uppercase tracking-wider ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Option 1: Enter Website URL
        </label>
        <form onSubmit={handleUrlSubmit} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Globe className="h-6 w-6 text-indigo-400" />
          </div>
          <input
            type="url"
            placeholder="https://example.com"
            value={urlInput}
            onChange={handleUrlChange}
            onFocus={onInteraction}
            onClick={onInteraction}
            disabled={isAnalyzing}
            className={`
              block w-full pl-16 pr-32 py-6 rounded-2xl text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-xl
              ${isDarkMode 
                ? 'bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600' 
                : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400'
              }
            `}
          />
          <button
            type="submit"
            disabled={!urlInput || isAnalyzing}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            {isAnalyzing ? 'Analyzing...' : 'Transform'}
            {!isAnalyzing && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <div className="relative flex items-center py-4">
        <div className={`flex-grow border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}></div>
        <span className={`flex-shrink-0 mx-4 text-sm font-medium uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>OR</span>
        <div className={`flex-grow border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}></div>
      </div>

      {/* File Upload Section */}
      <div className="space-y-4">
        <label className={`block text-sm font-medium uppercase tracking-wider ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Option 2: Upload Screenshots
        </label>
        <div 
          className={`
            relative group border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-500/10' 
              : isDarkMode 
                ? 'border-white/10 hover:border-white/20 bg-[#1a1a1a]' 
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            onInteraction?.();
            document.getElementById('file-upload')?.click();
          }}
        >
          <input 
            id="file-upload"
            type="file" 
            accept="image/*" 
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center gap-4 pointer-events-none transition-transform group-hover:scale-105">
            <div className="relative">
                <div className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center border relative z-10
                  ${isDarkMode 
                    ? 'bg-[#252525] border-white/5' 
                    : 'bg-gray-100 border-gray-200'
                  }
                `}>
                  <Upload className={`w-8 h-8 transition-colors ${isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-800'}`} />
                </div>
                <div className={`
                  absolute top-2 -right-2 w-16 h-16 rounded-2xl border -z-0 opacity-50 rotate-6
                  ${isDarkMode 
                    ? 'bg-[#252525] border-white/5' 
                    : 'bg-gray-100 border-gray-200'
                  }
                `}></div>
            </div>
            <div>
              <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Upload Screenshots</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Drag & drop multiple images or click to browse</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FileUpload;
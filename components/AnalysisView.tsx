import React from 'react';
import { AnalysisResult } from '../types';
import { ArrowRight, Palette, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';

interface AnalysisViewProps {
  imageSrcs: string[];
  analysis: AnalysisResult;
  onContinue: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ imageSrcs, analysis, onContinue }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px] animate-fade-in">
      
      {/* LEFT: Current State */}
      <div className="lg:w-5/12 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Current Website</h3>
          <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded">Before</span>
        </div>
        
        <div className="flex-1 bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden relative group shadow-2xl">
          {imageSrcs.length > 0 ? (
            <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
                {imageSrcs.map((src, idx) => (
                    <img 
                      key={idx}
                      src={src} 
                      alt={`Original Website Screenshot ${idx + 1}`} 
                      className="w-full object-contain rounded-lg border border-white/5 shadow-md"
                    />
                ))}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 mb-4 flex items-center justify-center">
                <span className="text-2xl">🌐</span>
              </div>
              <p>Analysis performed via URL data.</p>
              <p className="text-sm mt-2 opacity-50">Visual reference not available for live URL mode.</p>
            </div>
          )}
          {imageSrcs.length === 0 && (
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent pointer-events-none opacity-50" />
          )}
        </div>
      </div>

      {/* RIGHT: Analysis Results */}
      <div className="lg:w-7/12 flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Analysis Results</h3>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                {analysis.businessType}
            </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Header Card */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
            <h1 className="text-3xl font-bold text-white mb-2">{analysis.businessName}</h1>
            <p className="text-gray-400 leading-relaxed">{analysis.extractedContent.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Color Palette */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-white font-medium mb-2">
                <Palette className="w-4 h-4 text-purple-400" />
                <span>Extracted Palette</span>
              </div>
              <div className="flex gap-4">
                 {[analysis.primaryColor, analysis.secondaryColor, analysis.accentColor].map((color, i) => (
                   <div key={i} className="flex flex-col gap-2 items-center">
                      <div 
                        className="w-14 h-14 rounded-full border border-white/10 shadow-lg"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-500 font-mono">{color}</span>
                   </div>
                 ))}
              </div>
            </div>

            {/* Recommended Style */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-white font-medium mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span>Recommended Style</span>
              </div>
              <div className="text-xl text-indigo-300 font-light">
                "{analysis.recommendedStyle}"
              </div>
              <div className="text-sm text-gray-500">
                AI suggests this direction based on the industry and current trends.
              </div>
            </div>

          </div>

          {/* Issues List */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-white font-medium mb-4">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span>Design Issues Identified</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {analysis.designIssues.map((issue, i) => (
                <div key={i} className="flex items-start gap-3 text-gray-300 text-sm bg-white/5 p-3 rounded-lg">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  {issue}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-4 border-t border-white/10">
          <button 
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/20 transition-all transform hover:scale-[1.01]"
          >
            Generate New Website
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default AnalysisView;
import React, { useState, useEffect, useRef } from 'react';
import { AppStep, AnalysisResult, ChatMessage, GeneratedAsset } from './types';
import FileUpload from './components/FileUpload';
import AnalysisView from './components/AnalysisView';
import ChatInterface from './components/ChatInterface';
import { analyzeScreenshot, analyzeUrl, generateWebsiteCode, refineWebsiteCode, generateAssetImage } from './services/geminiService';
import { Sparkles, CheckCircle2, Loader2, Camera, Search, Palette, Code, Layout, Moon, Sun } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  
  // Loading States
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [genProgress, setGenProgress] = useState<string[]>([]);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatProcessing, setIsChatProcessing] = useState(false);

  // Card expansion state
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isCardLocked, setIsCardLocked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Card theme state (only affects card, not entire page)
  const [isCardDarkMode, setIsCardDarkMode] = useState(true);

  // Load card theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cardTheme');
    if (savedTheme) {
      setIsCardDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save card theme to localStorage
  useEffect(() => {
    localStorage.setItem('cardTheme', isCardDarkMode ? 'dark' : 'light');
  }, [isCardDarkMode]);

  const toggleCardTheme = () => {
    setIsCardDarkMode(!isCardDarkMode);
  };

  // Reset card state when step changes
  useEffect(() => {
    if (step !== AppStep.INPUT) {
      setIsCardExpanded(false);
      setIsCardLocked(false);
    }
  }, [step]);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        if (step === AppStep.INPUT) {
          // Always unlock and collapse when clicking outside
          setIsCardLocked(false);
          setIsCardExpanded(false);
        }
      }
    };

    if (step === AppStep.INPUT) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [step]);

  // Lock card when user interacts
  const handleCardInteraction = () => {
    setIsCardExpanded(true);
    setIsCardLocked(true);
  };

  // --- Handlers ---

  const handleFileSelect = async (files: File[]) => {
    const promises = files.map(file => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        });
    });

    const results = await Promise.all(promises);
    setImageSrcs(results);
    await runAnalysis(results, 'image');
  };

  const handleUrlSelect = async (url: string) => {
    setImageSrcs([]); // No visual for URL
    await runAnalysis(url, 'url');
  };

  const runAnalysis = async (input: string | string[], type: 'image' | 'url') => {
    setStep(AppStep.ANALYZING);
    setAnalysisProgress(0);
    
    // Simulate steps visual
    const steps = [
      type === 'image' ? "📸 Capturing screenshots..." : "🌍 accessing URL...",
      "🔍 Analyzing design and structure...",
      "🎨 Identifying brand palette...",
      "✨ Generating improvement plan..."
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
        if(currentStepIdx < steps.length) {
            setAnalysisStatus(steps[currentStepIdx]);
            setAnalysisProgress((prev) => prev + 25);
            currentStepIdx++;
        }
    }, 800);

    try {
      let result: AnalysisResult;
      if (type === 'image' && Array.isArray(input)) {
        result = await analyzeScreenshot(input);
      } else if (typeof input === 'string') {
        result = await analyzeUrl(input);
      } else {
        throw new Error("Invalid input");
      }

      clearInterval(interval);
      setAnalysis(result);
      setStep(AppStep.ANALYSIS_RESULT);
    } catch (error) {
      clearInterval(interval);
      console.error(error);
      alert("Analysis failed. Please try again.");
      setStep(AppStep.INPUT);
    }
  };

  const handleStartGeneration = async () => {
    if (!analysis) return;
    setStep(AppStep.GENERATING);
    setGenProgress([]);

    try {
      // 1. Trigger Image Generation (Parallel)
      addGenLog("🎨 Generating hero assets...");
      const heroPrompt = `Professional hero website banner for ${analysis.businessName}, ${analysis.businessType}. ${analysis.recommendedStyle}. High quality, 4k, cinematic lighting.`;
      
      addGenLog("📸 Creating feature photography...");
      const featurePrompt = `Detailed photo representing ${analysis.businessType} services: ${analysis.extractedContent.services[0]}. Professional photography, ${analysis.recommendedStyle}.`;

      const [heroAsset, featureAsset] = await Promise.all([
        generateAssetImage(heroPrompt, 'hero'),
        generateAssetImage(featurePrompt, 'feature')
      ]);
      
      const assets = [heroAsset, featureAsset];
      setGeneratedAssets(assets);
      addGenLog("✅ Images generated successfully");

      // 2. Trigger Code Generation
      addGenLog("💻 Architecting modern HTML structure...");
      const htmlCode = await generateWebsiteCode(analysis, assets);
      
      setGeneratedHtml(htmlCode);
      addGenLog("✨ Finalizing design...");
      
      // Delay slightly to show success
      setTimeout(() => {
          setStep(AppStep.PREVIEW);
          setChatMessages([{ role: 'model', text: `Welcome to the new ${analysis.businessName} website! I've applied a ${analysis.recommendedStyle} style. You can ask me to make any changes.` }]);
      }, 1000);

    } catch (error) {
      console.error(error);
      alert("Generation failed.");
      setStep(AppStep.ANALYSIS_RESULT);
    }
  };

  const addGenLog = (msg: string) => {
      setGenProgress(prev => [...prev, msg]);
  };

  const handleChatMessage = async (text: string) => {
    const newHistory = [...chatMessages, { role: 'user', text } as ChatMessage];
    setChatMessages(newHistory);
    setIsChatProcessing(true);

    try {
        // If user asks to regenerate images, we might need a specific handler, 
        // but for now we focus on code refinement as per instructions.
        const updatedHtml = await refineWebsiteCode(generatedHtml, text);
        setGeneratedHtml(updatedHtml);
        setChatMessages([...newHistory, { role: 'model', text: 'Updated! How does that look?' }]);
    } catch (error) {
        setChatMessages([...newHistory, { role: 'model', text: 'Sorry, I had trouble making that change.' }]);
    } finally {
        setIsChatProcessing(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis?.businessName.replace(/\s+/g, '-').toLowerCase() || 'website'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Renderers ---

  const renderContent = () => {
    switch (step) {
      case AppStep.INPUT:
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] w-full animate-fade-in pb-20">
            <div 
              ref={cardRef}
              className={`mac-card ${isCardExpanded || isCardLocked ? 'expanded' : ''} ${isCardDarkMode ? 'dark-card' : 'light-card'}`}
              onMouseEnter={() => !isCardLocked && setIsCardExpanded(true)}
              onMouseLeave={() => !isCardLocked && setIsCardExpanded(false)}
              onClick={handleCardInteraction}
              style={{
                minWidth: isCardExpanded || isCardLocked ? 'auto' : '300px',
                minHeight: isCardExpanded || isCardLocked ? 'auto' : '180px',
                backgroundColor: isCardDarkMode ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isCardDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* macOS Window Controls */}
              <div className="tools flex items-center justify-between">
                <div className="flex items-center">
                  <div className="circle">
                    <span className="red box"></span>
                  </div>
                  <div className="circle">
                    <span className="yellow box"></span>
                  </div>
                  <div className="circle">
                    <span className="green box"></span>
                  </div>
                </div>
                {/* Theme Toggle Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCardTheme();
                  }}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${isCardDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                  aria-label="Toggle card theme"
                >
                  {isCardDarkMode ? (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  )}
                </button>
              </div>

              <div className="card__content">
                {/* Default State - Only Title (Compact) */}
                <div 
                  className={`flex items-center justify-center px-8 py-6 min-h-[120px] transition-all duration-700 ease-out ${
                    isCardExpanded || isCardLocked ? 'max-h-0 opacity-0 overflow-hidden py-0' : 'opacity-100'
                  }`}
                >
                  <h1 className={`text-3xl md:text-4xl font-black ${isCardDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight text-center`} style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '2px' }}>
                    AI Website <br />
                    Rebuilder
                  </h1>
                </div>
                
                {/* Expanded State - Full Content */}
                <div 
                  className={`overflow-hidden transition-all duration-700 ease-out ${
                    isCardExpanded || isCardLocked 
                      ? 'max-h-[2000px] opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}
                  onClick={handleCardInteraction}
                  onFocus={handleCardInteraction}
                  onInput={handleCardInteraction}
                >
                  <div className="flex flex-col items-center justify-center w-full px-8 md:px-16 py-6">
                    <div className="text-center mb-12 space-y-4 pt-2 w-full transform transition-transform duration-700 ease-out delay-200">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm mb-4 ${isCardDarkMode ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span>Powered by Gemini 2.5 & Imagen</span>
                      </div>
                      <h1 className={`text-5xl md:text-6xl font-black ${isCardDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight leading-tight`} style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '3px' }}>
                        AI Website <br />
                        Rebuilder
                      </h1>
                      <p className={`text-lg ${isCardDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto font-light`}>
                        Transform any outdated website URL or screenshots into a modern masterpiece in seconds.
                      </p>
                    </div>
                    <div className="w-full transform transition-transform duration-700 ease-out delay-300">
                      <FileUpload 
                        onFileSelect={handleFileSelect} 
                        onUrlSelect={handleUrlSelect} 
                        isAnalyzing={false}
                        onInteraction={handleCardInteraction}
                        isDarkMode={isCardDarkMode}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case AppStep.ANALYZING:
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-12 w-full max-w-md mx-auto">
                <div className="relative w-32 h-32">
                     <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                     <div className="absolute inset-2 border-r-4 border-purple-500 rounded-full animate-spin animation-delay-200"></div>
                     <div className="absolute inset-4 border-b-4 border-pink-500 rounded-full animate-spin animation-delay-500"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="w-10 h-10 text-white opacity-80" />
                     </div>
                </div>
                
                <div className="w-full space-y-6">
                    <h2 className="text-2xl font-bold text-center text-white">{analysisStatus}</h2>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                            style={{ width: `${analysisProgress}%` }}
                        ></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-4">
                        {[1, 2, 3, 4].map((s, i) => (
                            <div key={i} className={`h-1 rounded-full ${i * 25 < analysisProgress ? 'bg-green-500' : 'bg-gray-800'}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        );

      case AppStep.ANALYSIS_RESULT:
        return analysis ? (
             <div className="h-full w-full max-w-7xl mx-auto">
                <AnalysisView 
                    imageSrcs={imageSrcs} 
                    analysis={analysis} 
                    onContinue={handleStartGeneration} 
                />
             </div>
        ) : null;

      case AppStep.GENERATING:
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-10">
            <h2 className="text-3xl font-bold text-white">Creating your new website...</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Log Output */}
                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10 h-64 overflow-y-auto space-y-4 font-mono text-sm">
                    {genProgress.map((log, i) => (
                        <div key={i} className="flex items-center gap-3 animate-fade-in text-gray-300">
                             {log.includes("✅") ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                             {log}
                        </div>
                    ))}
                    {genProgress.length === 0 && <span className="text-gray-600">Initializing AI models...</span>}
                </div>
                
                {/* Visual Thumbnails */}
                <div className="grid grid-cols-2 gap-4">
                     {generatedAssets.map((asset, i) => (
                         <div key={i} className="aspect-video bg-[#1a1a1a] rounded-lg border border-white/10 overflow-hidden relative group animate-fade-in">
                             <img src={asset.url} alt="Generated Asset" className="w-full h-full object-cover" />
                             <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-white truncate">
                                {asset.type === 'hero' ? 'Hero Image' : 'Content Image'}
                             </div>
                         </div>
                     ))}
                     {generatedAssets.length < 2 && (
                         <div className="aspect-video bg-[#1a1a1a] rounded-lg border border-white/10 flex items-center justify-center border-dashed">
                             <div className="text-center text-gray-600">
                                 <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                 <span className="text-xs">Generating assets...</span>
                             </div>
                         </div>
                     )}
                </div>
            </div>
          </div>
        );

      case AppStep.PREVIEW:
        return (
          <div className="flex h-full border-t border-white/10">
            {/* Website Preview Iframe */}
            <div className="w-[70%] h-full bg-[#0a0a0a] relative">
               <iframe 
                  srcDoc={generatedHtml}
                  className="w-full h-full border-none"
                  title="Generated Website"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
               />
            </div>
            {/* Chat Sidebar */}
            <div className="w-[30%] h-full border-l border-white/10">
                <ChatInterface 
                    messages={chatMessages} 
                    onSendMessage={handleChatMessage} 
                    isProcessing={isChatProcessing}
                    onExport={handleExport}
                />
            </div>
          </div>
        );
    }
  };

  // Determine if the current step requires a fixed, full-height layout without main scroll
  const isFixedLayout = step === AppStep.ANALYSIS_RESULT || step === AppStep.PREVIEW;

  // Matrix background - generate character sequence
  const generateMatrixChars = () => {
    const chars = ["ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト","ナ","ニ","ヌ","ネ","ノ","ハ","ヒ","フ","ヘ","ホ","マ","ミ","ム","メ","モ","ヤ","ユ","ヨ","ラ","リ","ル","レ","ロ","ワ","ヲ","ン","ガ","ギ","グ","ゲ","ゴ","ザ","ジ","ズ","ゼ","ゾ","ダ","ヂ","ヅ","デ","ド","バ","ビ","ブ","ベ","ボ","パ","ピ","プ","ペ","ポ"];
    const sequence: string[] = [];
    // Repeat the full character set multiple times to create enough characters
    for (let i = 0; i < 50; i++) {
      sequence.push(...chars);
    }
    return sequence;
  };
  const matrixChars = generateMatrixChars();

  return (
    <div className="min-h-screen bg-[#0f0f0f]/90 text-white font-sans selection:bg-indigo-500/30 flex flex-col relative z-10">
      {/* Matrix Background - Always visible */}
      <div 
        className="jp-matrix fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      >
        {matrixChars.map((char, i) => (
          <span key={i}>{char}</span>
        ))}
      </div>
      {/* Main Content Area */}
      <main 
        className={`
           relative w-full flex-1
           ${isFixedLayout ? 'overflow-hidden h-screen' : 'overflow-y-auto custom-scrollbar h-screen'}
        `}
      >
        <div className={`
            mx-auto h-full
            ${step === AppStep.PREVIEW ? 'w-full' : 'container px-4 py-8'}
        `}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
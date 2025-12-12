import React, { useState } from 'react';
import { UserPreferences, AnalysisData } from '../types';
import { generateMoodImage } from '../services/geminiService';
import { Sparkles, Palette, Type, Layout, ChevronLeft, Check } from 'lucide-react';

interface Props {
  onComplete: (prefs: UserPreferences) => void;
  isGeneratingImage: boolean;
  setIsGeneratingImage: (isGenerating: boolean) => void;
  analysisData: AnalysisData;
}

interface StepConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  options: Array<{
    value: string;
    label: string;
    description: string;
    gradient?: string;
  }>;
}

const PreferenceBuilder: React.FC<Props> = ({
  onComplete,
  isGeneratingImage,
  setIsGeneratingImage,
  analysisData
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [prefs, setPrefs] = useState<UserPreferences>({
    vibe: {},
    colorPalette: '',
    typography: '',
    layoutFocus: '',
  });
  const [moodImageUrl, setMoodImageUrl] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const steps: StepConfig[] = [
    {
      id: 'vibe',
      title: 'Select Your Vibe',
      subtitle: 'Define the overall personality of your new website',
      icon: <Sparkles className="w-5 h-5" />,
      options: [
        { value: 'minimal', label: 'Minimal', description: 'Clean lines, whitespace, understated elegance', gradient: 'from-gray-400 to-gray-600' },
        { value: 'bold', label: 'Bold', description: 'Strong contrasts, large typography, impactful presence', gradient: 'from-red-500 to-orange-500' },
        { value: 'playful', label: 'Playful', description: 'Rounded shapes, vibrant colors, friendly feel', gradient: 'from-pink-500 to-purple-500' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated aesthetics, refined details, luxurious', gradient: 'from-amber-400 to-yellow-600' },
      ],
    },
    {
      id: 'colorPalette',
      title: 'Choose Color Palette',
      subtitle: 'Set the color mood for your brand',
      icon: <Palette className="w-5 h-5" />,
      options: [
        { value: 'soft-pastels', label: 'Soft Pastels', description: 'Gentle, calming, approachable tones', gradient: 'from-pink-200 via-purple-200 to-blue-200' },
        { value: 'vibrant-high-contrast', label: 'Vibrant High-Contrast', description: 'Eye-catching, energetic, memorable', gradient: 'from-cyan-400 via-fuchsia-500 to-yellow-400' },
        { value: 'dark-mode-neon', label: 'Dark Mode & Neon', description: 'Modern, tech-forward, dramatic', gradient: 'from-purple-600 via-pink-600 to-cyan-400' },
        { value: 'clean-monochrome', label: 'Clean Monochrome', description: 'Timeless, professional, focused', gradient: 'from-gray-200 via-gray-400 to-gray-600' },
      ],
    },
    {
      id: 'typography',
      title: 'Pick Typography Style',
      subtitle: 'Choose fonts that speak your brand voice',
      icon: <Type className="w-5 h-5" />,
      options: [
        { value: 'modern-sans-serif', label: 'Modern Sans-Serif', description: 'Clean, contemporary, universal appeal', gradient: 'from-blue-400 to-indigo-500' },
        { value: 'classic-serif', label: 'Classic Serif', description: 'Traditional, trustworthy, authoritative', gradient: 'from-amber-600 to-orange-700' },
        { value: 'tech-monospace', label: 'Tech/Monospace', description: 'Technical, precise, developer-friendly', gradient: 'from-green-400 to-emerald-600' },
        { value: 'friendly-rounded', label: 'Friendly Rounded', description: 'Approachable, warm, inviting', gradient: 'from-pink-400 to-rose-500' },
      ],
    },
    {
      id: 'layoutFocus',
      title: 'Define Layout Focus',
      subtitle: 'Choose how content is prioritized',
      icon: <Layout className="w-5 h-5" />,
      options: [
        { value: 'hero-centric', label: 'Hero-Centric', description: 'Big impactful hero image, visual-first approach', gradient: 'from-violet-500 to-purple-600' },
        { value: 'content-first', label: 'Content-First', description: 'Text-focused, readable, informative', gradient: 'from-teal-400 to-cyan-500' },
        { value: 'split-screen', label: 'Split Screen', description: 'Balanced visual and text, modern feel', gradient: 'from-orange-400 to-red-500' },
        { value: 'visual-grid', label: 'Visual Grid', description: 'Gallery-style, portfolio-ready, dynamic', gradient: 'from-indigo-400 to-blue-600' },
      ],
    },
  ];

  const handleOptionSelect = async (option: string) => {
    const step = steps[currentStep];
    const newPrefs = { ...prefs };
    const newSelectedOptions = { ...selectedOptions, [step.id]: option };
    setSelectedOptions(newSelectedOptions);

    if (step.id === 'vibe') {
      // Create weighted vibe vector
      const newVibeWeights: Record<string, number> = {};
      step.options.forEach(opt => {
        newVibeWeights[opt.value] = opt.value === option ? 0.8 : 0.1;
      });
      newPrefs.vibe = newVibeWeights;

      // WOAH FACTOR: Generate mood image based on VIBE + BUSINESS CONTEXT
      setIsGeneratingImage(true);
      const businessContext = analysisData.textContent.headings[0] || "a local business";
      const moodPrompt = `An abstract, high-quality background image representing a '${option}' design vibe, specifically tailored for ${businessContext}. Artistic, modern, professional.`;

      generateMoodImage(moodPrompt)
        .then(asset => {
          setMoodImageUrl(asset.url);
          setPrefs(prev => ({ ...prev, nanoBananaMoodImage: asset.url }));
          setIsGeneratingImage(false);
        })
        .catch(e => {
          console.error("Failed to generate mood image", e);
          setIsGeneratingImage(false);
        });
    } else {
      (newPrefs as Record<string, unknown>)[step.id] = option;
    }

    setPrefs(newPrefs);

    // Auto-advance after brief delay for visual feedback
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Ensure all preferences are set before completing
        const finalPrefs = {
          ...newPrefs,
          nanoBananaMoodImage: moodImageUrl || prefs.nanoBananaMoodImage
        };
        onComplete(finalPrefs);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-1.5 text-xs transition-all ${
                idx <= currentStep ? 'text-indigo-400' : 'text-gray-600'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  idx < currentStep
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : idx === currentStep
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-gray-700 text-gray-600'
                }`}
              >
                {idx < currentStep ? <Check className="w-3 h-3" /> : idx + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-2xl">
        {/* Mood Image Preview (shows when generated) */}
        {moodImageUrl && (
          <div className="absolute -top-4 -right-4 w-32 h-32 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 z-10 animate-fade-in">
            <img
              src={moodImageUrl}
              alt="Mood visualization"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-1 left-1 text-[10px] text-white/80 font-medium">Vibe Preview</span>
          </div>
        )}

        <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                {currentStepData.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{currentStepData.title}</h2>
                <p className="text-sm text-gray-500">{currentStepData.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            {currentStepData.options.map((option) => {
              const isSelected = selectedOptions[currentStepData.id] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  disabled={isGeneratingImage && currentStepData.id !== 'vibe'}
                  className={`
                    group relative p-5 rounded-2xl text-left transition-all duration-300 transform
                    ${isSelected
                      ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500 scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 hover:scale-[1.01]'
                    }
                    border-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
                  `}
                >
                  {/* Gradient accent bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${option.gradient} opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}
                  />

                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {option.label}
                    </h3>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                    {option.description}
                  </p>

                  {/* Preview gradient */}
                  <div
                    className={`mt-3 h-2 rounded-full bg-gradient-to-r ${option.gradient} opacity-60`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isGeneratingImage && (
        <div className="mt-6 flex items-center gap-3 text-indigo-400 animate-pulse">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-indigo-500/30 rounded-full" />
            <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin" />
          </div>
          <span className="font-medium">Generating vibe visualization...</span>
        </div>
      )}

      {/* Context Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Building for: <span className="text-indigo-400 font-medium">{analysisData.textContent.headings[0] || 'Your Business'}</span>
        </p>
      </div>
    </div>
  );
};

export default PreferenceBuilder;

import React, { useState, useCallback } from 'react';
import { Sprout, MapPin, Calendar, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ImageUploader } from './components/ImageUploader';
import { HOKKAIDO_REGIONS, SEASONS } from './constants';
import { DiagnosticMetadata, AnalysisState } from './types';
import { analyzeCropImage } from './services/geminiService';

export default function App() {
  const [image, setImage] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DiagnosticMetadata>({
    location: HOKKAIDO_REGIONS[0],
    season: SEASONS[1], // Default to Summer
  });
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isLoading: false,
    result: null,
    error: null,
  });

  const handleAnalyze = useCallback(async () => {
    if (!image) return;

    setAnalysis({ isLoading: true, result: null, error: null });

    try {
      const resultText = await analyzeCropImage(image, metadata);
      setAnalysis({ isLoading: false, result: resultText, error: null });
    } catch (error: any) {
      setAnalysis({
        isLoading: false,
        result: null,
        error: error.message || 'An unexpected error occurred.',
      });
    }
  }, [image, metadata]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-agri-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-agri-800 text-white p-2 rounded-lg shadow-sm">
              <Sprout size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-agri-800 leading-tight tracking-tight">SakuCheck</h1>
              <p className="text-xs text-agri-500 font-medium">北海道農業向けAI病害虫診断</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-agri-100 p-6">
              <h2 className="text-lg font-bold text-agri-800 mb-4 flex items-center gap-3">
                <span className="bg-agri-50 text-agri-800 border border-agri-200 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">1</span>
                画像をアップロード
              </h2>
              <ImageUploader onImageSelect={setImage} selectedImage={image} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-agri-100 p-6">
              <h2 className="text-lg font-bold text-agri-800 mb-4 flex items-center gap-3">
                <span className="bg-agri-50 text-agri-800 border border-agri-200 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">2</span>
                圃場情報 (任意)
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-agri-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin size={16} className="text-agri-500" />
                    地域 (Region)
                  </label>
                  <select
                    value={metadata.location}
                    onChange={(e) => setMetadata(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full rounded-xl border-agri-200 border p-3 text-agri-800 focus:ring-2 focus:ring-agri-500 focus:border-agri-500 outline-none transition-all bg-agri-50/50 hover:bg-agri-50"
                  >
                    {HOKKAIDO_REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-agri-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={16} className="text-agri-500" />
                    時期 (Season)
                  </label>
                  <select
                    value={metadata.season}
                    onChange={(e) => setMetadata(prev => ({ ...prev, season: e.target.value }))}
                    className="w-full rounded-xl border-agri-200 border p-3 text-agri-800 focus:ring-2 focus:ring-agri-500 focus:border-agri-500 outline-none transition-all bg-agri-50/50 hover:bg-agri-50"
                  >
                    {SEASONS.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!image || analysis.isLoading}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-sm
                ${!image 
                  ? 'bg-agri-100 text-agri-400 cursor-not-allowed' 
                  : analysis.isLoading
                    ? 'bg-agri-600 text-white opacity-90 cursor-wait'
                    : 'bg-agri-800 hover:bg-agri-900 text-white hover:shadow-md active:scale-[0.98]'
                }`}
            >
              {analysis.isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  診断中... (Analyzing)
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  AI診断を実行 (Run Diagnosis)
                </>
              )}
            </button>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-sm border border-agri-100 h-full min-h-[600px] overflow-hidden flex flex-col">
              <div className="bg-agri-50/50 border-b border-agri-100 p-5 px-6">
                <h2 className="text-lg font-bold text-agri-800 flex items-center gap-2">
                  診断結果 (Diagnostic Report)
                </h2>
              </div>
              
              <div className="p-6 flex-grow overflow-y-auto">
                {!analysis.isLoading && !analysis.result && !analysis.error && (
                  <div className="h-full flex flex-col items-center justify-center text-agri-400 space-y-4">
                    <Sprout size={64} className="opacity-20" />
                    <p className="text-center font-medium">
                      画像をアップロードして「AI診断を実行」を<br/>クリックしてください。
                    </p>
                  </div>
                )}

                {analysis.isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-agri-600 space-y-4">
                    <Loader2 size={48} className="animate-spin opacity-50" />
                    <p className="font-medium animate-pulse">AIが画像を解析しています...</p>
                  </div>
                )}

                {analysis.error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="font-bold mb-1">エラーが発生しました</h3>
                      <p className="text-sm">{analysis.error}</p>
                    </div>
                  </div>
                )}

                {analysis.result && (
                  <div className="prose prose-headings:text-agri-800 prose-h1:text-2xl prose-h1:border-b prose-h1:border-agri-100 prose-h1:pb-3 prose-h2:text-xl prose-h2:mt-8 prose-h3:text-lg prose-h3:text-agri-700 prose-a:text-agri-600 prose-strong:text-agri-800 prose-li:text-agri-700 prose-p:text-agri-700 max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysis.result}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

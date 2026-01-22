import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe, MessageSquare, FileText, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, Target, TrendingUp, Users, Clock, Zap, BarChart3, Send,
  Copy, Link, History, Trash2, X, Upload, Check, Info, HelpCircle,
  Share2, FileDown, Sparkles
} from 'lucide-react';
import { analyzeDemo } from './services/claudeApi';
import { Toast, useToast } from './components/Toast';
import { useAnalysisHistory, type HistoryEntry } from './hooks/useAnalysisHistory';
import { copyToClipboard, downloadPDF, generateShareableLink } from './utils/export';
import { SAMPLE_TRANSCRIPT, SAMPLE_PROSPECT_URL, SAMPLE_SDR_TRANSCRIPT, BENCHMARKS } from './constants/sampleData';
import type { AnalysisResult } from './types/analysis';

type FeedbackStyle = 'direct' | 'supportive';

const LOADING_STAGES = [
  'Reading transcript...',
  'Analyzing discovery quality...',
  'Evaluating demo structure...',
  'Generating coaching feedback...'
];

export default function App() {
  const [demoTranscript, setDemoTranscript] = useState('');
  const [sdrTranscript, setSdrTranscript] = useState('');
  const [prospectUrl, setProspectUrl] = useState('');
  const [feedbackStyle, setFeedbackStyle] = useState<FeedbackStyle>('direct');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [activeNavSection, setActiveNavSection] = useState<number>(0);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { toast, showToast, hideToast } = useToast();
  const { history, addToHistory, clearHistory, deleteEntry } = useAnalysisHistory();

  // URL Validation
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Extract prospect name from URL
  const getProspectName = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '').split('.')[0];
    } catch {
      return 'Unknown';
    }
  };

  // Parse timestamp from transcript text
  const parseTimestamp = (text: string): string | null => {
    const match = text.match(/(\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/);
    return match ? match[1] : null;
  };

  // Generate quick win summary from results
  const generateQuickWinSummary = (results: AnalysisResult): string => {
    const strongCategories = results.categories.filter(c => c.score >= 7);
    const weakCategories = results.categories.filter(c => c.score < 5);

    let summary = '';

    if (strongCategories.length > 0) {
      const topStrength = strongCategories.sort((a, b) => b.score - a.score)[0];
      summary += `You nailed ${topStrength.name.toLowerCase()}`;
      if (strongCategories.length > 1) {
        summary += ` and ${strongCategories[1].name.toLowerCase()}`;
      }
      summary += '. ';
    }

    if (weakCategories.length > 0) {
      const topWeakness = weakCategories.sort((a, b) => a.score - b.score)[0];
      summary += `Focus on ${topWeakness.name.toLowerCase()} next time.`;
    } else if (results.priorityImprovements.length > 0) {
      summary += `Keep pushing on ${results.priorityImprovements[0].split(' ').slice(0, 3).join(' ').toLowerCase()}.`;
    }

    return summary || 'Good effort! Review the detailed feedback below.';
  };

  // Get top 3 priorities from categories
  const getTop3Priorities = (results: AnalysisResult) => {
    return results.categories
      .filter(c => c.nextDemo)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(c => ({
        category: c.name,
        tip: c.nextDemo,
        score: c.score
      }));
  };

  const toggleSection = (section: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.vtt') || file.name.endsWith('.srt'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setDemoTranscript(content);
      };
      reader.readAsText(file);
    }
  }, []);

  // Load sample data
  const loadSampleData = () => {
    setDemoTranscript(SAMPLE_TRANSCRIPT);
    setProspectUrl(SAMPLE_PROSPECT_URL);
    setSdrTranscript(SAMPLE_SDR_TRANSCRIPT);
    showToast('Sample data loaded!');
  };

  // Cancel analysis
  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setLoadingStage(0);
  };

  // Handle analysis
  const handleAnalyze = async () => {
    if (!demoTranscript.trim()) {
      setError('Please paste your demo transcript');
      return;
    }
    if (!prospectUrl.trim()) {
      setError('Please enter the prospect website URL');
      return;
    }

    setIsAnalyzing(true);
    setLoadingStage(0);
    setError(null);
    setShowScoreBreakdown(false);
    abortControllerRef.current = new AbortController();

    const stageInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < LOADING_STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 8000);

    try {
      const result = await analyzeDemo({
        demoTranscript,
        sdrTranscript,
        prospectUrl,
        feedbackStyle
      });

      clearInterval(stageInterval);
      setResults(result);

      const historyId = addToHistory(result, prospectUrl, demoTranscript, sdrTranscript, feedbackStyle);
      setCurrentHistoryId(historyId);

      setActiveTab('results');
    } catch (err) {
      clearInterval(stageInterval);
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
      setLoadingStage(0);
    }
  };

  // Load history entry
  const loadHistoryEntry = (entry: HistoryEntry) => {
    setResults(entry.results);
    setProspectUrl(entry.prospectUrl);
    setDemoTranscript(entry.demoTranscript);
    setSdrTranscript(entry.sdrTranscript);
    setFeedbackStyle(entry.feedbackStyle);
    setCurrentHistoryId(entry.id);
    setActiveTab('results');
    setShowHistoryPanel(false);
    setShowScoreBreakdown(false);
  };

  // Export functions
  const handleCopyForHubSpot = async () => {
    if (!results) return;
    const priorities = getTop3Priorities(results);
    const hubspotText = `Demo Analysis - ${getProspectName(prospectUrl)}
Score: ${results.overallScore.toFixed(1)}/10

Top 3 Priorities:
${priorities.map((p, i) => `${i + 1}. ${p.category}: ${p.tip}`).join('\n')}

Key Strengths: ${results.keyStrengths.slice(0, 2).join(', ')}`;

    const success = await copyToClipboard(hubspotText);
    if (success) showToast('Copied for HubSpot!');
  };

  const handleShareWithManager = async () => {
    if (!results || !currentHistoryId) return;
    const summary = `Demo Analysis for ${getProspectName(prospectUrl)}

Overall Score: ${results.overallScore.toFixed(1)}/10 (Team avg: ${BENCHMARKS.teamAverage})

Quick Summary: ${generateQuickWinSummary(results)}

${generateShareableLink(currentHistoryId)}`;

    const success = await copyToClipboard(summary);
    if (success) showToast('Summary copied for sharing!');
  };

  const handleDownloadPDF = () => {
    if (!results) return;
    downloadPDF(results, getProspectName(prospectUrl));
  };

  const handleCopyTip = async (tip: string) => {
    const success = await copyToClipboard(tip);
    if (success) showToast('Copied!');
  };

  const handleAddToHubSpot = async (category: string, tip: string) => {
    const text = `[${category}] ${tip}`;
    const success = await copyToClipboard(text);
    if (success) showToast('Copied for HubSpot!');
  };

  // Scroll spy for navigation
  useEffect(() => {
    const handleScroll = () => {
      if (!results) return;
      const scrollPosition = window.scrollY + 200;

      categoryRefs.current.forEach((ref, idx) => {
        if (ref) {
          const top = ref.offsetTop;
          const bottom = top + ref.offsetHeight;
          if (scrollPosition >= top && scrollPosition < bottom) {
            setActiveNavSection(idx);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [results]);

  const scrollToCategory = (idx: number) => {
    categoryRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-400/20 border-green-400/30';
    if (score >= 5) return 'bg-yellow-400/20 border-yellow-400/30';
    return 'bg-red-400/20 border-red-400/30';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return { text: 'Strong', color: 'text-green-400 bg-green-400/20' };
    if (score >= 5) return { text: 'Good', color: 'text-yellow-400 bg-yellow-400/20' };
    return { text: 'Needs Work', color: 'text-red-400 bg-red-400/20' };
  };

  const IconComponent = ({ name }: { name: string }) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Target, BarChart3, Users, TrendingUp, AlertTriangle, Zap, Clock
    };
    const Icon = icons[name] || Target;
    return <Icon className="w-5 h-5" />;
  };

  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: Record<string, string> = {
      'Discovery Quality': 'Target',
      'Demo Structure': 'BarChart3',
      'Personalisation': 'Users',
      'ROI & Value Articulation': 'TrendingUp',
      'Objection Handling': 'AlertTriangle',
      'Close Strength': 'Zap',
      'Engagement & Pacing': 'Clock'
    };
    return iconMap[categoryName] || 'Target';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-24">
      {/* Toast Notification */}
      <Toast message={toast.message} isVisible={toast.isVisible} onClose={hideToast} />

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Salesfire Demo Coach</h1>
              <p className="text-sm text-gray-400">AI-powered demo analysis & coaching</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* History Button */}
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className="relative p-2 text-gray-400 hover:text-white transition-colors"
              title="Analysis History"
            >
              <History className="w-5 h-5" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-xs flex items-center justify-center text-white">
                  {history.length}
                </span>
              )}
            </button>

            {/* Feedback Style Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip('feedback')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                {showTooltip === 'feedback' && (
                  <div className="absolute right-0 top-6 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 text-sm">
                    <p className="text-gray-300">
                      <strong className="text-orange-400">Direct:</strong> Blunt, actionable feedback
                    </p>
                    <p className="text-gray-300 mt-1">
                      <strong className="text-orange-400">Supportive:</strong> Encouraging tone with constructive suggestions
                    </p>
                  </div>
                )}
              </div>
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setFeedbackStyle('direct')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    feedbackStyle === 'direct'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Direct
                </button>
                <button
                  onClick={() => setFeedbackStyle('supportive')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    feedbackStyle === 'supportive'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Supportive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistoryPanel && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistoryPanel(false)} />
          <div className="relative ml-auto w-96 bg-gray-900 border-l border-gray-800 h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">Analysis History</h3>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300">
                    Clear All
                  </button>
                )}
                <button onClick={() => setShowHistoryPanel(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No previous analyses</p>
              ) : (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors group"
                    onClick={() => loadHistoryEntry(entry)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">{entry.prospectName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(entry.date).toLocaleDateString()} at{' '}
                          {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getScoreColor(entry.overallScore)}`}>
                          {entry.overallScore.toFixed(1)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-4 max-w-6xl mx-auto">
          <button
            onClick={() => setActiveTab('input')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all ${
              activeTab === 'input'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Input
          </button>
          <button
            onClick={() => setActiveTab('results')}
            disabled={!results}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all ${
              activeTab === 'results'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-white disabled:opacity-50'
            }`}
          >
            Results
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* Sample Data Link */}
            <div className="flex justify-end">
              <button
                onClick={loadSampleData}
                className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <Info className="w-4 h-4" />
                Try with sample demo
              </button>
            </div>

            {/* Demo Transcript - Required */}
            <div
              className={`bg-gray-900 rounded-xl border ${isDragOver ? 'border-orange-500 bg-orange-500/5' : 'border-gray-800'} p-6 transition-colors`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Demo Transcript <span className="text-red-400">*</span></h2>
                    <p className="text-sm text-gray-400">Required - paste or drag & drop your transcript</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Upload className="w-4 h-4" />
                  .txt, .vtt, .srt
                </div>
              </div>
              <textarea
                value={demoTranscript}
                onChange={(e) => setDemoTranscript(e.target.value)}
                placeholder={`Paste your demo transcript here or drag & drop a file...

Example format:
00:03:13 Russell: Hello, how are you?
00:03:15 Prospect: Good, thanks...`}
                className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-mono text-sm"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {demoTranscript.length > 0 ? `${demoTranscript.split('\n').length} lines` : 'No transcript loaded'}
                </span>
              </div>
            </div>

            {/* Prospect URL - Required */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Prospect Website <span className="text-red-400">*</span></h2>
                  <p className="text-sm text-gray-400">Required - used to assess demo personalisation</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="url"
                  value={prospectUrl}
                  onChange={(e) => setProspectUrl(e.target.value)}
                  placeholder="https://www.prospect-website.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 pr-10 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                {prospectUrl && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidUrl(prospectUrl) ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SDR Transcript - Optional */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">SDR Discovery Call</h2>
                  <p className="text-sm text-gray-400">Optional - helps assess discovery continuation</p>
                </div>
              </div>
              <textarea
                value={sdrTranscript}
                onChange={(e) => setSdrTranscript(e.target.value)}
                placeholder="Paste the SDR's initial call transcript here (optional)..."
                className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!demoTranscript.trim() || !prospectUrl.trim() || isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{LOADING_STAGES[loadingStage]}</span>
                  </div>
                  <span className="text-xs text-white/70">Usually takes 30-60 seconds</span>
                </div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Analyze Demo
                </>
              )}
            </button>

            {isAnalyzing && (
              <button
                onClick={cancelAnalysis}
                className="w-full py-3 bg-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {activeTab === 'results' && results && (
          <div className="space-y-6">
            {/* 1. QUICK WIN SUMMARY */}
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-white">Quick Summary</h2>
                    <div className={`text-3xl font-bold ${getScoreColor(results.overallScore)}`}>
                      {results.overallScore.toFixed(1)}<span className="text-lg text-gray-500">/10</span>
                    </div>
                  </div>
                  <p className="text-gray-200 text-lg">
                    {generateQuickWinSummary(results)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Team average: {BENCHMARKS.teamAverage} | Top performers: {BENCHMARKS.topPerformers}+
                  </p>
                </div>
              </div>
            </div>

            {/* 2. YOUR 3 PRIORITIES FOR NEXT DEMO */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-white">Your 3 Priorities for Next Demo</h2>
              </div>
              <div className="space-y-4">
                {getTop3Priorities(results).map((priority, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{priority.category}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreLabel(priority.score).color}`}>
                              {priority.score}/10
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{priority.tip}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleCopyTip(priority.tip)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAddToHubSpot(priority.category, priority.tip)}
                          className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                          title="Copy for HubSpot"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. SCORE BREAKDOWN (Collapsed by default) */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-white">See detailed scores</span>
                </div>
                {showScoreBreakdown ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showScoreBreakdown && (
                <div className="p-6 pt-0 border-t border-gray-800">
                  {/* Score bars */}
                  <div className="grid grid-cols-7 gap-2 mt-4">
                    {results.categories.map((cat, idx) => (
                      <div key={idx} className="text-center">
                        <div className="h-24 bg-gray-800 rounded-lg relative overflow-hidden">
                          <div
                            className={`absolute bottom-0 left-0 right-0 transition-all ${getScoreBarColor(cat.score)}`}
                            style={{ height: `${cat.score * 10}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 truncate" title={cat.name}>
                          {cat.name.split(' ')[0]}
                        </p>
                        <p className={`text-sm font-semibold ${getScoreColor(cat.score)}`}>{cat.score}</p>
                      </div>
                    ))}
                  </div>

                  {/* Key Insights */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <h3 className="font-medium text-white text-sm">Key Strengths</h3>
                      </div>
                      <ul className="space-y-1">
                        {results.keyStrengths.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                            <span className="text-green-500">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <h3 className="font-medium text-white text-sm">Areas to Improve</h3>
                      </div>
                      <ul className="space-y-1">
                        {results.priorityImprovements.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                            <span className="text-orange-500">{i + 1}.</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. DETAILED ANALYSIS */}
            <div className="space-y-3">
              {/* Sticky Navigation */}
              <div className="sticky top-0 z-10 bg-gray-950 py-3 -mx-6 px-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Detailed Analysis</h3>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {results.categories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToCategory(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        activeNavSection === idx
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {results.categories.map((category, idx) => (
                <div
                  key={idx}
                  ref={(el) => { categoryRefs.current[idx] = el; }}
                  className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(idx)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getScoreBg(category.score)}`}>
                        <IconComponent name={getCategoryIcon(category.name)} />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{category.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreLabel(category.score).color}`}>
                            {getScoreLabel(category.score).text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{category.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                        {category.score}/10
                      </span>
                      {expandedSections[idx] ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedSections[idx] && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">
                      {category.quotes && category.quotes.map((quote, qIdx) => {
                        const timestamp = parseTimestamp(quote.transcript);
                        return (
                          <div key={qIdx} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex gap-2 mb-2 items-center">
                              <span className="text-xs font-medium text-gray-500 uppercase">From transcript:</span>
                              {timestamp && (
                                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-mono">
                                  {timestamp}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 italic border-l-2 border-gray-600 pl-3 mb-3">
                              "{quote.transcript}"
                            </p>
                            <div className="flex gap-2 mb-2">
                              <span className="text-xs font-medium text-orange-500 uppercase">Coaching:</span>
                            </div>
                            <p className="text-sm text-gray-200">{quote.feedback}</p>
                          </div>
                        );
                      })}

                      {category.objections && category.objections.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium text-gray-400 uppercase">Objections Identified</h5>
                          {category.objections.map((obj, oIdx) => (
                            <div key={oIdx} className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-red-400">
                                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                                  {obj.objection}
                                </span>
                                <span className={`text-sm font-bold ${getScoreColor(obj.score)}`}>
                                  {obj.score}/10
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 mb-2">
                                <span className="text-gray-500">Handling:</span> {obj.handling}
                              </p>
                              <p className="text-sm text-gray-200">{obj.feedback}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {category.nextDemo && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 relative">
                          <button
                            onClick={() => handleCopyTip(category.nextDemo)}
                            className="absolute top-3 right-3 p-1.5 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 rounded transition-colors"
                            title="Copy tip"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-500">Next Demo, Try This:</span>
                          </div>
                          <p className="text-sm text-gray-200 pr-8">{category.nextDemo}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Analyze Another Demo Button */}
            <button
              onClick={() => setActiveTab('input')}
              className="w-full py-3 bg-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-all"
            >
              ← Analyze Another Demo
            </button>
          </div>
        )}
      </div>

      {/* 5. STICKY EXPORT FOOTER */}
      {activeTab === 'results' && results && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
            <button
              onClick={handleCopyForHubSpot}
              className="px-4 py-2.5 bg-gray-800 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy for HubSpot
            </button>
            <button
              onClick={handleShareWithManager}
              className="px-4 py-2.5 bg-gray-800 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share with Manager
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Save PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Globe, MessageSquare, FileText, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Target, TrendingUp, Users, Clock, Zap, BarChart3, Send } from 'lucide-react';
import { analyzeDemo } from './services/claudeApi';
import type { AnalysisResult } from './types/analysis';

type FeedbackStyle = 'direct' | 'supportive';

export default function App() {
  const [demoTranscript, setDemoTranscript] = useState('');
  const [sdrTranscript, setSdrTranscript] = useState('');
  const [prospectUrl, setProspectUrl] = useState('');
  const [feedbackStyle, setFeedbackStyle] = useState<FeedbackStyle>('direct');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');

  const toggleSection = (section: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
    setError(null);

    try {
      const result = await analyzeDemo({
        demoTranscript,
        sdrTranscript,
        prospectUrl,
        feedbackStyle
      });
      setResults(result);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-400/20 border-green-400/30';
    if (score >= 6) return 'bg-yellow-400/20 border-yellow-400/30';
    return 'bg-red-400/20 border-red-400/30';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const IconComponent = ({ name }: { name: string }) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Target: Target,
      BarChart3: BarChart3,
      Users: Users,
      TrendingUp: TrendingUp,
      AlertTriangle: AlertTriangle,
      Zap: Zap,
      Clock: Clock
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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Salesfire Demo Coach</h1>
              <p className="text-sm text-gray-400">AI-powered demo analysis & coaching</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Feedback style:</span>
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

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-4">
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
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* Demo Transcript - Required */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Demo Transcript <span className="text-red-400">*</span></h2>
                  <p className="text-sm text-gray-400">Required - paste your Zoom transcript</p>
                </div>
              </div>
              <textarea
                value={demoTranscript}
                onChange={(e) => setDemoTranscript(e.target.value)}
                placeholder={`Paste your demo transcript here...

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
              <input
                type="url"
                value={prospectUrl}
                onChange={(e) => setProspectUrl(e.target.value)}
                placeholder="https://www.prospect-website.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
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
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing demo...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Analyze Demo
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'results' && results && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Overall Demo Score</h2>
                  <p className="text-sm text-gray-400">Based on Salesfire demo best practices</p>
                </div>
                <div className={`text-5xl font-bold ${getScoreColor(results.overallScore)}`}>
                  {results.overallScore.toFixed(1)}
                  <span className="text-2xl text-gray-500">/10</span>
                </div>
              </div>

              {/* Score bars */}
              <div className="mt-6 grid grid-cols-7 gap-2">
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
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-white">Key Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {results.keyStrengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-white">Priority Improvements</h3>
                </div>
                <ul className="space-y-2">
                  {results.priorityImprovements.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-orange-500 mt-1">{idx + 1}.</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Categories */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Detailed Analysis</h3>
              {results.categories.map((category, idx) => (
                <div key={idx} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <button
                    onClick={() => toggleSection(idx)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getScoreBg(category.score)}`}>
                        <IconComponent name={getCategoryIcon(category.name)} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-white">{category.name}</h4>
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
                      {/* Quotes & Feedback */}
                      {category.quotes && category.quotes.map((quote, qIdx) => (
                        <div key={qIdx} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase">From transcript:</span>
                          </div>
                          <p className="text-sm text-gray-300 italic border-l-2 border-gray-600 pl-3 mb-3">
                            "{quote.transcript}"
                          </p>
                          <div className="flex gap-2 mb-2">
                            <span className="text-xs font-medium text-orange-500 uppercase">Coaching:</span>
                          </div>
                          <p className="text-sm text-gray-200">{quote.feedback}</p>
                        </div>
                      ))}

                      {/* Objections (if present) */}
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

                      {/* Next Demo Tip */}
                      {category.nextDemo && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-500">Next Demo, Try This:</span>
                          </div>
                          <p className="text-sm text-gray-200">{category.nextDemo}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Back to Input Button */}
            <button
              onClick={() => setActiveTab('input')}
              className="w-full py-3 bg-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-all"
            >
              ← Analyze Another Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

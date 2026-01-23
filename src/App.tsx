import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Globe, MessageSquare, FileText, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, Target, TrendingUp, Users, Clock, Zap, BarChart3, Send,
  Copy, Link, History, Trash2, X, Upload, Check, Info,
  Share2, FileDown, Sparkles, Mail, Building2, ArrowRight,
  Calendar, Eye, Settings, ArrowLeft, User, Phone, Video
} from 'lucide-react';
import { analyzeDemo, analyzeCall } from './services/claudeApi';
import { Toast, useToast } from './components/Toast';
import { useAnalysisHistory, type HistoryEntry } from './hooks/useAnalysisHistory';
import { useCallHistory, type CallHistoryEntry } from './hooks/useCallHistory';
import { useCompanyProfile } from './hooks/useCompanyProfile';
import { copyToClipboard, downloadPDF, generateShareableLink } from './utils/export';
import { SAMPLE_TRANSCRIPT, SAMPLE_PROSPECT_URL, SAMPLE_SDR_TRANSCRIPT, BENCHMARKS } from './constants/sampleData';
import type { AnalysisResult, HubSpotExportOptions, ShareEmailOptions } from './types/analysis';

type FeedbackStyle = 'direct' | 'supportive';
type CoachType = 'demo' | 'call';
type AppScreen = 'setup' | 'style' | 'coachSelect' | 'main' | 'settings' | 'analyzing';

const LOADING_STAGES = [
  'Reading transcript...',
  'Analyzing discovery quality...',
  'Evaluating demo structure...',
  'Generating coaching feedback...'
];

const DEMO_WITTY_MESSAGES = [
  "Counting how many times you said 'does that make sense?'...",
  "Checking if you actually let them talk...",
  "Measuring your 'um' to insight ratio...",
  "Seeing if you remembered their name...",
  "Analyzing your mute button timing...",
  "Checking if you demoed features they asked for...",
  "Calculating talk-to-listen ratio... (no judgment)",
  "Looking for that perfect discovery question...",
  "Evaluating your 'any questions?' technique...",
  "Checking if you stuck the landing...",
  "Reviewing your screen share confidence...",
  "Hunting for those golden sound bites...",
  "Almost done... preparing your coaching notes..."
];

const CALL_WITTY_MESSAGES = [
  "Checking if you asked for permission to continue...",
  "Counting your 'does that make sense?' moments...",
  "Analyzing your gatekeeper charm...",
  "Measuring your talk-to-listen ratio...",
  "Reviewing your objection comebacks...",
  "Checking if you got past 'send me an email'...",
  "Evaluating your opener confidence...",
  "Looking for that killer discovery question...",
  "Checking if you stuck the landing...",
  "Scoring your close attempt...",
  "Almost done... preparing your coaching notes..."
];

export default function App() {
  const [demoTranscript, setDemoTranscript] = useState('');
  const [sdrTranscript, setSdrTranscript] = useState('');
  const [prospectUrl, setProspectUrl] = useState('');
  const [feedbackStyle, setFeedbackStyle] = useState<FeedbackStyle>('direct');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [wittyMessageIndex, setWittyMessageIndex] = useState(0);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState<number>(0);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  // Screen and navigation state
  const [appScreen, setAppScreen] = useState<AppScreen>('main');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('main');
  const [activeCoach, setActiveCoach] = useState<CoachType>('demo');

  // Call Coach state
  const [callTranscript, setCallTranscript] = useState('');
  const [callResults, setCallResults] = useState<AnalysisResult | null>(null);
  const [currentCallHistoryId, setCurrentCallHistoryId] = useState<string | null>(null);
  void currentCallHistoryId; // TODO: Use in call history panel

  // Setup form state
  const [setupUserName, setSetupUserName] = useState('');
  const [setupCompanyName, setSetupCompanyName] = useState('');

  // Settings form state
  const [settingsUserName, setSettingsUserName] = useState('');
  const [settingsCompanyName, setSettingsCompanyName] = useState('');
  const [settingsFeedbackStyle, setSettingsFeedbackStyle] = useState<FeedbackStyle>('direct');

  // Modal state
  const [showHubSpotModal, setShowHubSpotModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hubSpotOptions, setHubSpotOptions] = useState<HubSpotExportOptions>({
    includeStrengths: true,
    includePriorities: true,
    includeDetailedScores: false,
    includeTranscriptQuotes: false
  });
  const [shareOptions, setShareOptions] = useState<ShareEmailOptions>({
    managerEmail: '',
    note: '',
    includePriorities: true,
    includeFullAnalysis: false
  });

  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { toast, showToast, hideToast } = useToast();
  const { history, addToHistory, clearHistory, deleteEntry } = useAnalysisHistory();
  const { history: callHistory, addToHistory: addCallToHistory, clearHistory: clearCallHistory, deleteEntry: deleteCallEntry } = useCallHistory();
  void clearCallHistory; void deleteCallEntry; // TODO: Use in call history panel
  const { profile, saveProfile, hasProfile, isLoading: profileLoading } = useCompanyProfile();

  // Check if first time user
  useEffect(() => {
    if (!profileLoading && !hasProfile) {
      setAppScreen('setup');
    }
  }, [profileLoading, hasProfile]);

  // Sync feedbackStyle from profile
  useEffect(() => {
    if (profile?.feedbackStyle) {
      setFeedbackStyle(profile.feedbackStyle);
    }
  }, [profile]);

  // Navigation functions
  const goToInput = () => {
    setAppScreen('coachSelect');
  };

  const goToCoach = (coach: CoachType) => {
    setActiveCoach(coach);
    setAppScreen('main');
    setActiveTab('input');
  };

  const goToSettings = () => {
    setPreviousScreen(appScreen);
    // Pre-populate settings form
    if (profile) {
      setSettingsUserName(profile.userName || '');
      setSettingsCompanyName(profile.companyName || '');
      setSettingsFeedbackStyle(profile.feedbackStyle || 'direct');
    }
    setAppScreen('settings');
  };

  const goBack = () => {
    setAppScreen(previousScreen === 'settings' ? 'main' : previousScreen);
  };

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

  // Handle profile setup - continue to style selection
  const handleContinueSetup = () => {
    if (!setupUserName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!setupCompanyName.trim()) {
      setError('Please enter your company name');
      return;
    }

    setError(null);
    saveProfile({
      companyName: setupCompanyName.trim(),
      userName: setupUserName.trim(),
      feedbackStyle: 'direct'
    });
    setAppScreen('style');
  };

  // Complete setup and go to coach selector
  const completeSetup = () => {
    if (profile) {
      saveProfile({ ...profile, feedbackStyle });
    }
    setAppScreen('coachSelect');
  };

  // Save settings
  const handleSaveSettings = () => {
    if (!settingsUserName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!settingsCompanyName.trim()) {
      setError('Please enter your company name');
      return;
    }
    if (profile) {
      saveProfile({
        ...profile,
        userName: settingsUserName.trim(),
        companyName: settingsCompanyName.trim(),
        feedbackStyle: settingsFeedbackStyle
      });
      setFeedbackStyle(settingsFeedbackStyle);
    }
    showToast('Settings saved!');
    goBack();
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

  // Group history by week
  const groupedHistory = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeek: HistoryEntry[] = [];
    const lastWeek: HistoryEntry[] = [];
    const older: HistoryEntry[] = [];

    history.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= startOfWeek) {
        thisWeek.push(entry);
      } else if (entryDate >= lastWeekStart) {
        lastWeek.push(entry);
      } else {
        older.push(entry);
      }
    });

    return { thisWeek, lastWeek, older };
  }, [history]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const thisWeekAvg = groupedHistory.thisWeek.length > 0
      ? groupedHistory.thisWeek.reduce((sum, e) => sum + e.overallScore, 0) / groupedHistory.thisWeek.length
      : 0;
    const lastWeekAvg = groupedHistory.lastWeek.length > 0
      ? groupedHistory.lastWeek.reduce((sum, e) => sum + e.overallScore, 0) / groupedHistory.lastWeek.length
      : 0;

    const trend = thisWeekAvg - lastWeekAvg;

    const categoryScores: Record<string, number[]> = {};
    groupedHistory.thisWeek.forEach(entry => {
      entry.results.categories.forEach(cat => {
        if (!categoryScores[cat.name]) categoryScores[cat.name] = [];
        categoryScores[cat.name].push(cat.score);
      });
    });

    const recurringThemes = Object.entries(categoryScores)
      .map(([name, scores]) => ({
        name,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length
      }))
      .filter(t => t.avgScore < 6 && t.count >= 2)
      .sort((a, b) => a.avgScore - b.avgScore);

    return { thisWeekAvg, lastWeekAvg, trend, recurringThemes };
  }, [groupedHistory]);

  // Computed properties for active coach
  const currentResults = activeCoach === 'demo' ? results : callResults;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentHistory = activeCoach === 'demo' ? history : callHistory;
  void currentHistory; // TODO: Use in history panel

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
    setAppScreen('main');
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
    setWittyMessageIndex(0);
    setError(null);
    setShowScoreBreakdown(false);
    setAppScreen('analyzing');
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

      setAppScreen('main');
      setActiveTab('results');
    } catch (err) {
      clearInterval(stageInterval);
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
        setAppScreen('main');
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

  // Handle call analysis
  const handleAnalyzeCall = async () => {
    if (!callTranscript.trim()) {
      setError('Please paste your call transcript');
      return;
    }

    setIsAnalyzing(true);
    setLoadingStage(0);
    setWittyMessageIndex(0);
    setError(null);
    setShowScoreBreakdown(false);
    setAppScreen('analyzing');
    abortControllerRef.current = new AbortController();

    const stageInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < LOADING_STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 8000);

    try {
      const result = await analyzeCall({
        callTranscript,
        feedbackStyle
      });

      clearInterval(stageInterval);
      setCallResults(result);

      const historyId = addCallToHistory(result, callTranscript, feedbackStyle);
      setCurrentCallHistoryId(historyId);

      setAppScreen('main');
      setActiveTab('results');
    } catch (err) {
      clearInterval(stageInterval);
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
        setAppScreen('main');
      }
    } finally {
      setIsAnalyzing(false);
      setLoadingStage(0);
    }
  };

  // Load call history entry
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadCallHistoryEntry = (entry: CallHistoryEntry) => {
    setCallResults(entry.results);
    setCallTranscript(entry.callTranscript);
    setFeedbackStyle(entry.feedbackStyle);
    setCurrentCallHistoryId(entry.id);
    setActiveTab('results');
    setShowHistoryPanel(false);
    setShowScoreBreakdown(false);
  };
  void loadCallHistoryEntry; // TODO: Use in call history panel

  // Generate HubSpot formatted text
  const generateHubSpotText = () => {
    if (!results) return '';

    const priorities = getTop3Priorities(results);
    const date = new Date().toLocaleDateString();
    const prospectName = getProspectName(prospectUrl);

    let text = `📊 DEMO ANALYSIS - ${prospectName} - ${date}\n\n`;
    text += `OVERALL: ${results.overallScore.toFixed(1)}/10\n\n`;

    if (hubSpotOptions.includeStrengths) {
      text += `✅ STRENGTHS:\n`;
      results.keyStrengths.slice(0, 3).forEach(s => {
        text += `• ${s}\n`;
      });
      text += '\n';
    }

    if (hubSpotOptions.includePriorities) {
      text += `🎯 PRIORITIES FOR NEXT DEMO:\n`;
      priorities.forEach((p, i) => {
        text += `${i + 1}. ${p.tip}\n`;
      });
      text += '\n';
    }

    if (hubSpotOptions.includeDetailedScores) {
      text += `📈 CATEGORY SCORES:\n`;
      results.categories.forEach(cat => {
        text += `• ${cat.name}: ${cat.score}/10\n`;
      });
      text += '\n';
    }

    if (hubSpotOptions.includeTranscriptQuotes) {
      text += `💬 KEY QUOTES:\n`;
      results.categories.slice(0, 3).forEach(cat => {
        if (cat.quotes && cat.quotes[0]) {
          text += `• "${cat.quotes[0].transcript.slice(0, 100)}..."\n`;
        }
      });
      text += '\n';
    }

    if (currentHistoryId) {
      text += `🔗 Full analysis: ${generateShareableLink(currentHistoryId)}`;
    }

    return text;
  };

  const handleCopyForHubSpot = async () => {
    const text = generateHubSpotText();
    const success = await copyToClipboard(text);
    if (success) {
      showToast('Copied for HubSpot!');
      setShowHubSpotModal(false);
    }
  };

  const handleShareWithManager = async () => {
    if (!results || !shareOptions.managerEmail) {
      setError('Please enter your manager\'s email');
      return;
    }

    const prospectName = getProspectName(prospectUrl);
    let emailBody = `Demo Analysis for ${prospectName}\n\n`;
    emailBody += `Overall Score: ${results.overallScore.toFixed(1)}/10 (Team avg: ${BENCHMARKS.teamAverage})\n\n`;

    if (shareOptions.note) {
      emailBody += `Note: ${shareOptions.note}\n\n`;
    }

    if (shareOptions.includePriorities) {
      emailBody += `My Priorities for Next Demo:\n`;
      getTop3Priorities(results).forEach((p, i) => {
        emailBody += `${i + 1}. ${p.tip}\n`;
      });
      emailBody += '\n';
    }

    if (shareOptions.includeFullAnalysis && currentHistoryId) {
      emailBody += `Full Analysis: ${generateShareableLink(currentHistoryId)}\n`;
    }

    const mailtoUrl = `mailto:${shareOptions.managerEmail}?subject=Demo Analysis: ${prospectName}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');

    showToast('Opening email client...');
    setShowShareModal(false);
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

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Shared Header Component
  const Header = () => (
    <div className="bg-sf-card border-b border-sf-border px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <button
          onClick={goToInput}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-sf-green rounded-lg flex items-center justify-center">
            {activeCoach === 'demo' ? (
              <Video className="w-6 h-6 text-sf-dark" />
            ) : (
              <Phone className="w-6 h-6 text-sf-dark" />
            )}
          </div>
          <span className="text-xl font-bold text-white">
            {activeCoach === 'demo' ? 'Demo Coach' : 'Call Coach'}
          </span>
        </button>
        <div className="flex items-center gap-4">
          {profile?.userName && (
            <span className="text-sm text-sf-muted">
              Hi, <span className="text-white">{profile.userName}</span>
            </span>
          )}
          <button
            onClick={goToSettings}
            className="p-2 text-sf-muted hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Analyzing Screen Component
  const AnalyzingScreen = () => {
    const wittyMessages = activeCoach === 'demo' ? DEMO_WITTY_MESSAGES : CALL_WITTY_MESSAGES;

    // Rotate witty messages every 3 seconds
    useEffect(() => {
      const messageInterval = setInterval(() => {
        setWittyMessageIndex(prev => (prev + 1) % wittyMessages.length);
      }, 3000);
      return () => clearInterval(messageInterval);
    }, [wittyMessages.length]);

    // Calculate progress percentage based on loading stage
    const progressPercent = Math.min(((loadingStage + 1) / LOADING_STAGES.length) * 85 + 10, 95);

    return (
      <div className="min-h-screen bg-sf-dark">
        <Header />
        <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-73px)]">
          <div className="max-w-md w-full text-center">
            {/* Pulsing Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-sf-green/20 rounded-full flex items-center justify-center animate-pulse-scale">
                <div className="w-16 h-16 bg-sf-green/30 rounded-full flex items-center justify-center">
                  {activeCoach === 'demo' ? (
                    <Video className="w-10 h-10 text-sf-green" />
                  ) : (
                    <Phone className="w-10 h-10 text-sf-green" />
                  )}
                </div>
              </div>
            </div>

            {/* Witty Message */}
            <div className="h-16 flex items-center justify-center mb-8">
              <p className="text-xl text-white font-medium transition-opacity duration-500">
                {wittyMessages[wittyMessageIndex]}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-3 bg-sf-input rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sf-green to-sf-green-dark rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
              <p className="text-sf-muted text-sm mt-2">{Math.round(progressPercent)}% complete</p>
            </div>

            {/* Stage Indicator */}
            <p className="text-sf-muted-dark text-sm mb-8">
              {LOADING_STAGES[loadingStage]}
            </p>

            {/* Cancel Button */}
            <button
              onClick={cancelAnalysis}
              className="px-6 py-3 bg-sf-input text-sf-muted font-medium rounded-xl hover:bg-sf-hover hover:text-white transition-all"
            >
              Cancel Analysis
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading while checking for profile
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-sf-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sf-green/30 border-t-sf-green rounded-full animate-spin" />
      </div>
    );
  }

  // Analyzing Screen
  if (appScreen === 'analyzing') {
    return <AnalyzingScreen />;
  }

  // Coach Selector Screen
  if (appScreen === 'coachSelect') {
    return (
      <div className="min-h-screen bg-sf-dark">
        <Header />
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-73px)]">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">What are you reviewing?</h1>
              <p className="text-sf-muted">Choose the type of call you want to analyze</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Demo Coach Card */}
              <button
                onClick={() => goToCoach('demo')}
                className="bg-sf-card rounded-2xl border border-sf-border p-8 text-left hover:border-sf-green/50 transition-all group"
              >
                <div className="w-16 h-16 bg-sf-green/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sf-green/30 transition-colors">
                  <Video className="w-8 h-8 text-sf-green" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Demo Coach</h2>
                <p className="text-sf-muted text-sm mb-4">
                  Analyze your product demos and get coaching on your presentation, discovery, and closing skills.
                </p>
                <div className="flex items-center gap-2 text-sf-green text-sm font-medium">
                  <span>For BDMs</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Call Coach Card */}
              <button
                onClick={() => goToCoach('call')}
                className="bg-sf-card rounded-2xl border border-sf-border p-8 text-left hover:border-sf-green/50 transition-all group"
              >
                <div className="w-16 h-16 bg-sf-green/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sf-green/30 transition-colors">
                  <Phone className="w-8 h-8 text-sf-green" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Call Coach</h2>
                <p className="text-sf-muted text-sm mb-4">
                  Analyze your cold calls and get coaching on your opener, discovery, objection handling, and close.
                </p>
                <div className="flex items-center gap-2 text-sf-green text-sm font-medium">
                  <span>For SDRs</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile Setup Screen
  if (appScreen === 'setup') {
    return (
      <div className="min-h-screen bg-sf-dark">
        <Header />
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-73px)]">
          <div className="w-full max-w-md">
            <div className="bg-sf-card rounded-2xl border border-sf-border p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-sf-green rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-sf-dark" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Set Up Your Profile</h1>
                  <p className="text-sm text-sf-muted">Let's personalize your coaching</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sf-muted-dark" />
                    <input
                      type="text"
                      value={setupUserName}
                      onChange={(e) => setSetupUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-sf-input border border-sf-border-light rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-sf-green focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sf-muted-dark" />
                    <input
                      type="text"
                      value={setupCompanyName}
                      onChange={(e) => setSetupCompanyName(e.target.value)}
                      placeholder="Enter your company name"
                      className="w-full bg-sf-input border border-sf-border-light rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-sf-green focus:border-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleContinueSetup}
                  disabled={!setupUserName.trim() || !setupCompanyName.trim()}
                  className="w-full py-3 bg-sf-green text-sf-dark font-semibold rounded-lg hover:bg-sf-green-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Coaching Style Selection Screen
  if (appScreen === 'style') {
    return (
      <div className="min-h-screen bg-sf-dark">
        <Header />
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-73px)]">
          <div className="w-full max-w-md">
            <div className="bg-sf-card rounded-2xl border border-sf-border p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-sf-green rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-sf-dark" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Choose Your Coaching Style</h1>
                  <p className="text-sm text-sf-muted">How do you like feedback?</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setFeedbackStyle('supportive')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    feedbackStyle === 'supportive'
                      ? 'border-sf-green bg-sf-green/10'
                      : 'border-sf-border-light bg-sf-input hover:border-sf-muted'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      feedbackStyle === 'supportive' ? 'border-sf-green' : 'border-sf-muted'
                    }`}>
                      {feedbackStyle === 'supportive' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-sf-green" />
                      )}
                    </div>
                    <span className="font-semibold text-white">Supportive</span>
                  </div>
                  <p className="text-sm text-sf-muted ml-8">
                    Encouraging tone, celebrates wins, gentle nudges
                  </p>
                </button>

                <button
                  onClick={() => setFeedbackStyle('direct')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    feedbackStyle === 'direct'
                      ? 'border-sf-green bg-sf-green/10'
                      : 'border-sf-border-light bg-sf-input hover:border-sf-muted'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      feedbackStyle === 'direct' ? 'border-sf-green' : 'border-sf-muted'
                    }`}>
                      {feedbackStyle === 'direct' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-sf-green" />
                      )}
                    </div>
                    <span className="font-semibold text-white">Direct</span>
                  </div>
                  <p className="text-sm text-sf-muted ml-8">
                    Straight to the point, no fluff, clear actions
                  </p>
                </button>
              </div>

              <p className="text-xs text-sf-muted-dark text-center mb-4">
                (You can change this anytime in Settings)
              </p>

              <button
                onClick={completeSetup}
                className="w-full py-3 bg-sf-green text-sf-dark font-semibold rounded-lg hover:bg-sf-green-dark transition-all flex items-center justify-center gap-2"
              >
                Start Analysing Demos
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Settings Screen
  if (appScreen === 'settings') {
    return (
      <div className="min-h-screen bg-sf-dark">
        <Header />
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sf-muted hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="bg-sf-card rounded-2xl border border-sf-border p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sf-muted-dark" />
                  <input
                    type="text"
                    value={settingsUserName}
                    onChange={(e) => setSettingsUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-sf-input border border-sf-border-light rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-sf-green focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sf-muted-dark" />
                  <input
                    type="text"
                    value={settingsCompanyName}
                    onChange={(e) => setSettingsCompanyName(e.target.value)}
                    placeholder="Enter your company name"
                    className="w-full bg-sf-input border border-sf-border-light rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-sf-green focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Coaching Style
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => setSettingsFeedbackStyle('supportive')}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      settingsFeedbackStyle === 'supportive'
                        ? 'border-sf-green bg-sf-green/10'
                        : 'border-sf-border-light bg-sf-input hover:border-sf-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settingsFeedbackStyle === 'supportive' ? 'border-sf-green' : 'border-sf-muted'
                      }`}>
                        {settingsFeedbackStyle === 'supportive' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-sf-green" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-white">Supportive</span>
                        <p className="text-sm text-sf-muted">Encouraging tone, celebrates wins</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSettingsFeedbackStyle('direct')}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      settingsFeedbackStyle === 'direct'
                        ? 'border-sf-green bg-sf-green/10'
                        : 'border-sf-border-light bg-sf-input hover:border-sf-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settingsFeedbackStyle === 'direct' ? 'border-sf-green' : 'border-sf-muted'
                      }`}>
                        {settingsFeedbackStyle === 'direct' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-sf-green" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-white">Direct</span>
                        <p className="text-sm text-sf-muted">Straight to the point, clear actions</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleSaveSettings}
                className="w-full py-3 bg-sf-green text-sf-dark font-semibold rounded-lg hover:bg-sf-green-dark transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-sf-dark text-gray-100 pb-24">
      <Toast message={toast.message} isVisible={toast.isVisible} onClose={hideToast} />

      {/* HubSpot Export Modal */}
      {showHubSpotModal && results && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowHubSpotModal(false)} />
          <div className="relative bg-sf-card rounded-2xl border border-sf-border w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-sf-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Copy for HubSpot</h2>
                <button onClick={() => setShowHubSpotModal(false)} className="text-sf-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-80 overflow-y-auto">
              <div className="bg-sf-input rounded-lg p-4 mb-4 font-mono text-xs text-gray-300 whitespace-pre-wrap">
                {generateHubSpotText()}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-sf-muted">Include:</p>
                {[
                  { key: 'includeStrengths', label: 'Strengths' },
                  { key: 'includePriorities', label: 'Priorities' },
                  { key: 'includeDetailedScores', label: 'Detailed scores' },
                  { key: 'includeTranscriptQuotes', label: 'Full transcript quotes' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hubSpotOptions[key as keyof HubSpotExportOptions]}
                      onChange={(e) => setHubSpotOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-sf-border-light bg-sf-input text-sf-green focus:ring-sf-green"
                    />
                    <span className="text-sm text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-sf-border">
              <button
                onClick={handleCopyForHubSpot}
                className="w-full py-3 bg-sf-green text-sf-dark font-semibold rounded-lg hover:bg-sf-green-dark transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share via Email Modal */}
      {showShareModal && results && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowShareModal(false)} />
          <div className="relative bg-sf-card rounded-2xl border border-sf-border w-full max-w-lg">
            <div className="p-6 border-b border-sf-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Share This Analysis</h2>
                <button onClick={() => setShowShareModal(false)} className="text-sf-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-sf-muted mt-1">Email a summary to your manager</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Manager's Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sf-muted-dark" />
                  <input
                    type="email"
                    value={shareOptions.managerEmail}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, managerEmail: e.target.value }))}
                    placeholder="manager@company.com"
                    className="w-full bg-sf-input border border-sf-border-light rounded-lg py-3 pl-10 pr-4 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-sf-green focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Add a note (optional)</label>
                <textarea
                  value={shareOptions.note}
                  onChange={(e) => setShareOptions(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Would love feedback on my discovery approach..."
                  className="w-full bg-sf-input border border-sf-border-light rounded-lg p-3 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-sf-green focus:border-transparent resize-none h-20"
                />
              </div>
              <div className="space-y-3">
                {[
                  { key: 'includePriorities', label: 'Include my priorities for next demo' },
                  { key: 'includeFullAnalysis', label: 'Include full detailed analysis' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareOptions[key as keyof ShareEmailOptions] as boolean}
                      onChange={(e) => setShareOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-sf-border-light bg-sf-input text-sf-green focus:ring-sf-green"
                    />
                    <span className="text-sm text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-sf-border">
              <button
                onClick={handleShareWithManager}
                disabled={!shareOptions.managerEmail}
                className="w-full py-3 bg-sf-green text-sf-dark font-semibold rounded-lg hover:bg-sf-green-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Header />

      {/* Enhanced History Panel */}
      {showHistoryPanel && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistoryPanel(false)} />
          <div className="relative ml-auto w-96 bg-sf-card border-l border-sf-border h-full overflow-y-auto">
            <div className="p-4 border-b border-sf-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sf-green" />
                  <h3 className="font-semibold text-white">Your {activeCoach === 'demo' ? 'Demo' : 'Call'} History</h3>
                </div>
                <button onClick={() => setShowHistoryPanel(false)} className="text-sf-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {groupedHistory.thisWeek.length > 0 && (
                <div className="bg-sf-input rounded-lg p-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-sf-muted">Weekly Average:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${getScoreColor(weeklyStats.thisWeekAvg)}`}>
                        {weeklyStats.thisWeekAvg.toFixed(1)}
                      </span>
                      {weeklyStats.trend !== 0 && (
                        <span className={`text-xs ${weeklyStats.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {weeklyStats.trend > 0 ? '↑' : '↓'} {Math.abs(weeklyStats.trend).toFixed(1)} from last week
                        </span>
                      )}
                    </div>
                  </div>
                  {weeklyStats.recurringThemes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-sf-border-light">
                      <div className="flex items-center gap-1 mb-1">
                        <Target className="w-3 h-3 text-sf-green" />
                        <span className="text-xs text-sf-muted">Recurring Theme:</span>
                      </div>
                      <p className="text-xs text-gray-300">
                        "{weeklyStats.recurringThemes[0].name}" flagged in {weeklyStats.recurringThemes[0].count}/{groupedHistory.thisWeek.length} demos
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 space-y-4">
              {history.length === 0 ? (
                <p className="text-sf-muted-dark text-sm text-center py-8">No previous analyses</p>
              ) : (
                <>
                  {groupedHistory.thisWeek.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-sf-muted-dark uppercase mb-2">This Week</h4>
                      <div className="space-y-2">
                        {groupedHistory.thisWeek.map((entry) => (
                          <div key={entry.id} className="bg-sf-input rounded-lg p-3 cursor-pointer hover:bg-sf-hover transition-colors group" onClick={() => loadHistoryEntry(entry)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-sf-muted-dark w-8">{getDayName(new Date(entry.date))}</span>
                                <span className="font-medium text-white">{entry.prospectName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${getScoreColor(entry.overallScore)}`}>{entry.overallScore.toFixed(1)}</span>
                                <button onClick={(e) => { e.stopPropagation(); loadHistoryEntry(entry); }} className="text-sf-muted hover:text-white"><Eye className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="opacity-0 group-hover:opacity-100 text-sf-muted hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {groupedHistory.lastWeek.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-sf-muted-dark uppercase mb-2">Last Week</h4>
                      <div className="space-y-2">
                        {groupedHistory.lastWeek.map((entry) => (
                          <div key={entry.id} className="bg-sf-input rounded-lg p-3 cursor-pointer hover:bg-sf-hover transition-colors group" onClick={() => loadHistoryEntry(entry)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-sf-muted-dark w-8">{getDayName(new Date(entry.date))}</span>
                                <span className="font-medium text-white">{entry.prospectName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${getScoreColor(entry.overallScore)}`}>{entry.overallScore.toFixed(1)}</span>
                                <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="opacity-0 group-hover:opacity-100 text-sf-muted hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {groupedHistory.older.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-sf-muted-dark uppercase mb-2">Earlier</h4>
                      <div className="space-y-2">
                        {groupedHistory.older.map((entry) => (
                          <div key={entry.id} className="bg-sf-input rounded-lg p-3 cursor-pointer hover:bg-sf-hover transition-colors group" onClick={() => loadHistoryEntry(entry)}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-white">{entry.prospectName}</p>
                                <p className="text-xs text-sf-muted-dark">{new Date(entry.date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${getScoreColor(entry.overallScore)}`}>{entry.overallScore.toFixed(1)}</span>
                                <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="opacity-0 group-hover:opacity-100 text-sf-muted hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {history.length > 0 && (
                    <button onClick={clearHistory} className="w-full py-2 text-red-400 hover:text-red-300 text-sm border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors">Clear All History</button>
                  )}
                </>
              )}
              <button onClick={() => { setShowHistoryPanel(false); setActiveTab('input'); }} className="w-full py-3 bg-sf-green text-sf-dark font-semibold rounded-lg hover:bg-sf-green-dark transition-all">Analyse New Demo</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-sf-border px-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('input')} className={`py-3 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'input' ? 'border-sf-green text-sf-green' : 'border-transparent text-sf-muted hover:text-white'}`}>Input</button>
            <button onClick={() => setActiveTab('results')} disabled={!results} className={`py-3 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'results' ? 'border-sf-green text-sf-green' : 'border-transparent text-sf-muted hover:text-white disabled:opacity-50'}`}>Results</button>
          </div>
          <button onClick={() => setShowHistoryPanel(!showHistoryPanel)} className="relative p-2 text-sf-muted hover:text-white transition-colors" title="History">
            <History className="w-5 h-5" />
            {history.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-sf-green rounded-full text-xs flex items-center justify-center text-sf-dark font-bold">{history.length}</span>}
          </button>
        </div>
      </div>

      {/* Profile Context - Input Tab */}
      {activeTab === 'input' && profile && (
        <div className="px-6 py-3 border-b border-sf-border">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm text-sf-muted">
              Analysing as <span className="text-white">{profile.userName}</span> from <span className="text-white">{profile.companyName}</span>
              <button onClick={goToSettings} className="ml-2 text-sf-green hover:text-sf-green-dark underline">Edit</button>
            </p>
          </div>
        </div>
      )}

      <div className="p-6 max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300"><X className="w-5 h-5" /></button>
          </div>
        )}

        {activeTab === 'input' && activeCoach === 'demo' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={loadSampleData} className="text-sm text-sf-green hover:text-sf-green-dark flex items-center gap-1">
                <Info className="w-4 h-4" />
                Try with sample demo
              </button>
            </div>

            {/* Demo Transcript */}
            <div className={`bg-sf-card rounded-xl border ${isDragOver ? 'border-sf-green bg-sf-green/5' : 'border-sf-border'} p-6 transition-colors`} onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sf-green/20 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-sf-green" /></div>
                  <div>
                    <h2 className="font-semibold text-white">Demo Transcript <span className="text-red-400">*</span></h2>
                    <p className="text-sm text-sf-muted">Required - paste or drag & drop</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-sf-muted-dark"><Upload className="w-4 h-4" />.txt, .vtt, .srt</div>
              </div>
              <textarea value={demoTranscript} onChange={(e) => setDemoTranscript(e.target.value)} placeholder={`Paste your demo transcript here...\n\nExample:\n00:03:13 Russell: Hello, how are you?`} className="w-full h-48 bg-sf-input border border-sf-border-light rounded-lg p-4 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-sf-green focus:border-transparent resize-none font-mono text-sm" />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-sf-muted-dark">{demoTranscript.length > 0 ? `${demoTranscript.split('\n').length} lines` : 'No transcript loaded'}</span>
              </div>
            </div>

            {/* Prospect URL */}
            <div className="bg-sf-card rounded-xl border border-sf-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-sf-purple/20 rounded-lg flex items-center justify-center"><Globe className="w-4 h-4 text-sf-purple" /></div>
                <div>
                  <h2 className="font-semibold text-white">Prospect Website <span className="text-red-400">*</span></h2>
                  <p className="text-sm text-sf-muted">Required - used to assess personalisation</p>
                </div>
              </div>
              <div className="relative">
                <input type="url" value={prospectUrl} onChange={(e) => setProspectUrl(e.target.value)} placeholder="https://www.prospect-website.com" className="w-full bg-sf-input border border-sf-border-light rounded-lg p-4 pr-10 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-sf-purple focus:border-transparent text-sm" />
                {prospectUrl && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidUrl(prospectUrl) ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                  </div>
                )}
              </div>
            </div>

            {/* SDR Transcript */}
            <div className="bg-sf-card rounded-xl border border-sf-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center"><MessageSquare className="w-4 h-4 text-blue-500" /></div>
                <div>
                  <h2 className="font-semibold text-white">SDR Discovery Call</h2>
                  <p className="text-sm text-sf-muted">Optional - helps assess discovery continuation</p>
                </div>
              </div>
              <textarea value={sdrTranscript} onChange={(e) => setSdrTranscript(e.target.value)} placeholder="Paste the SDR's initial call transcript here (optional)..." className="w-full h-32 bg-sf-input border border-sf-border-light rounded-lg p-4 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm" />
            </div>

            {/* Analyze Button */}
            <button onClick={handleAnalyze} disabled={!demoTranscript.trim() || !prospectUrl.trim() || isAnalyzing} className="w-full py-4 bg-sf-green text-sf-dark font-semibold rounded-xl hover:bg-sf-green-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-sf-dark/30 border-t-sf-dark rounded-full animate-spin" /><span>{LOADING_STAGES[loadingStage]}</span></div>
                  <span className="text-xs text-sf-dark/70">Usually takes 30-60 seconds</span>
                </div>
              ) : (
                <><Send className="w-5 h-5" />Analyze Demo</>
              )}
            </button>
            {isAnalyzing && <button onClick={cancelAnalysis} className="w-full py-3 bg-sf-input text-gray-300 font-medium rounded-xl hover:bg-sf-hover transition-all">Cancel</button>}
          </div>
        )}

        {/* Call Coach Input */}
        {activeTab === 'input' && activeCoach === 'call' && (
          <div className="space-y-6">
            {/* Call Transcript */}
            <div className={`bg-sf-card rounded-xl border ${isDragOver ? 'border-sf-green bg-sf-green/5' : 'border-sf-border'} p-6 transition-colors`} onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sf-green/20 rounded-lg flex items-center justify-center"><Phone className="w-4 h-4 text-sf-green" /></div>
                  <div>
                    <h2 className="font-semibold text-white">Call Transcript <span className="text-red-400">*</span></h2>
                    <p className="text-sm text-sf-muted">Required - paste your cold call transcript</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-sf-muted-dark"><Upload className="w-4 h-4" />.txt, .vtt, .srt</div>
              </div>
              <textarea value={callTranscript} onChange={(e) => setCallTranscript(e.target.value)} placeholder={`Paste your cold call transcript here...\n\nExample:\n00:00:05 SDR: Hi, is this Sarah?\n00:00:07 Prospect: Yes, who's calling?`} className="w-full h-64 bg-sf-input border border-sf-border-light rounded-lg p-4 text-gray-100 placeholder-sf-muted-dark focus:outline-none focus:ring-2 focus:ring-sf-green focus:border-transparent resize-none font-mono text-sm" />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-sf-muted-dark">{callTranscript.length > 0 ? `${callTranscript.split('\n').length} lines` : 'No transcript loaded'}</span>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-sf-card rounded-xl border border-sf-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-sf-purple/20 rounded-lg flex items-center justify-center"><Sparkles className="w-4 h-4 text-sf-purple" /></div>
                <div>
                  <h2 className="font-semibold text-white">What we'll analyze</h2>
                  <p className="text-sm text-sf-muted">10 key areas of your cold call</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-sf-muted">
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Gatekeeper Handling</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Permission-based Opener</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Personalisation</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Discovery Questions</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Qualifying</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Call Control</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Tone & Energy</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Value Proposition</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Objection Handling</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-sf-green" />Close & Next Steps</div>
              </div>
            </div>

            {/* Analyze Button */}
            <button onClick={handleAnalyzeCall} disabled={!callTranscript.trim() || isAnalyzing} className="w-full py-4 bg-sf-green text-sf-dark font-semibold rounded-xl hover:bg-sf-green-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-sf-dark/30 border-t-sf-dark rounded-full animate-spin" /><span>{LOADING_STAGES[loadingStage]}</span></div>
                  <span className="text-xs text-sf-dark/70">Usually takes 30-60 seconds</span>
                </div>
              ) : (
                <><Send className="w-5 h-5" />Analyze Call</>
              )}
            </button>
            {isAnalyzing && <button onClick={cancelAnalysis} className="w-full py-3 bg-sf-input text-gray-300 font-medium rounded-xl hover:bg-sf-hover transition-all">Cancel</button>}
          </div>
        )}

        {activeTab === 'results' && currentResults && (
          <div className="space-y-6">
            {/* Quick Win Summary */}
            <div className="bg-gradient-to-r from-sf-green/10 to-sf-purple/10 border border-sf-green/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-sf-green rounded-xl flex items-center justify-center flex-shrink-0"><Sparkles className="w-6 h-6 text-sf-dark" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-white">Quick Summary</h2>
                    <div className={`text-3xl font-bold ${getScoreColor(currentResults.overallScore)}`}>{currentResults.overallScore.toFixed(1)}<span className="text-lg text-sf-muted-dark">/10</span></div>
                  </div>
                  <p className="text-gray-200 text-lg">{generateQuickWinSummary(currentResults)}</p>
                  <p className="text-xs text-sf-muted-dark mt-2">Team average: {BENCHMARKS.teamAverage} | Top performers: {BENCHMARKS.topPerformers}+</p>
                </div>
              </div>
            </div>

            {/* 3 Priorities */}
            <div className="bg-sf-card rounded-xl border border-sf-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-sf-green" />
                <h2 className="text-lg font-semibold text-white">Your 3 Priorities for Next {activeCoach === 'demo' ? 'Demo' : 'Call'}</h2>
              </div>
              <div className="space-y-4">
                {getTop3Priorities(currentResults).map((priority, idx) => (
                  <div key={idx} className="bg-sf-input rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-6 h-6 bg-sf-green rounded-full flex items-center justify-center text-sf-dark text-sm font-bold flex-shrink-0">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{priority.category}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreLabel(priority.score).color}`}>{priority.score}/10</span>
                          </div>
                          <p className="text-sm text-gray-300">{priority.tip}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleCopyTip(priority.tip)} className="p-2 text-sf-muted hover:text-white hover:bg-sf-hover rounded-lg transition-colors" title="Copy"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => handleAddToHubSpot(priority.category, priority.tip)} className="p-2 text-sf-muted hover:text-sf-green hover:bg-sf-green/10 rounded-lg transition-colors" title="Copy for HubSpot"><Link className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-sf-card rounded-xl border border-sf-border overflow-hidden">
              <button onClick={() => setShowScoreBreakdown(!showScoreBreakdown)} className="w-full p-4 flex items-center justify-between hover:bg-sf-input/50 transition-colors">
                <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-sf-muted" /><span className="font-medium text-white">See detailed scores</span></div>
                {showScoreBreakdown ? <ChevronUp className="w-5 h-5 text-sf-muted" /> : <ChevronDown className="w-5 h-5 text-sf-muted" />}
              </button>
              {showScoreBreakdown && (
                <div className="p-6 pt-0 border-t border-sf-border">
                  <div className="grid grid-cols-7 gap-2 mt-4">
                    {currentResults.categories.map((cat, idx) => (
                      <div key={idx} className="text-center">
                        <div className="h-24 bg-sf-input rounded-lg relative overflow-hidden">
                          <div className={`absolute bottom-0 left-0 right-0 transition-all ${getScoreBarColor(cat.score)}`} style={{ height: `${cat.score * 10}%` }} />
                        </div>
                        <p className="text-xs text-sf-muted mt-2 truncate" title={cat.name}>{cat.name.split(' ')[0]}</p>
                        <p className={`text-sm font-semibold ${getScoreColor(cat.score)}`}>{cat.score}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-sf-input rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-500" /><h3 className="font-medium text-white text-sm">Key Strengths</h3></div>
                      <ul className="space-y-1">{currentResults.keyStrengths.slice(0, 3).map((s, i) => <li key={i} className="text-xs text-gray-300 flex items-start gap-1"><span className="text-green-500">•</span>{s}</li>)}</ul>
                    </div>
                    <div className="bg-sf-input rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-sf-green" /><h3 className="font-medium text-white text-sm">Areas to Improve</h3></div>
                      <ul className="space-y-1">{currentResults.priorityImprovements.slice(0, 3).map((s, i) => <li key={i} className="text-xs text-gray-300 flex items-start gap-1"><span className="text-sf-green">{i + 1}.</span>{s}</li>)}</ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Analysis */}
            <div className="space-y-3">
              <div className="sticky top-0 z-10 bg-sf-dark py-3 -mx-6 px-6">
                <h3 className="text-lg font-semibold text-white mb-2">Detailed Analysis</h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {currentResults.categories.map((cat, idx) => (
                    <button key={idx} onClick={() => scrollToCategory(idx)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeNavSection === idx ? 'bg-sf-green text-sf-dark' : 'bg-sf-input text-sf-muted hover:text-white'}`}>{cat.name.split(' ')[0]}</button>
                  ))}
                </div>
              </div>
              {currentResults.categories.map((category, idx) => (
                <div key={idx} ref={(el) => { categoryRefs.current[idx] = el; }} className="bg-sf-card rounded-xl border border-sf-border overflow-hidden">
                  <button onClick={() => toggleSection(idx)} className="w-full p-4 flex items-center justify-between hover:bg-sf-input/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getScoreBg(category.score)}`}><IconComponent name={getCategoryIcon(category.name)} /></div>
                      <div className="text-left">
                        <div className="flex items-center gap-2"><h4 className="font-medium text-white">{category.name}</h4><span className={`text-xs px-2 py-0.5 rounded-full ${getScoreLabel(category.score).color}`}>{getScoreLabel(category.score).text}</span></div>
                        <p className="text-sm text-sf-muted">{category.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>{category.score}/10</span>
                      {expandedSections[idx] ? <ChevronUp className="w-5 h-5 text-sf-muted" /> : <ChevronDown className="w-5 h-5 text-sf-muted" />}
                    </div>
                  </button>
                  {expandedSections[idx] && (
                    <div className="px-4 pb-4 space-y-4 border-t border-sf-border pt-4">
                      {category.quotes && category.quotes.map((quote, qIdx) => {
                        const timestamp = parseTimestamp(quote.transcript);
                        return (
                          <div key={qIdx} className="bg-sf-input rounded-lg p-4">
                            <div className="flex gap-2 mb-2 items-center">
                              <span className="text-xs font-medium text-sf-muted-dark uppercase">From transcript:</span>
                              {timestamp && <span className="text-xs bg-sf-border-light text-gray-300 px-2 py-0.5 rounded font-mono">{timestamp}</span>}
                            </div>
                            <p className="text-sm text-gray-300 italic border-l-2 border-sf-border-light pl-3 mb-2">"{quote.transcript}"</p>
                            {quote.correctedTranscript && quote.correctedTranscript !== quote.transcript && (
                              <div className="text-xs text-sf-muted border-l-2 border-sf-green/30 pl-3 mb-3 py-1">
                                <span className="text-sf-green">Likely said:</span> "{quote.correctedTranscript}"
                              </div>
                            )}
                            <div className="flex gap-2 mb-2"><span className="text-xs font-medium text-sf-green uppercase">Coaching:</span></div>
                            <p className="text-sm text-gray-200">{quote.feedback}</p>
                          </div>
                        );
                      })}
                      {category.objections && category.objections.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium text-sf-muted uppercase">Objections Identified</h5>
                          {category.objections.map((obj, oIdx) => (
                            <div key={oIdx} className="bg-sf-input rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-red-400"><AlertTriangle className="w-4 h-4 inline mr-1" />{obj.objection}</span>
                                <span className={`text-sm font-bold ${getScoreColor(obj.score)}`}>{obj.score}/10</span>
                              </div>
                              <p className="text-sm text-sf-muted mb-2"><span className="text-sf-muted-dark">Handling:</span> {obj.handling}</p>
                              <p className="text-sm text-gray-200">{obj.feedback}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {category.nextDemo && (
                        <div className="bg-sf-green/10 border border-sf-green/30 rounded-lg p-4 relative">
                          <button onClick={() => handleCopyTip(category.nextDemo)} className="absolute top-3 right-3 p-1.5 text-sf-green hover:text-sf-green-dark hover:bg-sf-green/20 rounded transition-colors" title="Copy tip"><Copy className="w-4 h-4" /></button>
                          <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-sf-green" /><span className="text-sm font-medium text-sf-green">Next Demo, Try This:</span></div>
                          <p className="text-sm text-gray-200 pr-8">{category.nextDemo}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={goToInput} className="w-full py-3 bg-sf-input text-gray-300 font-medium rounded-xl hover:bg-sf-hover transition-all">← Analyze Another Demo</button>
          </div>
        )}
      </div>

      {/* Sticky Export Footer */}
      {activeTab === 'results' && currentResults && (
        <div className="fixed bottom-0 left-0 right-0 bg-sf-card border-t border-sf-border p-4 z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="text-sm text-sf-muted">
              Logged as <span className="text-white">{profile?.userName}</span>
              <button onClick={goToSettings} className="ml-2 text-sf-green hover:text-sf-green-dark">Edit profile</button>
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowHubSpotModal(true)} className="px-4 py-2.5 bg-sf-input text-gray-200 font-medium rounded-lg hover:bg-sf-hover transition-all flex items-center gap-2"><Copy className="w-4 h-4" />Copy for HubSpot</button>
              <button onClick={() => setShowShareModal(true)} className="px-4 py-2.5 bg-sf-input text-gray-200 font-medium rounded-lg hover:bg-sf-hover transition-all flex items-center gap-2"><Share2 className="w-4 h-4" />Share with Manager</button>
              <button onClick={handleDownloadPDF} className="px-4 py-2.5 bg-sf-green text-sf-dark font-medium rounded-lg hover:bg-sf-green-dark transition-all flex items-center gap-2"><FileDown className="w-4 h-4" />Save PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

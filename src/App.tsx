import React, { useState, useEffect, useRef } from 'react';
import { 
  Map, 
  BarChart3, 
  Heart, 
  Settings, 
  Mic, 
  Bell, 
  Search, 
  Navigation, 
  Plus, 
  Minus, 
  Layers, 
  Shield, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  Maximize2,
  Trash2,
  Save,
  AlertTriangle,
  TrendingUp,
  Download,
  ExternalLink,
  MessageSquare,
  X,
  Send,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse, searchUrbanZones, generateSonicImage } from './lib/gemini';
import { cn } from './lib/utils';

// --- Types ---
type Screen = 'live-map' | 'analytics' | 'contributions' | 'recording';

// --- Mock Data ---
const TEMPORAL_DATA = [
  { time: '06:00', day: 40, night: 20 },
  { time: '09:00', day: 55, night: 25 },
  { time: '12:00', day: 75, night: 35 },
  { time: '15:00', day: 90, night: 45 },
  { time: '18:00', day: 80, night: 40 },
  { time: '21:00', day: 60, night: 30 },
  { time: '00:00', day: 50, night: 20 },
];

const MICRO_SEGMENTS = [
  { id: 'PX-742-N', mean: 74.2, reliability: 98.2, status: 'CRITICAL', color: '#ff1e56' },
  { id: 'PX-118-S', mean: 58.1, reliability: 94.5, status: 'ELEVATED', color: '#ffb2b7' },
  { id: 'PX-909-W', mean: 42.0, reliability: 89.1, status: 'OPTIMAL', color: '#00e475' },
  { id: 'PX-332-E', mean: 62.5, reliability: 96.7, status: 'MODERATE', color: '#ffb2b7' },
];

// --- Components ---

const Sidebar = ({ currentScreen, setScreen }: { currentScreen: Screen, setScreen: (s: Screen) => void }) => {
  const navItems = [
    { id: 'live-map', label: 'Global Heatmap', icon: Map },
    { id: 'analytics', label: 'Acoustic Trends', icon: BarChart3 },
    { id: 'contributions', label: 'Health Impact', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col h-full w-64 bg-[#171f33] py-8 shadow-2xl shadow-black/50 shrink-0 z-40">
      <div className="px-6 mb-10">
        <div className="text-lg font-black text-[#ff1e56] uppercase tracking-widest font-headline">Sonic Intel</div>
        <div className="text-xs text-tertiary font-medium flex items-center mt-1">
          <span className="w-2 h-2 rounded-full bg-tertiary mr-2 animate-pulse"></span>
          68dB - High Activity
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.id !== 'settings' && setScreen(item.id as Screen)}
            className={cn(
              "w-full flex items-center space-x-4 px-6 py-3 transition-all duration-200 rounded-lg mx-2 max-w-[calc(100%-1rem)]",
              currentScreen === item.id 
                ? "bg-[#2d3449] text-[#00e475]" 
                : "text-slate-400 hover:bg-[#2d3449]/50 hover:translate-x-1"
            )}
          >
            <item.icon className={cn("w-5 h-5", currentScreen === item.id && "fill-current")} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-4 mt-auto space-y-4">
        <div className="bg-surface-container-highest/30 p-4 rounded-xl border border-outline-variant/10">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Quarterly Report</p>
          <button className="w-full text-xs font-bold py-2 bg-surface-container-highest text-primary rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
            View WHO Report
          </button>
        </div>
        <div className="flex justify-between px-2 pb-2">
          <button className="text-xs text-slate-500 hover:text-white flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Privacy</span>
          </button>
          <button className="text-xs text-slate-500 hover:text-white flex items-center space-x-1">
            <HelpCircle className="w-3 h-3" />
            <span>Support</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

const Header = ({ onStartRecording }: { onStartRecording: () => void }) => {
  return (
    <header className="fixed top-0 z-50 w-full bg-[#0b1326]/60 backdrop-blur-xl shadow-[0_20px_40px_rgba(6,14,32,0.4)] flex justify-between items-center px-6 py-4">
      <div className="text-2xl font-bold tracking-tighter text-[#ff1e56] font-headline">NoiseMap</div>
      <nav className="hidden md:flex items-center space-x-8">
        <button className="text-slate-400 font-medium hover:text-white transition-colors duration-300">Live Map</button>
        <button className="text-slate-400 font-medium hover:text-white transition-colors duration-300">Analytics</button>
        <button className="text-[#ffb2b7] border-b-2 border-[#ff1e56] pb-1 font-medium">Contributions</button>
      </nav>
      <div className="flex items-center space-x-6">
        <Bell className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
        <div className="flex items-center space-x-3 bg-surface-container-highest/40 pl-1 pr-4 py-1 rounded-full group cursor-pointer border border-outline-variant/10">
          <img 
            alt="User profile avatar" 
            className="w-8 h-8 rounded-full object-cover border border-primary/20" 
            src="https://picsum.photos/seed/explorer/100/100"
            referrerPolicy="no-referrer"
          />
          <span className="text-sm font-semibold font-headline tracking-wide uppercase group-hover:text-primary transition-colors">Explorer_04</span>
        </div>
        <button 
          onClick={onStartRecording}
          className="bg-gradient-to-br from-[#ffb2b7] to-[#ff506b] text-white px-5 py-2 rounded-lg font-bold text-sm active:scale-95 duration-150 shadow-lg shadow-primary/20"
        >
          Start Recording
        </button>
      </div>
    </header>
  );
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      if (userMsg.toLowerCase().includes('generate image') || userMsg.toLowerCase().includes('show me a picture')) {
        const imageUrl = await generateSonicImage(userMsg);
        if (imageUrl) {
          setMessages(prev => [...prev, { role: 'model', content: `Here is a sonic visualization based on your request: \n\n![Generated Image](${imageUrl})` }]);
        } else {
          setMessages(prev => [...prev, { role: 'model', content: "I couldn't generate an image at this time." }]);
        }
      } else {
        const response = await getGeminiResponse(userMsg, messages);
        setMessages(prev => [...prev, { role: 'model', content: response }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-[#171f33] border border-white/10 w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0b1326]/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00e475] animate-pulse" />
                <span className="font-headline font-bold text-sm uppercase tracking-widest">Sonic Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm mt-10">
                  Ask me anything about urban noise, health impacts, or sonic data.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-surface-container-highest text-on-surface rounded-tl-none"
                  )}>
                    <div className="markdown-body prose prose-invert prose-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-container-highest p-3 rounded-2xl rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-[#0b1326] border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="bg-primary p-2 rounded-xl text-white hover:opacity-90 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-105 transition-transform"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

const LiveMapScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await searchUrbanZones(searchQuery);
      setSearchResults(result);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 relative overflow-hidden bg-surface-container-lowest">
      <div className="absolute inset-0 z-0">
        <img 
          alt="London city map overview" 
          className="w-full h-full object-cover grayscale opacity-40" 
          src="https://picsum.photos/seed/london-map/1920/1080"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,30,86,0.4)_0%,transparent_40%),radial-gradient(circle_at_70%_60%,rgba(255,178,183,0.3)_0%,transparent_35%),radial-gradient(circle_at_50%_20%,rgba(0,228,117,0.2)_0%,transparent_30%)] pointer-events-none" />
      </div>

      {/* Search Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <div className="relative group">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search urban zones (e.g., 'Quiet parks in London')"
            className="w-full bg-[#171f33]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 pr-12 text-sm shadow-2xl focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button 
            onClick={handleSearch}
            disabled={isSearching}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {searchResults && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 bg-[#171f33]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl max-h-60 overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Zone Insights</h3>
                <button onClick={() => setSearchResults(null)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">{searchResults.text}</p>
              {searchResults.grounding && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sources</p>
                  {searchResults.grounding.map((chunk: any, i: number) => (
                    chunk.web && (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-tertiary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {chunk.web.title}
                      </a>
                    )
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="absolute top-6 left-6 w-80 z-10 space-y-6 pointer-events-none">
        <div className="bg-[#2d3449]/60 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/5 pointer-events-auto">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#ff1e56] mb-6 flex items-center justify-between">
            Live Insights
            <span className="inline-block w-2 h-2 rounded-full bg-error animate-pulse"></span>
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Trending Hotspots</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Piccadilly Circus</span>
                    <span className="text-[10px] text-slate-500">Construction Activity</span>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-error-container text-on-error-container text-[10px] font-black">84dB</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Waterloo Station</span>
                    <span className="text-[10px] text-slate-500">Commuter Peak</span>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-secondary-container text-on-secondary-container text-[10px] font-black">71dB</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Reports</p>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container overflow-hidden">
                    <img alt="User avatar" src={`https://picsum.photos/seed/user${i}/100/100`} referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container flex items-center justify-center text-[10px] font-bold text-slate-300">
                  +12
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">12 volunteers contributing live data in this sector.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#2d3449]/60 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/5 pointer-events-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00e475] mb-3">Weekly Digest</p>
          <div className="flex items-end justify-between gap-1 h-12">
            {[40, 65, 100, 35, 55, 45, 60].map((h, i) => (
              <div key={i} className={cn("w-full rounded-t-sm", i === 2 ? "bg-[#ffb2b7]" : "bg-[#00e475]/20")} style={{ height: `${h}%` }}></div>
            ))}
          </div>
          <p className="text-xs text-on-surface-variant mt-3">Noise levels are <span className="text-[#00e475] font-bold">12% lower</span> than last week.</p>
        </div>
      </section>

      <section className="absolute bottom-6 right-6 z-10 pointer-events-auto">
        <div className="bg-[#2d3449]/60 backdrop-blur-xl p-4 rounded-xl border border-white/5 shadow-xl min-w-[180px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Heatmap Legend</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_rgba(255,30,86,0.6)]"></div>
              <span className="text-xs font-medium text-slate-300">Hazardous (&gt;75dB)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(255,178,183,0.4)]"></div>
              <span className="text-xs font-medium text-slate-300">Active (55-75dB)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-tertiary shadow-[0_0_8px_rgba(0,228,117,0.4)]"></div>
              <span className="text-xs font-medium text-slate-300">Quiet (&lt;55dB)</span>
            </div>
          </div>
        </div>
      </section>

      <section className="absolute top-6 right-6 z-10 flex flex-col gap-3 pointer-events-auto">
        {[Navigation, Plus, Minus, Layers].map((Icon, i) => (
          <button key={i} className="w-10 h-10 bg-[#2d3449]/60 backdrop-blur-xl flex items-center justify-center rounded-lg border border-white/5 text-slate-300 hover:text-white transition-all">
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </section>
    </div>
  );
};

const AnalyticsScreen = () => {
  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface no-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-[500px] rounded-xl overflow-hidden relative shadow-2xl border border-white/5 group">
          <div className="absolute inset-0 bg-cover bg-center grayscale-[0.5] contrast-[1.2]" style={{ backgroundImage: "url('https://picsum.photos/seed/london-aerial/1200/800')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary/20 animate-ping"></div>
              <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/40"></div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 bg-[#2d3449]/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Live Prediction</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black font-headline">71</span>
                  <span className="text-sm font-medium text-slate-400 mb-1">dB</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-error font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  High Impact at 2pm
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 bg-[#2d3449]/60 backdrop-blur-xl p-4 rounded-xl border border-white/10">
            <h4 className="text-xs font-bold text-white mb-3">Hotspot Prediction Grid</h4>
            <div className="grid grid-cols-4 gap-1">
              <div className="h-10 w-10 bg-tertiary-container/40 rounded flex items-center justify-center text-[10px] text-tertiary font-bold">42</div>
              <div className="h-10 w-10 bg-primary-container/20 rounded flex items-center justify-center text-[10px] text-primary font-bold">58</div>
              <div className="h-10 w-10 bg-primary-container/60 rounded flex items-center justify-center text-[10px] text-white font-bold">72</div>
              <div className="h-10 w-10 bg-error-container/80 rounded flex items-center justify-center text-[10px] text-white font-bold">89</div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 italic">ML-generated unsampled areas</p>
          </div>
          <div className="absolute top-6 left-6 bg-surface-container p-3 rounded-lg border border-white/5 flex items-center gap-3">
            <Mic className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs font-bold text-white leading-none">Click-to-Predict</p>
              <p className="text-[10px] text-slate-400">Sample any point on the grid</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-error-container/20 border border-error/20 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-error opacity-10">
              <AlertTriangle className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-error fill-current" />
              <h3 className="font-headline font-bold text-error uppercase tracking-wider text-sm">WHO Health Alert</h3>
            </div>
            <p className="text-2xl font-black mb-2 text-on-error-container">Critical Noise Zone</p>
            <p className="text-sm text-on-error-container/70 leading-relaxed mb-6">Current levels exceed 65dB threshold for extended exposure. Elevated risk of cognitive stress and cardiovascular strain.</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-error-container/40 p-3 rounded-lg border border-error/10">
                <Mic className="w-4 h-4 text-error" />
                <span className="text-xs font-medium text-on-error-container">Wear hearing protection</span>
              </div>
              <div className="flex items-center gap-3 bg-error-container/40 p-3 rounded-lg border border-error/10">
                <X className="w-4 h-4 text-error" />
                <span className="text-xs font-medium text-on-error-container">Avoid this area during peak hours</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Zone Statistics</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface/70">Population Exposed</span>
                <span className="text-sm font-bold">12.4k</span>
              </div>
              <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[75%]"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface/70">Primary Source</span>
                <span className="text-sm font-bold text-primary">Traffic (T1)</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-on-surface/70">Predicted Trend</span>
                <span className="flex items-center text-error text-xs font-bold">
                  +4.2% Increase <TrendingUp className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container rounded-xl p-6 border border-white/5">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-headline text-xl font-bold">Sonic Temporal Variance</h3>
              <p className="text-xs text-slate-400">Daytime vs. Nighttime noise patterns (24h Window)</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-[10px] text-slate-400">Day</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span className="text-[10px] text-slate-400">Night</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TEMPORAL_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171f33', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="day" fill="#ffb2b7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="night" fill="#adcbda" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-xl font-bold">Predictive Micro-Segments</h3>
            <button className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
              Export Dataset <Download className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-white/5">
                  <th className="pb-3 font-medium uppercase text-[10px] tracking-widest">Sector ID</th>
                  <th className="pb-3 font-medium uppercase text-[10px] tracking-widest">Mean dB</th>
                  <th className="pb-3 font-medium uppercase text-[10px] tracking-widest">Reliability</th>
                  <th className="pb-3 font-medium uppercase text-[10px] tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MICRO_SEGMENTS.map((seg) => (
                  <tr key={seg.id}>
                    <td className="py-4 font-mono font-medium text-white">{seg.id}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }}></span>
                        {seg.mean} dB
                      </div>
                    </td>
                    <td className="py-4 text-slate-400">{seg.reliability}%</td>
                    <td className="py-4 text-right">
                      <span className={cn(
                        "text-[10px] px-2 py-1 rounded font-bold",
                        seg.status === 'CRITICAL' ? "bg-error/10 text-error" : 
                        seg.status === 'OPTIMAL' ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"
                      )}>
                        {seg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Model Confidence', val: '0.974', desc: 'Correlation with ground-truth sensors', color: 'text-primary' },
          { label: 'Urban Quietness Index', val: '64.2%', desc: 'Zones within WHO recommended limits', color: 'text-tertiary' },
          { label: 'Sensor Mesh Density', val: '12/km²', desc: 'Active acoustic nodes in grid', color: 'text-secondary' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-variant/40 rounded-xl p-6 flex flex-col justify-center border border-white/5">
            <span className={cn(stat.color, "text-xs font-bold uppercase tracking-widest mb-2")}>{stat.label}</span>
            <div className="text-4xl font-black font-headline tracking-tighter">{stat.val}</div>
            <p className="text-[10px] text-slate-400 mt-2">{stat.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
};

const ContributionsScreen = () => {
  return (
    <main className="flex-1 overflow-y-auto bg-background p-6 lg:p-10 no-scrollbar">
      <section className="mb-12 flex flex-col md:flex-row items-center md:items-end gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-surface-container-highest shadow-2xl">
            <img alt="User profile avatar" className="w-full h-full object-cover" src="https://picsum.photos/seed/alex/300/300" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute -bottom-3 -right-3 bg-tertiary text-on-tertiary p-2 rounded-xl shadow-lg flex items-center space-x-1 border-2 border-background">
            <CheckCircle2 className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Civic Hero</span>
          </div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl lg:text-5xl font-black font-headline tracking-tighter mb-2 italic">Alex Rivers</h1>
          <p className="text-slate-400 font-medium flex items-center justify-center md:justify-start">
            <Navigation className="w-4 h-4 text-primary mr-2" />
            Contributor since Jan 2024 • Zone 4 Resident
          </p>
        </div>
        <div className="md:ml-auto flex gap-4">
          <div className="bg-surface-container px-6 py-4 rounded-2xl text-center min-w-[120px]">
            <div className="text-2xl font-black font-headline text-primary">1,284</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Contributions</div>
          </div>
          <div className="bg-surface-container px-6 py-4 rounded-2xl text-center min-w-[120px]">
            <div className="text-2xl font-black font-headline text-tertiary">LVL 12</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Sonic Rank</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        <div className="lg:col-span-8 bg-surface-container rounded-[2rem] overflow-hidden relative group h-[400px]">
          <div className="absolute inset-0 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
            <img className="w-full h-full object-cover" src="https://picsum.photos/seed/noise-map/1200/800" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          <div className="absolute top-6 left-6 bg-[#2d3449]/60 backdrop-blur-xl px-4 py-2 rounded-full flex items-center space-x-2 border border-white/5">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span className="text-xs font-bold font-headline tracking-widest uppercase">Coverage Area: North-East</span>
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <div>
              <h3 className="text-xl font-bold font-headline leading-none mb-1">Impact Map</h3>
              <p className="text-sm text-slate-400">Showing 42 personal data clusters</p>
            </div>
            <button className="bg-white/10 backdrop-blur-md hover:bg-white/20 p-3 rounded-full transition-all">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-highest rounded-[2rem] p-8 flex-1 flex flex-col justify-between border border-primary/5">
            <div>
              <div className="flex justify-between items-start mb-6">
                <BarChart3 className="w-10 h-10 text-primary" />
                <div className="bg-tertiary/20 text-tertiary px-3 py-1 rounded-full text-[10px] font-black uppercase">+12% Growth</div>
              </div>
              <h3 className="text-3xl font-black font-headline tracking-tighter mb-4">Total dB Data Provided</h3>
              <div className="text-5xl font-black font-headline text-on-surface mb-2 tracking-tighter">8.4<span className="text-xl text-slate-500">TB</span></div>
              <p className="text-sm text-slate-400 leading-relaxed">Your granular data represents over 400 hours of high-fidelity urban acoustic monitoring.</p>
            </div>
            <div className="mt-8 pt-6 border-t border-outline-variant/20">
              <div className="flex items-center space-x-3 text-tertiary">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Verified by Urban Science Div.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Policy Change', text: 'High impact on traffic policy in zone 4. New speed limits enacted based on your 2AM readings.', color: 'border-primary' },
            { label: 'Public Health', text: 'Your data contributed to the WHO Sleep Hygiene study for the metro area. 12k citizens benefited.', color: 'border-tertiary' },
            { label: 'Urban Planning', text: 'Acoustic barriers in Central Park North redesigned using your spectral analysis submissions.', color: 'border-secondary' },
          ].map((item, i) => (
            <div key={i} className={cn("bg-surface-container-low p-8 rounded-3xl border-l-4", item.color)}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">{item.label}</span>
              <p className="text-lg font-bold font-headline leading-snug">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

const RecordingScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [db, setDb] = useState(68.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setDb(prev => +(prev + (Math.random() - 0.5) * 2).toFixed(1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 z-0 opacity-40 blur-md pointer-events-none">
        <img className="w-full h-full object-cover" src="https://picsum.photos/seed/recording-bg/1200/800" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50"></div>
      </div>

      <div className="z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-10">
          <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping duration-[3000ms]"></div>
            <div className="absolute inset-4 rounded-full border-4 border-dashed border-primary/20 animate-[spin_20s_linear_infinite]"></div>
            <div className="relative w-full h-full rounded-full border-[12px] border-surface-container-highest flex flex-col items-center justify-center shadow-2xl shadow-primary/20 bg-[#0b1326]/40 backdrop-blur-sm">
              <div className="text-center space-y-1">
                <div className="text-sm font-bold tracking-[0.2em] text-primary/60 uppercase font-headline">Live Monitoring</div>
                <div className="text-6xl md:text-8xl font-black font-headline tracking-tighter text-white">{db}</div>
                <div className="text-xl font-medium text-on-surface-variant font-headline">decibels (dB)</div>
              </div>
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-end gap-1 h-12 w-32 justify-center">
                {[0.8, 1.2, 0.6, 1.5, 0.9, 1.1].map((s, i) => (
                  <div key={i} className="w-1 bg-primary rounded-full" style={{ height: `${Math.random() * 100}%`, animation: `pulse ${s}s infinite` }}></div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 bg-surface-container-highest px-6 py-2 rounded-full border border-primary/10">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-headline font-bold text-sm text-primary tracking-widest uppercase">Sampling...</span>
              <span className="h-4 w-[1px] bg-outline-variant"></span>
              <span className="text-white font-mono text-sm">00:02:45</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant text-sm bg-surface-container/40 backdrop-blur-md px-4 py-1.5 rounded-lg border border-white/5">
              <Navigation className="w-3 h-3" />
              <span>Current Location: <span className="text-white font-medium">Oxford St, London</span></span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#2d3449]/60 backdrop-blur-xl rounded-xl p-6 border-l-4 border-error shadow-lg">
            <div className="flex items-start gap-4">
              <div className="bg-error-container/20 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-headline text-error">65dB Limit Exceeded</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Current levels are 3.5dB above recommended residential safety thresholds. Prolonged exposure at this intensity is linked to increased cortisol levels, sleep disruption, and potential long-term hypertension.
                </p>
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-error-container bg-error px-2 py-0.5 rounded">High Risk Zone</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase font-headline">Avg. 5s Window</span>
              <span className="text-2xl font-bold font-headline">67.2 dB</span>
            </div>
            <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase font-headline">Peak Pulse</span>
              <span className="text-2xl font-bold font-headline text-error">74.1 dB</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={onFinish}
              className="w-full bg-gradient-to-r from-[#ffb2b7] to-[#ff506b] text-white font-headline font-black py-4 rounded-xl shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Save className="w-5 h-5" />
              Save & Pin to Map
            </button>
            <button 
              onClick={onFinish}
              className="w-full bg-surface-container-highest border border-outline-variant/30 text-white font-headline font-bold py-4 rounded-xl hover:bg-surface-container transition-all flex items-center justify-center gap-3"
            >
              <Trash2 className="w-5 h-5" />
              Discard Contribution
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('live-map');

  return (
    <div className="bg-background text-on-background font-body selection:bg-primary/30 min-h-screen flex flex-col overflow-hidden">
      <Header onStartRecording={() => setScreen('recording')} />
      
      <div className="flex flex-1 pt-20 overflow-hidden">
        <Sidebar currentScreen={screen} setScreen={setScreen} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex overflow-hidden"
          >
            {screen === 'live-map' && <LiveMapScreen />}
            {screen === 'analytics' && <AnalyticsScreen />}
            {screen === 'contributions' && <ContributionsScreen />}
            {screen === 'recording' && <RecordingScreen onFinish={() => setScreen('live-map')} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <Chatbot />

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#171f33]/90 backdrop-blur-lg h-20 flex items-center justify-around px-4 z-50 border-t border-white/5">
        <button onClick={() => setScreen('live-map')} className={cn("flex flex-col items-center gap-1", screen === 'live-map' ? "text-[#00e475]" : "text-slate-400")}>
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Map</span>
        </button>
        <button onClick={() => setScreen('analytics')} className={cn("flex flex-col items-center gap-1", screen === 'analytics' ? "text-[#00e475]" : "text-slate-400")}>
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Trends</span>
        </button>
        <div className="relative -top-6">
          <button 
            onClick={() => setScreen('recording')}
            className="w-14 h-14 bg-gradient-to-br from-[#ff1e56] to-[#ff506b] rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(255,30,86,0.4)] border-4 border-background"
          >
            <Mic className="w-6 h-6 text-white" />
          </button>
        </div>
        <button onClick={() => setScreen('contributions')} className={cn("flex flex-col items-center gap-1", screen === 'contributions' ? "text-[#00e475]" : "text-slate-400")}>
          <Heart className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Health</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Menu</span>
        </button>
      </nav>
    </div>
  );
}

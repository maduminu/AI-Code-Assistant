import { useState, useRef, useEffect } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Play, Sparkles, Code2, AlertTriangle, CheckCircle, RefreshCw, Send, MessageSquare, Plus, Menu, Copy, Check, FileCode2, SplitSquareHorizontal, Paperclip } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('nexus_ai_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => {
    const saved = localStorage.getItem('nexus_ai_conversation_id');
    if (saved) return saved;
    const newId = crypto.randomUUID();
    localStorage.setItem('nexus_ai_conversation_id', newId);
    return newId;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_ai_history', JSON.stringify(messages));
  }, [messages]);

  const handleCopy = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleDiff = (idx) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, showDiff: !m.showDiff } : m));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = async (files) => {
    let combinedContent = "";
    for (const file of files) {
      if (file.type.startsWith('text/') || file.name.match(/\.(js|jsx|ts|tsx|css|html|json|md|py|java|c|cpp|h|hpp)$/i)) {
        const text = await file.text();
        combinedContent += `\n\n// --- File: ${file.name} ---\n${text}`;
      }
    }
    
    if (combinedContent) {
      setInput((prev) => prev + combinedContent);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await processFiles(files);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: newMessages,
          conversationId: conversationId 
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        data = { error: 'Failed to read server response.' };
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Analysis failed.');
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        optimizedCode: data.optimizedCode || 'No optimized code returned.',
        language: data.language || 'javascript',
        analysis: data.analysis || []
      }]);
    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, {
        role: 'ai',
        error: error.message || 'An error occurred while connecting to the AI server.'
       }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-screen w-full flex overflow-hidden selection:bg-indigo-500/30 font-sans relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* File Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-indigo-950/60 backdrop-blur-md flex items-center justify-center border-4 border-indigo-500 border-dashed m-4 rounded-[2.5rem] pointer-events-none"
          >
            <div className="bg-black/80 px-10 py-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl border border-indigo-500/30">
              <FileCode2 className="w-20 h-20 text-indigo-400 animate-bounce" />
              <h2 className="text-3xl font-extrabold text-white tracking-wide drop-shadow-lg">Drop files to add context</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Stunning Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#070709] overflow-hidden">
        {/* Animated Orbs for Glass Refraction */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/40 blur-[130px]" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/30 blur-[150px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-blue-500/20 blur-[120px]" 
        />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {windowWidth <= 1024 && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`h-full z-50 flex flex-col p-5 glass-panel border-r \${
              windowWidth <= 1024 ? 'fixed w-72' : 'w-72 shrink-0 relative'
            }`}
          >
            {/* Logo Area */}
            <div className="flex items-center gap-4 mb-8">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-[0_4px_20px_rgba(99,102,241,0.5)] border border-white/20">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold glow-text tracking-wide">Nexus AI</h1>
                <p className="text-[10px] text-indigo-300 font-semibold tracking-widest uppercase mt-0.5">Senior Engineer</p>
              </div>
            </div>

            <button 
              onClick={() => { setMessages([]); localStorage.removeItem('nexus_ai_history'); }}
              className="glass-button group flex items-center justify-center gap-2 w-full p-3.5 rounded-2xl text-white font-medium mb-8"
            >
              <Plus className="w-4 h-4 text-indigo-300 group-hover:rotate-90 transition-transform duration-300" />
              New Analysis
            </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Recent History</p>
              {[1, 2, 3].map((i) => (
                <button key={i} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/10 text-left transition-colors group">
                  <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 truncate">Previous Snippet {i}</span>
                </button>
              ))}
            </div>
            
            {/* User Profile Footer */}
            <div className="mt-4 pt-5 border-t border-white/10 flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-white/20 flex items-center justify-center text-white font-bold">
                M
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Madushan</span>
                <span className="text-xs text-indigo-300 font-medium">Pro Developer</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 transition-all duration-300 min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-transparent border-b border-white/5 backdrop-blur-md">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors glass-button"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-black/30 border border-white/10 shadow-inner text-[10px] md:text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5 text-purple-400" /> 
            <span className="hidden sm:inline">Current Model : Stepfun 3.5 Flash</span>
            <span className="sm:hidden text-[9px]">Stepfun 3.5</span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 md:p-8 custom-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-32">
            
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full flex flex-col items-center justify-center text-center mt-32"
              >
                <div className="relative mb-10">
                  <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 rounded-full" />
                  <div className="w-28 h-28 rounded-3xl glass-panel border border-white/20 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10">
                    <Sparkles className="w-14 h-14 text-white glow-text" />
                  </div>
                </div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 mb-6 drop-shadow-lg">
                  How can I optimize your code?
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed font-medium">
                  Paste your snippet below. I will identify bugs, enhance performance, and deliver a cleaner refactored version.
                </p>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[95%] md:max-w-[70%] text-sm rounded-3xl rounded-tr-md p-3 md:p-5 bubble-user text-white shadow-2xl overflow-hidden">
                      <pre className="font-mono whitespace-pre-wrap">{msg.content}</pre>
                    </div>
                  ) : (
                    <div className="max-w-full w-full lg:max-w-[90%] text-sm rounded-3xl rounded-tl-md p-3 md:p-6 lg:p-8 bubble-ai text-slate-200 shadow-2xl overflow-hidden">
                      
                      {msg.error ? (
                         <div className="flex items-center gap-3 text-rose-300 bg-rose-500/10 p-5 rounded-2xl border border-rose-500/30 shadow-inner">
                           <AlertTriangle className="w-6 h-6" />
                           <p className="font-medium">{msg.error}</p>
                         </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Analysis Section */}
                          {msg.analysis && msg.analysis.length > 0 && (
                            <div className="space-y-4 overflow-x-auto custom-scrollbar pb-2">
                              <h3 className="text-white font-bold flex items-center gap-2 text-base tracking-wide uppercase">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                Analysis Insights
                              </h3>
                              <div className="grid gap-3 min-w-max md:min-w-0">
                                {msg.analysis.map((item, i) => (
                                  <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-black/40 border border-white/5 shadow-inner transition-colors hover:bg-black/50">
                                    {item.type === 'warning' ? (
                                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                    ) : item.type === 'error' ? (
                                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                    ) : (
                                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                    )}
                                    <span className="text-slate-300 leading-relaxed font-medium">{item.message}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Code Section */}
                          {msg.optimizedCode && (
                            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative bg-[#1e1e1e]">
                               <div className="absolute top-0 left-0 w-full h-12 bg-black/60 border-b border-white/10 flex items-center justify-between px-5 z-10 backdrop-blur-md">
                                 <div className="flex gap-2 items-center">
                                   <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
                                   <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
                                   <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
                                 </div>
                                 
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <button 
                                     onClick={() => toggleDiff(idx)}
                                     className={`flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-all text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase group ${msg.showDiff ? 'text-indigo-400 bg-white/5' : 'text-slate-400'}`}
                                   >
                                     <SplitSquareHorizontal className="w-4 h-4" /> <span className="hidden sm:inline">{msg.showDiff ? 'Code View' : 'Diff View'}</span>
                                   </button>
                                   
                                   <button 
                                     onClick={() => handleCopy(msg.optimizedCode, idx)}
                                     className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase group"
                                    >
                                   {copiedIndex === idx ? (
                                      <><Check className="w-4 h-4 text-emerald-400" /> Copied</>
                                   ) : (
                                      <><Copy className="w-4 h-4 group-hover:scale-110 transition-transform" /> Copy Code</>
                                   )}
                                 </button>
                                 </div>
                               </div>
                               <div className="pt-12">
                                {msg.showDiff ? (
                                  <div className="rounded-b-2xl overflow-x-auto bg-[#1e1e1e]/50 backdrop-blur-sm text-sm custom-scrollbar">
                                    <div className="min-w-max md:min-w-full">
                                      <ReactDiffViewer 
                                        oldValue={messages[idx - 1]?.content || ''} 
                                        newValue={msg.optimizedCode} 
                                        splitView={windowWidth >= 768} 
                                        useDarkTheme={true} 
                                        styles={{
                                          variables: { 
                                            dark: { diffViewerBackground: 'transparent' } 
                                          },
                                          contentText: {
                                            wordBreak: 'normal',
                                            whiteSpace: 'pre'
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <SyntaxHighlighter
                                    language={msg.language || 'javascript'}
                                    style={vscDarkPlus}
                                    customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
                                    wrapLines={false}
                                    showLineNumbers={true}
                                  >
                                    {msg.optimizedCode}
                                  </SyntaxHighlighter>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Loading State */}
              {isLoading && (
                 <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start w-full"
                 >
                   <div className="max-w-[80%] rounded-3xl rounded-tl-md p-6 bubble-ai flex items-center gap-4">
                     <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                     <span className="text-slate-300 animate-pulse font-medium tracking-wide">Synthesizing optimization...</span>
                   </div>
                 </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent pt-20 pb-8 px-2 md:px-10 z-20">
          <div className="max-w-4xl mx-auto relative px-2 md:px-0">
            <div className="floating-input rounded-3xl p-2.5 md:p-3 flex items-end gap-3 transition-all duration-300 focus-within:shadow-[0_0_50px_rgba(99,102,241,0.2)] focus-within:border-indigo-500/50">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                accept=".js,.jsx,.ts,.tsx,.css,.html,.json,.md,.py,.java,.c,.cpp,.h,.hpp"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 md:p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-300 shrink-0"
                title="Attach Files"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Nexus AI... (Press Enter to analyze)"
                className="w-full bg-transparent text-white placeholder:text-slate-500 resize-none min-h-[56px] max-h-[300px] p-4 text-[15px] focus:outline-none scroll-smooth custom-scrollbar font-medium"
                rows={1}
                spellCheck="false"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 md:p-4 rounded-2xl bg-white hover:bg-indigo-100 disabled:bg-white/10 disabled:text-slate-500 text-indigo-900 shrink-0 shadow-[0_4px_15px_rgba(255,255,255,0.2)] disabled:shadow-none transition-all duration-300 group font-bold"
              >
                <div className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                  <Send className="w-5 h-5" />
                </div>
              </button>
            </div>
            <p className="text-center text-xs text-slate-500 mt-4 px-4 font-semibold tracking-wider uppercase">
              Nexus AI can make mistakes. Verify critical code before deploying.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;

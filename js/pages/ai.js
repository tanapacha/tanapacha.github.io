const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.FramerMotion || window.Motion || { motion: (props) => <div {...props} />, AnimatePresence: (props) => <>{props.children}</> };
const Navbar = window.Navbar;
const BentoCard = window.BentoCard;

const AIAssistant = () => {
    console.log("Rendering AI Assistant", { Navbar, BentoCard, motion });
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'สวัสดีครับคุณ Tanapon ผมคือ Aura AI ผู้ช่วยส่วนตัวของคุณ วันนี้มีอะไรให้ผมช่วยจัดการไหมครับ?' }
    ]);
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-flash-latest');
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [wellnessScore, setWellnessScore] = useState(0);
    const [events, setEvents] = useState([]);
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [isAutoSpeak, setIsAutoSpeak] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const chatEndRef = useRef(null);

    // Cooldown timer logic
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const models = [
        { id: 'gemini-flash-latest', name: 'Gemini 1.5 Flash (Stable)', desc: 'รุ่นเสถียรที่สุด แนะนำให้ใช้เป็นหลัก' },
        { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', desc: 'ฉลาดที่สุด วิเคราะห์ลึกซึ้ง (Experimental)' },
        { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS', desc: 'เน้นความเร็วและการประมวลผลเสียง' },
        { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', desc: 'รุ่นเล็ก ประมวลผลไวที่สุด' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'ฉลาดระดับสูง สำหรับงานวางแผน' },
        { id: 'gemini-2.5-pro-preview-tts', name: 'Gemini 2.5 Pro TTS', desc: 'รุ่น 2.5 พร้อมฟีเจอร์เสียง' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2 Flash', desc: 'รวดเร็วและแม่นยำ' },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2 Flash Lite', desc: 'ประหยัดทรัพยากร มักจะว่างตลอดเวลา' },
    ];

    useEffect(() => {
        const loadInitialData = async () => {
            const data = await window.gasClient.fetchData('events,goals');
            if (data) {
                setEvents(data.events || []);
                setGoals(data.goals || []);
                calculateWellnessScore(data.events || [], data.goals || []);
            }
        };
        loadInitialData();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const calculateWellnessScore = (evs, gls) => {
        let score = 50; // Base score
        
        // 1. Goal Progress (Weight 60%)
        if (gls.length > 0) {
            const avgProgress = gls.reduce((sum, g) => sum + (g.progress / g.total), 0) / gls.length;
            score += (avgProgress * 50);
        }

        // 2. Schedule Balance (Weight 40%) - Focus on today
        const todayStr = new Date().toDateString();
        const todayEvents = evs.filter(e => new Date(e.start).toDateString() === todayStr);
        
        if (todayEvents.length >= 3 && todayEvents.length <= 6) {
            score += 20; // Perfect balance
        } else if (todayEvents.length > 8) {
            score -= 10; // Overloaded
        } else if (todayEvents.length > 0) {
            score += 10; // Making progress
        }

        setWellnessScore(Math.min(100, Math.max(0, Math.round(score))));
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Build Context
        const goalsContext = goals.map(g => `- ${g.title}: ${g.progress}/${g.total} ${g.unit}`).join('\n');
        const eventsContext = events.slice(0, 10).map(e => `- ${new Date(e.start).toLocaleString('th-TH')}: ${e.title}`).join('\n');
        const context = `เป้าหมายปัจจุบัน:\n${goalsContext}\n\nกิจกรรมในปฏิทิน (30 วันข้างหน้า):\n${eventsContext}`;

        // Real AI Call via GAS
        const response = await window.gasClient.callAI(input, context, selectedModel);
        
        // Auto-speak response
        if (isAutoSpeak) {
            // Clean action tags before speaking
            const speechText = response.replace(/\[ACTION:.*?\]/g, "").trim();
            window.auraVoice.speak(speechText);
        }

        // Check for Rate Limit to trigger cooldown
        if (typeof response === 'string' && response.includes('Rate Limit')) {
            setCooldown(30); // 30 seconds cooldown
        }

        setMessages(prev => [...prev, { 
            role: 'ai', 
            text: response
        }]);
        setIsLoading(false);
    };

    const handleStartListening = () => {
        window.auraVoice.startListening(
            (result) => setInput(result),
            () => setIsListening(false)
        );
        setIsListening(true);
    };

    const executeAction = async (actionStr, msgIdx) => {
        const eventRegex = /\[ACTION:ADD_EVENT\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/;
        const goalRegex = /\[ACTION:ADD_GOAL\|(.*?)\|(.*?)\|(.*?)\]/;

        try {
            if (eventRegex.test(actionStr)) {
                const m = actionStr.match(eventRegex);
                await window.gasClient.addEvent({ title: m[1], start: m[2], end: m[3], description: m[4] });
            } else if (goalRegex.test(actionStr)) {
                const m = actionStr.match(goalRegex);
                await window.gasClient.addGoal({ title: m[1], total: parseInt(m[2]), unit: m[3] });
            }
            
            // Mark action as completed in UI
            setMessages(prev => prev.map((msg, i) => 
                i === msgIdx ? { ...msg, actionExecuted: true } : msg
            ));
            
            // Refresh data
            const data = await window.gasClient.fetchData('events,goals');
            if (data) calculateWellnessScore(data.events, data.goals);
            
        } catch (error) {
            console.error("Action execution failed", error);
        }
    };

    return (
        <div className="app-container lg:pt-20">
            <Navbar />
            
            <main className="flex-1 h-screen flex flex-col lg:flex-row bg-midnight overflow-hidden">
                {/* Chat Section */}
                <div className="flex-1 flex flex-col border-r border-white/5 relative h-full">
                    <header className="p-6 md:p-12 pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h2 className="text-gold font-medium mb-1">Aura Intelligence</h2>
                            <h1 className="text-white text-2xl lg:text-3xl">คุยกับผู้ช่วย AI</h1>
                        </div>

                        
                        {/* Voice Toggle */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsAutoSpeak(!isAutoSpeak)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold border ${isAutoSpeak ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-white/5 border-white/5 text-white/30'}`}
                            >
                                <i data-lucide={isAutoSpeak ? "Volume2" : "VolumeX"} className="w-4 h-4"></i>
                                {isAutoSpeak ? 'คุยด้วยเสียง: เปิด' : 'คุยด้วยเสียง: ปิด'}
                            </button>
                            
                            <div className="relative">
                                <button 
                                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                                    className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:border-gold/50 transition-all text-sm"
                                >
                                    <span className="text-gold font-medium">{models.find(m => m.id === selectedModel)?.name}</span>
                                    <i data-lucide="ChevronDown" className={`w-4 h-4 text-text-secondary transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`}></i>
                                </button>
                                
                                <AnimatePresence>
                                    {isModelMenuOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-72 bg-midnight/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-[60] shadow-2xl"
                                        >
                                            {models.map(model => (
                                                <button 
                                                    key={model.id}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setSelectedModel(model.id);
                                                        setIsModelMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1
                                                        ${selectedModel === model.id ? 'bg-gold/10 border border-gold/20' : 'hover:bg-white/5 border border-transparent'}
                                                    `}
                                                >
                                                    <span className={`text-sm font-medium ${selectedModel === model.id ? 'text-gold' : 'text-white'}`}>{model.name}</span>
                                                    <span className="text-[10px] text-white/60">{model.desc}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 md:p-12 pt-0 space-y-6 custom-scrollbar">

                        {messages.map((msg, idx) => {
                            const actionMatch = msg.text.match(/\[ACTION:.*?\]/);
                            const cleanText = msg.text.replace(/\[ACTION:.*?\]/g, "").trim();
                            const isUser = msg.role === 'user';

                            return (
                                <div
                                    key={idx}
                                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} ${isUser ? 'msg-user' : 'msg-ai'}`}
                                    style={{ animationDelay: `${idx * 0.04}s` }}
                                >
                                    {/* Avatar for AI */}
                                    {!isUser && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                                                <span style={{ fontSize: '10px' }}>✨</span>
                                            </div>
                                            <span className="text-[10px] text-gold/60 font-medium uppercase tracking-wider">Aura AI</span>
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[72%] p-5 rounded-3xl ${
                                            isUser
                                            ? 'rounded-tr-sm text-midnight font-medium'
                                            : 'rounded-tl-sm text-white border border-white/8'
                                        }`}
                                        style={isUser ? {
                                            background: 'linear-gradient(135deg, #D4AF37, #F0D060)',
                                            boxShadow: '0 4px 20px rgba(212,175,55,0.25)'
                                        } : {
                                            background: 'rgba(255,255,255,0.04)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        <p className="leading-relaxed whitespace-pre-wrap text-sm">{cleanText}</p>

                                        {actionMatch && !msg.actionExecuted && (
                                            <button
                                                onClick={() => executeAction(actionMatch[0], idx)}
                                                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-gold/20 hover:bg-gold/30
                                                           border border-gold/30 text-gold rounded-xl transition-all text-xs font-bold btn-spring"
                                            >
                                                <i data-lucide={actionMatch[0].includes('EVENT') ? 'Calendar' : 'Target'} className="w-4 h-4" />
                                                ยืนยันการบันทึกข้อมูล
                                            </button>
                                        )}

                                        {msg.actionExecuted && (
                                            <div className="mt-4 flex items-center gap-2 text-xs text-green-400 font-medium bg-green-400/10 p-3 rounded-xl border border-green-400/20">
                                                <i data-lucide="CheckCircle" className="w-4 h-4" />
                                                บันทึกข้อมูลเรียบร้อยแล้ว
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Thinking indicator */}
                        {isLoading && (
                            <div className="flex items-start gap-2 msg-ai">
                                <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                                    <span style={{ fontSize: '10px' }}>✨</span>
                                </div>
                                <div className="p-5 rounded-3xl rounded-tl-sm border border-white/8 flex items-center gap-3"
                                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <span className="thinking-dot" />
                                    <span className="thinking-dot" />
                                    <span className="thinking-dot" />
                                    <span className="text-xs text-text-secondary ml-1">กำลังคิด...</span>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 md:p-8 pt-0">

                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && !cooldown && handleSend()}
                                placeholder={isListening ? "กำลังรอฟังคุณอยู่..." : cooldown > 0 ? `ต้องรอก่อนครับ (${cooldown} วินาที)...` : "พิมพ์ข้อความ หรือกดที่ไมค์เพื่อสั่งด้วยเสียง..."}
                                disabled={isLoading || cooldown > 0}
                                className={`w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-8 pr-32 text-white input-glow ${cooldown > 0 ? 'opacity-30 cursor-not-allowed grayscale' : 'disabled:opacity-50'}`}
                                style={{ transition: 'border-color 0.25s ease, box-shadow 0.25s ease' }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                                <button
                                    onClick={isListening ? () => window.auraVoice.stopListening() : handleStartListening}
                                    disabled={isLoading || cooldown > 0}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-white/5 border border-white/10 text-white/40 hover:text-gold hover:border-gold/30'}`}
                                >
                                    <i data-lucide={isListening ? "MicOff" : "Mic"} className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || cooldown > 0 || !input.trim()}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center btn-gold btn-spring disabled:opacity-30"
                                >
                                    <i data-lucide={isLoading ? "Loader2" : "Send"} className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insights Section - Hidden on mobile for better chat experience */}
                <div
                    className="hidden lg:flex w-96 p-8 flex-col gap-6"
                    style={{ background: 'rgba(0,0,0,0.25)', borderLeft: '1px solid rgba(255,255,255,0.04)' }}
                >

                    <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em]">บทวิเคราะห์ AI</p>

                    {/* Wellness card */}
                    <BentoCard title="Wellness Score" subtitle="สรุปพฤติกรรม" icon="Activity" gold={true}>
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <span className="text-6xl font-thin text-white" style={{ lineHeight: 1 }}>{wellnessScore}</span>
                            <span className="text-xs text-gold font-medium">
                                {wellnessScore >= 80 ? '🔥 Excellent Style'
                                    : wellnessScore >= 50 ? '🚀 Good Progress'
                                    : '💪 Needs Focus'}
                            </span>
                            <div className="mt-3 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gold progress-bar-animated"
                                    style={{ width: `${wellnessScore}%`, boxShadow: '0 0 8px rgba(212,175,55,0.5)' }}
                                />
                            </div>
                        </div>
                    </BentoCard>

                    {/* Suggestion chips */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em]">คำขอที่แนะนำ</p>
                        {[
                            { label: 'สรุปกิจกรรมอาทิตย์นี้', icon: '📅' },
                            { label: 'ช่วยจัดตารางวันที่ 25', icon: '🗓️' },
                            { label: 'วิเคราะห์การนอนของฉัน', icon: '🌙' },
                        ].map((q, i) => (
                            <button
                                key={i}
                                onClick={() => setInput(q.label)}
                                className="w-full text-left p-3.5 rounded-xl border border-white/5 bg-white/5 text-sm text-text-secondary
                                           hover:text-white hover:border-gold/30 hover:bg-gold/5 transition-all duration-300 btn-spring flex items-center gap-3"
                                style={{ animationDelay: `${i * 0.07}s`, animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
                            >
                                <span>{q.icon}</span>
                                <span>{q.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Pro tip */}
                    <div className="mt-auto p-5 rounded-2xl float-slow" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}>
                        <div className="flex gap-2 items-center mb-2">
                            <i data-lucide="Zap" className="w-3.5 h-3.5 text-gold" />
                            <span className="text-gold font-bold text-[10px] uppercase tracking-wider">Pro Tip</span>
                        </div>
                        <p className="text-[10px] text-text-secondary leading-relaxed">
                            AI สามารถวิเคราะห์นิสัยและแนะนำช่วงเวลา Productive ที่สุดของคุณได้โดยอัตโนมัติ
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AIAssistant />);

const { useState, useEffect, useRef } = React;
const Navbar = window.Navbar;
const BentoCard = window.BentoCard;

const FocusPage = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // focus | short_break | long_break
    const [settings, setSettings] = useState({ focus: 25, short: 5, long: 15 });
    const [goals, setGoals] = useState([]);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [focusHistory, setFocusHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const timerRef = useRef(null);
    const alarmRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock_ringing_beeps.ogg'));

    // Initial Load
    useEffect(() => {
        const loadFocusData = async () => {
            setIsLoading(true);
            // Optimization: Only fetch goals and focusSessions
            const data = await window.gasClient.fetchData("goals,focusSessions");
            if (data) {
                setGoals(data.goals || []);
                setFocusHistory(data.focusSessions || []); 
            }
            setIsLoading(false);
            if (window.lucide) setTimeout(() => window.lucide.createIcons(), 100);
        };
        loadFocusData();
    }, []);

    // Optimized Timer Logic (Drift-proof)
    const startTimeRef = useRef(null);
    const initialTimeRef = useRef(timeLeft);

    useEffect(() => {
        if (isActive) {
            startTimeRef.current = Date.now();
            initialTimeRef.current = timeLeft;

            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                const newTime = Math.max(0, initialTimeRef.current - elapsed);
                
                setTimeLeft(newTime);
                if (newTime === 0) {
                    clearInterval(timerRef.current);
                    handleTimerComplete();
                }
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive]);

    const handleTimerComplete = async () => {
        setIsActive(false);
        const nextMode = mode === 'focus' ? 'short_break' : 'focus';
        setMode(nextMode);
        setTimeLeft(settings[nextMode === 'focus' ? 'focus' : 'short'] * 60);
        
        if (mode === 'focus') {
            await window.gasClient.logFocusSession({
                duration: settings.focus,
                task: selectedGoal ? selectedGoal.title : "Deep Work",
                status: "Completed",
                date: new Date().toISOString()
            });
            // Optimization: Only reload history
            const data = await window.gasClient.fetchData("focusSessions");
            if (data) setFocusHistory(data.focusSessions || []);
        }

        // Play alarm sound
        if (alarmRef.current) {
            alarmRef.current.volume = 1.0;
            alarmRef.current.play().catch(err => console.error("Audio play failed:", err));
            
            // Stop after 5 seconds as requested
            setTimeout(() => {
                alarmRef.current.pause();
                alarmRef.current.currentTime = 0;
            }, 5000);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(settings[mode === 'focus' ? 'focus' : (mode === 'short_break' ? 'short' : 'long')] * 60);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const updateDuration = (type, val) => {
        const newSettings = { ...settings, [type]: parseInt(val) || 1 };
        setSettings(newSettings);
        if (!isActive && mode === type) {
            setTimeLeft(newSettings[type] * 60);
        }
    };

    return (
        <div className="app-container lg:pt-20">
            <Navbar />

            <main className="flex-1 min-h-screen p-6 lg:p-12 relative flex flex-col lg:flex-row gap-12">
                
                {/* Left Side: Immersive Timer */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] lg:min-h-0">
                    
                    {/* Mode Selector */}
                    <div className="flex gap-4 mb-12 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                        {['focus', 'short_break', 'long_break'].map(m => (
                            <button
                                key={m}
                                onClick={() => {
                                    setMode(m);
                                    setIsActive(false);
                                    const type = m === 'focus' ? 'focus' : (m === 'short_break' ? 'short' : 'long');
                                    setTimeLeft(settings[type] * 60);
                                }}
                                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                                    ${mode === m ? 'bg-gold text-midnight' : 'text-white/40 hover:text-white'}`}
                            >
                                {m.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Branding / Active Goal */}
                    <div className="text-center mb-12 animate-fade-in">
                        <h2 className="text-white text-3xl lg:text-5xl font-extralight tracking-tight opacity-90">
                            {selectedGoal ? selectedGoal.title : "Unlocking Deep Work"}
                        </h2>
                        <p className="text-gold/60 text-sm mt-3 uppercase tracking-[0.3em] font-medium">
                            {mode === 'focus' ? 'Focus Session' : 'Moment of Calm'}
                        </p>
                    </div>

                    {/* The Aura Visualization */}
                    <div className="relative flex items-center justify-center mb-16">
                        <div 
                            onClick={toggleTimer}
                            className={`
                                relative w-64 h-64 lg:w-80 lg:h-80 rounded-full cursor-pointer transition-all duration-1000
                                ${isActive ? 'breathing-aura' : 'border border-white/10 hover:border-gold/30 bg-white/[0.02]'}
                                flex items-center justify-center group
                            `}
                            style={{ background: isActive ? 'var(--aura-primary)' : '' }}
                        >
                            <div className={`text-6xl lg:text-8xl font-extralight tracking-tighter transition-all duration-500 ${isActive ? 'text-midnight scale-90' : 'text-white group-hover:text-gold'}`}>
                                {formatTime(timeLeft)}
                            </div>
                            
                            {!isActive && (
                                <div className="absolute bottom-[-50px] text-[10px] font-bold text-gold/60 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to start session
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-10">
                        <button onClick={resetTimer} className="p-4 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all hover:scale-110">
                            <i data-lucide="RotateCcw" className="w-5 h-5"></i>
                        </button>
                        <button 
                            onClick={toggleTimer} 
                            className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all btn-spring ${isActive ? 'bg-white/10 text-white' : 'bg-gold text-midnight shadow-[0_0_50px_rgba(212,175,55,0.3)]'}`}
                        >
                            <i data-lucide={isActive ? "Pause" : "Play"} className={`w-6 h-6 lg:w-8 lg:h-8 ${!isActive ? 'fill-current ml-1' : ''}`}></i>
                        </button>
                        <button onClick={handleTimerComplete} className="p-4 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all hover:scale-110">
                            <i data-lucide="SkipForward" className="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                {/* Right Side: Settings & Goals & History */}
                <div className="w-full lg:w-96 flex flex-col gap-8 animate-fade-in">
                    
                    {/* Timer Settings */}
                    <BentoCard title="ตั้งค่าเวลา" subtitle="Session Control" icon="Settings">
                        <div className="mt-6 space-y-5">
                            <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                <span className="text-xs text-white/60 font-medium uppercase tracking-wider">Focus (Min)</span>
                                <input 
                                    type="number" 
                                    value={settings.focus} 
                                    onChange={(e) => updateDuration('focus', e.target.value)}
                                    className="w-16 bg-white/10 border border-white/10 rounded-lg p-1.5 text-center text-gold outline-none focus:border-gold/50"
                                />
                            </div>
                            <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                <span className="text-xs text-white/60 font-medium uppercase tracking-wider">Break (Min)</span>
                                <input 
                                    type="number" 
                                    value={settings.short} 
                                    onChange={(e) => updateDuration('short', e.target.value)}
                                    className="w-16 bg-white/10 border border-white/10 rounded-lg p-1.5 text-center text-gold outline-none focus:border-gold/50"
                                />
                            </div>
                        </div>
                    </BentoCard>

                    {/* Goal Selector */}
                    <BentoCard title="โฟกัสเพื่ออะไร?" subtitle="Active Target" icon="Target">
                        <div className="mt-6 space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {goals.length === 0 ? (
                                <p className="text-xs text-white/20 italic text-center py-4">ยังไม่มีเป้าหมายที่รอทำ</p>
                            ) : goals.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGoal(g)}
                                    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group
                                        ${selectedGoal?.id === g.id ? 'bg-gold/10 border-gold/40' : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'}`}
                                >
                                    <span className={`text-sm font-medium ${selectedGoal?.id === g.id ? 'text-gold' : 'text-white/60'}`}>{g.title}</span>
                                    {selectedGoal?.id === g.id && <i data-lucide="CheckCircle2" className="w-4 h-4 text-gold"></i>}
                                </button>
                            ))}
                        </div>
                    </BentoCard>

                    {/* History */}
                    <BentoCard title="ประวัติการโฟกัส" subtitle="History" icon="History">
                        <div className="mt-6 space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {focusHistory.length === 0 ? (
                                <p className="text-xs text-white/20 italic text-center py-4">ยังไม่มีประวัติในเร็วๆ นี้</p>
                            ) : focusHistory.sort((a,b) => new Date(b.date) - new Date(a.date)).map((h, i) => (
                                <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 border-l-gold border-l-2">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-white/80">{h.task}</h4>
                                        <p className="text-[10px] text-white/30 uppercase tracking-tighter mt-1">
                                            {new Date(h.date).toLocaleDateString('th-TH')} • {h.duration} min
                                        </p>
                                    </div>
                                    <i data-lucide="Check" className="w-4 h-4 text-gold"></i>
                                </div>
                            ))}
                        </div>
                    </BentoCard>

                </div>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<FocusPage />);

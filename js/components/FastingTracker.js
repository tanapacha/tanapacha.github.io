const { useState, useEffect, useRef } = React;
const { motion } = window.Motion || { motion: (props) => <div {...props} /> };

const PROTOCOLS = [
    { name: '16:8', fast: 16, eat: 8, label: 'LeanGains' },
    { name: '18:6', fast: 18, eat: 6, label: 'Advanced' },
    { name: '20:4', fast: 20, eat: 4, label: 'Warrior' },
    { name: 'OMAD', fast: 23, eat: 1, label: 'One Meal' }
];

const FastingTracker = () => {
    const [isActive, setIsActive] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [protocol, setProtocol] = useState(PROTOCOLS[0]);
    const [elapsed, setElapsed] = useState(0);
    const [remaining, setRemaining] = useState(0);
    const [progress, setProgress] = useState(0);

    const timerRef = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem('aura_fasting_state');
        if (saved) {
            const state = JSON.parse(saved);
            setIsActive(state.isActive);
            setStartTime(state.startTime);
            const savedProtocol = PROTOCOLS.find(p => p.name === state.protocolName) || PROTOCOLS[0];
            setProtocol(savedProtocol);
        }
    }, []);

    useEffect(() => {
        if (isActive && startTime) {
            updateTimer();
            timerRef.current = setInterval(updateTimer, 1000);
        } else {
            clearInterval(timerRef.current);
            setElapsed(0);
            setRemaining(protocol.fast * 3600);
            setProgress(0);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, startTime, protocol]);

    const updateTimer = () => {
        const now = Date.now();
        const start = parseInt(startTime);
        const diffInSeconds = Math.floor((now - start) / 1000);
        const totalFastingSeconds = protocol.fast * 3600;
        
        setElapsed(diffInSeconds);
        setRemaining(Math.max(0, totalFastingSeconds - diffInSeconds));
        setProgress(Math.min(100, (diffInSeconds / totalFastingSeconds) * 100));
        
        // Save state every update to ensure fresh data on reload
        localStorage.setItem('aura_fasting_state', JSON.stringify({
            isActive: true,
            startTime: start,
            protocolName: protocol.name
        }));
    };

    const startFasting = () => {
        const now = Date.now();
        setIsActive(true);
        setStartTime(now);
        localStorage.setItem('aura_fasting_state', JSON.stringify({
            isActive: true,
            startTime: now,
            protocolName: protocol.name
        }));
    };

    const stopFasting = () => {
        if (window.confirm("คุณต้องการสิ้นสุดการ Fasting ตอนนี้ใช่หรือไม่?")) {
            setIsActive(false);
            setStartTime(null);
            localStorage.removeItem('aura_fasting_state');
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const SafeIcon = window.SafeIcon;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-white font-bold text-xl flex items-center gap-2">
                        {SafeIcon && <SafeIcon name="Timer" className="w-5 h-5 text-gold" />}
                        Dynamic Fasting
                    </h3>
                    <p className="text-white/40 text-xs mt-1">Intermittent Fasting Monitor</p>
                </div>
                {!isActive && (
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        {PROTOCOLS.map(p => (
                            <button 
                                key={p.name}
                                onClick={() => setProtocol(p)}
                                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${protocol.name === p.name ? 'bg-gold text-midnight' : 'text-white/40 hover:text-white'}`}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-4">
                {/* Progress Circle Container */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle 
                            cx="96" cy="96" r="88" 
                            className="stroke-white/5 fill-none" 
                            strokeWidth="8"
                        />
                        <motion.circle 
                            cx="96" cy="96" r="88" 
                            className="stroke-gold fill-none" 
                            strokeWidth="8"
                            strokeDasharray={552}
                            strokeDashoffset={552 - (552 * progress) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{isActive ? 'Remaining' : 'Target Fast'}</span>
                        <h2 className="text-3xl text-white font-mono font-bold">
                            {isActive ? formatTime(remaining) : `${protocol.fast}h`}
                        </h2>
                        {isActive && (
                            <span className="text-[10px] text-gold/60 mt-2 font-medium">Elapsed: {formatTime(elapsed)}</span>
                        )}
                    </div>
                </div>

                <div className="mt-8 w-full space-y-4">
                    <div className="flex justify-between text-[11px] text-white/40 px-2">
                        <span className="flex items-center gap-1">
                            {SafeIcon && <SafeIcon name="Moon" className="w-3 h-3" />}
                            Fasting: {protocol.fast}h
                        </span>
                        <span className="flex items-center gap-1">
                            {SafeIcon && <SafeIcon name="Sun" className="w-3 h-3" />}
                            Eating: {protocol.eat}h
                        </span>
                    </div>

                    {!isActive ? (
                        <button 
                            onClick={startFasting}
                            className="w-full py-4 bg-gold text-midnight font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                        >
                            {SafeIcon && <SafeIcon name="Play" className="w-5 h-5 fill-current" />}
                            Start Fasting
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button 
                                onClick={stopFasting}
                                className="flex-1 py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl hover:bg-red-500/20 transition-all"
                            >
                                End Fast
                            </button>
                            <button 
                                onClick={async () => {
                                    const advice = await window.gasClient.callAI(
                                        `ฉันกำลังทำ Fasting แบบ ${protocol.name} และผ่านมาแล้ว ${Math.floor(elapsed/3600)} ชั่วโมง ${Math.floor((elapsed%3600)/60)} นาที ช่วยแนะนำ Bio-hacking สั้นๆ ว่าตอนนี้ร่างกายกำลังทำอะไรอยู่ (เช่น Autophagy หรือ Fat Burning) และควรดื่มน้ำหรือทำอะไรเพิ่มไหม?`,
                                        "Fasting Advice"
                                    );
                                    alert(advice);
                                }}
                                className="p-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10"
                                title="AI Bio-hacking Advice"
                            >
                                {SafeIcon && <SafeIcon name="Sparkles" className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                    <span className="text-[10px] text-white/40">{isActive ? 'Metabolic State Active' : 'System Ready'}</span>
                </div>
                {isActive && (
                    <span className="text-[10px] text-white/30 italic">
                        End: {new Date(parseInt(startTime) + protocol.fast * 3600000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </div>
    );
};

window.FastingTracker = FastingTracker;

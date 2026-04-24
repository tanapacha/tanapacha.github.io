const { useState, useEffect, useRef } = React;

const FocusOverlay = ({ isOpen, onClose, activeGoal, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus');
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        setIsActive(false);
        const next = mode === 'focus' ? 'break' : 'focus';
        setMode(next);
        setTimeLeft(next === 'focus' ? 25 * 60 : 5 * 60);
        if (mode === 'focus') onComplete && onComplete(activeGoal);
    };

    const toggle = () => setIsActive(!isActive);
    const reset = () => { setIsActive(false); setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60); };
    const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    const progress = mode === 'focus' ? 1-(timeLeft/(25*60)) : 1-(timeLeft/(5*60));

    useEffect(() => { if (window.lucide) setTimeout(() => window.lucide.createIcons(), 50); }, [isOpen, isActive, mode]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background:'#09090b' }}>
            {/* Close */}
            <button onClick={onClose}
                className="absolute top-6 right-6 p-3 rounded-xl text-white/20 hover:text-white/60 hover:bg-white/5 transition-all z-50">
                <i data-lucide="X" className="w-5 h-5"></i>
            </button>

            <div className="flex flex-col items-center justify-center w-full px-6">
                {/* Mode badge */}
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-12"
                    style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse' : ''}`}
                        style={{ background: mode === 'focus' ? 'var(--accent)' : 'var(--green)' }} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em]"
                        style={{ color: mode === 'focus' ? 'var(--accent)' : 'var(--green)' }}>
                        {mode === 'focus' ? 'Focus' : 'Break'}
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-white/50 text-lg font-medium tracking-tight mb-12 text-center">
                    {activeGoal ? activeGoal.title : "Deep Focus"}
                </h2>

                {/* Timer */}
                <div onClick={toggle} className="relative cursor-pointer mb-16 group">
                    <svg className="w-56 h-56 lg:w-64 lg:h-64 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        <circle cx="50" cy="50" r="46" fill="none" stroke="var(--accent)" strokeWidth="1.5"
                            strokeLinecap="round" opacity={isActive ? 1 : 0.4}
                            strokeDasharray={`${progress * 289} 289`}
                            style={{ transition:'stroke-dasharray 1s var(--ease)' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-5xl lg:text-6xl font-extralight tabular-nums tracking-tighter transition-colors duration-300
                            ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`}>
                            {fmt(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                    <button onClick={reset} className="p-3 rounded-xl transition-all hover:bg-white/5"
                        style={{ color:'var(--text-tertiary)' }}>
                        <i data-lucide="RotateCcw" className="w-4 h-4"></i>
                    </button>
                    <button onClick={toggle}
                        className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                        style={{ background: isActive ? 'var(--bg-card)' : 'var(--accent)', 
                                 border: isActive ? '1px solid var(--border)' : 'none',
                                 color: isActive ? 'white' : 'var(--text-inverse)' }}>
                        <i data-lucide={isActive ? "Pause" : "Play"} className={`w-5 h-5 ${!isActive ? 'ml-0.5' : ''}`}></i>
                    </button>
                    <button onClick={handleTimerComplete} className="p-3 rounded-xl transition-all hover:bg-white/5"
                        style={{ color:'var(--text-tertiary)' }}>
                        <i data-lucide="SkipForward" className="w-4 h-4"></i>
                    </button>
                </div>

                {/* Quote */}
                <p className="mt-16 max-w-xs text-center text-sm font-light italic" style={{ color:'var(--text-tertiary)' }}>
                    "มุ่งมั่นทำสิ่งที่สำคัญ ทีละขั้นตอน"
                </p>
            </div>
        </div>
    );
};

window.FocusOverlay = FocusOverlay;

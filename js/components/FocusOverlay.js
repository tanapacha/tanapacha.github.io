const { useState, useEffect, useRef } = React;

const FocusOverlay = ({ isOpen, onClose, activeGoal, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // focus | break
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        setIsActive(false);
        const nextMode = mode === 'focus' ? 'break' : 'focus';
        setMode(nextMode);
        setTimeLeft(nextMode === 'focus' ? 25 * 60 : 5 * 60);
        
        if (mode === 'focus') {
            onComplete && onComplete(activeGoal);
            if (window.lucide) setTimeout(() => window.lucide.createIcons(), 100);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
            {/* Cinematic Background */}
            <div className="absolute inset-0 bg-midnight/95 backdrop-blur-[100px] animate-backdrop-in transition-colors duration-2000">
                <div className={`focus-pulse-glow ${isActive ? 'active' : ''}`} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>

            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-10 right-10 p-4 text-white/20 hover:text-white transition-all hover:scale-110 active:scale-95 z-50"
            >
                <i data-lucide="X" className="w-8 h-8"></i>
            </button>

            {/* Focus Content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-6 stagger-children">
                
                {/* Header Information */}
                <div className="text-center mb-20">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-gold/5 border border-gold/20 mb-6">
                        <span className="text-gold font-bold uppercase tracking-[0.4em] text-[10px]">
                            {mode === 'focus' ? 'Deep Focus Session' : 'Moment of Calm'}
                        </span>
                    </div>
                    <h2 className="text-white text-4xl lg:text-5xl font-extralight tracking-tight opacity-90">
                        {activeGoal ? activeGoal.title : "Unlocking Potential"}
                    </h2>
                </div>

                {/* The Aura Visualization (As requested in screenshot aesthetic) */}
                <div className="relative flex items-center justify-center mb-24">
                    {/* Decorative Side Orbs */}
                    <div className="absolute -left-20 w-12 h-12 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hidden md:block opacity-40"></div>
                    <div className="absolute -right-20 w-12 h-12 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hidden md:block opacity-40"></div>
                    
                    {/* Central Breathing Aura Orb */}
                    <div 
                        onClick={toggleTimer}
                        className={`
                            relative w-48 h-48 lg:w-64 lg:h-64 rounded-full cursor-pointer transition-all duration-1000
                            ${isActive ? 'breathing-aura' : 'border border-white/20 hover:border-gold/50'}
                            flex items-center justify-center group
                        `}
                        style={{ background: isActive ? 'var(--aura-primary)' : 'rgba(255,255,255,0.02)' }}
                    >
                        {/* Timer overlay on central orb */}
                        <div className={`text-5xl lg:text-6xl font-extralight tracking-tighter transition-all duration-500 ${isActive ? 'text-midnight scale-90' : 'text-white group-hover:text-gold'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        
                        {!isActive && (
                            <div className="absolute bottom-[-40px] text-[10px] font-bold text-gold/60 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                Tap to begin
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls (Subtle) */}
                <div className="flex items-center gap-12 group/controls opacity-40 hover:opacity-100 transition-opacity duration-500">
                    <button 
                        onClick={resetTimer}
                        className="p-5 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
                        title="Reset Timer"
                    >
                        <i data-lucide="RotateCcw" className="w-5 h-5"></i>
                    </button>
                    
                    <button 
                        onClick={toggleTimer}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all btn-spring ${isActive ? 'bg-white/10 text-white' : 'bg-gold text-midnight shadow-[0_0_50px_rgba(212,175,55,0.3)]'}`}
                    >
                        <i data-lucide={isActive ? "Pause" : "Play"} className={`w-8 h-8 ${!isActive ? 'fill-current ml-1' : ''}`}></i>
                    </button>

                    <button 
                        onClick={handleTimerComplete}
                        className="p-5 rounded-full bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
                        title="Skip to Break"
                    >
                        <i data-lucide="SkipForward" className="w-5 h-5"></i>
                    </button>
                </div>

                {/* AI Inspirational Quote */}
                <div className="mt-24 max-w-sm text-center">
                    <p className="focus-quote text-white/60 italic text-base lg:text-lg leading-relaxed font-light">
                        "หันหลังให้ความไขว้เขว แล้วมุ่งหน้าสู่เป้าหมายที่แท้จริงของคุณ พลัง Aura ของคุณกำลังเปล่งประกาย"
                    </p>
                </div>
            </div>
        </div>
    );
};

window.FocusOverlay = FocusOverlay;

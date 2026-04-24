const { useState, useEffect, useRef } = React;

const FocusOverlay = ({ isOpen, onClose, activeGoal, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus');
    const timerRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    // Particle effect
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = Array.from({ length: 40 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 2 + 0.5,
            o: Math.random() * 0.3 + 0.05,
        }));

        let animId;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 175, 55, ${p.o})`;
                ctx.fill();
            });
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animId);
    }, [isOpen]);

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
    const resetTimer = () => { setIsActive(false); setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60); };
    const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    const progress = mode === 'focus' ? 1-(timeLeft/(25*60)) : 1-(timeLeft/(5*60));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0" style={{ background: '#030405' }}>
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                <div className={`focus-pulse-glow ${isActive ? 'active' : ''}`} style={{ left:'50%',top:'50%',transform:'translate(-50%,-50%)' }} />
                <div className="absolute inset-0 opacity-20" style={{ background:'radial-gradient(ellipse at 50% 30%, var(--aura-glow) 0%, transparent 60%)' }} />
            </div>

            {/* Close */}
            <button onClick={onClose}
                className="absolute top-6 right-6 lg:top-10 lg:right-10 p-3 text-white/15 hover:text-white/60 transition-all hover:scale-110 active:scale-95 z-50 rounded-full hover:bg-white/5">
                <i data-lucide="X" className="w-6 h-6"></i>
            </button>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-6">
                {/* Header */}
                <div className="text-center mb-16 lg:mb-20 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 backdrop-blur-md"
                        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}`}
                            style={{ background: mode==='focus' ? 'var(--aura-primary)' : '#34D399' }} />
                        <span className="font-bold uppercase tracking-[0.3em] text-[10px]"
                            style={{ color: mode==='focus' ? 'var(--aura-primary)' : '#34D399' }}>
                            {mode === 'focus' ? 'Deep Focus' : 'Break Time'}
                        </span>
                    </div>
                    <h2 className="text-white text-3xl lg:text-4xl font-light tracking-tight opacity-80">
                        {activeGoal ? activeGoal.title : "Unlocking Potential"}
                    </h2>
                </div>

                {/* Timer Orb */}
                <div className="relative flex items-center justify-center mb-16 lg:mb-20">
                    <div onClick={toggleTimer}
                        className={`relative w-56 h-56 lg:w-72 lg:h-72 rounded-full cursor-pointer transition-all duration-700
                            ${isActive ? 'breathing-aura' : 'hover:scale-[1.02]'}
                            flex items-center justify-center group`}
                        style={{ 
                            background: isActive ? 'var(--aura-primary)' : 'rgba(255,255,255,0.02)',
                            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            boxShadow: isActive ? '0 0 80px var(--aura-glow)' : 'none',
                        }}>
                        {!isActive && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
                                <circle cx="50" cy="50" r="48" fill="none" stroke="var(--aura-primary)" strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${progress * 301.6} 301.6`}
                                    style={{ transition:'stroke-dasharray 1s ease', filter:'drop-shadow(0 0 6px var(--aura-glow))' }} />
                            </svg>
                        )}
                        <div className={`text-5xl lg:text-7xl font-extralight tabular-nums tracking-tighter transition-all duration-500 
                            ${isActive ? 'text-[#0A0C10]' : 'text-white group-hover:text-gold'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-8 opacity-30 hover:opacity-100 transition-opacity duration-500">
                    <button onClick={resetTimer} className="p-4 rounded-full border transition-all hover:scale-110 active:scale-95"
                        style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)' }}>
                        <i data-lucide="RotateCcw" className="w-4 h-4"></i>
                    </button>
                    <button onClick={toggleTimer}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all btn-spring
                            ${isActive ? '' : 'shadow-[0_0_40px_var(--aura-glow)]'}`}
                        style={{ background: isActive ? 'rgba(255,255,255,0.08)' : 'var(--aura-primary)', color: isActive ? 'white' : '#0A0C10' }}>
                        <i data-lucide={isActive ? "Pause" : "Play"} className={`w-6 h-6 ${!isActive ? 'fill-current ml-0.5' : ''}`}></i>
                    </button>
                    <button onClick={handleTimerComplete} className="p-4 rounded-full border transition-all hover:scale-110 active:scale-95"
                        style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)' }}>
                        <i data-lucide="SkipForward" className="w-4 h-4"></i>
                    </button>
                </div>

                {/* Quote */}
                <div className="mt-16 lg:mt-20 max-w-sm text-center">
                    <p className="focus-quote text-white/40 italic text-sm lg:text-base leading-relaxed font-light">
                        "หันหลังให้ความไขว้เขว แล้วมุ่งหน้าสู่เป้าหมายที่แท้จริงของคุณ"
                    </p>
                </div>
            </div>
        </div>
    );
};

window.FocusOverlay = FocusOverlay;

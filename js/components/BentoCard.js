const { useRef, useEffect: useEffectBento, useState: useStateBento } = React;

/**
 * SafeIcon — React-safe Lucide icon renderer
 */
const SafeIcon = ({ name, className = "" }) => {
    const iconRef = useRef(null);

    useEffectBento(() => {
        if (iconRef.current && window.lucide) {
            iconRef.current.innerHTML = '';
            const i = document.createElement('i');
            i.dataset.lucide = name;
            i.className = className;
            iconRef.current.appendChild(i);
            window.lucide.createIcons({ elements: [i] });
        }
    }, [name, className]);

    return <span ref={iconRef} className="inline-flex items-center justify-center" />;
};

window.SafeIcon = SafeIcon;

// Updated Premium Category color mapping (OKLCH based)
const categoryColors = {
    gold:    { bg: 'rgba(212,175,55,0.08)', border: 'rgba(212,175,55,0.25)', text: '#D4AF37', glow: 'rgba(212,175,55,0.15)' },
    blue:    { bg: 'rgba(55,140,220,0.08)', border: 'rgba(55,140,220,0.25)', text: '#378CDC', glow: 'rgba(55,140,220,0.15)' },
    emerald: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', text: '#34D399', glow: 'rgba(52,211,153,0.15)' },
    violet:  { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)', text: '#A78BFA', glow: 'rgba(167,139,250,0.15)' },
    rose:    { bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.25)', text: '#FB7185', glow: 'rgba(251,113,133,0.15)' },
    cyan:    { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.25)', text: '#22D3EE', glow: 'rgba(34,211,238,0.15)' },
    orange:  { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', text: '#FB923C', glow: 'rgba(251,146,60,0.15)' },
    default: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.4)', glow: 'transparent' },
};

const BentoCard = ({ title, subtitle, children, className = "", icon = null, gold = false, accent = null, delay = 0, style = {}, isLoading = false }) => {
    const cardRef = useRef(null);

    // Scroll-reveal
    useEffectBento(() => {
        const el = cardRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.style.animationPlayState = 'running';
                    observer.unobserve(el);
                }
            },
            { threshold: 0.05 }
        );

        el.style.animation = `fadeInUp 0.8s cubic-bezier(0.2,1,0.2,1) ${delay}s both`;
        el.style.animationPlayState = 'paused';

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    // Very Subtle mouse tilt
    useEffectBento(() => {
        const el = cardRef.current;
        if (!el || window.innerWidth < 1024) return;

        const onMouseMove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rotX = ((y - cy) / cy) * -1.5; // Reduced from 2
            const rotY = ((x - cx) / cx) * 1.5; // Reduced from 2
            el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
        };

        const onMouseLeave = () => {
            el.style.transform = '';
            el.style.transition = 'all 0.6s cubic-bezier(0.2,1,0.2,1)';
        };

        el.addEventListener('mousemove', onMouseMove);
        el.addEventListener('mouseleave', onMouseLeave);

        return () => {
            el.removeEventListener('mousemove', onMouseMove);
            el.removeEventListener('mouseleave', onMouseLeave);
        };
    }, []);

    const colorKey = gold ? 'gold' : (accent || 'default');
    const colors = categoryColors[colorKey] || categoryColors.default;

    if (isLoading) {
        return (
            <div className={`bento-card p-6 flex flex-col gap-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                        <div className="h-2 w-16 bg-white/5 rounded-full animate-pulse" />
                        <div className="h-5 w-32 bg-white/10 rounded-lg animate-pulse" />
                    </div>
                    <div className="w-10 h-10 bg-white/5 rounded-xl animate-pulse" />
                </div>
                <div className="flex-1 space-y-3">
                    <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div
            ref={cardRef}
            className={`bento-card ${className} flex flex-col p-7`}
            style={{
                ...style,
                borderColor: gold ? colors.border : undefined,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex-1 min-w-0">
                    {subtitle && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
                            style={{ color: colors.text, opacity: 0.8 }}>
                            {subtitle}
                        </p>
                    )}
                    <h3 className="text-xl font-bold tracking-tight truncate text-white">
                        {title}
                    </h3>
                </div>

                {icon && (
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                        style={{
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            boxShadow: `0 8px 20px -5px ${colors.glow}`
                        }}>
                        <SafeIcon name={icon} className="w-5 h-5" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 relative">
                {children}
            </div>
        </div>
    );
};

window.BentoCard = BentoCard;

const { useRef, useEffect: useEffectCard } = React;

/* Safe Lucide Icon Renderer */
const SafeIcon = ({ name, className = "" }) => {
    const ref = useRef(null);
    useEffectCard(() => {
        if (ref.current && window.lucide) {
            ref.current.innerHTML = '';
            const i = document.createElement('i');
            i.dataset.lucide = name;
            i.className = className;
            ref.current.appendChild(i);
            window.lucide.createIcons({ elements: [i] });
        }
    }, [name, className]);
    return <span ref={ref} className="inline-flex items-center justify-center" />;
};
window.SafeIcon = SafeIcon;

/* Color mapping — clean & minimal */
const accentMap = {
    gold:    { color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.15)' },
    blue:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.15)' },
    emerald: { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.15)' },
    violet:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
    rose:    { color: '#fb7185', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.15)' },
    cyan:    { color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.15)' },
    orange:  { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.15)' },
    default: { color: '#a1a1aa', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
};

const BentoCard = ({ title, subtitle, children, className = "", icon = null, gold = false, accent = null, delay = 0, style = {}, isLoading = false }) => {
    const cardRef = useRef(null);

    // Scroll reveal
    useEffectCard(() => {
        const el = cardRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { el.style.animationPlayState = 'running'; obs.unobserve(el); }
        }, { threshold: 0.05 });
        el.style.animation = `fadeInUp .5s var(--ease) ${delay}s both`;
        el.style.animationPlayState = 'paused';
        obs.observe(el);
        return () => obs.disconnect();
    }, [delay]);

    const key = gold ? 'gold' : (accent || 'default');
    const colors = accentMap[key] || accentMap.default;

    if (isLoading) {
        return (
            <div className={`bento-card ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-2 flex-1">
                        <div className="h-2 w-12 skeleton rounded" />
                        <div className="h-5 w-28 skeleton rounded" />
                    </div>
                    <div className="w-9 h-9 skeleton rounded-xl" />
                </div>
                <div className="h-16 skeleton rounded-xl" />
            </div>
        );
    }

    return (
        <div ref={cardRef} className={`bento-card ${className}`} style={style}>
            {/* Header */}
            {(title || icon) && (
                <div className="flex items-center justify-between mb-5">
                    <div className="flex-1 min-w-0">
                        {subtitle && (
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1" style={{ color: colors.color }}>
                                {subtitle}
                            </p>
                        )}
                        {title && (
                            <h3 className="text-[15px] font-semibold text-white/90 truncate">{title}</h3>
                        )}
                    </div>
                    {icon && (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: colors.bg, color: colors.color }}>
                            <SafeIcon name={icon} className="w-4 h-4" />
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="relative">{children}</div>
        </div>
    );
};

window.BentoCard = BentoCard;

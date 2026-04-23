const { useRef, useEffect: useEffectBento, useState: useStateBento } = React;

/**
 * SafeIcon Component
 * Prevents Lucide from crashing React during re-renders by using a ref
 * and managing the icon lifecycle outside of React's virtual DOM.
 */
const SafeIcon = ({ name, className = "" }) => {
    const iconRef = useRef(null);

    useEffectBento(() => {
        if (iconRef.current && window.lucide) {
            // Create a disposable container for Lucide
            iconRef.current.innerHTML = ''; 
            const i = document.createElement('i');
            i.dataset.lucide = name;
            i.className = className;
            iconRef.current.appendChild(i);
            
            // Tell Lucide to only look at this specific element
            window.lucide.createIcons({
                elements: [i]
            });
        }
    }, [name, className]);

    return <span ref={iconRef} className="inline-flex items-center justify-center" />;
};

window.SafeIcon = SafeIcon;

window.SafeIcon = SafeIcon;

const BentoCard = ({ title, subtitle, children, className = "", icon = null, gold = false, delay = 0, expandable = true, style = {} }) => {
    const cardRef = useRef(null);
    const [isExpanded, setIsExpanded] = useStateBento(false);

    // Scroll-reveal via IntersectionObserver
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
            { threshold: 0.08 }
        );

        // Start paused, play on reveal
        el.style.animation = `fadeInUp 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s both`;
        el.style.animationPlayState = 'paused';

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    // Subtle mouse-tracking tilt
    useEffectBento(() => {
        const el = cardRef.current;
        if (!el) return;

        const onMouseMove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rotX = ((y - cy) / cy) * -4;
            const rotY = ((x - cx) / cx) * 4;
            el.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-5px) scale(1.005)`;
        };

        const onMouseLeave = () => {
            el.style.transform = '';
            el.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s cubic-bezier(0.22,1,0.36,1), border-color 0.35s ease';
        };

        const onMouseEnter = () => {
            el.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease, border-color 0.3s ease';
        };

        el.addEventListener('mousemove', onMouseMove);
        el.addEventListener('mouseleave', onMouseLeave);
        el.addEventListener('mouseenter', onMouseEnter);

        return () => {
            el.removeEventListener('mousemove', onMouseMove);
            el.removeEventListener('mouseleave', onMouseLeave);
            el.removeEventListener('mouseenter', onMouseEnter);
        };
    }, []);

    const toggleExpand = () => {
        if (!expandable) return;
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(15);
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            {isExpanded && (
                <div 
                    className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
                    onClick={toggleExpand}
                />
            )}
            <div
                ref={cardRef}
                onClick={toggleExpand}
                className={`bento-card ${className} ${gold ? 'border-gold/30' : ''} flex flex-col ${isExpanded ? 'expanded' : ''} ${expandable ? 'cursor-pointer' : ''}`}
                style={{
                    ...style,
                    boxShadow: gold && !isExpanded
                        ? '0 0 0 1px rgba(212,175,55,0.15), 0 10px 40px -10px rgba(0,0,0,0.5)'
                        : style.boxShadow || undefined,
                }}
            >
            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.15em]">
                        {subtitle}
                    </h3>
                    <h2
                        className="text-2xl font-semibold mt-1 transition-colors duration-300"
                        style={{ color: gold ? '#D4AF37' : 'white' }}
                    >
                        {title}
                    </h2>
                </div>

                {icon && (
                    <div
                        className="p-3 rounded-xl transition-all duration-300"
                        style={{
                            background: gold
                                ? 'rgba(212,175,55,0.12)'
                                : 'rgba(255,255,255,0.05)',
                            color: gold ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                        }}
                    >
                        <SafeIcon name={icon} className="w-5 h-5" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`flex-1 relative ${isExpanded ? 'mt-4' : ''}`}>
                {children}
            </div>

            {isExpanded && (
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                    <SafeIcon name="X" className="w-5 h-5" />
                </button>
            )}
        </div>
        </>
    );
};

window.BentoCard = BentoCard;

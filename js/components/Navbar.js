const Navbar = () => {
    const { useState, useEffect, useRef } = React;

    const mainItems = [
        { name: 'หน้าหลัก', icon: 'LayoutDashboard', href: 'index.html' },
        { name: 'ตารางสอน', icon: 'GraduationCap', href: 'timetable.html' },
        { name: 'สุขภาพ', icon: 'Heart', href: 'health.html' },
        { name: 'การเงิน', icon: 'Wallet', href: 'finance.html' },
        { name: 'ผู้ช่วย AI', icon: 'Sparkles', href: 'ai-assistant.html' },
    ];

    const moreItems = [
        { name: 'ปฏิทิน', icon: 'CalendarDays', href: 'calendar.html' },
        { name: 'ตารางชีวิต', icon: 'Clock', href: 'schedule.html' },
        { name: 'โฟกัส', icon: 'Brain', href: 'focus.html' },
        { name: 'บันทึก', icon: 'BookOpen', href: 'journal.html' },
        { name: 'เป้าหมาย', icon: 'Target', href: 'goals.html' },
    ];

    const currentPath = window.location.pathname;
    const [scrolled, setScrolled] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [moreOpen]);

    const isActive = (href) => {
        return currentPath.includes(href) || (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html')));
    };

    const triggerHaptic = () => {
        if (window.navigator?.vibrate) window.navigator.vibrate(10);
    };

    return (
        <>
            {/* ═══ Desktop Top Nav ═══ */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 hidden lg:block ${scrolled ? 'py-3 nav-blur shadow-2xl' : 'py-6 bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-10 flex items-center justify-between">
                    {/* Logo */}
                    <a href="index.html" className="flex items-center gap-3 group" onClick={triggerHaptic}>
                        <div className="w-10 h-10 rounded-[10px] overflow-hidden transition-all duration-500 group-hover:rotate-[5deg] group-hover:scale-110"
                            style={{ boxShadow: '0 0 20px var(--aura-glow)' }}>
                            <img src="icon.png" alt="Aura Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-lg font-bold tracking-tighter text-white">Aura <span className="text-secondary font-medium">LifeOS</span></span>
                    </a>

                    {/* Nav Items */}
                    <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                        {[...mainItems, ...moreItems].slice(0, 7).map((item) => {
                            const active = isActive(item.href);
                            return (
                                <a key={item.name} href={item.href} onClick={triggerHaptic}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2
                                        ${active ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>
                                    <i data-lucide={item.icon} className={`w-4 h-4 ${active ? 'text-gold' : ''}`} />
                                    <span>{item.name}</span>
                                </a>
                            );
                        })}
                    </div>

                    {/* Profile/Settings */}
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                            <i data-lucide="Bell" className="w-5 h-5 text-white/50" />
                        </button>
                        <div className="w-10 h-10 rounded-full border-2 border-gold/30 p-0.5">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aura" className="w-full h-full rounded-full bg-midnight" alt="User" />
                        </div>
                    </div>
                </div>
            </nav>

            {/* ═══ Mobile Bottom Tab Bar ═══ */}
            <div className="lg:hidden bottom-nav safe-padding">
                {mainItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <a key={item.name} href={item.href} onClick={triggerHaptic}
                            className={`relative flex flex-col items-center gap-1 py-1 transition-all duration-300 ${active ? 'scale-110' : 'opacity-40'}`}>
                            <i data-lucide={item.icon} className={`w-6 h-6 ${active ? 'text-gold' : 'text-white'}`} style={{ strokeWidth: active ? 2.5 : 2 }} />
                            <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-white/50'}`}>{item.name}</span>
                            {active && <div className="absolute -bottom-2 w-1 h-1 bg-gold rounded-full shadow-[0_0_8px_var(--aura-primary)]" />}
                        </a>
                    );
                })}
                
                {/* More Button */}
                <button ref={moreRef} onClick={() => { setMoreOpen(!moreOpen); triggerHaptic(); }}
                    className={`flex flex-col items-center gap-1 py-1 transition-all duration-300 ${moreOpen ? 'scale-110' : 'opacity-40'}`}>
                    <i data-lucide={moreOpen ? "X" : "MoreHorizontal"} className="w-6 h-6 text-white" />
                    <span className="text-[10px] font-bold text-white/50">เพิ่มเติม</span>
                    
                    {moreOpen && (
                        <div className="absolute bottom-20 right-0 w-56 bg-[#11141d]/95 backdrop-blur-2xl border border-white/10 rounded-[24px] p-2 shadow-2xl animate-fade-in flex flex-col gap-1">
                            {moreItems.map(item => (
                                <a key={item.name} href={item.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all">
                                    <i data-lucide={item.icon} className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{item.name}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </button>
            </div>
        </>
    );
};

window.Navbar = Navbar;

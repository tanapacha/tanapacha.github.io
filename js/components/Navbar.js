const Navbar = () => {
    const { useState, useEffect, useRef } = React;

    const mainItems = [
        { name: 'หน้าหลัก', icon: 'LayoutDashboard', href: 'index.html' },
        { name: 'ตารางสอน', icon: 'GraduationCap', href: 'timetable.html' },
        { name: 'สุขภาพ', icon: 'Heart', href: 'health.html' },
        { name: 'การเงิน', icon: 'Wallet', href: 'finance.html' },
        { name: 'AI', icon: 'Sparkles', href: 'ai-assistant.html' },
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
        const fn = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    useEffect(() => {
        const fn = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
        document.addEventListener('click', fn);
        return () => document.removeEventListener('click', fn);
    }, []);

    useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [moreOpen]);

    const isActive = (href) => currentPath.includes(href) || (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html')));

    return (
        <>
            {/* ═══ Desktop ═══ */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] hidden lg:block transition-all duration-300 ${scrolled ? 'nav-blur py-3' : 'py-5 bg-transparent'}`}>
                <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between">
                    {/* Logo */}
                    <a href="index.html" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
                            <img src="icon.png" alt="Aura" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[15px] font-semibold tracking-tight text-white/90">Aura</span>
                    </a>

                    {/* Center Nav */}
                    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                        {[...mainItems, ...moreItems].slice(0, 7).map(item => {
                            const active = isActive(item.href);
                            return (
                                <a key={item.name} href={item.href}
                                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center gap-1.5
                                        ${active
                                            ? 'bg-white/10 text-white'
                                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                                        }`}>
                                    <i data-lucide={item.icon} className="w-3.5 h-3.5" style={{ strokeWidth: active ? 2.2 : 1.8 }} />
                                    <span>{item.name}</span>
                                </a>
                            );
                        })}
                    </div>

                    {/* Right */}
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/6 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                        <i data-lucide="User" className="w-3.5 h-3.5 text-white/40" />
                    </div>
                </div>
            </nav>

            {/* ═══ Mobile Bottom Bar ═══ */}
            <div className="lg:hidden bottom-nav">
                {mainItems.map(item => {
                    const active = isActive(item.href);
                    return (
                        <a key={item.name} href={item.href}
                            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200
                                ${active ? '' : 'opacity-35'}`}>
                            <i data-lucide={item.icon} className={`w-5 h-5 ${active ? 'text-accent' : 'text-white'}`}
                                style={{ strokeWidth: active ? 2.2 : 1.8, color: active ? 'var(--accent)' : undefined }} />
                            <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-white/50'}`}>{item.name}</span>
                        </a>
                    );
                })}

                {/* More */}
                <button ref={moreRef} onClick={() => setMoreOpen(!moreOpen)}
                    className={`relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 ${moreOpen ? '' : 'opacity-35'}`}>
                    <i data-lucide={moreOpen ? 'X' : 'MoreHorizontal'} className="w-5 h-5 text-white" style={{ strokeWidth: 1.8 }} />
                    <span className="text-[10px] font-medium text-white/50">เพิ่มเติม</span>

                    {moreOpen && (
                        <div className="absolute bottom-16 right-0 w-52 p-1.5 rounded-2xl shadow-lg animate-fade-in"
                            style={{ background:'rgba(24,24,27,0.98)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(20px)' }}>
                            {moreItems.map(item => (
                                <a key={item.name} href={item.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
                                    <i data-lucide={item.icon} className="w-4 h-4" style={{ strokeWidth: 1.8 }} />
                                    <span className="text-[13px] font-medium">{item.name}</span>
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

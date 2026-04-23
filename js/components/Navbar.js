const Navbar = () => {
    const navItems = [
        { name: 'หน้าหลัก', icon: 'LayoutDashboard', href: 'index.html' },
        { name: 'ปฏิทิน', icon: 'CalendarDays', href: 'calendar.html' },
        { name: 'ตารางชีวิต', icon: 'Clock', href: 'schedule.html' },
        { name: 'ตารางสอน', icon: 'GraduationCap', href: 'timetable.html' },
        { name: 'โฟกัส', icon: 'Brain', href: 'focus.html' },
        { name: 'บันทึก', icon: 'BookOpen', href: 'journal.html' },
        { name: 'เป้าหมาย', icon: 'Target', href: 'goals.html' },
        { name: 'การเงิน', icon: 'Wallet', href: 'finance.html' },
        { name: 'สุขภาพ', icon: 'Activity', href: 'health.html' },
        { name: 'ผู้ช่วย AI', icon: 'Sparkles', href: 'ai-assistant.html' },
    ];

    const currentPath = window.location.pathname;

    return (
        <nav
            className="fixed z-50 transition-all duration-500
                       bottom-0 left-0 w-full h-20 border-t flex flex-row justify-around px-2 py-2
                       lg:bottom-auto lg:top-0 lg:h-full lg:w-24 lg:border-r lg:border-t-0 lg:flex-col lg:items-center lg:py-8"
            style={{
                background: 'oklch(14% 0.025 265 / 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderColor: 'rgba(255,255,255,0.06)'
            }}
        >
            {/* Logo - Desktop only */}
            <div className="hidden lg:flex mb-12 float-slow">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
                    style={{
                        background: 'linear-gradient(135deg, #D4AF37, #F0D060)',
                        boxShadow: '0 0 28px rgba(212,175,55,0.4), 0 4px 16px rgba(0,0,0,0.3)',
                    }}
                >
                    <span className="text-midnight font-bold text-xl" style={{ color: '#0A0C10' }}>A</span>
                </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 flex flex-row lg:flex-col gap-1 lg:gap-2 w-full lg:px-2 justify-around items-center relative">
                
                {navItems.map((item, i) => {
                    const isActive = currentPath.includes(item.href);
                    return (
                        <a
                            key={item.name}
                            href={item.href}
                            onClick={() => {
                                if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
                            }}
                            className={`group relative flex flex-col items-center gap-1 py-1 lg:py-3 px-2 rounded-2xl transition-all duration-300 flex-1 lg:flex-none
                                ${isActive ? 'lg:bg-gold/10' : ''}
                            `}
                            style={{
                                animationDelay: `${0.05 + i * 0.06}s`,
                            }}
                        >

                            {/* Active gold bar (Desktop) */}
                            {isActive && (
                                <div
                                    className="hidden lg:block nav-active-indicator absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold rounded-full"
                                />
                            )}

                            {/* Icon wrapper */}
                            <div
                                className="p-2 lg:p-2.5 rounded-xl transition-all duration-300 icon-bounce"
                                style={{
                                    background: isActive ? 'rgba(212,175,55,0.15)' : 'transparent',
                                }}
                            >
                                <i
                                    data-lucide={item.icon}
                                    className="w-5 h-5 lg:w-6 lg:h-6 transition-all duration-300"
                                    style={{ color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.4)' }}
                                />
                            </div>

                            {/* Label */}
                            <span
                                className="hidden lg:block text-[10px] lg:text-[9px] font-medium tracking-wide transition-all duration-300"
                                style={{
                                    color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                                    opacity: isActive ? 1 : 0.6,
                                    maxHeight: '16px',
                                    overflow: 'hidden',
                                }}
                            >
                                {item.name}
                            </span>

                            {/* Hover tooltip (Desktop only) */}
                            {!isActive && (
                                <span
                                    className="hidden lg:block absolute left-full ml-3 px-3 py-1.5 bg-zinc-900 border border-white/10 text-white text-xs rounded-xl whitespace-nowrap
                                               opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 -translate-x-2 z-50"
                                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                                >
                                    {item.name}
                                </span>
                            )}
                        </a>
                    );
                })}
            </div>

            {/* Settings (Desktop only visually, or optional) */}
            <button
                className="hidden lg:flex p-3 rounded-2xl transition-all duration-300 hover:bg-white/5 icon-bounce"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onClick={() => {
                    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
                    // Toggle OLED mode for testing
                    document.body.classList.toggle('theme-oled');
                }}
            >
                <i data-lucide="Settings" className="w-5 h-5" />
            </button>
        </nav>

    );
};

window.Navbar = Navbar;

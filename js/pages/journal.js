const { useState, useEffect, useRef } = React;
const Navbar = window.Navbar;
const BentoCard = window.BentoCard;

const JournalPage = () => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [journalEntries, setJournalEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentAura, setCurrentAura] = useState('neutral');

    // Sentiment Heuristic
    useEffect(() => {
        const text = content.toLowerCase();
        if (text.length === 0) {
            setCurrentAura('neutral');
            return;
        }
        const positiveWords = ['ดี', 'รัก', 'สำเร็จ', 'แฮปปี้', 'ขอบคุณ', 'ชอบ', 'สวย', 'เก่ง', 'ภูมิใจ', 'great', 'happy', 'success', 'love'];
        const negativeWords = ['เหนื่อย', 'หนัก', 'แย่', 'เครียด', 'กลัว', 'เบื่อ', 'ท้อ', 'tired', 'sad', 'bad', 'stress', 'fear'];
        const hasPos = positiveWords.some(w => text.includes(w));
        const hasNeg = negativeWords.some(w => text.includes(w));
        if (hasPos && !hasNeg) setCurrentAura('positive');
        else if (hasNeg && !hasPos) setCurrentAura('negative');
        else setCurrentAura('neutral');
    }, [content]);

    const getAuraColor = () => {
        if (currentAura === 'positive') return 'var(--aura-sentiment-positive)';
        if (currentAura === 'negative') return 'var(--aura-sentiment-negative)';
        return 'var(--aura-sentiment-neutral)';
    };

    // Load Entries
    useEffect(() => {
        const loadEntries = async () => {
            setIsLoading(true);
            // Optimization: Only fetch journal data
            const data = await window.gasClient.fetchData("journal");
            if (data && data.journal) setJournalEntries(data.journal);
            setIsLoading(false);
            if (window.lucide) setTimeout(() => window.lucide.createIcons(), 100);
        };
        loadEntries();
    }, []);

    const handleSave = async () => {
        if (!content.trim()) return;
        setIsSaving(true);
        try {
            await window.gasClient.saveJournal({
                content,
                auraColor: getAuraColor(),
                sentiment: currentAura,
                date: new Date().toISOString()
            });
            setContent('');
            // Optimization: Only reload journal entries
            const data = await window.gasClient.fetchData("journal");
            if (data && data.journal) setJournalEntries(data.journal);
        } catch (error) {
            console.error("Failed to save journal", error);
        }
        setIsSaving(false);
    };

    return (
        <div className="app-container lg:pt-20">
            <Navbar />

            <main className="flex-1 min-h-screen p-6 lg:p-12 relative flex flex-col lg:flex-row gap-8">
                
                {/* Writing Area */}
                <div className="flex-1 flex flex-col stagger-children z-10">
                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: getAuraColor() }} />
                             <p className="text-gold font-bold uppercase tracking-[0.3em] text-[10px]">Recording Golden Moments</p>
                        </div>
                        <h1 className="text-white text-3xl lg:text-5xl font-light">Aura Journal</h1>
                    </header>

                    <div 
                        className="relative flex-1 bg-white/[0.02] border border-white/10 rounded-[40px] p-8 lg:p-12 mb-8 transition-all duration-1000 overflow-hidden"
                        style={{ boxShadow: `inset 0 0 80px -20px ${getAuraColor()}22` }}
                    >
                        {/* Decorative background aura inside editor */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 blur-[120px] rounded-full pointer-events-none" style={{ background: `${getAuraColor()}15` }} />
                        
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="ปล่อยใจให้ไหลไปกับตัวอักษร... วันนี้มีอะไรที่คุณอยากบันทึกไว้ไหม?"
                            className="w-full h-full bg-transparent text-white text-xl lg:text-2xl font-light leading-relaxed placeholder-white/10 outline-none resize-none z-10 relative"
                            disabled={isSaving}
                        />

                        <div className="absolute bottom-8 right-12 flex items-center gap-4 animate-fade-in">
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Emotional Tone: {currentAura}</span>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving || !content.trim()}
                                className={`
                                    px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95
                                    ${isSaving ? 'opacity-50' : 'hover:scale-105'}
                                `}
                                style={{ background: getAuraColor(), color: currentAura === 'neutral' ? '#0A0C10' : 'white' }}
                            >
                                {isSaving ? <div className="thinking-dot scale-75" /> : <><i data-lucide="Save" className="w-5 h-5"></i> <span>บันทึก Aura วันนี้</span></>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* History Sidebar */}
                <div className="w-full lg:w-96 flex flex-col gap-6 animate-fade-in z-10">
                    <BentoCard title="ความทรงจำที่ผ่านมา" subtitle="Journal History" icon="BookOpen">
                        <div className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            {isLoading ? (
                                <div className="py-12 flex justify-center"><div className="thinking-dot"></div></div>
                            ) : journalEntries.length === 0 ? (
                                <p className="text-xs text-white/20 italic text-center py-4">ยังไม่มีบันทึกสำหรับวันนี้</p>
                            ) : journalEntries.sort((a,b) => new Date(b.date) - new Date(a.date)).map((entry, i) => (
                                <div 
                                    key={i} 
                                    className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 border-l-2 transition-all hover:bg-white/5 cursor-default group"
                                    style={{ borderLeftColor: entry.auraColor || 'var(--aura-primary)' }}
                                >
                                    <p className="text-sm text-white/80 line-clamp-3 leading-relaxed mb-3">"{entry.content}"</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-white/30 uppercase tracking-tighter">
                                            {new Date(entry.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: entry.auraColor || 'var(--aura-primary)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </BentoCard>
                </div>

                {/* Ambient Aura Background Layer */}
                <div className="fixed inset-0 pointer-events-none opacity-20 transition-colors duration-2000" style={{ background: `radial-gradient(circle at center, ${getAuraColor()}44 0%, transparent 70%)` }} />
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<JournalPage />);

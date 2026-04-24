const { useState, useEffect } = React;

const JournalModal = ({ isOpen, onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [currentAura, setCurrentAura] = useState('neutral'); // neutral | positive | negative

    // Real-time sentiment analysis (simple heuristic)
    useEffect(() => {
        const text = content.toLowerCase();
        if (text.length === 0) { setCurrentAura('neutral'); return; }
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

    const handleSave = async () => {
        if (!content.trim()) return;
        setIsSaving(true);
        try {
            await onSave({ content, auraColor: getAuraColor(), sentiment: currentAura });
            setContent('');
            setIsSaving(false);
            onClose();
        } catch (error) {
            console.error("Failed to save aura record", error);
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-end lg:items-center justify-center lg:p-6">
            <div className="absolute inset-0 bg-[#030405]/90 backdrop-blur-2xl" onClick={onClose} />
            
            <div className="relative w-full lg:max-w-xl rounded-t-[32px] lg:rounded-[32px] p-8 lg:p-10 modal-sheet lg:modal-panel shadow-2xl overflow-hidden"
                style={{ 
                    background: 'rgba(12,14,20,0.98)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: `0 0 80px -20px ${getAuraColor()}, 0 20px 60px -10px rgba(0,0,0,0.6)`,
                    maxHeight: '90vh',
                }}>
                {/* Gradient glow */}
                <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full blur-[120px] opacity-20 transition-colors duration-1000"
                    style={{ background: getAuraColor() }} />
                <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[120px] opacity-10 transition-colors duration-1000"
                    style={{ background: getAuraColor() }} />
                
                {/* Header */}
                <div className="relative z-10 mb-8 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                             <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: getAuraColor() }} />
                             <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.25em]">Record your Aura</h3>
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Golden Moment</h2>
                        <p className="text-sm text-white/50 mt-2 font-light">วันนี้เป็นอย่างไรบ้าง? บันทึกสิ่งที่ทำให้คุณรู้สึกพิเศษ</p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                        <i data-lucide="X" className="w-5 h-5"></i>
                    </button>
                </div>

                {/* Text Area */}
                <div className="relative z-10">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="เล่าเรื่องราวที่ประทับใจ หรือสิ่งที่ได้เรียนรู้ในวันนี้..."
                        className="w-full h-56 bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-white placeholder-white/20 focus:border-gold/30 focus:bg-white/5 outline-none transition-all resize-none leading-relaxed text-lg font-light"
                        disabled={isSaving}
                    />
                    <div className="absolute bottom-4 right-6 text-[10px] text-white/10 font-bold uppercase tracking-widest">
                        Aura: {currentAura}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 mt-10 flex justify-end items-center gap-6">
                    <button onClick={onClose} className="text-sm font-medium text-white/40 hover:text-white transition-colors">
                        Skip for now
                    </button>
                    <button onClick={handleSave} disabled={isSaving || !content.trim()}
                        className={`relative px-10 py-4 font-bold rounded-2xl transition-all duration-500 flex items-center gap-3
                            ${isSaving ? 'opacity-70 scale-95' : 'hover:scale-105 active:scale-95'}`}
                        style={{ 
                            background: getAuraColor(),
                            color: currentAura === 'neutral' ? '#0A0C10' : 'white',
                            boxShadow: `0 10px 40px -5px ${getAuraColor()}44`
                        }}>
                        {isSaving ? <div className="thinking-dot scale-75" /> : (
                            <><i data-lucide="Stars" className="w-5 h-5"></i><span>บันทึก Aura วันนี้</span></>
                        )}
                    </button>
                </div>
                
                <div className="absolute top-0 left-0 w-full h-[2px] opacity-40 transition-colors duration-1000"
                    style={{ background: `linear-gradient(90deg, transparent, ${getAuraColor()}, transparent)` }} />
            </div>
        </div>
    );
};

window.JournalModal = JournalModal;

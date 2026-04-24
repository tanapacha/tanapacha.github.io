const { useState, useEffect } = React;

const JournalModal = ({ isOpen, onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [currentAura, setCurrentAura] = useState('neutral');

    useEffect(() => {
        const text = content.toLowerCase();
        if (!text.length) { setCurrentAura('neutral'); return; }
        const pos = ['ดี','รัก','สำเร็จ','แฮปปี้','ขอบคุณ','ชอบ','สวย','เก่ง','ภูมิใจ','great','happy','success','love'];
        const neg = ['เหนื่อย','หนัก','แย่','เครียด','กลัว','เบื่อ','ท้อ','tired','sad','bad','stress','fear'];
        const hasP = pos.some(w => text.includes(w));
        const hasN = neg.some(w => text.includes(w));
        if (hasP && !hasN) setCurrentAura('positive');
        else if (hasN && !hasP) setCurrentAura('negative');
        else setCurrentAura('neutral');
    }, [content]);

    const auraColor = currentAura === 'positive' ? 'var(--aura-sentiment-positive)' : currentAura === 'negative' ? 'var(--aura-sentiment-negative)' : 'var(--aura-sentiment-neutral)';

    const handleSave = async () => {
        if (!content.trim()) return;
        setIsSaving(true);
        try {
            await onSave({ content, auraColor, sentiment: currentAura });
            setContent(''); setIsSaving(false); onClose();
        } catch (e) { console.error("Save failed", e); setIsSaving(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-end lg:items-center justify-center lg:p-6">
            <div className="absolute inset-0 modal-backdrop" style={{ background:'rgba(9,9,11,0.85)', backdropFilter:'blur(8px)' }} onClick={onClose} />
            
            <div className="relative w-full lg:max-w-lg rounded-t-2xl lg:rounded-2xl p-6 lg:p-8 modal-sheet lg:modal-panel overflow-hidden"
                style={{ background:'#18181b', border:'1px solid var(--border)', maxHeight:'90vh' }}>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: auraColor }} />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color:'var(--text-tertiary)' }}>Record your Aura</span>
                        </div>
                        <h2 className="text-xl font-semibold text-white">บันทึกวันนี้</h2>
                        <p className="text-sm mt-1" style={{ color:'var(--text-tertiary)' }}>วันนี้เป็นอย่างไรบ้าง?</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color:'var(--text-tertiary)' }}>
                        <i data-lucide="X" className="w-5 h-5"></i>
                    </button>
                </div>

                {/* Textarea */}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="เล่าเรื่องราวที่ประทับใจ..."
                    className="w-full h-48 rounded-xl p-4 text-white placeholder-white/20 outline-none resize-none text-[15px] leading-relaxed font-light input-glow"
                    style={{ background:'var(--bg-input)', border:'1px solid var(--border)' }}
                    disabled={isSaving}
                />

                {/* Footer */}
                <div className="mt-6 flex justify-between items-center">
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color:'var(--text-tertiary)' }}>
                        Aura: {currentAura}
                    </span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn-ghost text-sm px-4 py-2 rounded-lg">ข้าม</button>
                        <button onClick={handleSave} disabled={isSaving || !content.trim()}
                            className="btn-primary text-sm px-5 py-2 rounded-lg flex items-center gap-2 disabled:opacity-40">
                            {isSaving ? <div className="thinking-dot" /> : <><i data-lucide="Stars" className="w-4 h-4"></i><span>บันทึก</span></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.JournalModal = JournalModal;

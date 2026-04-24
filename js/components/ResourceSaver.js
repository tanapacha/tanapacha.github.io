const { useState } = React;

const ResourceSaver = ({ onSave, resources = [] }) => {
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!title || !url) return;
        setIsSaving(true);
        await onSave({ title, url });
        setTitle('');
        setUrl('');
        setIsSaving(false);
    };

    return (
        <div className="space-y-5">
            <form onSubmit={handleSave} className="space-y-3">
                <input 
                    type="text" 
                    placeholder="หัวข้อความรู้..." 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3.5 rounded-2xl text-sm text-white outline-none transition-all input-glow"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                />
                <div className="flex gap-2">
                    <input 
                        type="url" 
                        placeholder="ลิงก์ (URL)..." 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 p-3.5 rounded-2xl text-sm text-white outline-none transition-all input-glow"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                    <button 
                        type="submit"
                        disabled={isSaving || !title || !url}
                        className="px-5 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                        style={{ background: '#A78BFA', color: '#08090d' }}
                    >
                        {isSaving ? <div className="thinking-dot scale-50" /> : <i data-lucide="Plus" className="w-5 h-5"></i>}
                    </button>
                </div>
            </form>

            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {resources.length === 0 ? (
                    <div className="text-center py-8 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                        <p className="text-3xl mb-2">📚</p>
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>ยังไม่ได้บันทึกแหล่งความรู้</p>
                    </div>
                ) : (
                    resources.slice().reverse().map((res, i) => (
                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group hover:scale-[1.01]"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor='rgba(167,139,250,0.25)'; e.currentTarget.style.background='rgba(167,139,250,0.04)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}>
                            <div className="p-2 rounded-xl" style={{ background: 'rgba(167,139,250,0.08)' }}>
                                <i data-lucide="ExternalLink" className="w-3.5 h-3.5" style={{ color: '#A78BFA' }}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-white/80 group-hover:text-white truncate block">{res.title}</span>
                            </div>
                            <span className="text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)' }}>
                                {res.category || 'General'}
                            </span>
                        </a>
                    ))
                )}
            </div>
        </div>
    );
};

window.ResourceSaver = ResourceSaver;

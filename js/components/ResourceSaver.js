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
        setTitle(''); setUrl(''); setIsSaving(false);
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSave} className="space-y-2">
                <input type="text" placeholder="หัวข้อ..." value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 rounded-xl text-sm text-white outline-none input-glow"
                    style={{ background:'var(--bg-input)', border:'1px solid var(--border)' }} />
                <div className="flex gap-2">
                    <input type="url" placeholder="URL..." value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 p-3 rounded-xl text-sm text-white outline-none input-glow"
                        style={{ background:'var(--bg-input)', border:'1px solid var(--border)' }} />
                    <button type="submit" disabled={isSaving || !title || !url}
                        className="px-4 rounded-xl font-semibold transition-all disabled:opacity-30 btn-primary">
                        {isSaving ? <div className="thinking-dot scale-50" /> : <i data-lucide="Plus" className="w-4 h-4"></i>}
                    </button>
                </div>
            </form>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                {resources.length === 0 ? (
                    <div className="text-center py-6 rounded-xl" style={{ border:'1px dashed var(--border)' }}>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color:'var(--text-tertiary)' }}>ยังไม่มีแหล่งความรู้</p>
                    </div>
                ) : (
                    resources.slice().reverse().map((res, i) => (
                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group hover:bg-white/[0.04]"
                            style={{ border:'1px solid var(--border)' }}>
                            <div className="p-1.5 rounded-lg" style={{ background:'var(--violet-subtle)' }}>
                                <i data-lucide="ExternalLink" className="w-3 h-3" style={{ color:'var(--violet)' }}></i>
                            </div>
                            <span className="flex-1 text-sm font-medium text-white/70 group-hover:text-white truncate">{res.title}</span>
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ background:'var(--bg-card)', color:'var(--text-tertiary)' }}>
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

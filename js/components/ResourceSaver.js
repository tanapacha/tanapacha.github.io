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
        <div className="space-y-4">
            <form onSubmit={handleSave} className="space-y-3">
                <input 
                    type="text" 
                    placeholder="หัวข้อความรู้..." 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm text-white focus:border-gold/50 outline-none transition-all"
                />
                <div className="flex gap-2">
                    <input 
                        type="url" 
                        placeholder="ลิงก์ (URL)..." 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl text-sm text-white focus:border-gold/50 outline-none transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={isSaving || !title || !url}
                        className="px-4 bg-gold text-midnight rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <div className="thinking-dot scale-50" /> : <i data-lucide="Plus" className="w-5 h-5"></i>}
                    </button>
                </div>
            </form>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {resources.length === 0 ? (
                    <p className="text-center text-[10px] text-white/20 italic py-4">ยังไม่ได้บันทึกแหล่งความรู้</p>
                ) : (
                    resources.slice().reverse().map((res, i) => (
                        <a 
                            key={i} 
                            href={res.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-gold/30 hover:bg-white/[0.08] transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-medium text-white group-hover:text-gold truncate max-w-[150px]">{res.title}</span>
                                <span className="text-[9px] text-white/30 uppercase">{res.category || 'General'}</span>
                            </div>
                        </a>
                    ))
                )}
            </div>
        </div>
    );
};

window.ResourceSaver = ResourceSaver;

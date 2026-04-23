const { useState, useEffect, useRef } = React;
const { motion } = window.Motion || { motion: (props) => <div {...props} /> };
const Navbar = window.Navbar;
const BentoCard = window.BentoCard;

/* ── SVG Ring Progress ───────────────────────── */
const RingProgress = ({ percent, size = 72, stroke = 6, color = '#D4AF37' }) => {
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const dash = (percent / 100) * circumference;

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
            <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - dash}
                className="progress-ring-circle"
                style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
            />
        </svg>
    );
};

/* ── Goal Card ───────────────────────────────── */
const GoalCard = ({ goal, idx, onUpdate, onDelete }) => {
    const pct = Math.min(100, Math.round((goal.progress / goal.total) * 100));
    const isDone = pct >= 100;

    return (
        <div
            className="bento-card flex flex-col hover:scale-[1.025]"
            style={{
                animationDelay: `${0.06 + idx * 0.08}s`,
                animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
            }}
        >
            {/* Status badge */}
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
                    {goal.status}
                </span>
                <span className={`text-[10px] px-2 py-1 rounded-full ${
                    isDone
                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                        : 'bg-gold/10 text-gold border border-gold/20'
                }`}>
                    {isDone ? '✓ สำเร็จ' : `${pct}%`}
                </span>
            </div>

            {/* Title + Ring */}
            <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-white truncate">{goal.title}</h2>
                    <p className="text-text-secondary text-sm mt-1">
                        {goal.progress} <span className="text-white/20">/</span> {goal.total} {goal.unit}
                    </p>
                </div>
                <div className="flex-shrink-0 relative flex items-center justify-center">
                    <RingProgress percent={pct} size={72} color={isDone ? '#4ade80' : '#D4AF37'} />
                    <span className="absolute text-xs font-bold" style={{ color: isDone ? '#4ade80' : '#D4AF37' }}>
                        {pct}%
                    </span>
                </div>
            </div>

            {/* Bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-5">
                <div
                    className="h-full rounded-full progress-bar-animated"
                    style={{
                        width: `${pct}%`,
                        background: isDone
                            ? 'linear-gradient(90deg, #22c55e88, #4ade80)'
                            : 'linear-gradient(90deg, rgba(212,175,55,0.6), #D4AF37)',
                        animationDelay: `${0.15 + idx * 0.08}s`,
                    }}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
                <button
                    onClick={() => onUpdate(goal.id, goal.progress, goal.total)}
                    className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border border-gold/20 text-gold
                               hover:bg-gold hover:text-midnight transition-all duration-300 active:scale-95 btn-spring"
                    disabled={isDone}
                    style={{ opacity: isDone ? 0.4 : 1 }}
                >
                    +1 ความคืบหน้า
                </button>
                <button
                    onClick={() => onDelete(goal.id, goal.title)}
                    className="p-2.5 rounded-xl border border-white/5 text-white/20 hover:text-red-400 hover:border-red-400/30
                               hover:bg-red-400/5 transition-all duration-300 active:scale-95"
                >
                    <i data-lucide="Trash2" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

/* ── Overview Ring (large) ───────────────────── */
const OverviewRing = ({ pct }) => {
    const size = 140; const stroke = 10;
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const dash = (pct / 100) * circumference;

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
            <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke="#D4AF37" strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - dash}
                className="progress-ring-circle"
                style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.5))' }}
            />
        </svg>
    );
};

/* ── Main Goals Page ─────────────────────────── */
const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: '', total: 100, unit: '%' });
    const [isSaving, setIsSaving] = useState(false);

    const loadGoals = async (silent = false) => {
        if (!silent) setIsLoading(true);
        // Optimization: Only fetch goals data
        const data = await window.gasClient.fetchData("goals");
        if (data && data.goals) setGoals(data.goals);
        setIsLoading(false);
        if (window.lucide) setTimeout(() => window.lucide.createIcons(), 100);
    };

    useEffect(() => { loadGoals(); }, []);

    const handleUpdateProgress = async (goalId, current, total) => {
        const next = Math.min(total, current + 1);
        
        // Optimistic UI Update
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress: next } : g));
        
        try {
            await window.gasClient.updateGoal(goalId, next);
            // Silent refresh to sync official data
            loadGoals(true);
        } catch (e) {
            console.error("Goal update error", e);
            alert("ไม่สามารถบันทึกความคืบหน้าลงระบบได้ครับ");
        }
    };

    const handleDeleteGoal = async (goalId, title) => {
        if (!window.confirm(`ลบเป้าหมาย "${title}" ใช่ไหม?`)) return;
        
        // Optimistic UI Update
        const backup = [...goals];
        setGoals(prev => prev.filter(g => g.id !== goalId));

        try {
            const result = await window.gasClient.deleteGoal(goalId);
            if (result.status !== "success") {
                setGoals(backup);
                alert("เกิดข้อผิดพลาดในการลบครับ");
            }
        } catch {
            setGoals(backup);
            alert("ไม่สามารถเชื่อมต่อเพื่อลบข้อมูลได้");
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Optimistic Entry
        const tempId = 'temp-' + Date.now();
        const optimisticGoal = { ...newGoal, id: tempId, progress: 0, status: 'กำลังดำเนินการ' };
        setGoals(prev => [...prev, optimisticGoal]);
        setIsModalOpen(false);

        try {
            const result = await window.gasClient.addGoal(newGoal);
            if (result.status === "success") {
                setNewGoal({ title: '', total: 100, unit: '%' });
                loadGoals(true); // Silent reload to get the real ID
            } else {
                setGoals(prev => prev.filter(g => g.id !== tempId));
                alert("เกิดข้อผิดพลาด: " + (result.message || "Unknown"));
            }
        } catch { 
            setGoals(prev => prev.filter(g => g.id !== tempId));
            alert("ไม่สามารถเชื่อมต่อเพื่อเพิ่มเป้าหมายได้"); 
        }
        setIsSaving(false);
    };

    const overallPct = goals.length > 0
        ? Math.round(goals.reduce((a, g) => a + g.progress / g.total, 0) / goals.length * 100)
        : 0;

    return (
        <div className="app-container lg:pl-24">
            <Navbar />

            <main className="flex-1 min-h-screen p-6 lg:p-12 aurora-bg">
                {/* Header */}
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in">
                    <div>
                        <p className="text-gold font-medium mb-1 lg:mb-2 header-greeting" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                            SUCCESS TRACKING
                        </p>
                        <h1 className="text-white text-3xl lg:text-5xl header-title">เป้าหมายชีวิต</h1>
                        <p className="text-text-secondary text-base lg:text-lg mt-2 header-subtitle max-w-md">
                            คุณกำลังเข้าใกล้เป้าหมายใน {goals.length} ด้านสำคัญ
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full md:w-auto px-6 py-4 font-bold rounded-2xl flex items-center justify-center gap-2 btn-gold btn-spring"
                        style={{ animationDelay: '0.22s', animation: 'fadeInUp 0.65s cubic-bezier(0.16,1,0.3,1) both' }}
                    >
                        <i data-lucide="Plus" className="w-5 h-5" />
                        เพิ่มเป้าหมายใหม่
                    </button>
                </header>


                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="flex justify-center gap-2">
                                <span className="thinking-dot" />
                                <span className="thinking-dot" />
                                <span className="thinking-dot" />
                            </div>
                            <p className="text-gold mt-4 text-sm">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : goals.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-text-secondary space-y-3">
                            <p className="text-4xl">🎯</p>
                            <p>ไม่พบเป้าหมาย กรุณาเพิ่มข้อมูลใน Google Sheets</p>
                        </div>
                    ) : (
                        goals.map((goal, idx) => (
                            <GoalCard
                                key={goal.id || idx}
                                goal={goal}
                                idx={idx}
                                onUpdate={handleUpdateProgress}
                                onDelete={handleDeleteGoal}
                            />
                        ))
                    )}

                    {/* Overview card */}
                    {!isLoading && goals.length > 0 && (
                        <div
                            style={{
                                animation: `fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${0.06 + goals.length * 0.08}s both`,
                            }}
                        >
                            <BentoCard title="ภาพรวมทั้งหมด" subtitle="Total Progress" icon="TrendingUp" gold={true}>
                                <div className="mt-6 flex flex-col items-center justify-center py-4">
                                    <div className="relative flex items-center justify-center float-slow">
                                        <OverviewRing pct={overallPct} />
                                        <div className="absolute text-center">
                                            <span className="text-3xl font-bold text-white">{overallPct}</span>
                                            <span className="text-gold text-xs block">%</span>
                                        </div>
                                    </div>
                                    <p className="text-center text-sm text-text-secondary mt-5 max-w-[180px] leading-relaxed">
                                        {overallPct >= 80 ? '🔥 ยอดเยี่ยมมาก! เกือบถึงเป้าหมายแล้ว'
                                            : overallPct >= 50 ? '🚀 คุณทำได้ดีมาก! สู้ต่อไปนะ'
                                            : '💪 เริ่มต้นดีแล้ว สม่ำเสมอคือกุญแจสำคัญ'}
                                    </p>
                                </div>
                            </BentoCard>
                        </div>
                    )}
                </div>

                {/* Add Goal Modal */}
                {isModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-backdrop"
                        style={{ background: 'rgba(10,12,16,0.75)', backdropFilter: 'blur(12px)' }}
                        onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
                    >
                        <div
                            className="modal-panel bg-zinc-900 border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl"
                            style={{ boxShadow: '0 0 60px rgba(212,175,55,0.1), 0 25px 80px rgba(0,0,0,0.6)' }}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <p className="text-gold text-xs font-bold uppercase tracking-widest mb-1">New Goal</p>
                                    <h1 className="text-2xl text-white">เพิ่มเป้าหมายใหม่</h1>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/30
                                               hover:text-white hover:border-white/30 transition-all duration-200 active:scale-90"
                                >
                                    <i data-lucide="X" className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleAddGoal} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs text-text-secondary uppercase tracking-widest pl-1">ชื่อเป้าหมาย</label>
                                    <input
                                        required type="text"
                                        placeholder="เช่น อ่านหนังสือ, ลดน้ำหนัก..."
                                        className="w-full bg-white/5 border border-white/8 p-4 rounded-2xl text-white input-glow"
                                        value={newGoal.title}
                                        onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-secondary uppercase tracking-widest pl-1">เป้าหมายรวม</label>
                                        <input
                                            required type="number"
                                            className="w-full bg-white/5 border border-white/8 p-4 rounded-2xl text-white input-glow"
                                            value={newGoal.total}
                                            onChange={(e) => setNewGoal({...newGoal, total: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-secondary uppercase tracking-widest pl-1">หน่วยนับ</label>
                                        <input
                                            required type="text"
                                            placeholder="%, หน้า, ครั้ง..."
                                            className="w-full bg-white/5 border border-white/8 p-4 rounded-2xl text-white input-glow"
                                            value={newGoal.unit}
                                            onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <button
                                    disabled={isSaving} type="submit"
                                    className="w-full py-4 font-bold rounded-2xl transition-all btn-gold btn-spring disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="thinking-dot" style={{width:'6px',height:'6px'}} />
                                            <span className="thinking-dot" style={{width:'6px',height:'6px'}} />
                                            <span className="thinking-dot" style={{width:'6px',height:'6px'}} />
                                            <span className="ml-1">กำลังบันทึก...</span>
                                        </span>
                                    ) : 'ยืนยันการเพิ่มเป้าหมาย'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Goals />);

const { useState, useEffect } = React;
const { motion } = window.Motion || { motion: (props) => <div {...props} /> };
const Navbar = window.Navbar;
const BentoCard = window.BentoCard;

const Schedule = () => {
    console.log("Rendering Schedule", { Navbar, BentoCard, motion });
    const [selectedDate, setSelectedDate] = useState("");
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        startTime: '08:00',
        endTime: '09:00',
        description: ''
    });

    const loadTasks = async (dateParam, silent = false) => {
        if (!silent) setIsLoading(true);
        // Optimization: Only fetch events data
        const data = await window.gasClient.fetchData("events");
        if (data && data.events) {
            const filtered = data.events.filter(e => e.start.startsWith(dateParam));
            setTasks(filtered);
        }
        setIsLoading(false);
        if (window.lucide) {
            setTimeout(() => window.lucide.createIcons(), 100);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const dateParam = params.get('date') || new Date().toISOString().split('T')[0];
        setSelectedDate(dateParam);
        loadTasks(dateParam);
    }, []);

    const handleAddEvent = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const cleanStart = newEvent.startTime.replace('.', ':');
            const cleanEnd = newEvent.endTime.replace('.', ':');
            
            const startDate = new Date(`${selectedDate}T${cleanStart}:00`);
            let endDate = new Date(`${selectedDate}T${cleanEnd}:00`);

            if (endDate < startDate) {
                endDate.setDate(endDate.getDate() + 1);
            }

            const eventPayload = {
                title: newEvent.title,
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                description: newEvent.description
            };

            setIsModalOpen(false);
            setNewEvent({ title: '', startTime: '08:00', endTime: '09:00', description: '' });

            const result = await window.gasClient.addEvent(eventPayload);

            if (result && result.status === "success") {
                loadTasks(selectedDate, true); 
            } else {
                alert("เกิดข้อผิดพลาดในการบันทึกกิจกรรมครับ");
                loadTasks(selectedDate);
            }
        } catch (error) {
            alert("ไม่สามารถเชื่อมต่อกับระบบปฏิทินได้");
        }
        setIsSaving(false);
    };

    const handleDeleteEvent = async (eventId, title) => {
        if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรม "${title}"?`)) return;

        // Optimistic UI Update
        const backup = [...tasks];
        setTasks(prev => prev.filter(t => t.id !== eventId));

        try {
            const result = await window.gasClient.deleteEvent(eventId);
            if (result && result.status === "success") {
                // Already updated optimistically
            } else {
                alert("ไม่สามารถลบกิจกรรมได้ในขณะนี้");
                setTasks(backup);
            }
        } catch (error) {
            console.error("Delete error:", error);
            setTasks(backup);
        }
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className="app-container lg:pt-20">
            <Navbar />
            
            <main className="flex-1 min-h-screen p-6 lg:p-12 bg-midnight">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in">
                    <div>
                        <a href="calendar.html" className="text-gold flex items-center gap-2 text-sm mb-2 hover:underline">
                            <i data-lucide="ArrowLeft" className="w-4 h-4"></i> กลับไปปฏิทิน
                        </a>
                        <h1 className="text-white text-3xl lg:text-5xl">จัดการตารางชีวิต</h1>
                        <p className="text-text-secondary text-base lg:text-lg mt-1">{formatDisplayDate(selectedDate)}</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full md:w-auto px-6 py-4 bg-gold text-midnight font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                    >
                        <i data-lucide="Plus" className="w-5 h-5"></i> เพิ่มกิจกรรมใหม่
                    </button>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Unified Scrollable Container */}
                    <div className="flex-1 relative bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-y-auto custom-scrollbar h-[60vh] lg:h-[70vh] shadow-inner shadow-black/50">
                        <div className="relative min-w-[600px] flex" style={{ height: '2400px' }}>
                            {/* Time Column (Inside scroll) */}
                            <div className="w-16 md:w-24 border-r border-white/[0.05] flex flex-col">
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <div key={i} className="h-[100px] flex justify-center pt-2 text-[10px] md:text-xs font-medium text-text-secondary/50">
                                        {String(i).padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>

                            {/* Grid Area */}
                            <div className="flex-1 relative">
                                {/* Hour Lines */}
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <div key={i} className="absolute w-full border-t border-white/[0.03]" style={{ top: `${i * 100}px`, height: '100px' }}></div>
                                ))}

                                {/* Tasks */}
                                {isLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-gold animate-pulse">กำลังโหลดตาราง...</div>
                                ) : tasks.length === 0 ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm">
                                        ไม่มีกิจกรรมสำหรับวันนี้
                                    </div>
                                ) : tasks.map((task, idx) => {
                                    const startTime = new Date(task.start);
                                    let endTime = new Date(task.end);
                                    
                                    // Fix for existing bugged data: if exactly 24 hours, treat as 0 duration
                                    if (endTime - startTime === 24 * 60 * 60 * 1000) {
                                        endTime = new Date(startTime);
                                    }

                                    const startOffset = startTime.getHours() * 100 + (startTime.getMinutes() / 60) * 100;
                                    let duration = (endTime - startTime) / (1000 * 60 * 60);
                                    
                                    // Cap visual duration to not overflow the 24h timeline
                                    const startHourFloat = startTime.getHours() + startTime.getMinutes() / 60;
                                    if (startHourFloat + duration > 24) {
                                        duration = 24 - startHourFloat;
                                    }
                                    
                                    const isShort = duration < 0.25;

                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            key={task.id || idx}
                                            className={`absolute left-2 right-4 ${isShort ? 'px-3 py-1' : 'p-3 md:p-4'} rounded-[14px] shadow-xl flex flex-col justify-start overflow-hidden group cursor-pointer backdrop-blur-md`}
                                            style={{ 
                                                top: `${startOffset + 2}px`, 
                                                height: `${Math.max(isShort ? 28 : 45, duration * 100 - 4)}px`,
                                                zIndex: 10 + idx,
                                                background: 'linear-gradient(145deg, rgba(212,175,55,0.08), rgba(212,175,55,0.01))',
                                                border: '1px solid rgba(212,175,55,0.1)',
                                                borderLeft: '4px solid #D4AF37'
                                            }}
                                        >
                                            <div className={`flex justify-between ${isShort ? 'items-center' : 'items-start'} gap-4`}>
                                                <div className={`flex-1 ${isShort ? 'flex items-center gap-3' : ''}`}>
                                                    <h4 className={`text-white font-medium leading-snug line-clamp-1 group-hover:text-gold transition-colors ${isShort ? 'text-xs md:text-sm' : 'text-xs md:text-base'}`}>{task.title}</h4>
                                                    {!isShort && (
                                                        <span className="text-[10px] md:text-xs text-gold/70 mt-1 flex items-center gap-1 font-light tracking-wide">
                                                            <i data-lucide="Clock" className="w-[10px] h-[10px] md:w-3 md:h-3" />
                                                            {startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                    {isShort && (
                                                        <span className="text-[10px] text-gold/70 font-light tracking-wide flex items-center gap-1">
                                                            <i data-lucide="Clock" className="w-[10px] h-[10px]" />
                                                            {startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteEvent(task.id, task.title);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                                                >
                                                    <i data-lucide="Trash2" className="w-4 h-4"></i>
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Side panel for AI Suggestions - Stacks on mobile */}
                    <div className="w-full lg:w-80 space-y-6">
                        <BentoCard title="AI Suggestion" subtitle="Smart Assistant" gold={true}>
                            <p className="text-sm text-text-secondary italic leading-relaxed">
                                "คุณสามารถให้ AI ช่วยวิเคราะห์ตารางเวลาและจัดสรรมันให้มีประสิทธิภาพสูงสุดได้"
                            </p>
                            <a href="ai-assistant.html" className="inline-block text-center mt-4 w-full py-3 bg-gold/10 text-gold text-xs font-bold rounded-xl border border-gold/20 hover:bg-gold/20 transition-all">คุยกับ AI ทันที</a>
                        </BentoCard>
                        
                        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                            <h3 className="text-white font-medium mb-4">สถานะวันนี้</h3>
                            {tasks.length > 0 ? (() => {
                                const now = new Date();
                                const completed = tasks.filter(t => new Date(t.end) < now).length;
                                const percent = Math.round((completed / tasks.length) * 100);
                                return (
                                    <>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gold transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                            </div>
                                            <span className="text-sm text-gold font-bold">{percent}%</span>
                                        </div>
                                        <p className="text-[10px] text-text-secondary mt-2">
                                            ทำสำเร็จ {completed} จาก {tasks.length} กิจกรรม
                                        </p>
                                    </>
                                );
                            })() : (
                                <p className="text-[10px] text-text-secondary mt-2">ยังไม่มีกิจกรรม</p>
                            )}
                        </div>
                    </div>
                </div>


                {/* Event Creation Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-midnight/80 backdrop-blur-sm animate-fade-in">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-gold font-medium mb-1">New Activity</h2>
                                    <h1 className="text-2xl text-white">เพิ่มกิจกรรมใหม่</h1>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                                    <i data-lucide="X" className="w-6 h-6"></i>
                                </button>
                            </div>

                            <form onSubmit={handleAddEvent} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs text-text-secondary uppercase tracking-widest pl-1">ชื่อกิจกรรม</label>
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="เช่น ออกกำลังกาย, ประชุมงาน..."
                                        className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-white focus:border-gold/50 outline-none transition-all"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-secondary uppercase tracking-widest pl-1">เวลาเริ่ม (เช่น 14:30)</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="HH:mm"
                                            pattern="([01]?[0-9]|2[0-3])[:.][0-5][0-9]"
                                            className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-white focus:border-gold/50 outline-none transition-all"
                                            value={newEvent.startTime}
                                            onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-text-secondary uppercase tracking-widest pl-1">เวลาจบ (เช่น 15:45)</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="HH:mm"
                                            pattern="([01]?[0-9]|2[0-3])[:.][0-5][0-9]"
                                            className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-white focus:border-gold/50 outline-none transition-all"
                                            value={newEvent.endTime}
                                            onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-text-secondary uppercase tracking-widest pl-1">รายละเอียด (ไม่บังคับ)</label>
                                    <textarea 
                                        rows="2"
                                        className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-white focus:border-gold/50 outline-none transition-all resize-none"
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                    ></textarea>
                                </div>
                                <button 
                                    disabled={isSaving}
                                    type="submit" 
                                    className="w-full py-4 bg-gold text-midnight font-bold rounded-2xl shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "กำลังบันทึกลง Google Calendar..." : "บันทึกกิจกรรมลงปฏิทิน"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Schedule />);

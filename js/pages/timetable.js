const { useState, useEffect, useMemo, Component } = React;
const Navbar = window.Navbar;
const SafeIcon = window.SafeIcon;

// Error Boundary Component
class TimetableErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error("Timetable Crash:", error, info); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-midnight p-10 flex items-center justify-center text-white">
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-red-500/30 max-w-lg text-center">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">ขออภัย! เกิดข้อผิดพลาด</h2>
                        <p className="text-white/40 mb-6">{this.state.error?.message || 'Unknown Error'}</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gold text-midnight font-bold rounded-2xl">
                            โหลดหน้าใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const DAYS_TH = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const LEVELS = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const TimetableContent = () => {
    const [timetable, setTimetable] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    const todayIndex = useMemo(() => {
        const d = new Date().getDay();
        return (d === 0 || d === 6) ? 0 : d - 1;
    }, []);
    
    const [activeDay, setActiveDay] = useState(todayIndex);

    const [formData, setFormData] = useState({
        subject: 'วิทยาการคำนวณ',
        section: 'ป.1',
        room: 'ห้องคอมพิวเตอร์',
        onlineLink: '',
        day: 'จันทร์',
        startTime: '09:00',
        endTime: '10:00',
        color: '#D4AF37'
    });

    useEffect(() => {
        loadData();
    }, []);

    const formatDisplayTime = (str) => {
        if (!str) return "00:00";
        try {
            const s = String(str).trim();
            if (s.includes('T') || s.includes('-')) {
                const d = new Date(s);
                if (!isNaN(d.getTime())) {
                    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                }
            }
            const match = s.match(/(\d{1,2})[:.](\d{2})/);
            if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
            return s;
        } catch (e) { return "00:00"; }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await window.gasClient.fetchData('timetable');
            if (data && data.timetable && Array.isArray(data.timetable)) {
                const normalized = data.timetable
                    .filter(item => item !== null)
                    .map(item => ({
                        ...item,
                        day: (item.day || '').trim(),
                        startTime: formatDisplayTime(item.startTime),
                        endTime: formatDisplayTime(item.endTime)
                    }));
                setTimetable(normalized);
            }
        } catch (error) {
            console.error("Load Timetable Error:", error);
        }
        setIsLoading(false);
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            setEditingItem(null);
            setFormData({
                subject: 'วิทยาการคำนวณ',
                section: 'ป.1',
                room: 'ห้องคอมพิวเตอร์',
                onlineLink: '',
                day: DAYS_TH[activeDay] || 'จันทร์',
                startTime: '09:00',
                endTime: '10:00',
                color: '#D4AF37'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await window.gasClient.addTimetableItem(formData);
            if (res && res.status === 'success') {
                await loadData();
                setIsModalOpen(false);
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (err) {
            console.error("Save Error:", err);
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        }
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('คุณต้องการลบตารางการสอนนี้ใช่หรือไม่?')) return;
        setIsLoading(true);
        try {
            const res = await window.gasClient.deleteTimetableItem(id);
            if (res && res.status === 'success') {
                await loadData();
            } else {
                alert('เกิดข้อผิดพลาดในการลบ');
            }
        } catch (err) {
            console.error("Delete Error:", err);
        }
        setIsLoading(false);
    };

    const activeDayClasses = useMemo(() => {
        const currentDayName = DAYS_TH[activeDay];
        return timetable
            .filter(item => item.day === currentDayName)
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }, [timetable, activeDay]);

    return (
        <div className="app-container lg:pl-24">
            {Navbar && <Navbar />}

            <main className="flex-1 min-h-screen p-6 lg:p-12 bg-midnight text-white">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center text-gold shadow-lg shadow-gold/10">
                                    {SafeIcon ? <SafeIcon name="GraduationCap" className="w-6 h-6" /> : <span>🎓</span>}
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight">ตารางสอนระดับประถม</h1>
                            </div>
                            <p className="text-white/40 text-sm flex items-center gap-2">
                                {SafeIcon && <SafeIcon name="Monitor" className="w-4 h-4" />}
                                ห้องคอมพิวเตอร์ | ป.1 - ป.6
                            </p>
                        </div>
                        <button 
                            onClick={() => handleOpenModal()}
                            className="px-8 py-4 bg-gold text-midnight font-bold rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 group"
                        >
                            {SafeIcon && <SafeIcon name="Plus" className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />}
                            เพิ่มคาบสอน
                        </button>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <aside className="lg:col-span-3 space-y-3">
                            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                                {DAYS_TH.map((day, idx) => (
                                    <button
                                        key={day}
                                        onClick={() => setActiveDay(idx)}
                                        className={`px-6 py-4 rounded-[2rem] flex items-center justify-between min-w-[140px] lg:w-full transition-all duration-300
                                            ${activeDay === idx 
                                                ? 'bg-gold text-midnight shadow-2xl shadow-gold/20 scale-[1.03] z-10' 
                                                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${activeDay === idx ? 'text-midnight/40' : 'text-white/20'}`}>
                                                {DAYS_EN[idx]?.substring(0, 3)}
                                            </span>
                                            <span className="font-bold text-lg">{day}</span>
                                        </div>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black
                                            ${activeDay === idx ? 'bg-midnight/10 text-midnight' : 'bg-white/10 text-white/40'}
                                        `}>
                                            {timetable.filter(t => t.day === day).length}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className="lg:col-span-9 space-y-6">
                            {isLoading ? (
                                <div className="py-24 text-center flex flex-col items-center">
                                    <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mb-6"></div>
                                    <p className="text-white/30 font-medium tracking-wide">กำลังดึงข้อมูลล่าสุดจาก Aura...</p>
                                </div>
                            ) : activeDayClasses.length === 0 ? (
                                <div className="py-24 text-center bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[3rem]">
                                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/10 mx-auto mb-8 shadow-inner">
                                        {SafeIcon && <SafeIcon name="Coffee" className="w-12 h-12" />}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-white/60">ว่างยาวๆ เลยพาร์ทเนอร์</h3>
                                    <p className="text-white/30 text-lg">ไม่มีคาบสอนในวัน{DAYS_TH[activeDay]}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 animate-fade-in">
                                    {activeDayClasses.map((item) => (
                                        <div 
                                            key={item.id}
                                            className="group relative bg-white/[0.03] border border-white/5 rounded-[3rem] p-10 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500 shadow-xl"
                                        >
                                            <div 
                                                className="absolute top-0 left-0 w-2.5 h-full opacity-60 rounded-l-[3rem]"
                                                style={{ backgroundColor: item.color }}
                                            ></div>

                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] bg-gold/10 text-gold shadow-sm">
                                                            Grade {item.section || 'N/A'}
                                                        </span>
                                                        <span className="text-white/20 font-bold">•</span>
                                                        <span className="text-white/40 font-bold flex items-center gap-2">
                                                            {SafeIcon && <SafeIcon name="Monitor" className="w-4 h-4" />}
                                                            {item.room || 'ห้องคอมพิวเตอร์'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        <p className="text-gold font-bold text-lg">ชั้น {item.section}</p>
                                                        <h3 className="text-4xl font-black group-hover:text-gold transition-colors duration-300">
                                                            {item.subject}
                                                        </h3>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-8 text-lg text-white/40 font-bold">
                                                        <div className="flex items-center gap-3">
                                                            {SafeIcon && <SafeIcon name="Clock" className="w-6 h-6 text-gold/60" />}
                                                            <span className="font-mono text-white/60">{item.startTime} - {item.endTime}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 self-end md:self-center">
                                                    {item.onlineLink && (
                                                        <a href={item.onlineLink} target="_blank" className="w-14 h-14 bg-gold text-midnight rounded-2xl hover:scale-110 transition-all flex items-center justify-center shadow-lg">
                                                            {SafeIcon && <SafeIcon name="ExternalLink" className="w-6 h-6" />}
                                                        </a>
                                                    )}
                                                    <button 
                                                        onClick={() => handleOpenModal(item)} 
                                                        className="w-14 h-14 bg-white/5 text-white/40 rounded-2xl hover:bg-white/10 hover:text-white hover:scale-110 transition-all flex items-center justify-center shadow-lg"
                                                    >
                                                        {SafeIcon && <SafeIcon name="Edit2" className="w-6 h-6" />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)} 
                                                        className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white hover:scale-110 transition-all flex items-center justify-center shadow-lg group/del"
                                                    >
                                                        {SafeIcon && <SafeIcon name="Trash2" className="w-6 h-6 group-hover/del:rotate-12 transition-transform" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-midnight/90 backdrop-blur-xl animate-fade-in">
                        <div className="bg-zinc-900 border border-white/10 w-full max-w-xl rounded-[4rem] overflow-hidden shadow-2xl scale-in">
                            <form onSubmit={handleSave}>
                                <div className="p-12 space-y-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-4xl font-black mb-2">{editingItem ? 'แก้ไขคาบสอน' : 'เพิ่มคาบสอน'}</h2>
                                            <p className="text-white/30 font-medium">จัดการตารางสอนห้องคอมพิวเตอร์</p>
                                        </div>
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                                            {SafeIcon && <SafeIcon name="X" className="w-7 h-7" />}
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-white/20 uppercase tracking-[0.3em] ml-2">ชื่อวิชา / หัวข้อที่สอน</label>
                                            <input 
                                                required 
                                                type="text" 
                                                value={formData.subject} 
                                                onChange={e => setFormData({...formData, subject: e.target.value})} 
                                                className="w-full bg-white/5 border-2 border-white/5 rounded-3xl px-8 py-5 outline-none focus:border-gold/50 text-xl font-bold transition-all"
                                                placeholder="เช่น วิทยาการคำนวณ, พื้นฐานการใช้คอมฯ"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-white/20 uppercase tracking-[0.3em] ml-2">ระดับชั้น</label>
                                                <select 
                                                    required 
                                                    value={formData.section} 
                                                    onChange={e => setFormData({...formData, section: e.target.value})} 
                                                    className="w-full bg-white/5 border-2 border-white/5 rounded-3xl px-8 py-5 outline-none focus:border-gold/50 text-xl font-bold appearance-none transition-all"
                                                >
                                                    {LEVELS.map(lv => <option key={lv} value={lv} className="bg-zinc-900">{lv}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-white/20 uppercase tracking-[0.3em] ml-2">สีประจำชั้น</label>
                                                <div className="flex gap-4 items-center h-[68px]">
                                                    <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="flex-1 h-full bg-white/5 border-2 border-white/5 rounded-3xl p-2 cursor-pointer" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-white/20 uppercase tracking-[0.3em] ml-2">วันสอน</label>
                                                <select value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} className="w-full bg-white/5 border-2 border-white/5 rounded-3xl px-6 py-5 outline-none focus:border-gold/50 font-bold appearance-none">
                                                    {DAYS_TH.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-white/20 uppercase tracking-[0.3em] ml-2">เวลาสอน</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input required type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="bg-white/5 border-2 border-white/5 rounded-2xl px-3 py-5 outline-none focus:border-gold/50 font-bold" />
                                                    <input required type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="bg-white/5 border-2 border-white/5 rounded-2xl px-3 py-5 outline-none focus:border-gold/50 font-bold" />
                                                </div>
                                            </div>
                                        </div>

                                        <input type="hidden" value={formData.room} />
                                    </div>
                                </div>
                                <div className="p-12 pt-0">
                                    <button type="submit" disabled={isLoading} className="w-full py-6 bg-gold text-midnight font-black rounded-3xl hover:scale-[1.02] hover:brightness-110 active:scale-95 transition-all text-xl shadow-2xl shadow-gold/20">
                                        {isLoading ? 'กำลังบันทึก...' : 'บันทึกตารางสอน'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const Timetable = () => (
    <TimetableErrorBoundary>
        <TimetableContent />
    </TimetableErrorBoundary>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Timetable />);

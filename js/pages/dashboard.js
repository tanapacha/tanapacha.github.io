const { useState, useEffect, useRef, useCallback } = React;

/* ─── helpers ─────────────────────────────────────────────── */
const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const addDays = (d, n) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
};

const startsWithSafe = (value, prefix) => String(value || '').startsWith(prefix);

const greetingFor = (h) => {
    if (h < 12) return 'สวัสดีตอนเช้า';
    if (h < 17) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
};

// Robust Date Matching Helper for GAS Data
const isSameDay = (gasDate, targetDateStr) => {
    if (!gasDate || !targetDateStr) return false;
    const s = String(gasDate);
    
    // 1. Direct match (YYYY-MM-DD)
    if (s.startsWith(targetDateStr)) return true;
    
    // 2. ISO / UTC mismatch fallback
    try {
        const d = new Date(s);
        if (isNaN(d.getTime())) return false;
        // Format to YYYY-MM-DD using local time
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localFormat = `${y}-${m}-${day}`;
        const match = localFormat === targetDateStr;
        if (!match && targetDateStr === toDateStr(new Date())) {
             // Silently log only if it's supposed to be today but failing
             // console.log(`[Aura Date Debug] No match: ${s} (as ${localFormat}) vs ${targetDateStr}`);
        }
        return match;
    } catch (e) { return false; }
};


class DashboardErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('Aura LifeOS Dashboard ErrorBoundary:', error, info);
    }

    render() {
        if (this.state.hasError) {
            const message = this.state.error?.message || 'Unknown render error';
            return (
                <div style={{
                    minHeight: '100vh',
                    padding: '24px',
                    color: 'rgba(255,255,255,0.9)',
                    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                    background: '#0A0C10'
                }}>
                    <h1 style={{ fontSize: '18px', margin: '0 0 10px' }}>Aura LifeOS: หน้าโหลดไม่สำเร็จ</h1>
                    <p style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.7)' }}>{message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.95)',
                            cursor: 'pointer'
                        }}
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

/* ─── Day Slider component ─────────────────────────────────── */
const DAY_NAMES_TH = {
    Sun: 'อา', Mon: 'จ', Tue: 'อ', Wed: 'พ', Thu: 'พฤ', Fri: 'ศ', Sat: 'ส'
};

const DAYS_TH_MAP = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const DAYS_EN_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DaySlider = ({ selectedDate, onSelect }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Show 30 days (7 days before today, 22 days after)
    // This aligns better with the 30-day fetch range in the backend
    const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 7));

    const scrollRef = useRef(null);

    // Scroll to selected date whenever it changes
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        
        // Find the chip that is currently selected
        const selectedChip = el.querySelector(`[data-date="${selectedDate}"]`);
        if (selectedChip) {
            const offset = selectedChip.offsetLeft - el.clientWidth / 2 + selectedChip.clientWidth / 2;
            el.scrollTo({ left: offset, behavior: 'smooth' });
        }
    }, [selectedDate]);

    return (
        <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar-hidden scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {days.map((d) => {
                const ds = toDateStr(d);
                const isToday = toDateStr(today) === ds;
                const isSelected = selectedDate === ds;
                const dayLabel = DAY_NAMES_TH[d.toLocaleDateString('en-US', { weekday: 'short' })];
                return (
                    <button
                        key={ds}
                        data-date={ds}
                        data-today={isToday ? 'true' : 'false'}
                        onClick={() => onSelect(ds)}
                        className={`
                            flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl
                            transition-all duration-300 outline-none
                            ${isSelected
                                ? 'bg-gold text-midnight shadow-[0_0_20px_rgba(212,175,55,0.45)] scale-105'
                                : isToday
                                    ? 'bg-gold/15 text-gold border border-gold/30'
                                    : 'bg-white/5 text-text-secondary border border-white/5 hover:border-gold/30 hover:bg-white/10'
                            }
                        `}
                        style={{ minWidth: '64px' }}
                    >
                        <span className={`text-[10px] font-semibold uppercase tracking-widest ${isSelected ? 'text-midnight' : ''}`}>
                            {dayLabel}
                        </span>
                        <span className={`text-xl font-light ${isSelected ? 'text-midnight font-semibold' : ''}`}>
                            {d.getDate()}
                        </span>
                        {isToday && !isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

/* ─── Animated event list ──────────────────────────────────── */
const SlideDirection = { NONE: 'none', FORWARD: 'forward', BACKWARD: 'backward' };

const useSlide = () => {
    const [phase, setPhase] = useState('idle'); // idle | exit | enter
    const [direction, setDirection] = useState(SlideDirection.NONE);

    const trigger = useCallback((dir, callback) => {
        setDirection(dir);
        setPhase('exit');
        setTimeout(() => {
            callback();
            setPhase('enter');
            setTimeout(() => setPhase('idle'), 350);
        }, 220);
    }, []);

    const exitStyle = () => {
        if (phase !== 'exit') return {};
        return {
            opacity: 0,
            transform: direction === SlideDirection.FORWARD ? 'translateX(-28px)' : 'translateX(28px)',
            transition: 'opacity 220ms ease, transform 220ms ease',
        };
    };

    const enterStyle = () => {
        if (phase === 'enter') {
            return {
                opacity: 1,
                transform: 'translateX(0)',
                transition: 'opacity 350ms cubic-bezier(0.22,1,0.36,1), transform 350ms cubic-bezier(0.22,1,0.36,1)',
            };
        }
        if (phase === 'idle') return {};
        return {
            opacity: 0,
            transform: direction === SlideDirection.FORWARD ? 'translateX(28px)' : 'translateX(-28px)',
        };
    };

    return { phase, trigger, exitStyle, enterStyle };
};

/* ─── Chart Widget ─────────────────────────────────────────── */
const AuraChartWidget = ({ nutritionData, financeData }) => {
    const nutriChartRef = useRef(null);
    const financeChartRef = useRef(null);
    const nutriChartInstance = useRef(null);
    const financeChartInstance = useRef(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAdvice, setAiAdvice] = useState('');

    const getDatesArray = () => {
        const today = new Date();
        return Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            return { full: toDateStr(d), short: `${d.getDate()}/${d.getMonth()+1}` };
        });
    };

    // Group nutrition by last 7 days
    useEffect(() => {
        if (!window.Chart || !nutritionData) return;
        
        const datesInfo = getDatesArray();
        const intake = datesInfo.map(d => {
            const dayLogs = nutritionData.filter(n => isSameDay(n?.date, d.full) && parseFloat(n.calories) > 0);
            return dayLogs.reduce((sum, n) => sum + parseFloat(n.calories), 0);
        });
        
        const burned = datesInfo.map(d => {
            const dayLogs = nutritionData.filter(n => isSameDay(n?.date, d.full) && parseFloat(n.calories) < 0);
            return Math.abs(dayLogs.reduce((sum, n) => sum + parseFloat(n.calories), 0));
        });

        if (nutriChartInstance.current) nutriChartInstance.current.destroy();
        
        if (nutriChartRef.current) {
            const ctx = nutriChartRef.current.getContext('2d');
            nutriChartInstance.current = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: datesInfo.map(d => d.short),
                    datasets: [
                        { label: 'กินเข้าไป', data: intake, backgroundColor: 'rgba(55, 180, 212, 0.7)', borderRadius: 4 },
                        { label: 'เผาผลาญ', data: burned, backgroundColor: 'rgba(212, 55, 55, 0.7)', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: 'rgba(255,255,255,0.7)' } } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                    }
                }
            });
        }

        return () => { if (nutriChartInstance.current) nutriChartInstance.current.destroy(); };
    }, [nutritionData]);

    // Group finance by last 7 days
    useEffect(() => {
        if (!window.Chart || !financeData) return;
        
        const datesInfo = getDatesArray();
        const income = datesInfo.map(d => {
            const dayLogs = financeData.filter(n => isSameDay(n?.date, d.full) && n.type === 'income');
            return dayLogs.reduce((sum, n) => sum + parseFloat(n.amount), 0);
        });
        
        const expense = datesInfo.map(d => {
            const dayLogs = financeData.filter(n => isSameDay(n?.date, d.full) && n.type === 'expense');
            return dayLogs.reduce((sum, n) => sum + parseFloat(n.amount), 0);
        });

        if (financeChartInstance.current) financeChartInstance.current.destroy();
        
        if (financeChartRef.current) {
            const ctx = financeChartRef.current.getContext('2d');
            financeChartInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: datesInfo.map(d => d.short),
                    datasets: [
                        { label: 'รายรับ', data: income, borderColor: '#37d478', backgroundColor: 'rgba(55, 212, 120, 0.1)', fill: true, tension: 0.4 },
                        { label: 'รายจ่าย', data: expense, borderColor: '#d43737', backgroundColor: 'rgba(212, 55, 55, 0.1)', fill: true, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: 'rgba(255,255,255,0.7)' } } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                    }
                }
            });
        }

        return () => { if (financeChartInstance.current) financeChartInstance.current.destroy(); };
    }, [financeData]);

    const handleAnalyzeGraphs = async () => {
        setIsAnalyzing(true);
        
        // Prepare summary string of the last 7 days to send to AI
        const datesInfo = getDatesArray();
        let summaryText = datesInfo.map(d => {
            const dateStr = d.full;
            
            // Nutri
            const dayNutri = nutritionData ? nutritionData.filter(n => isSameDay(n?.date, dateStr)) : [];
            const intake = dayNutri.filter(n => parseFloat(n.calories) > 0).reduce((sum, n) => sum + parseFloat(n.calories), 0);
            const burned = Math.abs(dayNutri.filter(n => parseFloat(n.calories) < 0).reduce((sum, n) => sum + parseFloat(n.calories), 0));
            
            // Finance
            const dayFin = financeData ? financeData.filter(n => isSameDay(n?.date, dateStr)) : [];
            const income = dayFin.filter(n => n.type === 'income').reduce((sum, n) => sum + parseFloat(n.amount), 0);
            const expense = dayFin.filter(n => n.type === 'expense').reduce((sum, n) => sum + parseFloat(n.amount), 0);
            
            return `วันที่ ${d.short}: กิน ${intake} kcal, เบิร์น ${burned} kcal | รับ ${income} บาท, จ่าย ${expense} บาท`;
        }).join('\n');

        const prompt = `ในฐานะผู้ช่วยส่วนตัว Aura AI ช่วยดูสถิติ 7 วันย้อนหลังของฉันหน่อย (ฉันไม่มีพื้นฐานการอ่านกราฟ):
${summaryText}
ช่วยสรุปให้ฟังแบบเข้าใจง่ายที่สุด ว่าสัปดาห์นี้ฉันคุมอาหารและคุมเงินได้ดีแค่ไหน มีอะไรน่าห่วงไหม สรุปสั้นๆ ว้าวๆ 2-3 ประโยค เป็นกันเองครับ`;

        try {
            const advice = await window.gasClient.callAI(prompt, "วิเคราะห์สถิติรายสัปดาห์");
            setAiAdvice(advice);
        } catch {
            setAiAdvice("ขออภัย ไม่สามารถดึงข้อมูลสรุปจาก AI ได้ในขณะนี้");
        }
        setIsAnalyzing(false);
    };

    return (
        <div className="flex flex-col w-full mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[250px]">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                            <i data-lucide="Utensils" className="w-4 h-4 text-blue-400"></i> โภชนาการ (7 วันย้อนหลัง)
                        </h3>
                        <p className="text-[11px] text-white/50 mt-1">เปรียบเทียบแคลอรี่ที่กินเข้าไป กับที่เผาผลาญจากการออกกำลังกาย</p>
                    </div>
                    <div className="relative h-[200px] w-full">
                        <canvas ref={nutriChartRef}></canvas>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[250px]">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                            <i data-lucide="Wallet" className="w-4 h-4 text-green-400"></i> การเงิน (7 วันย้อนหลัง)
                        </h3>
                        <p className="text-[11px] text-white/50 mt-1">เปรียบเทียบยอดรวมรายรับและรายจ่ายในแต่ละวัน</p>
                    </div>
                    <div className="relative h-[200px] w-full">
                        <canvas ref={financeChartRef}></canvas>
                    </div>
                </div>
            </div>

            {/* AI Chart Analyst Button */}
            <div className="mt-4">
                {aiAdvice ? (
                    <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-sm text-white/90 leading-relaxed relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <span className="text-purple-400 mr-2 font-bold flex items-center gap-2 mb-2">
                            <i data-lucide="Sparkles" className="w-4 h-4"></i> Aura Insight สรุปสัปดาห์นี้:
                        </span>
                        {aiAdvice}
                    </div>
                ) : (
                    <button 
                        onClick={handleAnalyzeGraphs}
                        disabled={isAnalyzing}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-purple-400 transition-all flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? (
                            <><i data-lucide="Loader2" className="w-4 h-4 animate-spin" /> AI กำลังอ่านกราฟให้คุณ...</>
                        ) : (
                            <><i data-lucide="Sparkles" className="w-4 h-4" /> สรุปกราฟสัปดาห์นี้ให้ฟังหน่อย (Aura AI)</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

/* ─── Energy Correlator ────────────────────────────────────── */
const EnergyCorrelator = ({ energyLevel, setEnergyLevel, handleSaveMood, aiAdvice, isAnalyzing }) => {
    return (
        <div className="bg-white/5 border border-gold/20 rounded-3xl p-5 mt-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                    <i data-lucide="Zap" className="w-5 h-5"></i>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Energy & Bio-Correlator</h3>
                    <p className="text-xs text-white/50">ประเมินพลังงานปัจจุบันเพื่อหาต้นตอ</p>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-xs font-bold text-white/40 mb-2">
                    <span>หมดสภาพ (0%)</span>
                    <span className="text-gold text-lg">{energyLevel}%</span>
                    <span>พลังล้น (100%)</span>
                </div>
                <input 
                    type="range" 
                    min="0" max="100" 
                    value={energyLevel} 
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full accent-gold h-2 bg-white/10 rounded-full appearance-none outline-none cursor-pointer"
                />
            </div>

            <button 
                onClick={() => handleSaveMood('Neutral', energyLevel)}
                disabled={isAnalyzing}
                className="w-full py-3 bg-gold/10 text-gold hover:bg-gold/20 border border-gold/30 rounded-xl font-bold tracking-widest text-xs uppercase transition-all mb-4"
            >
                {isAnalyzing ? "กำลังวิเคราะห์..." : "วิเคราะห์ความเชื่อมโยง (AI)"}
            </button>

            {aiAdvice && (
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-sm text-white/80 leading-relaxed">
                    <span className="text-gold mr-2 font-bold">Aura Insight:</span>
                    {aiAdvice}
                </div>
            )}
        </div>
    );
};

/* ─── Main Dashboard ───────────────────────────────────────── */
const Dashboard = () => {
    const Navbar = window.Navbar;
    const BentoCard = window.BentoCard;

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [allEvents, setAllEvents] = useState([]);
    const [goals, setGoals] = useState([]);
    const [finances, setFinances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timetable, setTimetable] = useState([]);
    const [moods, setMoods] = useState([]);
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiAdvice, setAiAdvice] = useState('');
    const [habitStackAdvice, setHabitStackAdvice] = useState(null);
    const [isBurnoutAnalyzing, setIsBurnoutAnalyzing] = useState(false);
    const [burnoutAdvice, setBurnoutAdvice] = useState('');
    const [isEnergyAnalyzing, setIsEnergyAnalyzing] = useState(false);
    const [energyAdvice, setEnergyAdvice] = useState('');

    // Helper to extract clean Local Time (HH:mm) from any string format
    const formatLocalTime = (str) => {
        if (!str) return "--:--";
        const s = String(str);
        if (s.includes('T')) {
            const d = new Date(s);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString('th-TH', { 
                    hour: '2-digit', minute: '2-digit', hour12: false 
                }).replace('.', ':');
            }
        }
        const match = s.match(/(\d{1,2})[:.](\d{2})/);
        return match ? `${match[1].padStart(2, '0')}:${match[2]}` : s;
    };

    const [selectedDateStr, setSelectedDateStr] = useState(toDateStr(today));

    // New States
    const [habits, setHabits] = useState([]);
    const [habitLogs, setHabitLogs] = useState([]);
    const [wellness, setWellness] = useState([]);
    const [journal, setJournal] = useState([]);
    const [settings, setSettings] = useState({ waterGoal: 2000 });
    const [resources, setResources] = useState([]);
    const [nutrition, setNutrition] = useState([]);
    const [isMealAnalyzerOpen, setIsMealAnalyzerOpen] = useState(false);
    const [isMealLoading, setIsMealLoading] = useState(false);
    const [mealSuggestion, setMealSuggestion] = useState('');
    const [dailyNutritionSummary, setDailyNutritionSummary] = useState('');
    const [isNutriSummaryLoading, setIsNutriSummaryLoading] = useState(false);

    // Modals & UI States
    const [isJournalOpen, setIsJournalOpen] = useState(false);
    const [isFocusOpen, setIsFocusOpen] = useState(false);
    const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
    const [customWaterVol, setCustomWaterVol] = useState(250);
    const [isSavingWater, setIsSavingWater] = useState(false);
    const [isNightstandOpen, setIsNightstandOpen] = useState(false);
    const NightstandMode = window.NightstandMode;

    // Performance Optimization for Slider
    const [localEnergy, setLocalEnergy] = useState(50);

    const slide = useSlide();

    // Derive today's events from full list
    const displayEvents = allEvents.filter(e => {
        if (!e.start) return false;
        // Standard matching for correct dates
        if (startsWithSafe(e.start, selectedDateStr)) return true;
        
        // Robust Fallback: Handle legacy 1899 epoch bug (Google Sheets Time cells)
        // If it's 1899, it's a 'Time-Only' item. If selected date is today, show it.
        if (startsWithSafe(e.start, "1899-12-30") && selectedDateStr === toDateStr(today)) return true;
        
        return false;
    });

    const todayEvents = allEvents.filter(e => {
        if (!e.start) return false;
        return startsWithSafe(e.start, toDateStr(today)) || startsWithSafe(e.start, "1899-12-30");
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const CACHE_KEY = "aura_dashboard_cache";
        
        const loadContent = async (silent = false) => {
            // 1. Aura Turbo: Fast Cache Loading (Skip if silent)
            if (!silent) {
                const cached = localStorage.getItem(CACHE_KEY);
                console.log("[Aura Debug] Checking Cache...", cached ? "Found" : "Empty");
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        console.log("[Aura Debug] Applying Cache Data:", Object.keys(parsed));
                        applyLoadedData(parsed);
                        setIsLoading(false); // Immediate interaction
                    } catch (e) { console.error("[Aura Debug] Cache error", e); }
                } else {
                    setIsLoading(true);
                }
            }


            // 2. Priority Loading: Fetch Crucial Data First
            // 2. Unified Loading: Fetch All Data at once to prevent sync issues
            const allSheets = "events,timetable,mood,wellness,nutrition,settings,goals,finance,habits,habitLogs,journal,resources,focusSessions";

            try {
                console.log("[Aura Debug] Fetching All Data...");
                const allData = await window.gasClient.fetchData(allSheets);
                if (allData) {
                    console.log("[Aura Debug] Data Received:", Object.keys(allData));
                    if (allData.error) {
                        console.error("[Aura Debug] Server Error:", allData.error);
                    } else {
                        applyLoadedData(allData);
                        localStorage.setItem(CACHE_KEY, JSON.stringify(allData));
                    }
                }
            } catch (err) {
                console.error("[Aura Debug] Fetch error:", err);
            }

            
            setIsLoading(false);
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                setTimeout(() => window.lucide.createIcons(), 100);
            }
        };

        const applyLoadedData = (data) => {
            if (!data) return;
            console.log("[Aura Debug] applyLoadedData called with keys:", Object.keys(data));
            if (data.events) setAllEvents(data.events);
            if (data.goals) setGoals(data.goals);
            if (data.finance) {
                console.log("[Aura Debug] Setting Finance:", data.finance.length, "items");
                setFinances(data.finance);
            }
            if (data.mood) setMoods(data.mood);
            if (data.wellness) {
                console.log("[Aura Debug] Setting Wellness:", data.wellness.length, "items");

                setWellness(prev => {
                    const serverData = data.wellness || [];
                    const todayStr = toDateStr(new Date());
                    
                    const finalData = [...serverData];
                    const localToday = prev.find(p => isSameDay(p.date, todayStr));
                    const serverTodayIdx = finalData.findIndex(s => isSameDay(s.date, todayStr));
                    
                    if (localToday && serverTodayIdx !== -1) {
                        if (parseFloat(localToday.water) > parseFloat(finalData[serverTodayIdx].water)) {
                            finalData[serverTodayIdx] = { ...finalData[serverTodayIdx], water: localToday.water };
                        }
                    }
                    return finalData.sort((a,b) => new Date(b.date) - new Date(a.date));
                });
            }

            if (data.habits) setHabits(data.habits);
            if (data.habitLogs) setHabitLogs(data.habitLogs);
            if (data.journal) setJournal(data.journal);
            if (data.resources) setResources(data.resources);
            if (data.settings) setSettings(data.settings);
            if (data.nutrition) {
                setNutrition(data.nutrition);
                fetchNutritionSummary(data.nutrition);
            }
            let currentNormalizedTimetable = null;
            if (data.timetable) {
                currentNormalizedTimetable = (data.timetable || []).map(item => ({
                    ...item,
                    startTime: formatLocalTime(item.startTime),
                    endTime: formatLocalTime(item.endTime)
                }));
                setTimetable(currentNormalizedTimetable);
                fetchMealSuggestion(currentNormalizedTimetable);
            }

            if (window.lucide) {
                setTimeout(() => window.lucide.createIcons(), 200);
            }

            // Trigger AI Advice if it hasn't been cached or if we have fresh events
            if (data.events) {
                const todayEvts = data.events.filter(e => isSameDay(e?.start, toDateStr(today)));
                if (todayEvts.length > 0) fetchAIAdvice(todayEvts);
                
                // Trigger Habit Stacking (Use current normalized or fallback to state)
                if (currentNormalizedTimetable) {
                    fetchHabitStacking(currentNormalizedTimetable);
                }
            }

        };

        loadContent();
        return () => clearInterval(timer);
    }, []);

    const latestMood = moods
        .filter(m => startsWithSafe(m?.date, toDateStr(today)))
        .sort((a,b) => new Date(b.date) - new Date(a.date))[0];

    // Sync local energy with backend data when it loads
    useEffect(() => {
        if (latestMood) setLocalEnergy(latestMood.energy);
    }, [latestMood?.energy]);

    const fetchAIAdvice = async (events, force = false) => {
        if (!events || events.length === 0) return;

        const todayStr = toDateStr(new Date());
        const summary = events.map(e => `${new Date(e.start).getHours()}h-${e.title}`).join('|');
        const cacheKey = `aura_dashboard_advice_${todayStr}`;
        
        // 1. Check Cache
        if (!force) {
            const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
            if (cached && cached.summary === summary && (Date.now() - cached.ts < 3600000)) {
                setAiAdvice(cached.advice);
                return;
            }
        }

        setIsAILoading(true);
        const detailSummary = events.map(e => `${new Date(e.start).toLocaleTimeString('th-TH')} - ${e.title}`).join(', ');
        const prompt = `ในฐานะ Aura AI (Wellness Enthusiast ที่ชอบทฤษฎีวิทยาศาตร์แต่คุยสนุก) นี่คือตารางกิจกรรมของฉันวันนี้: ${detailSummary} 
        ช่วยวิเคราะห์สั้นๆ 2-3 ประโยคว่าวันนี้ควรเตรียมร่างกายยังไง (เช่น เตรียม Dopamine หรือรักษา Glucose Level) ให้มีพลังงานเหลือเฟือและคุยแบบตื่นเต้นเป็นกันเอง
        กฎเหล็ก: ห้ามใส่แท็ก [ACTION:...] หรือคำสั่งบันทึกข้อมูลใดๆ ทั้งสิ้น ตอบเป็นข้อความแนะนำอย่างเดียว`;
        
        try {
            const advice = await window.gasClient.callAI(prompt, "วิเคราะห์ตารางรายวัน");
            setAiAdvice(advice);
            // Save to Cache
            localStorage.setItem(cacheKey, JSON.stringify({
                advice,
                summary,
                ts: Date.now()
            }));

            // Also refresh habit stacking when user manually refreshes AI advice
            if (force) {
                fetchHabitStacking();
            }
        } catch {
            setAiAdvice("ขออภัย ไม่สามารถดึงคำวิเคราะห์จาก AI ได้ในขณะนี้");
        }
        setIsAILoading(false);
    };

    const fetchHabitStacking = async (timetableOverride = null) => {
        const todayName = DAYS_TH_MAP[currentTime.getDay()];
        // Use override if provided, otherwise fallback to state
        const sourceTimetable = timetableOverride || timetable;
        const classes = sourceTimetable.filter(item => item.day === todayName);
        const sortedClasses = classes.sort((a,b) => a.startTime.localeCompare(b.startTime));
            
        if (sortedClasses.length === 0) return;

        let gaps = [];
        for (let i = 0; i < sortedClasses.length - 1; i++) {
            const end = sortedClasses[i].endTime;
            const nextStart = sortedClasses[i+1].startTime;
            if (end < nextStart) {
                gaps.push({ after: sortedClasses[i].subject, before: sortedClasses[i+1].subject, time: `${end}-${nextStart}` });
            }
        }

        if (gaps.length === 0) {
            setHabitStackAdvice("ตารางสอนวันนี้แน่นมาก! อย่าลืมจิบน้ำระหว่างคาบนะครับ");
            return;
        }

        const prompt = `จากตารางสอนวันนี้ที่มีช่องว่างดังนี้: ${gaps.map(g => `ช่วง ${g.time} (หลัง ${g.after} ก่อน ${g.before})`).join(', ')}
        ช่วยเลือก 1 ช่องว่างที่เหมาะสมที่สุด และแนะนำ "Micro-habit" (นิสัย 1-3 นาที) ที่ควรทำเพื่อรักษาสมาธิหรือสุขภาพ
        ตอบสั้นๆ ไม่เกิน 1-2 ประโยค แบบเป็นกันเองและให้กำลังใจ
        กฎเหล็ก: ห้ามใส่แท็ก [ACTION:...] หรือคำสั่งบันทึกข้อมูลใดๆ ทั้งสิ้น ตอบเป็นข้อความแนะนำอย่างเดียว`;

        try {
            const advice = await window.gasClient.callAI(prompt, "Habit Stacking Suggestions");
            setHabitStackAdvice(advice);
        } catch (e) { console.error("Habit stacking error", e); }
    };

    const fetchMealSuggestion = async (timetableData) => {
        const todayName = DAYS_TH_MAP[new Date().getDay()];
        const todayClasses = timetableData.filter(item => item.day === todayName);
        
        if (todayClasses.length === 0) {
            setMealSuggestion("วันนี้ไม่มีสอน ทานอะไรที่ชอบได้เลยครับ!");
            return;
        }

        setIsMealLoading(true);
        const teachingLoad = todayClasses.map(c => `${c.subject} (${c.startTime}-${c.endTime})`).join(', ');
        const prompt = `จากตารางสอนวันนี้: ${teachingLoad} ช่วยแนะนำเมนูอาหารที่เหมาะสมในเชิงชีววิทยา (เช่น สารอาหารที่ช่วยให้สมองแล่น หรือรักษาระดับน้ำตาล) 
        แนะนำแบบสนุกสนาน ว้าวๆ เหมือนเพื่อนที่รอบรู้เรื่อง Bio-hacking สรุปสั้นๆ 1-2 ประโยค
        กฎเหล็ก: ห้ามใส่แท็ก [ACTION:...] หรือคำสั่งบันทึกข้อมูลใดๆ ทั้งสิ้น ตอบเป็นข้อความแนะนำอย่างเดียว`;
        
        try {
            const suggestion = await window.gasClient.callAI(prompt, "วิเคราะห์เมนูตามตารางสอน");
            setMealSuggestion(suggestion);
        } catch {
            setMealSuggestion("ไม่สามารถดึงข้อมูลเมนูแนะนำได้");
        }
        setIsMealLoading(false);
    };

    const fetchNutritionSummary = async (nutritionData) => {
        const todayLogs = nutritionData.filter(n => startsWithSafe(n?.date, toDateStr(today)));
        if (todayLogs.length === 0) return;

        setIsNutriSummaryLoading(true);
        const meals = todayLogs.map(n => `${n.mealName} (${n.calories} kcal)`).join(', ');
        const currentTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const totalCals = todayLogs.reduce((sum, n) => sum + (parseFloat(n.calories) || 0), 0);
        const tdee = Math.round(calculateStats().tdee);

        const prompt = `ขณะนี้เวลา ${currentTimeStr} วันนี้ฉันกินไปแล้วรวม ${totalCals} kcal จากเป้าหมาย TDEE ${tdee} kcal 
        รายการอาหารที่กินไป: ${meals} 
        ช่วยวิเคราะห์สรุปสั้นๆ 1 ประโยคถึงผลกระทบต่อร่างกาย (Scientific Impact) และคำแนะนำในการกินมื้อถัดไปของวันนี้
        กฎสำคัญ: 
        1. ต้องตระหนักถึงเวลาปัจจุบัน (เช่น ถ้ายังเช้าอยู่และกินน้อยถือเป็นเรื่องปกติ ไม่ต้องดุว่ากินไม่พอ)
        2. ใช้บุคลิกนักชีววิทยาที่รอบรู้แต่คุยสนุกและให้กำลังใจ (ห้ามใช้บุคลิกดุดันแบบ Discipline Master ในเคสนี้)
        3. ถ้ากินใกล้ครบเป้าหมายแล้ว ให้แนะนำเรื่องการรักษาเสถียรภาพของพลังงาน
        4. ห้ามใส่แท็ก [ACTION:...] หรือคำสั่งบันทึกข้อมูลใดๆ ทั้งสิ้น ตอบเป็นข้อความสรุปอย่างเดียว`;
        
        try {
            const summary = await window.gasClient.callAI(prompt, "สรุปโภชนาการรายวัน");
            setDailyNutritionSummary(summary);
        } catch {
            setDailyNutritionSummary("ไม่สามารถสรุปการกินได้");
        }
        setIsNutriSummaryLoading(false);
    };

    const handleSaveMeal = async () => {
        // Refresh nutrition data (Force refresh)
        const data = await window.gasClient.fetchData("nutrition", true);
        if (data && data.nutrition) {
            setNutrition(data.nutrition);
            fetchNutritionSummary(data.nutrition);
        }
    };

    /* Day navigation helpers */
    const goToPrevDay = () => {
        const cur = new Date(selectedDateStr + 'T00:00:00');
        const prev = toDateStr(addDays(cur, -1));
        slide.trigger(SlideDirection.BACKWARD, () => setSelectedDateStr(prev));
    };

    const goToNextDay = () => {
        const cur = new Date(selectedDateStr + 'T00:00:00');
        const next = toDateStr(addDays(cur, 1));
        slide.trigger(SlideDirection.FORWARD, () => setSelectedDateStr(next));
    };

    const handleDaySelect = (ds) => {
        const cur = new Date(selectedDateStr + 'T00:00:00');
        const target = new Date(ds + 'T00:00:00');
        const dir = target > cur ? SlideDirection.FORWARD : SlideDirection.BACKWARD;
        if (ds !== selectedDateStr) {
            slide.trigger(dir, () => setSelectedDateStr(ds));
        }
    };

    /* Swipe gesture support */
    const touchStart = useRef(null);
    const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touchStart.current === null) return;
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) diff > 0 ? goToNextDay() : goToPrevDay();
        touchStart.current = null;
    };

    /* Display strings */
    const timeString = currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const greeting = greetingFor(currentTime.getHours());

    const isViewingToday = selectedDateStr === toDateStr(today);

    const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
    const scheduleLabel = isViewingToday
        ? 'ตารางวันนี้'
        : selectedDateObj.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' });

    const dateString = currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });

    // Finance Calculations for Selected Date
    const todayFinances = finances.filter(tx => isSameDay(tx.date, selectedDateStr));
    console.log("[Aura Debug] todayFinances:", todayFinances.length, "for", selectedDateStr);
    const financeStats = todayFinances.reduce((acc, tx) => {
        if(tx.type === 'income') acc.income += parseFloat(tx.amount);
        if(tx.type === 'expense') acc.expense += parseFloat(tx.amount);
        return acc;
    }, { income: 0, expense: 0 });



    // Timetable Logic
    const todayName = DAYS_TH_MAP[currentTime.getDay()];
    const todayClasses = timetable.filter(item => item.day === todayName);
    const nowStr = currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const currentClass = todayClasses.find(c => c.startTime <= nowStr && c.endTime > nowStr);
    const nextClass = todayClasses
        .filter(c => c.startTime > nowStr)
        .sort((a,b) => a.startTime.localeCompare(b.startTime))[0];

    const handleSaveMood = async (mood, energy) => {
        const date = new Date().toISOString();
        const newEntry = { mood, energy, date };
        
        // Optimistic UI Update
        setMoods(prev => [newEntry, ...prev]);
        setLocalEnergy(energy);

        try {
            await window.gasClient.addMood(newEntry);
            // Silent reload to sync
            const data = await window.gasClient.fetchData("mood");
            if (data && data.mood) setMoods(data.mood);
        } catch (error) {
            console.error("Mood save error:", error);
            // Rollback on hard error (optional, simple app)
            alert("บันทึกอารมณ์ไม่สำเร็จในระบบ แต่แสดงผลชั่วคราวแล้วครับ");
        }
    };

    const handleSaveEnergyAndAnalyze = async (mood, energy) => {
        setIsEnergyAnalyzing(true);
        // Save mood
        await handleSaveMood(mood, energy);
        
        // Call AI for correlation
        const recentFood = nutrition.filter(n => parseFloat(n.calories) > 0).slice(0, 5).map(n => n.mealName).join(', ');
        const latestSleep = (wellness.filter(w => (parseFloat(w.sleepHours) || 0) > 0).sort((a,b) => new Date(b.date) - new Date(a.date))[0]?.sleepHours || 0);
        
        const prompt = `ในฐานะ Aura AI (Bio-hacking Expert) ตอนนี้ผู้ใช้มีระดับพลังงาน ${energy}/100 
        ข้อมูลที่ผ่านมา: การนอนล่าสุด ${latestSleep} ชม., อาหารล่าสุด: ${recentFood || 'ไม่มีข้อมูล'}
        ช่วยวิเคราะห์สั้นๆ 1-2 ประโยค ว่าระดับพลังงานนี้อาจเกิดจากอะไร และแนะนำวิธีปรับตัวแบบเป็นกันเอง ว้าวๆ
        กฎเหล็ก: ห้ามใส่แท็ก [ACTION:...] หรือคำสั่งบันทึกข้อมูลใดๆ ทั้งสิ้น ตอบเป็นข้อความแนะนำอย่างเดียว`;

        try {
            const advice = await window.gasClient.callAI(prompt, "วิเคราะห์พลังงาน");
            setEnergyAdvice(advice);
        } catch {
            setEnergyAdvice("ไม่สามารถวิเคราะห์พลังงานได้ในขณะนี้");
        }
        setIsEnergyAnalyzing(false);
    };

    const calculateStats = () => {
        const { weight = 70, height = 170, age = 25, gender = 'male', activityLevel = 1.2, fitnessGoal = 'maintain' } = settings || {};
        const bmi = weight / ((height / 100) ** 2) || 0;
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr = gender === 'male' ? bmr + 5 : bmr - 161;
        const tdee = bmr * activityLevel;
        const bodyFat = gender === 'male' 
            ? (1.20 * bmi) + (0.23 * age) - 16.2
            : (1.20 * bmi) + (0.23 * age) - 5.4;
            
        let targetCalories = tdee;
        if (fitnessGoal === 'lose') targetCalories = tdee - 500;
        if (fitnessGoal === 'gain') targetCalories = tdee + 300;

        return { bmi, bmr, tdee, targetCalories, bodyFat };
    };

    const stats = calculateStats();
    const todayNutriAll = nutrition.filter(n => isSameDay(n?.date, selectedDateStr));

    
    // Split Food and Exercise
    const todayFood = todayNutriAll.filter(n => parseFloat(n.calories) > 0);
    const todayExercise = todayNutriAll.filter(n => parseFloat(n.calories) <= 0 || (n.mealName && n.mealName.includes('[EXERCISE]')));

    const nutritionTotals = todayFood.reduce((acc, curr) => ({
        cals: acc.cals + (parseFloat(curr.calories) || 0),
        p: acc.p + (parseFloat(curr.protein) || 0),
        c: acc.c + (parseFloat(curr.carbs) || 0),
        f: acc.f + (parseFloat(curr.fat) || 0)
    }), { cals: 0, p: 0, c: 0, f: 0 });

    const exerciseCals = todayExercise.reduce((sum, curr) => sum + Math.abs(parseFloat(curr.calories) || 0), 0);
    const netCalories = nutritionTotals.cals - exerciseCals;

    const wellnessStats = (() => {
        const filtered = wellness.filter(w => isSameDay(w?.date, selectedDateStr));
        const totalWater = filtered.reduce((sum, w) => sum + (parseFloat(w.water) || 0), 0);
        // Sleep is usually the most recent entry regardless of today's filtered list if we want to show current status
        const latestSleep = (wellness.filter(w => (parseFloat(w.sleepHours) || 0) > 0).sort((a,b) => new Date(b.date) - new Date(a.date))[0]?.sleepHours || 0);
        return { water: totalWater, sleep: latestSleep };
    })();

    const calculateStressScore = () => {
        const latestMood = moods.slice().sort((a,b) => new Date(b.date) - new Date(a.date))[0];
        const energy = latestMood?.energy || 50;
        const sleep = wellnessStats.sleep || 0;
        const workClasses = todayClasses.length;
        
        let score = 30; // base stress
        
        // Sleep penalty (less than 7 hours adds stress)
        if (sleep > 0 && sleep < 7) score += (7 - sleep) * 10;
        else if (sleep >= 7) score -= (sleep - 7) * 5; 
        
        // Work penalty
        score += workClasses * 5;
        
        // Exercise penalty (high intensity adds physical stress)
        score += Math.min(20, exerciseCals / 50); 
        
        // Energy buffer
        score -= (energy / 5);
        
        return Math.max(0, Math.min(100, Math.round(score)));
    };
    
    const stressScore = calculateStressScore();

    const analyzeBurnout = async () => {
        setIsBurnoutAnalyzing(true);
        const latestMood = moods.slice().sort((a,b) => new Date(b.date) - new Date(a.date))[0];
        const timetableContext = todayClasses.map(c => `${c.subject} (${c.startTime}-${c.endTime})`).join(', ');
        const prompt = `วิเคราะห์ภาวะ Burnout สำหรับวันนี้หน่อยครับ
        ข้อมูล: พลังงานปัจจุบัน ${latestMood?.energy || 'ไม่ได้ระบุ'}/100, อารมณ์ล่าสุด: ${latestMood?.mood || 'ไม่ได้ระบุ'}
        ตารางสอนวันนี้: ${timetableContext || 'ไม่มีสอน'}
        ช่วงเวลาปัจจุบัน: ${currentTime.toLocaleTimeString()}
        
        ช่วยให้คำแนะนำสั้นๆ (ไม่เกิน 2-3 ประโยค) เพื่อป้องกันอาการ Burnout และปรับสมดุลชีวิตให้ดีขึ้น`;
        
        const advice = await window.gasClient.callAI(prompt);
        setBurnoutAdvice(advice);
        setIsBurnoutAnalyzing(false);
    };

    const handleFocusComplete = async (goal) => {
        setIsFocusOpen(false);
        const taskName = goal ? goal.title : "Focused Work";
        
        // Optimistic notification or dummy session? 
        // Focus sessions are usually background items, so we just log silently
        try {
            await window.gasClient.logFocusSession({ 
                duration: 25, 
                task: taskName, 
                status: "Completed" 
            });
        } catch (e) { console.error("Focus log error", e); }
    };

    const logWater = async (amount) => {
        const dateStr = toDateStr(new Date()); 
        
        setIsSavingWater(true);

        // Optimistic UI Update
        setWellness(prev => {
            const index = prev.findIndex(w => startsWithSafe(w?.date, dateStr));
            const oldWater = index !== -1 ? (parseFloat(prev[index].water) || 0) : 0;
            const newWater = oldWater + parseInt(amount);

            if (index !== -1) {
                const updated = [...prev];
                updated[index] = { ...updated[index], water: newWater };
                return updated;
            } else {
                return [...prev, { date: new Date().toISOString(), water: newWater }];
            }
        });

        // Close modal immediately for smooth feel
        setIsWaterModalOpen(false);

        try {
            const localDate = toDateStr(new Date());
            await window.gasClient.logWellness({ water: amount, date: localDate });
            // Background reload
            const data = await window.gasClient.fetchData("wellness");
            if (data) setWellness(data.wellness);
        } catch (error) {
            console.error("Water log error:", error);
            alert("บันทึกน้ำไม่สำเร็จ แต่หน้าจออัปเดตไปแล้วครับ");
        }
        setIsSavingWater(false);
    };

    const handleSaveJournal = async (journalData) => {
        // Optimistic UI
        const newEntry = { ...journalData, id: 'temp-' + Date.now(), date: new Date().toISOString() };
        setJournal(prev => [newEntry, ...prev]);
        
        try {
            await window.gasClient.saveJournal(journalData);
            const data = await window.gasClient.fetchData("journal", true);
            if (data) setJournal(data.journal);
        } catch (e) { console.error("Journal error", e); }
    };

    const handleSaveResource = async (resourceData) => {
        // Optimistic UI
        const newEntry = { ...resourceData, id: 'temp-' + Date.now(), date: new Date().toISOString() };
        setResources(prev => [newEntry, ...prev]);

        try {
            await window.gasClient.saveResource(resourceData);
            const data = await window.gasClient.fetchData("resources", true);
            if (data) setResources(data.resources);
        } catch (e) { console.error("Resource error", e); }
    };

    const hour = currentTime.getHours();
    const isMorning = hour < 12;
    const isAfternoon = hour >= 12 && hour < 17;
    const isEvening = hour >= 17;

    // Contextual Ordering Logic
    const order = {
        schedule: isMorning ? 1 : 4,
        teaching: isMorning ? 2 : 5,
        nutrition: isAfternoon ? 1 : 6,
        mealLogs: isAfternoon ? 2 : 7,
        wellness: isEvening ? 1 : 8,
        finance: isEvening ? 2 : 9,
        stats: isMorning ? 3 : isAfternoon ? 3 : 10,
        mood: isEvening ? 3 : 11,
        goals: 12,
        habit: 13,
        ai: 14,
        garden: 15,
        quickActions: 16
    };

    return (
        <div className="app-container">
            {isNightstandOpen && NightstandMode && (
                <NightstandMode
                    onClose={() => setIsNightstandOpen(false)}
                    todayEvents={todayEvents}
                    todayTimetableClasses={todayClasses}
                />
            )}
            <Navbar />

            <main className="flex-1 min-h-screen pt-4 lg:pt-20">
                {/* ── Header ── */}
                <header className="max-w-[1400px] mx-auto px-6 lg:px-8 pt-6 pb-6 animate-fade-in">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-[0.15em] mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{dateString}</p>
                            <h1 className="text-white leading-tight">
                                {greeting}, <span style={{ color: 'var(--accent)' }}>Tanapon</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
                                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{todayEvents.length} กิจกรรม</span>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{goals.filter(g => g.status !== 'สำเร็จ').length} เป้าหมาย</span>
                            </div>
                            <div className="text-2xl lg:text-3xl font-light tabular-nums tracking-tight ml-1" style={{ color: 'var(--text-secondary)' }}>
                                {timeString}
                            </div>
                            <button
                                onClick={() => setIsNightstandOpen(true)}
                                title="โหมดหัวเตียง (Nightstand)"
                                style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    color: 'var(--text-secondary)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--border-active)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                            >
                                🌙
                            </button>
                        </div>
                    </div>
                </header>

                {stressScore >= 85 && (
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 mb-6 animate-fade-in">
                        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                                    <i data-lucide="AlertTriangle" className="w-5 h-5 text-red-500"></i>
                                </div>
                                <div>
                                    <h3 className="text-red-400 font-bold text-sm">CRITICAL STRESS ALERT (คะแนนความล้า: {stressScore}%)</h3>
                                    <p className="text-red-400/80 text-xs mt-1">ร่างกายและสมองของคุณรับภาระหนักเกินไป แนะนำให้ลดความเข้มข้นงานและนอนพักให้มากกว่าเดิมด่วน!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bento Grid */}
                <div className="bento-grid stagger-children flex flex-col md:grid">

                    {/* ── Health Quick Stats ── */}
                    <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ order: order.stats }}>
                        {[
                            { label: 'Target', value: Math.round(stats.targetCalories), unit: 'kcal', icon: 'Target', color: 'var(--amber)' },
                            { label: 'TDEE', value: Math.round(stats.tdee), unit: 'kcal', icon: 'Flame', color: 'var(--blue)' },
                            { label: 'BMI', value: stats.bmi.toFixed(1), unit: 'index', icon: 'Activity', color: 'var(--green)' },
                            { label: 'Body Fat', value: stats.bodyFat.toFixed(1) + '%', unit: 'est.', icon: 'PieChart', color: 'var(--rose)' }
                        ].map((s, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:bg-white/[0.04]" 
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}>
                                    <i data-lucide={s.icon} className="w-4 h-4" style={{ color: s.color, strokeWidth: 1.8 }}></i>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
                                    <p className="text-lg font-semibold text-white leading-tight">{s.value} <span className="text-[10px] font-normal" style={{ color: 'var(--text-tertiary)' }}>{s.unit}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* ── Nutrition Hub (New Large Card) ── */}
                    <BentoCard
                        title="เป้าหมายโภชนาการ"
                        subtitle="Nutrition Progress"
                        icon="Target"
                        accent="emerald"
                        className="col-span-12 lg:col-span-8"
                        style={{ order: order.nutrition }}
                    >
                        <div className="flex flex-col md:flex-row items-center gap-8 mt-6">
                            {/* Progress Circle */}
                            <div className="progress-circle-container">
                                <svg width="140" height="140">
                                    <circle className="progress-circle-bg" cx="70" cy="70" r="64" />
                                    <circle 
                                        className="progress-circle-fill" 
                                        cx="70" cy="70" r="64" 
                                        style={{ 
                                            strokeDasharray: 402, 
                                            strokeDashoffset: 402 - (402 * Math.min(Math.max(netCalories, 0) / (stats.targetCalories || 1), 1))
                                        }} 
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-3xl font-bold text-white">{Math.round(netCalories)}</span>
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest">Net Cals</span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-4">
                                <h3 className="text-xl md:text-2xl font-medium text-white">
                                    วันนี้คุณใช้โควต้าไปแล้ว {Math.round((Math.max(netCalories, 0) / (stats.targetCalories || 1)) * 100)}% ของเป้าหมาย
                                </h3>
                                <p className="text-sm text-white/50 leading-relaxed max-w-md">
                                    แคลอรี่สุทธิ (กินไป {Math.round(nutritionTotals.cals)} ลบ เผาผลาญ {Math.round(exerciseCals)}) คือ {Math.round(netCalories)} kcal<br/>
                                    เป้าหมายของคุณคือ {Math.round(stats.targetCalories)} kcal
                                </p>
                                
                                {/* Macro Pills */}
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <div className="macro-pill" style={{ '--pill-bg': 'rgba(55,180,212,0.1)', '--pill-color': '#37b4d4', '--pill-border': 'rgba(55,180,212,0.2)' }}>
                                        <span>P: {Math.round(nutritionTotals.p)}g</span>
                                    </div>
                                    <div className="macro-pill" style={{ '--pill-bg': 'rgba(55,212,120,0.1)', '--pill-color': '#37d478', '--pill-border': 'rgba(55,212,120,0.2)' }}>
                                        <span>C: {Math.round(nutritionTotals.c)}g</span>
                                    </div>
                                    <div className="macro-pill" style={{ '--pill-bg': 'rgba(212,55,55,0.1)', '--pill-color': '#d43737', '--pill-border': 'rgba(212,55,55,0.2)' }}>
                                        <span>F: {Math.round(nutritionTotals.f)}g</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* ── Aura Analytics Card ── */}
                    <BentoCard
                        title="ภาพรวมรายสัปดาห์"
                        subtitle="Aura Analytics"
                        icon="BarChart2"
                        accent="purple"
                        className="col-span-12"
                        style={{ order: order.stats + 0.5 }}
                    >
                        <AuraChartWidget nutritionData={nutrition} financeData={finances} />
                    </BentoCard>

                    {/* ── Schedule Card ── */}
                    <BentoCard
                        title={scheduleLabel}
                        subtitle="Schedule"
                        icon="Clock"
                        accent="blue"
                        className="col-span-12 lg:col-span-4 lg:row-span-2"
                        style={{ order: order.schedule }}
                    >
                        {/* Day Slider */}
                        <div className="mt-4 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <button
                                    onClick={goToPrevDay}
                                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:border-gold/40 hover:text-gold transition-all duration-200 active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                </button>
                                <div className="flex-1 overflow-hidden">
                                    <DaySlider selectedDate={selectedDateStr} onSelect={handleDaySelect} />
                                </div>
                                <button
                                    onClick={goToNextDay}
                                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:border-gold/40 hover:text-gold transition-all duration-200 active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                            </div>

                            {/* Jump to today */}
                            {!isViewingToday && (
                                <button
                                    onClick={() => handleDaySelect(toDateStr(today))}
                                    className="text-xs text-gold/70 hover:text-gold transition-colors underline underline-offset-2 ml-1"
                                >
                                    กลับสู่วันนี้
                                </button>
                            )}
                        </div>

                        {/* Animated Event List */}
                        <div
                            onTouchStart={onTouchStart}
                            onTouchEnd={onTouchEnd}
                            style={slide.phase === 'exit' ? slide.exitStyle() : slide.enterStyle()}
                        >
                            {isLoading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl w-full" />)}
                                </div>
                            ) : displayEvents.length === 0 ? (
                                <div className="py-12 text-center space-y-2">
                                    <p className="text-4xl">📅</p>
                                    <p className="text-text-secondary text-sm">
                                        {isViewingToday ? 'ไม่มีกิจกรรมสำหรับวันนี้' : 'ไม่มีกิจกรรมในวันนี้'}
                                    </p>
                                    <a
                                        href={`schedule.html?date=${selectedDateStr}`}
                                        className="inline-block text-xs text-gold/70 hover:text-gold transition-colors underline underline-offset-2 mt-1"
                                    >
                                        + เพิ่มกิจกรรม
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {displayEvents.slice(0, 5).map((item, idx) => {
                                        const now = new Date();
                                        const startDate = new Date(item.start);
                                        const endDate = new Date(item.end);
                                        
                                        // Fix for legacy 1899-12-30 epoch dates from GAS
                                        if (startDate.getFullYear() < 1970) {
                                            startDate.setFullYear(now.getFullYear());
                                            startDate.setMonth(now.getMonth());
                                            startDate.setDate(now.getDate());
                                            endDate.setFullYear(now.getFullYear());
                                            endDate.setMonth(now.getMonth());
                                            endDate.setDate(now.getDate());
                                        }

                                        const isActive = isViewingToday && startDate <= now && endDate >= now;
                                        const isPast = isViewingToday && endDate < now;
                                        const startTime = startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                                        const endTime = endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <div
                                                key={idx}
                                                className={`flex items-start md:items-center gap-4 p-4 md:p-5 rounded-2xl transition-all duration-300
                                                    ${isActive ? 'bg-gradient-to-r from-[rgba(212,175,55,0.08)] to-transparent border border-[rgba(212,175,55,0.2)] shadow-[0_0_20px_rgba(212,175,55,0.1)] relative overflow-hidden backdrop-blur-sm'
                                                        : isPast ? 'opacity-40 hover:opacity-70 bg-white/[0.01] border border-white/[0.03]'
                                                            : 'hover:bg-white/[0.04] bg-white/[0.02] border border-white/[0.05]'}
                                                `}
                                                style={{ animationDelay: `${idx * 60}ms` }}
                                            >
                                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold to-yellow-200 shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>}

                                                
                                                <div className="w-16 md:w-20 pt-1 md:pt-0 flex flex-col items-center md:items-start text-xs font-semibold tracking-wider text-text-secondary leading-tight">
                                                    <div className={isActive ? 'text-gold' : ''}>{startTime}</div>
                                                    <div className="text-[10px] text-white/30 mt-1">{endTime}</div>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0 border-l border-white/[0.08] pl-5 py-1">
                                                    <h4 className={`text-sm md:text-base font-medium truncate ${isActive ? 'text-gold' : 'text-white/90'}`}>{item.title}</h4>
                                                    <span className="text-[11px] text-text-secondary line-clamp-2 md:truncate mt-1.5 leading-relaxed font-light">{item.description || 'ไม่มีคำอธิบาย'}</span>
                                                </div>

                                                
                                                {isActive && (
                                                    <span className="flex-shrink-0 px-3 py-1 bg-gold/20 border border-gold/50 text-gold text-[10px] font-bold rounded-xl uppercase tracking-widest animate-pulse mt-1 md:mt-0">
                                                        NOW
                                                    </span>
                                                )}
                                                {isPast && (
                                                    <span className="flex-shrink-0 text-[10px] text-white/30 mt-1 md:mt-0">✓</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {displayEvents.length > 5 && (
                                        <a
                                            href={`schedule.html?date=${selectedDateStr}`}
                                            className="block text-center text-xs text-gold/60 hover:text-gold transition-colors py-2"
                                        >
                                            ดูทั้งหมด {displayEvents.length} กิจกรรม →
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </BentoCard>

                    {/* ── Teaching Slot Card ── */}
                    <BentoCard
                        title={currentClass ? "กำลังสอนอยู่" : "คาบสอนถัดไป"}
                        subtitle="Teaching Session"
                        icon="GraduationCap"
                        accent="violet"
                        className="col-span-12 lg:col-span-4"
                        style={{ order: order.teaching }}
                    >
                        {isLoading ? (
                            <div className="animate-pulse space-y-3 mt-4">
                                <div className="h-10 bg-white/5 rounded-xl w-full" />
                                <div className="h-4 bg-white/5 rounded-lg w-2/3" />
                            </div>
                        ) : (currentClass || nextClass) ? (
                            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                                {currentClass && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold animate-pulse"></div>}
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-white truncate max-w-[180px]">{(currentClass || nextClass).subject}</h4>
                                    <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-lg">SEC {(currentClass || nextClass).section}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                                    <i data-lucide="Clock" className="w-3.5 h-3.5"></i>
                                    <span>
                                        {formatLocalTime((currentClass || nextClass).startTime)} - {formatLocalTime((currentClass || nextClass).endTime)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                        <i data-lucide="MapPin" className="w-3.5 h-3.5"></i>
                                        <span>{(currentClass || nextClass).room || 'ไม่ระบุห้อง'}</span>
                                    </div>
                                    {(currentClass || nextClass).onlineLink && (
                                        <a href={(currentClass || nextClass).onlineLink} target="_blank" className="p-2 bg-gold text-midnight rounded-lg hover:scale-110 transition-transform">
                                            <i data-lucide="Video" className="w-4 h-4"></i>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 py-8 text-center text-text-secondary text-sm italic border border-dashed border-white/10 rounded-2xl">
                                ไม่มีตารางสอนในวันนี้
                            </div>
                        )}
                        <a href="timetable.html" className="block text-center text-xs text-gold/60 hover:text-gold transition-colors mt-4">ดูตารางสอนทั้งหมด →</a>
                    </BentoCard>

                    {/* ── Mood & Energy Tracker Card ── */}
                    <BentoCard
                        title="พลังงาน & ความรู้สึก"
                        subtitle="Burnout Prevention"
                        icon="Activity"
                        accent="rose"
                        className="col-span-12 lg:col-span-4"
                        style={{ order: order.mood }}
                    >
                        <div className="mt-4 space-y-5">
                            {/* Mood Selection */}
                            <div className="flex justify-between gap-2">
                                {[
                                    { label: 'แฮปปี้', emoji: '😊', type: 'happy' },
                                    { label: 'เฉยๆ', emoji: '😐', type: 'neutral' },
                                    { label: 'เหนื่อย', emoji: '😫', type: 'tired' }
                                ].map(m => (
                                    <button
                                        key={m.type}
                                        onClick={() => handleSaveMood(m.type, latestMood?.energy || 50)}
                                        className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all
                                            ${latestMood?.mood === m.type 
                                                ? 'bg-gold/20 border-gold/50 scale-105' 
                                                : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'}`}
                                    >
                                        <span className="text-xl">{m.emoji}</span>
                                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-tighter">{m.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* New Energy Correlator & AI Analysis */}
                            <EnergyCorrelator 
                                energyLevel={localEnergy} 
                                setEnergyLevel={setLocalEnergy} 
                                handleSaveMood={(mood, energy) => handleSaveEnergyAndAnalyze(latestMood?.mood || 'Neutral', energy)} 
                                aiAdvice={energyAdvice} 
                                isAnalyzing={isEnergyAnalyzing} 
                            />
                        </div>
                    </BentoCard>

                    {/* ── Habit & Consistency Card ── */}
                    <BentoCard
                        title="Aura Consistency"
                        subtitle="Habit Tracker"
                        icon="Zap"
                        accent="gold"
                        className="col-span-12 lg:col-span-4"
                        style={{ order: order.habit }}
                    >
                        <div className="mt-4 space-y-4">
                            {isLoading ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-24 bg-white/5 rounded-2xl" />
                                    <div className="h-24 bg-white/5 rounded-2xl" />
                                </div>
                            ) : habits.length === 0 ? (
                                <div className="py-8 text-center text-text-secondary text-sm italic border border-dashed border-white/10 rounded-2xl">
                                    ยังไม่มีการตั้งเป้าหมายนิสัย
                                </div>
                            ) : (
                                habits.map(h => (
                                    <window.HabitHeatmap 
                                        key={h.id}
                                        habitId={h.id}
                                        logs={habitLogs}
                                        habitName={h.name}
                                        auraColor={h.color}
                                    />
                                ))
                            )}
                            <button 
                                onClick={() => window.location.href = 'goals.html'}
                                className="w-full py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] text-white/40 uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                + จัดการนิสัย
                            </button>
                        </div>
                    </BentoCard>

                    {/* ── AI Wisdom Card ── */}
                    <BentoCard
                        title="คำแนะนำจาก AI"
                        subtitle="Gemini Insight"
                        icon="Sparkles"
                        gold={true}
                        className="col-span-12 lg:col-span-4"
                        style={{ order: order.ai }}
                    >
                        <div className="mt-4 relative group">
                            {/* Refresh Button */}
                            {!isAILoading && todayEvents.length > 0 && (
                                <button 
                                    onClick={() => fetchAIAdvice(todayEvents, true)}
                                    className="absolute -top-12 right-0 p-2 rounded-lg bg-gold/5 border border-gold/10 text-gold/40 hover:text-gold hover:bg-gold/10 transition-all opacity-0 group-hover:opacity-100"
                                    title="วิเคราะห์ใหม่"
                                >
                                    <i data-lucide="RefreshCw" className="w-4 h-4"></i>
                                </button>
                            )}

                            {isAILoading ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-white/5 rounded w-full" />
                                    <div className="h-4 bg-white/5 rounded w-5/6" />
                                    <div className="h-4 bg-white/5 rounded w-4/6" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-white leading-relaxed italic text-sm">"{aiAdvice}"</p>
                                    {habitStackAdvice && (
                                        <div className="pt-4 border-t border-white/5">
                                            <p className="text-[10px] text-gold font-bold uppercase tracking-widest mb-1">Smart Habit Stacking</p>
                                            <p className="text-white/70 text-xs leading-relaxed italic">"{habitStackAdvice}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <a
                                href="ai-assistant.html"
                                className="inline-block text-center mt-6 w-full py-3 bg-gold/10 hover:bg-gold/20 text-gold rounded-xl transition-all border border-gold/20 text-sm font-medium"
                            >
                                คุยกับ AI ต่อ
                            </a>
                        </div>
                    </BentoCard>

                    {/* ── Goals Card ── */}
                    <BentoCard
                        title="เป้าหมาย"
                        subtitle="Daily Goals"
                        icon="Target"
                        accent="cyan"
                        className="col-span-12 lg:col-span-4"
                        style={{ order: order.goals }}
                    >
                        <div className="mt-6 flex flex-wrap justify-around gap-4">
                            {isLoading ? (
                                <div className="animate-pulse space-y-6 w-full">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-12 bg-white/5 rounded-2xl w-full" />
                                    ))}
                                </div>
                            ) : goals.length === 0 ? (
                                <div className="py-8 text-center text-text-secondary text-sm italic w-full">ไม่มีเป้าหมายที่กำลังดำเนินการ</div>
                            ) : (
                                goals.slice(0, 3).map((goal, idx) => {
                                    const progressPercent = Math.min((goal.progress / goal.total) * 100, 100);
                                    const colors = ['#D4AF37', '#37b4d4', '#d43737'];
                                    const color = colors[idx % colors.length];
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-2">
                                            <div className="progress-circle-container w-16 h-16">
                                                <svg width="64" height="64">
                                                    <circle className="progress-circle-bg" cx="32" cy="32" r="28" strokeWidth="4" />
                                                    <circle 
                                                        className="progress-circle-fill" 
                                                        cx="32" cy="32" r="28" 
                                                        strokeWidth="4"
                                                        stroke={color}
                                                        style={{ 
                                                            strokeDasharray: 176, 
                                                            strokeDashoffset: 176 - (176 * (progressPercent / 100))
                                                        }} 
                                                    />
                                                </svg>
                                                <span className="absolute text-[10px] font-bold text-white">{Math.round(progressPercent)}%</span>
                                            </div>
                                            <span className="text-[10px] text-white/60 truncate max-w-[64px] text-center">{goal.title}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </BentoCard>

                    {/* ── Wellness Card ── */}
                    <BentoCard
                        title="น้ำและการนอน"
                        subtitle="Wellness Monitor"
                        icon="Droplets"
                        accent="cyan"
                        className="col-span-12 lg:col-span-4"
                        style={{ order: order.wellness }}
                    >
                        <div className="mt-4 space-y-4">
                            {/* Water Intake Activity Ring */}
                            <div className="p-4 rounded-xl bg-[#37b4d4]/10 border border-[#37b4d4]/20 flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-[10px] text-[#37b4d4] font-bold uppercase tracking-widest">{isViewingToday ? 'Hydration Today' : 'Hydration'}</p>

                                    <h4 className="text-xl font-medium text-white mb-2">
                                        {Math.round(wellnessStats.water)} <span className="text-[10px] opacity-40">ml</span>
                                    </h4>
                                    <button 
                                        onClick={() => setIsWaterModalOpen(true)}
                                        className="py-2 px-4 bg-[#37b4d4]/20 text-[#37b4d4] text-[10px] font-bold rounded-lg hover:bg-[#37b4d4] hover:text-midnight transition-all"
                                    >
                                        + บันทึกดื่มน้ำ
                                    </button>
                                </div>
                                <div className="progress-circle-container w-20 h-20">
                                    <svg width="80" height="80">
                                        <circle className="progress-circle-bg" cx="40" cy="40" r="34" strokeWidth="6" />
                                        <circle 
                                            className="progress-circle-fill" 
                                            cx="40" cy="40" r="34" 
                                            strokeWidth="6"
                                            stroke="#37b4d4"
                                            style={{ 
                                                strokeDasharray: 214, 
                                                strokeDashoffset: 214 - (214 * Math.min(wellnessStats.water / (settings.waterGoal || 2000), 1))
                                            }} 
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Sleep Stats */}
                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Recovery</p>
                                    <span className="text-xs text-white/60">
                                        {wellnessStats.sleep}h
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[4, 6, 7, 8].map(h => (
                                        <button 
                                            key={h}
                                            onClick={async () => {
                                                const localDate = toDateStr(new Date());
                                                await window.gasClient.logWellness({ sleepHours: h, sleepQuality: 'good', date: localDate });
                                                const d = await window.gasClient.fetchData('wellness', true);
                                                if (d) setWellness(d.wellness);
                                            }}
                                            className={`flex-1 min-w-[45px] py-2 text-[10px] font-bold rounded-lg border transition-all ${wellnessStats.sleep === h ? 'bg-purple-500 border-purple-400 text-white' : 'border-white/5 bg-white/5 text-purple-400/50 hover:border-purple-400'}`}
                                        >
                                            {h}h
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* ── Meal Logs Card (Fixed) ── */}
                    <BentoCard
                        title="รายการอาหารวันนี้"
                        subtitle="Meal Logs"
                        icon="Coffee"
                        accent="orange"
                        className="col-span-12 lg:col-span-4"
                        style={{ order: order.mealLogs }}
                    >
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <i data-lucide="Utensils" className="w-3 h-3"></i>
                                    Nutrition Scanner
                                </p>
                                <button 
                                    onClick={() => setIsMealAnalyzerOpen(true)}
                                    className="text-[10px] font-bold text-gold hover:underline"
                                >
                                    เพิ่ม/สแกนอาหาร →
                                </button>
                            </div>

                            {/* Today's Calories & Summary */}
                            {(() => {
                                const todayNutri = nutrition.filter(n => n?.date && String(n.date).startsWith(toDateStr(today)));
                                const totals = todayNutri.reduce((acc, curr) => ({
                                    cals: acc.cals + (parseFloat(curr.calories) || 0),
                                    p: acc.p + (parseFloat(curr.protein) || 0),
                                    c: acc.c + (parseFloat(curr.carbs) || 0),
                                    f: acc.f + (parseFloat(curr.fat) || 0)
                                }), { cals: 0, p: 0, c: 0, f: 0 });

                                return todayNutri.length > 0 ? (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="p-3 bg-gold/5 border border-gold/10 rounded-xl relative overflow-hidden group">
                                            <p className="text-[9px] text-white/20 absolute top-2 right-2 uppercase">AI Summary</p>
                                            <p className="text-[11px] text-white/70 italic leading-relaxed pr-8">
                                                {isNutriSummaryLoading ? "กำลังสรุปการกิน..." : dailyNutritionSummary || "สแกนอาหารมื้อแรกเพื่อรับคำแนะนำครับ"}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[8px] text-white/20 uppercase tracking-widest pl-1">รายการวันนี้</p>
                                            <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                                                {todayNutri.map((n, i) => (
                                                    <div key={i} className="flex justify-between items-center text-[10px] text-white/40 py-2 border-b border-white/5 last:border-0">
                                                        <span className="truncate pr-2">{n.mealName}</span>
                                                        <span className="text-white/60 shrink-0">{n.calories} kcal</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <p className="text-xs text-text-secondary leading-relaxed italic mb-4 px-4">
                                            "{mealSuggestion || 'กำลังเตรียมแผนอาหารสำหรับตารางสอนวันนี้...'}"
                                        </p>
                                        <button 
                                            onClick={() => setIsMealAnalyzerOpen(true)}
                                            className="px-6 py-2 bg-gold/10 text-gold text-[10px] font-bold rounded-lg hover:bg-gold/20 transition-all"
                                        >
                                            บันทึกอาหารมื้อแรก
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </BentoCard>

                    {/* ── Finance Card ── */}
                    <BentoCard
                        title={isViewingToday ? "สรุปการเงินวันนี้" : `สรุปการเงิน ${selectedDateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`}

                        subtitle="Daily Finance"
                        icon="Wallet"
                        accent="emerald"
                        className="col-span-12 lg:col-span-4"
                        style={{ order: order.finance }}
                    >
                        <div className="mt-4">
                            {isLoading ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-16 bg-white/5 rounded-2xl w-full" />
                                    <div className="h-16 bg-white/5 rounded-2xl w-full" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-4 bg-green-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-green-500/70 font-bold uppercase tracking-widest">{isViewingToday ? 'รายรับวันนี้' : 'รายรับ'}</span>
                                            <span className="text-green-400 font-semibold text-xl">฿{financeStats.income.toLocaleString()}</span>
                                        </div>
                                        <i data-lucide="ArrowDownLeft" className="text-green-500 w-5 h-5"/>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest">{isViewingToday ? 'รายจ่ายวันนี้' : 'รายจ่าย'}</span>
                                            <span className="text-red-400 font-semibold text-xl">฿{financeStats.expense.toLocaleString()}</span>
                                        </div>

                                        <i data-lucide="ArrowUpRight" className="text-red-500 w-5 h-5"/>
                                    </div>
                                    <a
                                        href="finance.html"
                                        className="block text-center text-xs text-gold/60 hover:text-gold transition-colors py-2 mt-2"
                                    >
                                        จัดการการเงินทั้งหมด →
                                    </a>
                                </div>
                            )}
                        </div>
                    </BentoCard>

                    {/* ── Knowledge & Resources (Digital Garden) Card ── */}
                    <BentoCard
                        title="Digital Garden"
                        subtitle="Resource Saver"
                        icon="BookOpen"
                        accent="violet"
                        className="col-span-12 lg:col-span-4"
                        style={{ order: order.garden }}
                    >
                        <div className="mt-4">
                            <window.ResourceSaver 
                                resources={resources}
                                onSave={handleSaveResource}
                            />
                        </div>
                    </BentoCard>

                    {/* ── Quick Actions ── */}
                    <div className="col-span-12 grid grid-cols-3 lg:grid-cols-6 gap-3" style={{ order: order.quickActions }}>
                        {[
                            { label: 'Focus', icon: 'Zap', onClick: () => setIsFocusOpen(true), accent: '#D4AF37' },
                            { label: 'เพิ่มงาน', icon: 'Plus', href: `schedule.html?date=${selectedDateStr}`, accent: '#FB923C' },
                            { label: 'การเงิน', icon: 'Wallet', href: 'finance.html', accent: '#34D399' },
                            { label: 'เป้าหมาย', icon: 'Target', href: 'goals.html', accent: '#22D3EE' },
                            { label: 'บันทึก', icon: 'PenTool', onClick: () => setIsJournalOpen(true), accent: '#A78BFA' },
                            { label: 'AI', icon: 'Sparkles', href: 'ai-assistant.html', accent: '#D4AF37' },
                        ].map((btn, i) => {
                            const El = btn.onClick ? 'button' : 'a';
                            return (
                                <El
                                    key={i}
                                    onClick={btn.onClick}
                                    href={btn.href}
                                    className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.03] active:scale-95"
                                    style={{ 
                                        background: 'rgba(255,255,255,0.02)', 
                                        borderColor: 'rgba(255,255,255,0.05)',
                                    }}
                                >
                                    <div className="p-2.5 rounded-xl" style={{ background: `${btn.accent}12` }}>
                                        <i data-lucide={btn.icon} className="w-5 h-5" style={{ color: btn.accent, strokeWidth: 1.8 }}></i>
                                    </div>
                                    <span className="text-xs font-medium text-white/70">{btn.label}</span>
                                </El>
                            );
                        })}
                    </div>
                </div>

                {/* Focus Overlay */}
                <window.FocusOverlay 
                    isOpen={isFocusOpen} 
                    onClose={() => setIsFocusOpen(false)} 
                    activeGoal={goals.find(g => g.status !== 'สำเร็จ')}
                    onComplete={handleFocusComplete}
                />

                {/* Journal Modal */}
                <window.JournalModal 
                    isOpen={isJournalOpen}
                    onClose={() => setIsJournalOpen(false)}
                    onSave={handleSaveJournal}
                />
                {/* Water Intake Modal */}
                {isWaterModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-end lg:items-center justify-center lg:p-6">
                        <div className="absolute inset-0 bg-[#08090d]/85 backdrop-blur-xl" onClick={() => setIsWaterModalOpen(false)} />
                        <div className="relative w-full lg:max-w-sm lg:rounded-[28px] rounded-t-[24px] p-6 lg:p-8 modal-sheet lg:modal-panel shadow-2xl"
                            style={{ background: 'rgba(16,18,24,0.97)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ background: 'rgba(34,211,238,0.08)' }}>
                                        <i data-lucide="Droplets" className="w-4 h-4" style={{ color: '#22D3EE' }}></i>
                                    </div>
                                    <h3 className="text-lg text-white font-semibold tracking-tight">บันทึกน้ำ</h3>
                                </div>
                                <button onClick={() => setIsWaterModalOpen(false)} className="p-2 rounded-xl hover:bg-white/5 transition-all">
                                    <i data-lucide="X" className="w-4 h-4 text-white/30"></i>
                                </button>
                            </div>
                            <div className="space-y-5">
                                <div className="grid grid-cols-3 gap-2">
                                    {[250, 500, 750].map(v => (
                                        <button 
                                            key={v}
                                            onClick={() => setCustomWaterVol(v)}
                                            className="py-3 rounded-xl border transition-all text-xs font-bold"
                                            style={{ 
                                                borderColor: customWaterVol === v ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.05)',
                                                background: customWaterVol === v ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
                                                color: customWaterVol === v ? '#22D3EE' : 'rgba(255,255,255,0.4)'
                                            }}
                                        >
                                            {v}ml
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase tracking-widest pl-1" style={{ color: 'var(--text-tertiary)' }}>กำหนดเอง (ml)</label>
                                    <input 
                                        type="number" 
                                        value={customWaterVol}
                                        onChange={(e) => setCustomWaterVol(e.target.value)}
                                        className="w-full p-3.5 rounded-xl text-white outline-none transition-all input-glow"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                    />
                                </div>
                                <button 
                                    onClick={() => logWater(customWaterVol)}
                                    disabled={isSavingWater}
                                    className="w-full py-3.5 font-semibold rounded-xl btn-spring transition-all disabled:opacity-50 text-sm"
                                    style={{ background: '#22D3EE', color: '#08090d' }}
                                >
                                    {isSavingWater ? 'กำลังบันทึก...' : 'ยืนยัน'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Meal Scanner Modal */}
                <window.MealAnalyzer 
                    isOpen={isMealAnalyzerOpen}
                    onClose={() => setIsMealAnalyzerOpen(false)}
                    onSave={handleSaveMeal}
                />
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));

// Defensive Mounting - wait for components to be assigned by Babel
const mountApp = () => {
    const required = {
        Navbar: window.Navbar,
        BentoCard: window.BentoCard,
        HabitHeatmap: window.HabitHeatmap,
        FocusOverlay: window.FocusOverlay,
        JournalModal: window.JournalModal,
        ResourceSaver: window.ResourceSaver,
        MealAnalyzer: window.MealAnalyzer,
        NightstandMode: window.NightstandMode
    };

    const missing = Object.entries(required)
        .filter(([, v]) => typeof v !== 'function')
        .map(([k]) => k);

    if (missing.length === 0) {
        console.log("Aura LifeOS: All components loaded. Mounting...");
        try {
            root.render(
                <DashboardErrorBoundary>
                    <Dashboard />
                </DashboardErrorBoundary>
            );
            window.__AURA_MOUNTED__ = true;
            window.__AURA_BOOT_WAITING_FOR__ = null;
        } catch (err) {
            console.error("Aura LifeOS: Mount failed", err);
            const rootEl = document.getElementById('root');
            if (rootEl && !rootEl.dataset.auraBootError) {
                rootEl.dataset.auraBootError = '1';
                const msg = (err && (err.stack || err.message)) ? (err.stack || err.message) : String(err);
                rootEl.innerHTML = `<div style="padding:24px; color:rgba(255,255,255,0.85); font:14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">` +
                    `<div style="font-weight:700; margin-bottom:8px;">Aura LifeOS: Mount failed</div>` +
                    `<pre style="white-space:pre-wrap; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px; overflow:auto;">${msg.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>` +
                    `</div>`;
            }
        }
    } else {
        window.__AURA_BOOT_WAITING_FOR__ = missing;
        console.log("Aura LifeOS: Waiting for components...", missing);
        setTimeout(mountApp, 100);
    }
};

mountApp();

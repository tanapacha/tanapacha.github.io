const { useState, useEffect, useMemo, useRef } = React;

const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const isSameDay = (gasDate, targetDateStr) => {
    if (!gasDate || !targetDateStr) return false;
    const s = String(gasDate);
    if (s.startsWith(targetDateStr)) return true;
    try {
        const d = new Date(s);
        if (isNaN(d.getTime())) return false;
        const localFormat = toDateStr(d);
        return localFormat === targetDateStr;
    } catch (e) { return false; }
};

const Analytics = () => {
    const Navbar = window.Navbar;
    const BentoCard = window.BentoCard;

    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsight, setAiInsight] = useState('');
    
    const sleepChartRef = useRef(null);
    const teachingChartRef = useRef(null);
    const nutritionChartRef = useRef(null);
    
    const chartInstances = useRef({});

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            const sheets = "wellness,mood,finance,timetable,nutrition,focusSessions";
            const res = await window.gasClient.fetchData(sheets);
            if (res) setData(res);
            setIsLoading(false);
            if (window.lucide) setTimeout(() => window.lucide.createIcons(), 100);
        };
        loadAllData();
    }, []);

    // Daily Aggregates for 30 days
    const dailyStats = useMemo(() => {
        if (!data) return [];
        const result = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const ds = toDateStr(d);
            
            // 1. Sleep & Wellness
            const well = (data.wellness || []).find(w => isSameDay(w.date, ds));
            
            // 2. Mood & Energy (Today and Tomorrow for lag analysis)
            const mood = (data.mood || []).find(m => isSameDay(m.date, ds));
            
            // 3. Finance (Daily Total Expense)
            const expense = (data.finance || [])
                .filter(f => isSameDay(f.date, ds) && f.type === 'expense')
                .reduce((sum, f) => sum + parseFloat(f.amount), 0);
            
            // 4. Teaching Load (Duration in hours)
            const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
            const dayName = dayNames[d.getDay()];
            const classes = (data.timetable || []).filter(t => t.day === dayName);
            const teachHours = classes.reduce((sum, c) => {
                const [h1, m1] = c.startTime.split(':').map(Number);
                const [h2, m2] = c.endTime.split(':').map(Number);
                return sum + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
            }, 0);

            // 5. Nutrition (Total Cals)
            const cals = (data.nutrition || [])
                .filter(n => isSameDay(n.date, ds))
                .reduce((sum, n) => sum + parseFloat(n.calories), 0);

            result.push({
                date: ds,
                shortDate: `${d.getDate()}/${d.getMonth()+1}`,
                sleep: well ? parseFloat(well.sleepHours) : 0,
                sleepQuality: well ? parseFloat(well.sleepQuality) : 0,
                energy: mood ? parseFloat(mood.energy) : 0,
                expense: expense,
                teachHours: teachHours,
                calories: cals
            });
        }
        return result;
    }, [data]);

    // Render Charts
    useEffect(() => {
        if (isLoading || !dailyStats.length || !window.Chart) return;

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } } }
            }
        };

        // Chart 1: Sleep vs Next-Day Energy
        if (sleepChartRef.current) {
            const sleepData = dailyStats.slice(0, -1).map(d => d.sleep);
            const energyData = dailyStats.slice(1).map(d => d.energy);
            
            if (chartInstances.current.sleep) chartInstances.current.sleep.destroy();
            chartInstances.current.sleep = new window.Chart(sleepChartRef.current, {
                type: 'line',
                data: {
                    labels: dailyStats.slice(1).map(d => d.shortDate),
                    datasets: [
                        { label: 'ชั่วโมงนอน (เมื่อคืน)', data: sleepData, borderColor: '#818cf8', tension: 0.4, borderWidth: 2 },
                        { label: 'พลังงาน (วันนี้)', data: energyData, borderColor: '#34d399', tension: 0.4, borderWidth: 2 }
                    ]
                },
                options: commonOptions
            });
        }

        // Chart 2: Teaching Load vs Spending
        if (teachingChartRef.current) {
            if (chartInstances.current.teach) chartInstances.current.teach.destroy();
            chartInstances.current.teach = new window.Chart(teachingChartRef.current, {
                type: 'bar',
                data: {
                    labels: dailyStats.map(d => d.shortDate),
                    datasets: [
                        { label: 'คาบสอน (ชม.)', data: dailyStats.map(d => d.teachHours), backgroundColor: 'rgba(129,140,248,0.5)', borderRadius: 4 },
                        { label: 'รายจ่าย (บาท)', data: dailyStats.map(d => d.expense), type: 'line', borderColor: '#f87171', yAxisID: 'y1', tension: 0.3 }
                    ]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        y1: { position: 'right', grid: { display: false }, ticks: { color: 'rgba(248, 113, 113, 0.5)' } }
                    }
                }
            });
        }

        // Chart 3: Calories vs Sleep Quality
        if (nutritionChartRef.current) {
            if (chartInstances.current.nutri) chartInstances.current.nutri.destroy();
            chartInstances.current.nutri = new window.Chart(nutritionChartRef.current, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'แคลอรี่ vs คุณภาพการนอน',
                        data: dailyStats.map(d => ({ x: d.calories, y: d.sleepQuality })),
                        backgroundColor: '#fbbf24',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        x: { title: { display: true, text: 'แคลอรี่ (kcal)', color: 'rgba(255,255,255,0.2)', font: { size: 10 } }, ...commonOptions.scales.x },
                        y: { title: { display: true, text: 'คุณภาพการนอน (1-5)', color: 'rgba(255,255,255,0.2)', font: { size: 10 } }, ...commonOptions.scales.y }
                    }
                }
            });
        }

    }, [dailyStats, isLoading]);

    const handleAIDeepAnalysis = async (presetPrompt = null) => {
        setIsAnalyzing(true);
        
        // Prepare mini-dataset for AI
        const summary = dailyStats.slice(-14).map(d => 
            `วันที่ ${d.date}: นอน ${d.sleep}ชม. (คุณภาพ ${d.sleepQuality}/5), สอน ${d.teachHours}ชม., จ่าย ${d.expense}บ., พลังงาน ${d.energy}%`
        ).join('\n');

        const defaultPrompt = `ในฐานะ Aura Analytics Expert ช่วยวิเคราะห์ความสัมพันธ์ของข้อมูล 14 วันล่าสุดของฉันที:
${summary}
ช่วยหา 3 Insight สำคัญที่เชื่อมโยงกัน (เช่น การนอนส่งผลต่อการใช้จ่าย หรือตารางสอนส่งผลต่อพลังงาน) และแนะนำแนวทาง Bio-hacking 1 อย่างที่ว้าวที่สุด ตอบสั้นๆ เป็นข้อๆ ครับ`;

        const prompt = presetPrompt ? `${presetPrompt}\n\nนี่คือข้อมูลประกอบ:\n${summary}` : defaultPrompt;

        try {
            const res = await window.gasClient.callAI(prompt, "วิเคราะห์ความสัมพันธ์เชิงลึก");
            setAiInsight(res);
        } catch {
            setAiInsight("ขออภัย ไม่สามารถวิเคราะห์ได้ในขณะนี้");
        }
        setIsAnalyzing(false);
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </div>
    );

    return (
        <div className="app-container lg:pt-20">
            <Navbar />
            
            <main className="flex-1 min-h-screen p-6 lg:p-12 bg-midnight">
                {/* Header */}
                <header className="mb-8 p-8 bg-gradient-to-br from-violet-500/10 via-midnight to-midnight border border-violet-500/20 rounded-[40px] relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-violet-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                            ศูนย์วิเคราะห์อัจฉริยะ Aura
                        </div>
                    </div>
                    <h1 className="text-white text-4xl lg:text-6xl font-extrabold tracking-tight mb-4">วิเคราะห์ความสัมพันธ์</h1>
                    <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
                        วิเคราะห์ข้อมูลเชิงลึก ค้นหาว่าการนอน การกิน และตารางสอน 
                        ส่งผลต่อ <span className="text-violet-400 font-semibold italic">ประสิทธิภาพชีวิต</span> ของคุณอย่างไร
                    </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Charts Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BentoCard title="การนอน vs พลังงาน" subtitle="ประสิทธิภาพร่างกาย" icon="Zap" accent="emerald">
                            <div className="h-[200px] w-full mt-4">
                                <canvas ref={sleepChartRef}></canvas>
                            </div>
                            <p className="text-[10px] text-white/30 mt-4 italic">วิเคราะห์ชั่วโมงนอนของคืนก่อนหน้า เทียบกับระดับพลังงานในวันถัดไป</p>
                        </BentoCard>

                        <BentoCard title="แคลอรี่ vs คุณภาพการนอน" subtitle="ผลกระทบการเผาผลาญ" icon="Utensils" accent="gold">
                            <div className="h-[200px] w-full mt-4">
                                <canvas ref={nutritionChartRef}></canvas>
                            </div>
                            <p className="text-[10px] text-white/30 mt-4 italic">ค้นหาความสมดุลของสารอาหารที่ช่วยให้คุณหลับลึกที่สุด</p>
                        </BentoCard>
                        </div>

                        <BentoCard title="ภาระการสอน vs การใช้จ่าย" subtitle="ความเครียดและการเงิน" icon="TrendingUp" accent="rose">
                            <div className="h-[250px] w-full mt-4">
                                <canvas ref={teachingChartRef}></canvas>
                            </div>
                            <p className="text-[10px] text-white/30 mt-4 italic">เปรียบเทียบชั่วโมงการสอนกับพฤติกรรมการใช้จ่าย เพื่อดูแนวโน้ม Stress Spending</p>
                        </BentoCard>
                    </div>

                    {/* AI Insights & Presets */}
                    <div className="space-y-6">
                    <BentoCard title="วิเคราะห์เจาะลึกด้วย AI" subtitle="สมองกล Aura" icon="Sparkles" gold={true}>
                        <div className="mt-4">
                            {aiInsight ? (
                                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white/80 leading-relaxed whitespace-pre-wrap animate-fade-in">
                                    {aiInsight}
                                    <button 
                                        onClick={() => setAiInsight('')}
                                        className="mt-4 w-full py-2 text-[10px] text-white/30 hover:text-white transition-all uppercase font-bold tracking-widest"
                                    >
                                        ล้างข้อมูลการวิเคราะห์
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-sm text-white/50 mb-6 bg-white/5 p-4 rounded-xl border border-dashed border-white/10">
                                        Aura พร้อมค้นหา "จุดบอด" และ "โอกาส" จากข้อมูล 30 วันของคุณ
                                    </div>
                                    <button 
                                        onClick={() => handleAIDeepAnalysis()}
                                        disabled={isAnalyzing}
                                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isAnalyzing ? <span className="animate-spin text-xl">⏳</span> : <window.SafeIcon name="Brain" className="w-5 h-5" />}
                                        {isAnalyzing ? 'กำลังประมวลผลเชิงลึก...' : 'เริ่มวิเคราะห์ด้วย AI'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </BentoCard>

                    <BentoCard title="คำถามยอดฮิต" subtitle="ถาม Aura ได้ทันที" icon="MessageSquare">
                        <div className="flex flex-col gap-2 mt-4">
                            {[
                                "ถ้านอนน้อยกว่า 6 ชม. พลังงานจะลดลงกี่ %?",
                                "วันที่สอนหนัก มักจะใช้เงินเยอะขึ้นไหม?",
                                "กินแคลอรี่เท่าไหร่ถึงจะหลับได้ดีที่สุด?",
                                "ช่วงไหนของสัปดาห์ที่ประสิทธิภาพต่ำที่สุด?"
                            ].map((q, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleAIDeepAnalysis(q)}
                                    disabled={isAnalyzing}
                                    className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-white/70 hover:text-white transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </BentoCard>
                    </div>
                </div>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Analytics />);

// Remove diagnostic overlay when React mounts
setTimeout(() => {
    const diag = document.getElementById('boot-diagnostic');
    if (diag) {
        diag.style.opacity = '0';
        diag.style.pointerEvents = 'none';
        setTimeout(() => diag.remove(), 500);
    }
}, 500);

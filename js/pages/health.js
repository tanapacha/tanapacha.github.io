const { useState, useEffect } = React;
const { motion } = window.Motion || { motion: (props) => <div {...props} /> };

const HealthPage = () => {
    const today = new Date();
    const toDateStr = (date) => {
        try {
            // Local date string YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return date.toISOString().split('T')[0];
        }
    };

    const CACHE_KEY = 'aura_wellness_v2';
    const loadFromCache = () => {
        try {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
            if (cached && cached.date === toDateStr(new Date())) {
                return cached.data;
            }
        } catch (e) { console.error("Cache load error", e); }
        return null;
    };

    const saveToCache = (data) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                date: toDateStr(new Date()),
                data: data
            }));
        } catch (e) { console.error("Cache save error", e); }
    };

    // Helper to normalize any date/string from the sheet to YYYY-MM-DD (Local Time)
    const normalizeDate = (d) => {
        if (!d) return "";
        try {
            const cleanStr = String(d).trim().replace(/^'/, '');
            const dateObj = new Date(cleanStr);
            if (isNaN(dateObj.getTime())) return cleanStr.split('T')[0];
            
            // Use Local Date parts to avoid UTC shifting
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) { return String(d).split('T')[0]; }
    };

    const [nutrition, setNutrition] = useState([]);
    const [wellness, setWellness] = useState(loadFromCache() || []);
    const [settings, setSettings] = useState({ 
        waterGoal: 2000,
        gender: 'male',
        age: 25,
        weight: 70,
        height: 170,
        activityLevel: 1.2
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isMealAnalyzerOpen, setIsMealAnalyzerOpen] = useState(false);
    const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
    const [healthAdvice, setHealthAdvice] = useState(null);
    const [isSavingGoal, setIsSavingGoal] = useState(false);
    const [tempProfile, setTempProfile] = useState({});
    const [wellnessViewMode, setWellnessViewMode] = useState('day'); // 'day', 'week', 'month', 'year'
    const [manualWater, setManualWater] = useState(250);
    const [manualSleep, setManualSleep] = useState(8);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (force = false, silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const data = await window.gasClient.fetchData('nutrition,wellness,settings', force);
            if (data) {
                if (data.nutrition) setNutrition(data.nutrition);
                
                if (data.wellness) {
                    setWellness(prev => {
                        const serverData = data.wellness || [];
                        const todayStr = toDateStr(new Date());
                        
                        // Trust server as the definitive source of truth.
                        // We only merge local data if it's "Today" and strictly higher than server,
                        // BUT ONLY if today actually exists in the server data (to prevent phantom entries after a reset).
                        let finalData = [...serverData];
                        
                        const localToday = prev.find(p => normalizeDate(p.date) === todayStr);
                        const serverTodayIdx = finalData.findIndex(s => normalizeDate(s.date) === todayStr);
                        
                        if (localToday && serverTodayIdx !== -1) {
                            if (parseFloat(localToday.water) > parseFloat(finalData[serverTodayIdx].water)) {
                                finalData[serverTodayIdx] = { ...finalData[serverTodayIdx], water: localToday.water };
                            }
                        }
                        // Note: If today is in local but NOT in server, we no longer push it.
                        // This allows the UI to reflect a cleared/reset sheet (0 water) correctly.
                        
                        const sortedData = finalData.sort((a, b) => new Date(b.date) - new Date(a.date));
                        saveToCache(sortedData);
                        return sortedData;
                    });
                }

                if (data.settings) {
                    const s = {
                        waterGoal: parseInt(data.settings.waterGoal) || 2000,
                        gender: data.settings.gender || 'male',
                        age: parseInt(data.settings.age) || 25,
                        weight: parseFloat(data.settings.weight) || 70,
                        height: parseFloat(data.settings.height) || 170,
                        activityLevel: parseFloat(data.settings.activityLevel) || 1.2
                    };
                    setSettings(s);
                    setTempProfile(s);
                }
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
            if (window.lucide) {
                setTimeout(() => window.lucide.createIcons(), 200);
            }
        }
    };

    const handleSaveProfile = async () => {
        setIsSavingGoal(true);
        try {
            const keys = ['gender', 'age', 'weight', 'height', 'activityLevel', 'waterGoal'];
            for (const key of keys) {
                if (tempProfile[key] !== settings[key]) {
                    await window.gasClient.updateSetting(key, tempProfile[key]);
                }
            }
            setSettings({ ...tempProfile });
            alert("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!");
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setIsSavingGoal(false);
        }
    };

    // --- Calculations ---
    const calculateStats = () => {
        const { weight = 70, height = 170, age = 25, gender = 'male', activityLevel = 1.2 } = settings || {};
        
        // BMI
        const bmi = weight / ((height / 100) ** 2) || 0;
        
        // BMR (Mifflin-St Jeor)
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr = gender === 'male' ? bmr + 5 : bmr - 161;
        
        // TDEE
        const tdee = bmr * activityLevel;
        
        // Body Fat % (BMI-based estimate)
        const bodyFat = gender === 'male' 
            ? (1.20 * bmi) + (0.23 * age) - 16.2
            : (1.20 * bmi) + (0.23 * age) - 5.4;
            
        return { bmi, bmr, tdee, bodyFat };
    };

    const handleDataChange = async () => {
        await loadData(true, true);
        setTimeout(() => generateAIInsight(), 500);
    };

    const handleLogWater = async (amount) => {
        try {
            const localDate = toDateStr(new Date());
            
            // Optimistic UI Update
            setWellness(prev => {
                const index = prev.findIndex(w => String(w.date).startsWith(localDate));
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], water: (parseFloat(updated[index].water) || 0) + amount };
                    saveToCache(updated);
                    return updated;
                } else {
                    const updated = [...prev, { date: localDate, water: amount, sleepHours: 0 }];
                    saveToCache(updated);
                    return updated;
                }
            });

            const res = await window.gasClient.logWellness({ water: amount, date: localDate });
            
            // Sync with backend's definitive totals if available
            if (res && res.newTotals) {
                setWellness(prev => {
                    const index = prev.findIndex(w => normalizeDate(w.date) === localDate);
                    const updated = [...prev];
                    if (index !== -1) {
                        updated[index] = { ...updated[index], ...res.newTotals };
                    }
                    saveToCache(updated);
                    return updated;
                });
            }

            // Trust the newTotals, only do a background sync much later as safety
            setTimeout(() => generateAIInsight(), 500);
            setTimeout(() => loadData(true, true), 10000); 
        } catch (error) {
            console.error("Error logging water:", error);
            alert("บันทึกการดื่มน้ำลงระบบไม่สำเร็จครับ");
        }
    };

    const handleLogSleep = async (hours, quality = 'good') => {
        try {
            const localDate = toDateStr(new Date());

            // Optimistic UI Update
            setWellness(prev => {
                const index = prev.findIndex(w => normalizeDate(w.date) === localDate);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], sleepHours: hours, sleepQuality: quality };
                    saveToCache(updated);
                    return updated;
                } else {
                    const updated = [...prev, { date: localDate, water: 0, sleepHours: hours, sleepQuality: quality }];
                    saveToCache(updated);
                    return updated;
                }
            });

            const res = await window.gasClient.logWellness({ sleepHours: hours, sleepQuality: quality, date: localDate });
            
            // Sync with backend's definitive totals
            if (res && res.newTotals) {
                setWellness(prev => {
                    const index = prev.findIndex(w => normalizeDate(w.date) === localDate);
                    const updated = [...prev];
                    if (index !== -1) {
                        updated[index] = { ...updated[index], ...res.newTotals };
                    }
                    saveToCache(updated);
                    return updated;
                });
            }

            setTimeout(() => generateAIInsight(), 500);
            setTimeout(() => loadData(true, true), 10000);
        } catch (error) {
            console.error("Error logging sleep:", error);
            alert("บันทึกการนอนลงระบบไม่สำเร็จครับ");
        }
    };

    // --- Period Aggregation ---
    const getWellnessStats = () => {
        if (!wellness || wellness.length === 0) return { water: 0, sleep: 0, count: 0, history: [] };

        const now = new Date();
        const todayStr = toDateStr(now);
        
        if (wellnessViewMode === 'day') {
            const filtered = wellness.filter(w => normalizeDate(w.date) === todayStr);
            
            // If the database is properly cleaned, there should be only 1 row.
            // But as a fallback for old data, we sum water but TAKE THE LAST sleep value
            // (Since sleep intended to be the latest update for the day)
            const totalWater = filtered.reduce((sum, w) => sum + (parseFloat(w.water) || 0), 0);
            const latestSleep = filtered.length > 0 ? parseFloat(filtered[filtered.length - 1].sleepHours) || 0 : 0;
            
            return {
                water: totalWater,
                sleep: latestSleep,
                history: filtered
            };
        }

        // For other modes (week, month, year)
        let filtered = [];
        const oneDay = 24 * 60 * 60 * 1000;
        if (wellnessViewMode === 'week') {
            const startOfWeek = new Date(now.getTime() - 7 * oneDay);
            filtered = wellness.filter(w => new Date(w.date) >= startOfWeek);
        } else if (wellnessViewMode === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = wellness.filter(w => new Date(w.date) >= startOfMonth);
        } else if (wellnessViewMode === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            filtered = wellness.filter(w => new Date(w.date) >= startOfYear);
        }

        // Aggregate by date
        const grouped = filtered.reduce((acc, curr) => {
            const d = normalizeDate(curr.date);
            if (!acc[d]) acc[d] = { water: 0, sleep: 0, sleepEntries: [] };
            acc[d].water += parseFloat(curr.water) || 0;
            acc[d].sleepEntries.push(parseFloat(curr.sleepHours) || 0);
            return acc;
        }, {});

        const history = Object.keys(grouped).sort().map(date => ({
            date,
            water: grouped[date].water,
            sleep: grouped[date].sleepEntries.length > 0 ? grouped[date].sleepEntries[grouped[date].sleepEntries.length - 1] : 0
        }));

        const totalWaterValue = history.reduce((sum, h) => sum + h.water, 0);
        const totalSleepValue = history.reduce((sum, h) => sum + h.sleep, 0);
        const avgWater = history.length ? totalWaterValue / history.length : 0;
        const avgSleep = history.length ? totalSleepValue / history.length : 0;

        return { water: totalWaterValue, sleep: totalSleepValue, avgWater, avgSleep, history };
    };

    const wellnessStats = getWellnessStats();

    const generateAIInsight = async () => {
        setIsAIAnalyzing(true);
        try {
            const mealList = todayNutri.length > 0 
                ? todayNutri.map(m => `- ${m.mealName}: ${m.calories}kcal (P:${m.protein}g, C:${m.carbs}g, F:${m.fat}g)`).join('\n')
                : 'ยังไม่ได้บันทึกรายการอาหารในวันนี้';
                
            const hydrationStatus = wellnessStats.water > 0 
                ? `${wellnessStats.water} / ${settings.waterGoal} ml`
                : 'ยังไม่ได้บันทึกการดื่มน้ำเลย (อันตราย!)';
                
            const sleepStatus = wellnessStats.sleep > 0
                ? `${wellnessStats.sleep} ชั่วโมง`
                : 'ยังไม่ได้บันทึกการนอน';

            const prompt = `ในฐานะ Aura AI (เพื่อนคู่คิดด้านสุขภาพที่คอยดูแลและให้กำลังใจ) 
            ช่วยวิเคราะห์ภาพรวมความเฮลตี้ของฉันในวันนี้ให้หน่อยครับ อยากให้ช่วยแนะนำอย่างอบอุ่นและเป็นกันเอง:
            
            [Bio-Data ข้อมูลสุขภาพวันนี้]
            1. อาหารและโภชนาการ (Metabolic Intake):
               - พลังงานรับเข้า: ${Math.round(totals.cals)} / ${Math.round(stats.tdee)} kcal
               - Macro Ratio: P:${Math.round(totals.p)}g, C:${Math.round(totals.c)}g, F:${Math.round(totals.f)}g
               - รายการอาหาร:\n${mealList}
               
            2. การรักษาความชุ่มชื้น (Cellular Hydration): 
               - ปริมาณ: ${hydrationStatus} (เป้าหมาย: ${settings.waterGoal} ml)
               
            3. การฟื้นฟูร่างกาย (Circadian Recovery):
               - ระยะเวลา: ${sleepStatus} (ควรนอนให้ครบ 7-8 ชั่วโมงนะครับ)
            
            TDEE Target: ${Math.round(stats.tdee)} kcal
            
            [Your Mission]
            1. วิเคราะห์ด้วยความห่วงใย ผสมผสานความรู้ทางวิทยาศาสตร์ (เช่น พูดถึงสมดุลฮอร์โมน หรือการฟื้นฟูเซลล์) แต่เล่าให้น่าฟังและมีพลังบวก
            2. ให้คะแนน "Wellness Sync Score" 0-100% เพื่อเป็นกำลังใจในการดูแลตัวเอง
            3. ให้คำแนะนำ 3 ข้อ ที่ทำตามได้ง่ายและเป็นประโยชน์ต่อร่างกายจริงๆ
            
            ตอบกลับเป็น JSON เท่านั้น:
            {
               "analysis": "บทวิเคราะห์ที่ชาญฉลาดและสนุกสนาน (ผสมศัพท์การแพทย์แต่เล่าให้เข้าใจง่าย)",
               "wellnessSyncScore": 0-100,
               "advice": ["คำแนะนำแนววิทยาศาสตร์ข้อที่ 1", "คำแนะนำแนววิทยาศาสตร์ข้อที่ 2", "คำแนะนำแนววิทยาศาสตร์ข้อที่ 3"],
               "verdict": "ประโยคสรุปเท่ๆ ที่มีคลาสเรื่องสุขภาพ"
            }`;
            
            const responseText = await window.gasClient.callAI(prompt, "Health Analysis", "gemini-flash-latest");
            
            // Check for error messages returned by callAI
            if (typeof responseText === 'string' && responseText.includes('⚠️')) {
                throw new Error(responseText);
            }

            try {
                // Try to find JSON in the response
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    setHealthAdvice(data);
                } else {
                    // Fallback for plain text response
                    setHealthAdvice({
                        analysis: responseText,
                        disciplineScore: 70, // Default fallback
                        advice: ["กินนํ้าให้ครบ 2 ลิตร", "นอนก่อนเที่ยงคืน", "รักษาความสม่ำเสมอ"],
                        verdict: "วินัยสร้างได้ แค่เริ่มทำวันนี้"
                    });
                }
            } catch (e) {
                console.error("Parse error:", e);
                throw new Error("ไม่สามารถประมวลผลคำแนะนำจาก AI ได้ครับ");
            }
        } catch (error) {
            console.error("AI Analysis failed:", error);
            setHealthAdvice({
                analysis: error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI",
                disciplineScore: null,
                advice: ["ตรวจสอบการเชื่อมต่อ", "ลองใหม่อีกครั้ง", "เช็คสถานะ API"],
                verdict: "Aura AI พบปัญหาชั่วคราว"
            });
        } finally {
            setIsAIAnalyzing(false);
        }
    };

    const stats = calculateStats();

    const todayNutri = (nutrition || []).filter(n => n.date && typeof n.date === 'string' && n.date.startsWith(toDateStr(today)));
    const totals = todayNutri.reduce((acc, curr) => ({
        cals: acc.cals + (parseFloat(curr.calories) || 0),
        p: acc.p + (parseFloat(curr.protein) || 0),
        c: acc.c + (parseFloat(curr.carbs) || 0),
        f: acc.f + (parseFloat(curr.fat) || 0)
    }), { cals: 0, p: 0, c: 0, f: 0 });

    const todayWellness = wellness.find(w => w.date && typeof w.date === 'string' && w.date.startsWith(toDateStr(today))) || { water: 0, sleepHours: 0 };
    // We use aggregated wellnessStats for the view
    const currentWater = wellnessViewMode === 'day' ? wellnessStats.water : wellnessStats.avgWater;
    const currentSleep = wellnessViewMode === 'day' ? wellnessStats.sleep : wellnessStats.avgSleep;
    const waterProgress = Math.min((currentWater / settings.waterGoal) * 100, 100);

    // --- Elite Grade Logic ---
    const calculateEliteGrade = () => {
        const calRatio = totals.cals > 0 ? Math.max(0, 1 - (Math.abs(totals.cals - stats.tdee) / stats.tdee)) : 0;
        const waterRatio = Math.min(currentWater / settings.waterGoal, 1);
        const sleepRatio = Math.min(currentSleep / 8, 1);
        
        const score = (calRatio * 0.5) + (waterRatio * 0.25) + (sleepRatio * 0.25);
        
        if (score >= 0.9) return { grade: 'A', label: 'OPTIMIZED', color: 'text-gold' };
        if (score >= 0.8) return { grade: 'B', label: 'STABLE', color: 'text-emerald-400' };
        if (score >= 0.7) return { grade: 'C', label: 'NOMINAL', color: 'text-blue-400' };
        if (score >= 0.5) return { grade: 'D', label: 'WARNING', color: 'text-orange-400' };
        return { grade: 'F', label: 'CRITICAL', color: 'text-red-500' };
    };

    const eliteStats = calculateEliteGrade();

    const Navbar = window.Navbar;
    const BentoCard = window.BentoCard;
    const MealAnalyzer = window.MealAnalyzer;
    const SafeIcon = window.SafeIcon;

    return (
        <div className="min-h-screen bg-midnight text-white pb-32 lg:pb-12 lg:pl-24">
            {Navbar && <Navbar />}
            
            <main className="max-w-7xl mx-auto px-6 py-12">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-light mb-4 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                            Health Center
                        </h1>
                        <div className="flex items-center gap-4">
                            <p className="text-white/40 font-medium tracking-widest uppercase text-xs">Bio-Metrics & Nutrition Intelligence</p>
                            <span className="w-1 h-1 bg-gold/20 rounded-full"></span>
                            <button 
                                onClick={generateAIInsight}
                                disabled={isAIAnalyzing}
                                className="text-gold text-[10px] font-bold uppercase tracking-widest hover:underline disabled:opacity-50"
                            >
                                {isAIAnalyzing ? 'Analyzing...' : 'Click to Analyze with AI'}
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsMealAnalyzerOpen(true)}
                        className="px-8 py-4 bg-gold text-midnight font-bold rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {SafeIcon && <SafeIcon name="Camera" className="w-5 h-5" />}
                        สแกนอาหาร
                    </button>
                </header>

                <div className="grid grid-cols-12 gap-8">
                    
                    {/* ── Aura Elite Overview (NEW) ── */}
                    {BentoCard && (
                        <div className="col-span-12">
                            <div className="p-8 lg:p-12 rounded-[40px] bg-gradient-to-br from-gold/20 via-midnight to-midnight border border-gold/20 shadow-2xl relative overflow-hidden group">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                    {SafeIcon && <SafeIcon name="Activity" className="w-64 h-64 text-gold" />}
                                </div>

                                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
                                        <div className="px-4 py-1 bg-gold/10 border border-gold/20 rounded-full">
                                            <span className="text-[10px] text-gold font-bold tracking-[0.3em] uppercase">Today's Protocol Status</span>
                                        </div>
                                        <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter">
                                            Aura Elite <span className="text-gold">Summary</span>
                                        </h2>
                                        <p className="text-white/40 text-sm max-w-md">การวิเคราะห์พฤติกรรมเชิงชีวภาพและระดับความมีวินัยแบบ Real-time ของวันนี้</p>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        {/* Circular Grade */}
                                        <div className="relative w-32 h-32 lg:w-48 lg:h-48 flex items-center justify-center">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                <circle cx="50%" cy="50%" r="45%" className="fill-none stroke-white/5 stroke-[8]" />
                                                <circle 
                                                    cx="50%" cy="50%" r="45%" 
                                                    className="fill-none stroke-gold stroke-[8] transition-all duration-1000" 
                                                    strokeDasharray="283" 
                                                    strokeDashoffset={283 - (283 * waterProgress / 100)}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="text-center flex flex-col items-center">
                                                <span className={`text-6xl lg:text-8xl font-black tracking-tighter ${eliteStats.color}`}>{eliteStats.grade}</span>
                                                <span className={`text-[10px] font-bold tracking-[0.4em] ${eliteStats.color} opacity-50`}>{eliteStats.label}</span>
                                            </div>
                                        </div>

                                        {/* Quick Metrics */}
                                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
                                                    {SafeIcon && <SafeIcon name="Flame" className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-white/20 font-bold uppercase tracking-widest">Calories</div>
                                                    <div className="text-lg font-medium">{Math.round(totals.cals)} <span className="text-[10px] opacity-20">kcal</span></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#37b4d4]">
                                                    {SafeIcon && <SafeIcon name="Droplet" className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-white/20 font-bold uppercase tracking-widest">Hydration</div>
                                                    <div className="text-lg font-medium">{currentWater} <span className="text-[10px] opacity-20">ml</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* ── Aura AI Analysis Section ── */}
                    {/* ── Aura AI Analysis Section (Redesigned) ── */}
                    {BentoCard && (
                        <div className="col-span-12">
                            <BentoCard 
                                title="คำแนะนำจาก AI"
                                subtitle="Gemini Insight"
                                icon="Sparkles"
                                gold={true}
                                className="w-full"
                            >
                                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                                    {/* Left: Insight & Description */}
                                    <div className="lg:col-span-8 flex flex-col justify-center">
                                        {isAIAnalyzing ? (
                                            <div className="py-12 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center animate-pulse">
                                                        <SafeIcon name="Brain" className="w-6 h-6 text-gold" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-medium text-white">กำลังวิเคราะห์ข้อมูลสุขภาพ...</h4>
                                                        <p className="text-xs text-white/40">Gemini กำลังประมวลผลพฤติกรรมวันนี้ของคุณ</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 pl-16">
                                                    <div className="h-2 bg-white/5 rounded-full w-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
                                                    <div className="h-2 bg-white/5 rounded-full w-[90%] animate-pulse" />
                                                    <div className="h-2 bg-white/5 rounded-full w-[75%] animate-pulse" />
                                                </div>
                                            </div>
                                        ) : !healthAdvice ? (
                                            <div className="py-12 flex flex-col items-start gap-6 text-left">
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 opacity-30">
                                                    <SafeIcon name="Terminal" className="w-8 h-8 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-3xl font-light text-white mb-3">ต้องการวินัยที่ <span className="text-gold">เข้มข้น</span> ขึ้นไหม?</h3>
                                                    <p className="text-white/40 text-base max-w-xl leading-relaxed">
                                                        ให้ AI ช่วยประเมินการกิน การดื่มน้ำ และการนอนของคุณ 
                                                        เราจะวัดผลเป็นคะแนนวินัย (Discipline Score) พร้อมคำแนะนำที่ตรงจุดที่สุด
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={generateAIInsight}
                                                    className="px-10 py-5 bg-gold text-midnight font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(212,175,55,0.2)] uppercase tracking-widest text-[11px]"
                                                >
                                                    เริ่มการวิเคราะห์ด้วย AI
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-8 py-4 animate-fade-in">
                                                <div className="relative p-8 rounded-[40px] bg-white/[0.03] border border-white/10 group">
                                                    <div className="absolute top-6 right-8 text-[10px] text-white/20 uppercase font-black tracking-widest italic">Aura Intelligence</div>
                                                    <p className="text-xl lg:text-2xl text-white leading-relaxed font-light pr-12 italic">
                                                        "{healthAdvice.analysis}"
                                                    </p>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {healthAdvice.advice?.map((item, idx) => (
                                                        <div key={idx} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-gold/30 transition-all group flex gap-4 items-start">
                                                            <div className="mt-1 w-2 h-2 rounded-full bg-gold/50 shadow-[0_0_8px_#D4AF37] group-hover:scale-125 transition-transform" />
                                                            <p className="text-xs text-white/60 leading-relaxed">{item}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Score & Actions */}
                                    <div className="lg:col-span-4 flex flex-col gap-6">
                                        <div className="p-8 rounded-[40px] bg-gradient-to-br from-gold/10 to-transparent border border-gold/10 flex flex-col items-center justify-center text-center relative overflow-hidden h-full">
                                            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                                {SafeIcon && <SafeIcon name="Trophy" className="w-32 h-32 text-gold" />}
                                            </div>
                                            
                                            <div className="relative">
                                                <div className="text-[10px] text-gold font-black uppercase tracking-[.4em] mb-4">Discipline Score</div>
                                                <div className="text-8xl font-thin text-white mb-2 leading-none">
                                                    {healthAdvice?.disciplineScore || '--'}<span className="text-xl opacity-20 ml-1">%</span>
                                                </div>
                                                <div className="h-1 w-40 bg-white/5 rounded-full overflow-hidden mx-auto mb-8">
                                                    <div 
                                                        className="h-full bg-gold shadow-[0_0_20px_#D4AF37] transition-all duration-1000"
                                                        style={{ width: `${healthAdvice?.disciplineScore || 0}%` }}
                                                    />
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 mb-8 max-w-[200px] mx-auto">
                                                    <p className="text-[10px] text-gold/80 font-bold uppercase tracking-widest">
                                                        {healthAdvice?.verdict || "Waiting for data"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="w-full space-y-3 mt-auto">
                                                <a
                                                    href="ai-assistant.html"
                                                    className="flex items-center justify-center gap-3 w-full py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all uppercase tracking-widest text-[10px] group"
                                                >
                                                    {SafeIcon && <SafeIcon name="MessageSquare" className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />}
                                                    คุยกับ AI ต่อ
                                                </a>
                                                {healthAdvice && (
                                                    <button 
                                                        onClick={generateAIInsight}
                                                        className="text-[10px] font-bold text-white/30 hover:text-gold uppercase tracking-[.2em] transition-colors"
                                                    >
                                                        Re-Analyze Data
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </BentoCard>
                        </div>
                    )}

                    {/* ── Bio-Analytics Dashboard ── */}
                    {BentoCard && <BentoCard 
                        title="สรุปวิเคราะห์ร่างกาย"
                        subtitle="Advanced Bio-Metrics"
                        icon="Zap"
                        className="col-span-12 lg:col-span-8"
                    >
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'TDEE', value: Math.round(stats.tdee), unit: 'kcal/day', color: 'text-gold', bg: 'bg-gold/10', icon: 'Flame' },
                                { label: 'BMR', value: Math.round(stats.bmr), unit: 'kcal/day', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: 'Zap' },
                                { label: 'BMI', value: stats.bmi.toFixed(1), unit: 'Index', color: 'text-green-400', bg: 'bg-green-400/10', icon: 'Activity' },
                                { label: 'Body Fat', value: stats.bodyFat.toFixed(1) + '%', unit: 'Estimate', color: 'text-red-500', bg: 'bg-red-500/10', icon: 'PieChart' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all group flex flex-col items-center justify-center text-center">
                                    <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        {SafeIcon && <SafeIcon name={item.icon} className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[10px] ${item.color} font-black uppercase tracking-[0.2em] mb-1`}>{item.label}</span>
                                    <span className="text-3xl font-light tracking-tighter">{item.value}</span>
                                    <span className="text-[10px] text-white/20 font-medium uppercase mt-1">{item.unit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-8 rounded-[40px] bg-white/5 border border-white/5 relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={502} strokeDashoffset={502 - (502 * Math.min(totals.cals/stats.tdee, 1.2))} className="text-gold transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold">{Math.round(totals.cals)}</span>
                                        <span className="text-xs text-white/40 uppercase">Consumed</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-6">
                                    <h3 className="text-2xl font-light">วันนี้คุณทานไปแล้ว {Math.round((totals.cals / stats.tdee) * 100)}% ของเป้าหมาย TDEE</h3>
                                    <p className="text-white/40 text-sm leading-relaxed">
                                        ตามข้อมูล ร่างกายของคุณ คุณควรบริโภคประมาณ <strong>{Math.round(stats.tdee)} แคลอรี่</strong> เพื่อรักษาน้ำหนัก 
                                        {totals.cals > stats.tdee ? " ตอนนี้คุณทานเกินค่า TDEE แล้ว ระวังน้ำหนักขึ้นนะครับ!" : " คุณยังมีพื้นที่เหลือสำหรับมื้อจุกจิกอีกนิดหน่อยครับ"}
                                    </p>
                                    <div className="flex gap-4">
                                        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-400 font-bold uppercase">P: {Math.round(totals.p)}g</div>
                                        <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-[10px] text-green-400 font-bold uppercase">C: {Math.round(totals.c)}g</div>
                                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-bold uppercase">F: {Math.round(totals.f)}g</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BentoCard>}

                    {/* ── Physical Profile Form ── */}
                    {BentoCard && <BentoCard
                        title="ข้อมูล ร่างกาย & เป้าหมาย"
                        subtitle="Physical Data Protocol"
                        icon="User"
                        className="col-span-12 lg:col-span-4"
                    >
                        <div className="mt-8 space-y-6">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest flex items-center gap-2">
                                        {SafeIcon && <SafeIcon name="User" className="w-3 h-3" />} เพศ
                                    </label>
                                    <select 
                                        value={tempProfile.gender}
                                        onChange={(e) => setTempProfile({...tempProfile, gender: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all cursor-pointer appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                                    >
                                        <option value="male" className="bg-zinc-900 text-white">ชาย (Male)</option>
                                        <option value="female" className="bg-zinc-900 text-white">หญิง (Female)</option>
                                    </select>
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest flex items-center gap-2">
                                        {SafeIcon && <SafeIcon name="Calendar" className="w-3 h-3" />} อายุ (ปี)
                                    </label>
                                    <input 
                                        type="number" 
                                        value={tempProfile.age}
                                        onChange={(e) => setTempProfile({...tempProfile, age: parseInt(e.target.value)})}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                                        placeholder="25"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest flex items-center gap-2">
                                        {SafeIcon && <SafeIcon name="Weight" className="w-3 h-3" />} น้ำหนัก (kg)
                                    </label>
                                    <input 
                                        type="number" 
                                        value={tempProfile.weight}
                                        onChange={(e) => setTempProfile({...tempProfile, weight: parseFloat(e.target.value)})}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                                        placeholder="70.0"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest flex items-center gap-2">
                                        {SafeIcon && <SafeIcon name="Ruler" className="w-3 h-3" />} ส่วนสูง (cm)
                                    </label>
                                    <input 
                                        type="number" 
                                        value={tempProfile.height}
                                        onChange={(e) => setTempProfile({...tempProfile, height: parseFloat(e.target.value)})}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                                        placeholder="170"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest flex items-center gap-2">
                                    {SafeIcon && <SafeIcon name="Activity" className="w-3 h-3" />} ระดับกิจกรรม
                                </label>
                                <select 
                                    value={tempProfile.activityLevel}
                                    onChange={(e) => setTempProfile({...tempProfile, activityLevel: parseFloat(e.target.value)})}
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all cursor-pointer appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                                >
                                    <option value="1.2" className="bg-zinc-900 text-white">นั่งทำงานเฉยๆ (Sedentary)</option>
                                    <option value="1.375" className="bg-zinc-900 text-white">ออกกำลัง 1-3 วัน/สัปดาห์</option>
                                    <option value="1.55" className="bg-zinc-900 text-white">ออกกำลัง 3-5 วัน/สัปดาห์</option>
                                    <option value="1.725" className="bg-zinc-900 text-white">ออกกำลังหนัก 6-7 วัน</option>
                                    <option value="1.9" className="bg-zinc-900 text-white">นักกีฬา/งานออกแรงหนักมาก</option>
                                </select>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] text-[#37b4d4] font-bold uppercase tracking-widest flex items-center gap-2">
                                    {SafeIcon && <SafeIcon name="Droplet" className="w-3 h-3" />} เป้าหมายน้ำ (ml)
                                </label>
                                <input 
                                    type="number" 
                                    value={tempProfile.waterGoal}
                                    onChange={(e) => setTempProfile({...tempProfile, waterGoal: parseInt(e.target.value)})}
                                    className="w-full bg-white/5 border border-[#37b4d4]/10 p-4 rounded-2xl text-white outline-none focus:border-[#37b4d4]/50 focus:ring-1 focus:ring-[#37b4d4]/20 transition-all font-medium"
                                />
                            </div>

                            <button 
                                onClick={handleSaveProfile}
                                disabled={isSavingGoal}
                                className="w-full py-5 bg-gradient-to-r from-gold/80 to-gold text-midnight font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(212,175,55,0.2)] disabled:opacity-50 uppercase tracking-widest text-xs"
                            >
                                {isSavingGoal ? 'Updating Protocol...' : 'อัปเดตข้อมูลร่างกาย'}
                            </button>
                        </div>
                    </BentoCard>}

                    {/* ── Meal History ── */}
                    {BentoCard && <BentoCard
                        title="ประวัติมื้ออาหารวันนี้"
                        subtitle="Today's Meal Records"
                        icon="Utensils"
                        className="col-span-12 lg:col-span-8"
                    >
                        <div className="mt-6 space-y-3">
                            {todayNutri.length === 0 ? (
                                <div className="py-20 text-center text-white/10 italic">ยังไม่มีข้อมูลมื้ออาหาร</div>
                            ) : (
                                todayNutri.map((meal, idx) => (
                                    <div key={idx} className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-gold/5 hover:border-gold/20 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                                                {SafeIcon && <SafeIcon name="Flame" className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h5 className="text-white font-medium">{meal.mealName}</h5>
                                                <p className="text-[10px] text-white/30 uppercase tracking-widest">{new Date(meal.date).toLocaleTimeString('th-TH')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-light text-white">{meal.calories} <span className="text-[10px] opacity-40">kcal</span></span>
                                            <div className="flex gap-3 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[8px] font-bold">P: {meal.protein}g</span>
                                                <span className="text-[8px] font-bold">C: {meal.carbs}g</span>
                                                <span className="text-[8px] font-bold">F: {meal.fat}g</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </BentoCard>}

                    {/* ── Water & Sleep Quick View ── */}
                    {BentoCard && <BentoCard
                        title="วิเคราะห์ Wellness"
                        subtitle="Water & Sleep Analytics"
                        icon="Droplets"
                        className="col-span-12 lg:col-span-4"
                    >
                        {/* Period Selector Tabs */}
                        <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
                            {['day', 'week', 'month', 'year'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setWellnessViewMode(mode)}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${wellnessViewMode === mode ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                                >
                                    {mode === 'day' ? 'วันนี้' : mode === 'week' ? 'สัปดาห์' : mode === 'month' ? 'เดือน' : 'ปี'}
                                </button>
                            ))}
                        </div>

                        {wellnessViewMode === 'day' ? (
                            <div className="space-y-8 animate-fade-in">
                                {/* Water Section */}
                                <div className="p-6 rounded-[32px] bg-[#37b4d4]/10 border border-[#37b4d4]/20 relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#37b4d4]/20 rounded-full flex items-center justify-center text-[#37b4d4]">
                                                {SafeIcon && <SafeIcon name="Droplet" className="w-4 h-4" />}
                                            </div>
                                            <span className="text-[10px] text-[#37b4d4] font-black tracking-widest uppercase">Water Intake</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-white">{Math.round(currentWater)} / {settings.waterGoal} ml</span>
                                            <button 
                                                onClick={async () => {
                                                    if (confirm('ล้างข้อมูลวันนี้ทั้งหมดทิ้ง (ทั้งน้ำและการนอน)?')) {
                                                        try {
                                                            setIsLoading(true);
                                                            await window.gasClient.resetWellness();
                                                            
                                                            // Clear local state immediately for instant feedback
                                                            setWellness([]);
                                                            setNutrition([]);
                                                            setHealthAdvice(null);
                                                            
                                                            // Force refresh from server with force=true
                                                            await loadData(true);
                                                            alert("ล้างข้อมูลวันนี้เรียบร้อยแล้ว!");
                                                        } catch (err) {
                                                            console.error("Reset failed:", err);
                                                            alert("เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล");
                                                        } finally {
                                                            setIsLoading(false);
                                                        }
                                                    }
                                                }}
                                                className="p-1.5 bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-400 rounded-lg transition-all"
                                                title="Reset Today"
                                            >
                                                {SafeIcon && <SafeIcon name="RotateCcw" className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                                        <div 
                                            className="h-full bg-[#37b4d4] shadow-[0_0_15px_#37b4d4] transition-all duration-1000" 
                                            style={{ width: `${waterProgress}%` }} 
                                        />
                                    </div>

                                    {/* Manual Input & Stepper */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <button 
                                            onClick={() => setManualWater(Math.max(0, manualWater - 50))}
                                            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                        >
                                            {SafeIcon && <SafeIcon name="Minus" className="w-4 h-4" />}
                                        </button>
                                        <div className="flex-1 relative">
                                            <input 
                                                type="number" 
                                                value={manualWater}
                                                onChange={(e) => setManualWater(parseInt(e.target.value) || 0)}
                                                className="w-full bg-white/5 border border-white/10 py-3 px-4 rounded-2xl text-center text-white font-bold outline-none focus:border-[#37b4d4]/50"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">ML</span>
                                        </div>
                                        <button 
                                            onClick={() => setManualWater(manualWater + 50)}
                                            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                        >
                                            {SafeIcon && <SafeIcon name="Plus" className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleLogWater(manualWater)}
                                            className="py-3 bg-[#37b4d4] text-midnight font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                                        >
                                            บันทึกข้อมูล
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleLogWater(250)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl text-[10px] font-bold">+250</button>
                                            <button onClick={() => handleLogWater(500)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl text-[10px] font-bold">+500</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Sleep Section */}
                                <div className="p-6 rounded-[32px] bg-purple-500/10 border border-purple-500/20">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                                                {SafeIcon && <SafeIcon name="Moon" className="w-4 h-4" />}
                                            </div>
                                            <span className="text-[10px] text-purple-400 font-black tracking-widest uppercase">Sleep Protocol</span>
                                        </div>
                                        <span className="text-sm font-medium text-white">{currentSleep} h</span>
                                    </div>

                                    <div className="flex items-center gap-3 mb-6">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={`flex-1 h-1.5 rounded-full ${i < currentSleep ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/5'}`} 
                                            />
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <button 
                                            onClick={() => setManualSleep(Math.max(0, manualSleep - 0.5))}
                                            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                        >
                                            {SafeIcon && <SafeIcon name="Minus" className="w-4 h-4" />}
                                        </button>
                                        <div className="flex-1 relative">
                                            <input 
                                                type="number" 
                                                step="0.5"
                                                value={manualSleep}
                                                onChange={(e) => setManualSleep(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-white/5 border border-white/10 py-3 px-4 rounded-2xl text-center text-white font-bold outline-none focus:border-purple-500/50"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">HOURS</span>
                                        </div>
                                        <button 
                                            onClick={() => setManualSleep(manualSleep + 0.5)}
                                            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                        >
                                            {SafeIcon && <SafeIcon name="Plus" className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => handleLogSleep(manualSleep)}
                                        className="w-full py-4 bg-purple-500 text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                                    >
                                        อัปเดตชั่วโมงการนอน
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-fade-in py-4">
                                {/* Analytics Bars */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h4 className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Average Consumption</h4>
                                            <div className="text-2xl font-light text-white">{Math.round(wellnessStats.avgWater)} <span className="text-xs opacity-20 ml-1">ml/day</span></div>
                                        </div>
                                        <div className="text-right">
                                            <h4 className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Total Sleep</h4>
                                            <div className="text-2xl font-light text-purple-400">{Math.round(wellnessStats.avgSleep * 10) / 10} <span className="text-xs opacity-20 ml-1">h/day (avg)</span></div>
                                        </div>
                                    </div>

                                    {/* Simple Trend Visualizer */}
                                    <div className="h-32 flex items-end gap-1.5 px-2">
                                        {wellnessStats.history.slice(-14).map((h, i) => (
                                            <div key={i} className="flex-1 flex flex-col gap-1 items-center group relative">
                                                {/* Tooltip */}
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-white/10 shadow-xl">
                                                    {h.date}<br/>
                                                    Water: {h.water}ml<br/>
                                                    Sleep: {h.sleep}h
                                                </div>
                                                <div 
                                                    className="w-full bg-purple-500/40 rounded-t-sm transition-all duration-500" 
                                                    style={{ height: `${Math.min((h.sleep/12)*100, 100)}%` }} 
                                                />
                                                <div 
                                                    className="w-full bg-[#37b4d4] rounded-t-sm transition-all duration-500" 
                                                    style={{ height: `${Math.min((h.water/settings.waterGoal)*100, 100)}%` }} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between px-2 text-[8px] text-white/20 font-bold uppercase tracking-widest">
                                        <span>Older</span>
                                        <span>Recent</span>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                                            {SafeIcon && <SafeIcon name="TrendingUp" className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-white">แนวโน้มสุขภาพความมีวินัย</h5>
                                            <p className="text-[10px] text-white/30">วิเคราะห์จากข้อมูล {wellnessStats.history.length} วันล่าสุด</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/60 leading-relaxed italic">
                                        "{wellnessStats.avgWater >= settings.waterGoal ? "คุณรักษาระดับการดื่มน้ำได้ยอดเยี่ยมมาก" : "พยายามดื่มน้ำให้ใกล้เคียงเป้าหมายมากขึ้นเพื่อสุขภาพที่ดี"} 
                                        และมีการนอนเฉลี่ยอยู่ที่ {Math.round(wellnessStats.avgSleep * 10) / 10} ชั่วโมงต่อวัน"
                                    </p>
                                </div>
                            </div>
                        )}
                    </BentoCard>}
                </div>
            </main>

            {MealAnalyzer && (
                <MealAnalyzer 
                    isOpen={isMealAnalyzerOpen}
                    onClose={() => setIsMealAnalyzerOpen(false)}
                    onSave={handleDataChange}
                />
            )}
        </div>
    );
};

// Mount
const mountApp = () => {
    const root = document.getElementById('root');
    if (!root) return;

    // Robust Polling for global components
    const hasNavbar = !!window.Navbar;
    const hasBento = !!window.BentoCard;
    const hasMeal = !!window.MealAnalyzer;
    const hasSafeIcon = !!window.SafeIcon;

    if (hasNavbar && hasBento && hasMeal && hasSafeIcon) {
        ReactDOM.createRoot(root).render(<HealthPage />);
    } else {
        setTimeout(mountApp, 100);
    }
};

mountApp();

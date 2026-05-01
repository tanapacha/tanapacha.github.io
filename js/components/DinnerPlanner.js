const { useState, useEffect } = React;

const DinnerPlanner = ({ dailyStats, onClose }) => {
    const [budget, setBudget] = useState('50'); // '0', '50', '100+'
    const [fridgeItems, setFridgeItems] = useState('');
    const [leaveForFamily, setLeaveForFamily] = useState(false);
    const [isPlanning, setIsPlanning] = useState(false);
    const [aiPlan, setAiPlan] = useState('');

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    const getMealContext = () => {
        const hour = new Date().getHours();
        if (hour < 10) return { name: 'เช้า', ratio: 0.3 };
        if (hour < 15) return { name: 'กลางวัน', ratio: 0.4 };
        return { name: 'เย็น/ค่ำ', ratio: 1.0 }; // Use all remaining for dinner
    };

    const mealContext = getMealContext();
    const suggestedCals = Math.round(
        mealContext.ratio === 1.0 
        ? dailyStats.remainingCalories 
        : Math.min(dailyStats.targetCalories * mealContext.ratio, dailyStats.remainingCalories)
    );
    
    // Calculate remaining macros
    const remP = Math.max(0, dailyStats.targetP - dailyStats.consumedP);
    const remC = Math.max(0, dailyStats.targetC - dailyStats.consumedC);
    const remF = Math.max(0, dailyStats.targetF - dailyStats.consumedF);

    const handlePlan = async () => {
        setIsPlanning(true);
        setAiPlan('');

        const prompt = `ในฐานะผู้เชี่ยวชาญด้านโภชนาการและ Bio-hacking ช่วยคิดเมนูอาหารมื้อถัดไปให้หน่อยครับ

บริบทของวันนี้:
- เป้าหมายแคลอรี่รวมทั้งวัน (รวม Deficit/Surplus แล้ว): ${Math.round(dailyStats.targetCalories)} kcal
- กินไปแล้ววันนี้: ${Math.round(dailyStats.consumedCalories)} kcal
- **แคลอรี่คงเหลือทั้งวัน: ${Math.round(dailyStats.remainingCalories)} kcal**
- โปรตีนเป้าหมาย: ${Math.round(dailyStats.targetP)}g (กินไปแล้ว ${Math.round(dailyStats.consumedP)}g, เหลือ ${Math.round(remP)}g)
- มื้อนี้คือมื้อ: "${mealContext.name}"

โควต้าที่เหมาะสมสำหรับมื้อนี้:
- แนะนำให้อยู่ที่ประมาณ **${suggestedCals} kcal** (ไม่จำเป็นต้องยัดแคลอรี่ที่เหลือทั้งหมดลงในมื้อเดียว ถ้ายังไม่ใช่มื้อเย็น)
- เน้นเติมโปรตีนให้ใกล้เคียงเป้าหมายที่เหลือ

เงื่อนไขวัตถุดิบและงบประมาณ:
1. งบประมาณ: ${budget === '0' ? '0 บาท (ต้องใช้เฉพาะของที่มีในตู้เย็น)' : budget + ' บาท'}
2. ของที่มีในตู้เย็นตอนนี้: ${fridgeItems || 'ไม่มี/ไม่ได้ระบุ'}
3. เงื่อนไขพิเศษ: ${leaveForFamily ? 'ฉันกินคนเดียว แต่ห้ามใช้วัตถุดิบที่มีจนหมดเกลี้ยง ต้องเหลือวัตถุดิบไว้ให้คนในครอบครัวทำอาหารมื้ออื่นด้วย (เช่น ถ้ามีไข่ 3 ฟอง ให้ใช้ทำเมนูแค่ 1-2 ฟอง)' : 'ฉันสามารถใช้วัตถุดิบที่มีได้เต็มที่'}

ช่วยแนะนำเมนู 1-2 เมนูที่ตอบโจทย์โควต้ามื้อนี้ให้มากที่สุด ประหยัดงบ และระบุวัตถุดิบที่ต้องใช้พร้อมวิธีทำสั้นๆ แบบเป็นกันเอง`;

        try {
            const result = await window.gasClient.callAI(prompt, "วางแผนมื้ออาหาร");
            setAiPlan(result);
        } catch (error) {
            setAiPlan("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI ครับ");
        }
        setIsPlanning(false);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 lg:p-10">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl bg-[#0d1017] rounded-[24px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <i data-lucide="ChefHat" className="w-5 h-5 text-blue-400"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Aura Meal Planner</h2>
                            <p className="text-[10px] text-white/50 uppercase tracking-widest">คำนวณตามโควต้าและ Deficit อัตโนมัติ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 transition-colors">
                        <i data-lucide="X" className="w-5 h-5"></i>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {!aiPlan ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Stats Overview */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">แคลอรี่คงเหลือวันนี้</div>
                                    <div className="text-2xl font-light text-white">{Math.round(dailyStats.remainingCalories)} <span className="text-xs text-white/20">kcal</span></div>
                                    <div className="text-[10px] text-gold mt-1">เป้าหมาย: {Math.round(dailyStats.targetCalories)} kcal</div>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <div className="text-[10px] text-blue-400/60 uppercase tracking-widest mb-1">โควต้าสำหรับมื้อ{mealContext.name}</div>
                                    <div className="text-2xl font-light text-blue-400">~{suggestedCals} <span className="text-xs text-blue-400/40">kcal</span></div>
                                    <div className="text-[10px] text-blue-400/60 mt-1">เหลือโปรตีนให้เก็บ: {Math.round(remP)}g</div>
                                </div>
                            </div>

                            {/* Budget Section */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest">งบประมาณมื้อนี้ (บาท)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['0', '50', '150'].map(b => (
                                        <button 
                                            key={b}
                                            onClick={() => setBudget(b)}
                                            className={`py-3 rounded-xl border text-sm font-bold transition-all ${budget === b ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                        >
                                            {b === '0' ? '0 ฿ (ใช้ของที่มี)' : b === '150' ? '100+ ฿' : `${b} ฿`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fridge Items */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest">ของในตู้เย็น (วัตถุดิบที่มี)</label>
                                <textarea 
                                    value={fridgeItems}
                                    onChange={(e) => setFridgeItems(e.target.value)}
                                    placeholder="เช่น ไข่ไก่ 5 ฟอง, ปลากระป๋อง 2 กระป๋อง, ผักกาดขาว, หมูสับแช่แข็ง"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/30 focus:border-blue-500/50 outline-none resize-none h-24"
                                />
                            </div>

                            {/* Family Leave Clause */}
                            <div className="space-y-3">
                                <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none ${leaveForFamily ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/10'}`}
                                       onClick={() => setLeaveForFamily(!leaveForFamily)}>
                                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${leaveForFamily ? 'bg-blue-500 border-blue-500' : 'border-white/20 bg-black/50'}`}>
                                        {leaveForFamily && <i data-lucide="Check" className="w-4 h-4 text-white"></i>}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold ${leaveForFamily ? 'text-blue-400' : 'text-white'}`}>เผื่อวัตถุดิบให้คนที่บ้านด้วย</div>
                                        <div className="text-[10px] text-white/40 mt-0.5">ฉันกินคนเดียว แต่ให้ AI กะปริมาณวัตถุดิบโดยไม่ต้องใช้จนหมดตู้</div>
                                    </div>
                                </label>
                            </div>

                            {/* Info Box */}
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
                                <i data-lucide="Info" className="w-5 h-5 text-blue-400 shrink-0"></i>
                                <div className="text-[11px] text-blue-200/70 leading-relaxed">
                                    AI จะพยายามจัดเมนูให้ได้ **โปรตีน {Math.round(remP)}g** และ **พลังงานประมาณ {Math.round(suggestedCals)} kcal** (คำนวณตามโควต้าที่เหมาะสมของมื้อนี้)
                                </div>
                            </div>

                            <button 
                                onClick={handlePlan}
                                disabled={isPlanning}
                                className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold tracking-widest text-sm uppercase transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                {isPlanning ? (
                                    <><i data-lucide="Loader2" className="w-5 h-5 animate-spin"></i> กำลังให้ AI คิดเมนู...</>
                                ) : (
                                    <><i data-lucide="Sparkles" className="w-5 h-5"></i> เสกเมนูอาหาร</>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                                {aiPlan}
                            </div>
                            <button 
                                onClick={() => setAiPlan('')}
                                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                            >
                                ลองคิดเมนูอื่น
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.DinnerPlanner = DinnerPlanner;

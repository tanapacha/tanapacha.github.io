const { useState, useRef } = React;
const { motion, AnimatePresence } = window.FramerMotion || window.Motion || { motion: (props) => <div {...props} />, AnimatePresence: (props) => <>{props.children}</> };

const ExerciseLogger = ({ isOpen, onClose, onSave }) => {
    const [mode, setMode] = useState('auto'); // 'auto' (image) or 'manual'
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    // Manual form state
    const [activityName, setActivityName] = useState('🏃 วิ่ง');
    const [duration, setDuration] = useState('');
    const [durationUnit, setDurationUnit] = useState('min'); // 'min' or 'hr'
    const [distance, setDistance] = useState('');
    const [bodyParts, setBodyParts] = useState('');

    const activityOptions = [
        '🏃 วิ่ง', '🚴 ปั่นจักรยาน', '🏋️ เวทเทรนนิ่ง', '🤸 คาลิสเทนนิกส์', '🏊 ว่ายน้ำ', 
        '🚶 เดิน', '🧘 โยคะ', '⚽ เตะบอล', '🏸 แบดมินตัน', '🥊 มวย', '💪 ออกกำลังกายทั่วไป'
    ];

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async () => {
        if (!imagePreview) return;
        setIsAnalyzing(true);
        try {
            // Remove the base64 prefix
            const base64Data = imagePreview.split(',')[1];
            await window.gasClient.analyzeWorkoutImage(base64Data);
            
            // Re-fetch data
            await window.gasClient.fetchData('nutrition', true);
            if (onSave) onSave();
            
            // Short delay to show success
            setTimeout(() => {
                onClose();
                setImagePreview(null);
            }, 1500);

        } catch (error) {
            console.error("Image analysis failed:", error);
            alert("ไม่สามารถวิเคราะห์ภาพได้: " + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!duration) return;

        setIsSaving(true);
        try {
            const actualDuration = durationUnit === 'hr' ? parseFloat(duration) * 60 : parseFloat(duration);

            // Let AI estimate calories
            let prompt = `ฉันเพิ่งออกกำลังกายด้วยการ ${activityName} เป็นเวลา ${actualDuration} นาที`;
            if (distance) {
                prompt += ` ระยะทาง ${distance} กิโลเมตร`;
            }
            
            // Try to get user weight from local settings
            const cachedSettings = localStorage.getItem('aura_cache_settings');
            if (cachedSettings) {
                try {
                    const settings = JSON.parse(cachedSettings);
                    if (settings.profile && settings.profile.weight) {
                        prompt += ` น้ำหนักตัวของฉันคือ ${settings.profile.weight} kg`;
                    }
                } catch(e){}
            }
            prompt += `. โปรดประเมินการเผาผลาญแคลอรี่ของฉัน ตอบกลับมาเป็นตัวเลขกิโลแคลอรี่ (kcal) อย่างเดียว ห้ามมีตัวอักษรอื่นเด็ดขาด ห้ามใส่แท็ก [ACTION:...] หรือคำสั่งใดๆ ทั้งสิ้น เช่น ตอบแค่ 350`;

            const aiResponse = await window.gasClient.callAI(prompt);
            let cals = 300; // default fallback
            
            // Handle both string response and object response (if any)
            const replyText = typeof aiResponse === 'string' ? aiResponse : (aiResponse?.reply || '');
            
            if (replyText) {
                const parsed = parseInt(replyText.replace(/\D/g, ''));
                if (!isNaN(parsed) && parsed > 0) cals = parsed;
            }
            
            let mealNameStr = `[EXERCISE] ${activityName} ( ${actualDuration} นาที )`;
            if (bodyParts) {
                mealNameStr = `[EXERCISE] ${activityName} (${bodyParts}) ( ${actualDuration} นาที )`;
            }
            const needsDistance = activityName.includes('วิ่ง') || activityName.includes('จักรยาน');
            if (needsDistance && distance) {
                mealNameStr = `[EXERCISE] ${activityName} ( ${distance} กม., ${actualDuration} นาที )`;
            }
            
            const data = {
                date: new Date().toISOString(),
                mealName: mealNameStr,
                calories: -cals,
                protein: 0,
                carbs: 0,
                fat: 0,
                distance: distance ? parseFloat(distance) : ""
            };
            
            // Since we can't inject action easily without calling AI, we just use addNutrition
            await window.gasClient.addNutrition(data);
            
            await window.gasClient.fetchData('nutrition', true);
            if (onSave) onSave();
            onClose();

        } catch (error) {
            console.error("Save failed:", error);
            alert("บันทึกข้อมูลไม่สำเร็จ");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, y: 100, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.95 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="relative w-full max-w-md bg-midnight border border-orange-500/20 rounded-[32px] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-orange-500/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                                <i data-lucide="Activity" className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-white font-medium">บันทึกการออกกำลังกาย</h2>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">Exercise Tracker</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <i data-lucide="X" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        
                        {/* Mode Selector */}
                        <div className="flex bg-white/5 p-1 rounded-2xl mb-6">
                            <button
                                onClick={() => setMode('auto')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'auto' ? 'bg-orange-500/20 text-orange-400 shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                            >
                                อัปโหลดรูป (AI)
                            </button>
                            <button
                                onClick={() => setMode('manual')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'manual' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                            >
                                กรอกข้อมูลเอง
                            </button>
                        </div>

                        {mode === 'auto' ? (
                            <div className="space-y-6">
                                <p className="text-sm text-white/60 text-center">
                                    อัปโหลดภาพหน้าจอจากแอป Strava, Apple Watch, Garmin 
                                    หรือแอปออกกำลังกายอื่นๆ AI จะดึงข้อมูลแคลอรี่ให้คุณเอง
                                </p>

                                <input 
                                    type="file" 
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {!imagePreview ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-48 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-orange-400 group-hover:bg-orange-500/20 transition-all">
                                            <i data-lucide="UploadCloud" className="w-6 h-6" />
                                        </div>
                                        <span className="text-sm text-white/40 group-hover:text-white">แตะเพื่อเลือกรูปภาพ</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative w-full h-48 rounded-3xl overflow-hidden border border-white/10">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            {isAnalyzing && (
                                                <div className="absolute inset-0 bg-midnight/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30 animate-pulse">
                                                        <i data-lucide="Brain" className="w-6 h-6 text-orange-400" />
                                                    </div>
                                                    <span className="text-sm text-orange-400 font-medium animate-pulse">AI กำลังวิเคราะห์ข้อมูล...</span>
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => setImagePreview(null)}
                                                disabled={isAnalyzing}
                                                className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500/50 transition-colors"
                                            >
                                                <i data-lucide="X" className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        <button 
                                            onClick={analyzeImage}
                                            disabled={isAnalyzing}
                                            className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-xs flex justify-center items-center gap-2"
                                        >
                                            {isAnalyzing ? (
                                                <><i data-lucide="Loader2" className="w-4 h-4 animate-spin" /> กำลังประมวลผล</>
                                            ) : (
                                                <><i data-lucide="Sparkles" className="w-4 h-4" /> ให้ AI บันทึกข้อมูล</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleManualSubmit} className="space-y-5">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest">ประเภทการออกกำลังกาย</label>
                                    <select 
                                        value={activityName}
                                        onChange={(e) => setActivityName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-orange-500/50 appearance-none"
                                    >
                                        {activityOptions.map(opt => <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">ส่วนที่เล่นวันนี้ (ทางเลือก)</label>
                                    <input 
                                        type="text" 
                                        value={bodyParts}
                                        onChange={(e) => setBodyParts(e.target.value)}
                                        placeholder="เช่น อก, หลัง, ไหล่, ขา"
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-orange-500/50"
                                    />
                                </div>

                                {(activityName.includes('วิ่ง') || activityName.includes('จักรยาน')) && (
                                    <div className="space-y-2.5 relative">
                                        <label className="text-[10px] text-[#37b4d4] font-bold uppercase tracking-widest">ระยะทาง (ทางเลือก)</label>
                                        <input 
                                            type="number" 
                                            value={distance}
                                            onChange={(e) => setDistance(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-[#37b4d4]/50"
                                        />
                                        <span className="absolute right-4 top-10 text-xs text-white/20">กม.</span>
                                    </div>
                                )}

                                <div className="space-y-2.5">
                                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest">ระยะเวลา</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                type="number" 
                                                required
                                                step="any"
                                                value={duration}
                                                onChange={(e) => setDuration(e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-orange-500/50"
                                            />
                                        </div>
                                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
                                            <button 
                                                type="button"
                                                onClick={() => setDurationUnit('min')}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${durationUnit === 'min' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                            >
                                                นาที
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setDurationUnit('hr')}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${durationUnit === 'hr' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                            >
                                                ชม.
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSaving || !duration}
                                    className="w-full py-4 mt-4 bg-orange-500 text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-xs flex justify-center items-center gap-2"
                                >
                                    {isSaving ? (
                                        <><i data-lucide="Loader2" className="w-4 h-4 animate-spin" /> AI กำลังวิเคราะห์และบันทึก</>
                                    ) : (
                                        <><i data-lucide="Sparkles" className="w-4 h-4" /> ให้ AI คำนวณแคลอรี่และบันทึก</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

window.ExerciseLogger = ExerciseLogger;

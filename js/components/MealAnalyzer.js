const { useState, useRef, useEffect } = React;

const MealAnalyzer = ({ isOpen, onClose, onSave }) => {
    const [stream, setStream] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [inputMode, setInputMode] = useState('camera'); // 'camera' or 'text'
    const [mealText, setMealText] = useState('');
    const [condiments, setCondiments] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setPreview(null);
            setAnalysisResult('');
            setIsAnalyzing(false);
            setInputMode('camera');
            setMealText('');
            setCondiments('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (isCameraActive && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [isCameraActive, stream]);

    const startCamera = async () => {
        try {
            setInputMode('camera');
            // Try environment first, then any video
            let s;
            try {
                s = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' }, 
                    audio: false 
                });
            } catch (err) {
                console.log("Environment camera failed, trying default...");
                s = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: false 
                });
            }
            
            setStream(s);
            setIsCameraActive(true);
        } catch (err) {
            console.error("Camera error:", err);
            alert("ไม่สามารถเข้าถึงกล้องได้ครับ โปรดตรวจสอบการอนุญาตใช้งานกล้องของตัวเบราว์เซอร์");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Resize for API (Speed Optimization: 800px is enough for Gemini, reduces payload)
        const maxDim = 800;
        let w = canvas.width;
        let h = canvas.height;
        if (w > h) {
            if (w > maxDim) {
                h = h * (maxDim / w);
                w = maxDim;
            }
        } else {
            if (h > maxDim) {
                w = w * (maxDim / h);
                h = maxDim;
            }
        }

        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = w;
        resizeCanvas.height = h;
        resizeCanvas.getContext('2d').drawImage(canvas, 0, 0, w, h);
        
        const dataUrl = resizeCanvas.toDataURL('image/jpeg', 0.7);
        setPreview(dataUrl);
        stopCamera();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxDim = 1200;
                let w = img.width;
                let h = img.height;
                if (w > h) {
                    if (w > maxDim) { h = h * (maxDim / w); w = maxDim; }
                } else {
                    if (h > maxDim) { w = w * (maxDim / h); h = maxDim; }
                }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setPreview(dataUrl);
                setInputMode('camera');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleTextSubmit = async () => {
        if (!mealText.trim() || isAnalyzing) return;
        
        setIsAnalyzing(true);
        setAnalysisResult('');
        
        try {
            const result = await window.gasClient.analyzeMealText(mealText, condiments);
            setAnalysisResult(result || "AI ไม่สามารถให้ข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
            if (onSave && typeof result === 'string' && result && !result.startsWith('⚠️')) {
                onSave();
            }
        } catch (err) {
            setAnalysisResult("ขออภัย เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูลครับ");
        }
        setIsAnalyzing(false);
    };

    const runAnalysis = async (imageOverride = null) => {
        if (isAnalyzing) return; // ป้องกันการเรียกซ้อน
        
        const imageToProcess = imageOverride || preview;
        if (!imageToProcess) return;
        
        setIsAnalyzing(true);
        setAnalysisResult('');
        
        try {
            const base64 = imageToProcess.split(',')[1];
            const result = await window.gasClient.analyzeMealImage(base64, condiments);
            setAnalysisResult(result || "AI ไม่สามารถให้ข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
            // Only trigger refresh if result doesn't start with error indicator
            if (onSave && typeof result === 'string' && result && !result.startsWith('⚠️')) {
                onSave();
            }
        } catch (err) {
            setAnalysisResult("ขออภัย เกิดข้อผิดพลาดในการวิเคราะห์รูปอาหารครับ");
        }
        setIsAnalyzing(false);
    };

    const SafeIcon = window.SafeIcon;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-end lg:items-center justify-center lg:p-10">
            <div className="absolute inset-0 bg-[#08090d]/90 backdrop-blur-xl" onClick={onClose} />
            
            <div className="relative w-full lg:max-w-4xl rounded-t-[24px] lg:rounded-[28px] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[92vh] lg:h-auto lg:max-h-[85vh] modal-sheet lg:modal-panel"
                style={{ background: 'rgba(16,18,24,0.98)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Left: Input Section */}
                <div className="w-full lg:w-1/2 h-[40vh] lg:h-auto relative flex flex-col items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,0,0,0.3)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                    
                    {/* Toggle Buttons */}
                    {!isCameraActive && !preview && (
                        <div className="absolute top-5 left-5 right-5 flex p-1 rounded-xl z-20"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <button 
                                onClick={() => setInputMode('camera')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${inputMode === 'camera' ? 'text-[#08090d]' : 'text-white/40 hover:text-white'}`}
                                style={inputMode === 'camera' ? { background: 'var(--aura-primary)' } : {}}
                            >
                                Camera / Upload
                            </button>
                            <button 
                                onClick={() => setInputMode('text')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${inputMode === 'text' ? 'text-[#08090d]' : 'text-white/40 hover:text-white'}`}
                                style={inputMode === 'text' ? { background: 'var(--aura-primary)' } : {}}
                            >
                                Manual Text
                            </button>
                        </div>
                    )}

                    {!preview && !isCameraActive ? (
                        inputMode === 'camera' ? (
                            <div className="text-center p-8 space-y-6 pt-16">
                                <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    {SafeIcon && <SafeIcon name="Camera" className="w-10 h-10 text-gold" />}
                                </div>
                                <h3 className="text-2xl text-white font-medium">Aura Meal Matrix AI</h3>
                                <p className="text-white/40 text-sm max-w-xs mx-auto">ถ่ายรูปอาหารของคุณเพื่อให้ AI ช่วยวิเคราะห์แคลอรี่และสารอาหารอัตโนมัติ</p>
                                
                                <div className="flex flex-col gap-3 pt-6">
                                    <button 
                                        onClick={startCamera}
                                        className="w-full py-4 bg-gold text-midnight font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {SafeIcon && <SafeIcon name="Camera" className="w-5 h-5" />}
                                        เปิดกล้องสแกน
                                    </button>
                                    <button 
                                        onClick={() => fileInputRef.current.click()}
                                        className="w-full py-4 bg-white/5 border border-white/10 text-white font-medium rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        {SafeIcon && <SafeIcon name="Upload" className="w-5 h-5" />}
                                        เลือกจากรูปภาพ
                                    </button>
                                    <input 
                                        ref={fileInputRef}
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleFileUpload} 
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-8 w-full space-y-6 pt-16">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    {SafeIcon && <SafeIcon name="Type" className="w-10 h-10 text-blue-400" />}
                                </div>
                                <h3 className="text-2xl text-white font-medium">Manual Meal Entry</h3>
                                <p className="text-white/40 text-sm max-w-xs mx-auto">พิมพ์ชื่ออาหารหรือเมนูที่คุณทาน เพื่อให้ AI ประเมินสารอาหาร</p>
                                
                                <div className="space-y-4 pt-4">
                                    <textarea 
                                        value={mealText}
                                        onChange={(e) => setMealText(e.target.value)}
                                        placeholder="ตัวอย่าง: ข้าวมันไก่ผสมไก่ทอด 1 จาน หรือ สลัดผักอกไก่"
                                        className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-gold/50 transition-all resize-none text-sm"
                                    />
                                    <input 
                                        type="text"
                                        value={condiments}
                                        onChange={(e) => setCondiments(e.target.value)}
                                        placeholder="เครื่องปรุงเพิ่มเติม เช่น น้ำตาล 1 ช้อนชา (ถ้ามี)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-gold/50 transition-all text-sm"
                                    />
                                    <button 
                                        onClick={handleTextSubmit}
                                        disabled={!mealText.trim() || isAnalyzing}
                                        className="w-full py-4 bg-gold text-midnight font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                                                กำลังวิเคราะห์...
                                            </>
                                        ) : (
                                            <>
                                                {SafeIcon && <SafeIcon name="Send" className="w-5 h-5" />}
                                                วิเคราะห์และบันทึก
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )
                    ) : isCameraActive ? (
                        <div className="relative w-full h-full">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 border-8 border-black/20 pointer-events-none">
                                <div className="w-full h-full border border-gold/50 rounded-2xl relative shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-xl"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-xl"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-xl"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-xl"></div>
                                </div>
                            </div>
                            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-6 text-white overflow-hidden">
                                <button 
                                    onClick={stopCamera}
                                    className="p-4 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-red-500/20 transition-all border border-white/10"
                                >
                                    {SafeIcon && <SafeIcon name="X" className="w-6 h-6" />}
                                </button>
                                <button 
                                    onClick={capturePhoto}
                                    className="w-20 h-20 bg-gold rounded-full shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
                                >
                                    <div className="w-16 h-16 border-2 border-midnight rounded-full"></div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex flex-col bg-black">
                            <div className="relative flex-1 group min-h-0">
                                <img src={preview} className="w-full h-full object-cover" alt="Meal Preview" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button 
                                        onClick={() => setPreview(null)}
                                        className="p-4 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 text-white text-xs font-bold"
                                    >
                                        ลบรูปและถ่ายใหม่
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-midnight/90 border-t border-white/5 shrink-0 space-y-3">
                                <input 
                                    type="text"
                                    value={condiments}
                                    onChange={(e) => setCondiments(e.target.value)}
                                    placeholder="ระบุเครื่องปรุงเพิ่มเติม เช่น น้ำตาล 2 ช้อนโต๊ะ, ซีอิ๊ว (ถ้ามี)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-gold/50 transition-all text-sm placeholder-white/30"
                                />
                                <button 
                                    onClick={() => runAnalysis(preview)}
                                    disabled={isAnalyzing}
                                    className="w-full py-3 bg-gold text-midnight font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                                            กำลังวิเคราะห์...
                                        </>
                                    ) : (
                                        <>
                                            {SafeIcon && <SafeIcon name="Sparkles" className="w-4 h-4" />}
                                            วิเคราะห์อาหารด้วย AI
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Right: Analysis Section */}
                <div className="w-full lg:w-1/2 p-5 lg:p-10 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-6 md:mb-10">
                        <h4 className="text-gold font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2">
                            {SafeIcon && <SafeIcon name="Sparkles" className="w-3 h-3" />}
                            AI Nutrition Analysis
                        </h4>
                        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                            {SafeIcon && <SafeIcon name="X" className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 leading-relaxed">
                        {(!preview && inputMode === 'camera') ? (
                            <div className="h-full flex items-center justify-center text-center opacity-20 italic text-sm">
                                รอรูปภาพอาหารของคุณ...
                            </div>
                        ) : (!mealText && inputMode === 'text') ? (
                            <div className="h-full flex items-center justify-center text-center opacity-20 italic text-sm">
                                รอชื่ออาหารที่คุณทาน...
                            </div>
                        ) : isAnalyzing ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-16 h-16 relative">
                                    <div className="absolute inset-0 border-4 border-gold/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-t-gold rounded-full animate-spin"></div>
                                </div>
                                <div>
                                    <h5 className="text-white font-medium mb-1">กำลังวิเคราะห์อาหาร...</h5>
                                    <p className="text-white/40 text-xs">Gemini กำลังประเมินแคลอรี่และสารอาหาร</p>
                                </div>
                            </div>
                        ) : analysisResult ? (
                            <div className="animate-fade-in space-y-8 pb-6">
                                <div className="p-6 bg-gold/5 border border-gold/20 rounded-3xl">
                                    <div className="prose prose-invert text-white/90 text-sm whitespace-pre-wrap leading-relaxed">
                                        {analysisResult}
                                    </div>
                                </div>
                                {analysisResult && !analysisResult.startsWith('⚠️') && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Smart Action Status</p>
                                        <div className="flex items-center gap-3 py-3 px-5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-2xl">
                                            <i data-lucide="CheckCircle" className="w-4 h-4"></i>
                                            บันทึกข้อมูลโภชนาการลงในระบบ Aura เรียบร้อยแล้ว
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center opacity-20 italic text-sm">
                                กรุณากดปุ่ม "วิเคราะห์อาหารด้วย AI" เพื่อดูผลลัพธ์
                            </div>
                        )}
                    </div>

                    {analysisResult && (
                        <div className="pt-6 md:pt-8 border-t border-white/5">
                            <button 
                                onClick={onClose}
                                className="w-full py-3 md:py-4 bg-white/5 hover:bg-white/10 text-white/60 font-medium rounded-2xl transition-all text-sm md:text-base"
                            >
                                เสร็จสิ้น
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.MealAnalyzer = MealAnalyzer;

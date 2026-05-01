const { useState, useEffect, useRef } = React;

const ElectricityTracker = ({ electricityData, onUpdate }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newBill, setNewBill] = useState({
        month: new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
        units: '',
        amount: '',
        note: ''
    });

    useEffect(() => {
        if (!window.Chart || !electricityData || electricityData.length === 0) return;

        // Sort data by date
        const sortedData = [...electricityData].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-6);
        
        const labels = sortedData.map(d => d.month);
        const units = sortedData.map(d => parseFloat(d.units));
        const amounts = sortedData.map(d => parseFloat(d.amount));

        if (chartInstance.current) chartInstance.current.destroy();

        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'หน่วยไฟ (Units)',
                            data: units,
                            backgroundColor: 'rgba(251, 191, 36, 0.6)',
                            borderRadius: 6,
                            yAxisID: 'y'
                        },
                        {
                            label: 'ค่าไฟ (บาท)',
                            data: amounts,
                            type: 'line',
                            borderColor: '#fbbf24',
                            borderWidth: 3,
                            pointBackgroundColor: '#fbbf24',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(9, 9, 11, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#a1a1aa',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            padding: 12
                        }
                    },
                    scales: {
                        x: { 
                            grid: { display: false }, 
                            ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } } 
                        },
                        y: { 
                            position: 'left',
                            grid: { color: 'rgba(255,255,255,0.05)' }, 
                            ticks: { color: 'rgba(251, 191, 36, 0.5)', font: { size: 10 } } 
                        },
                        y1: {
                            position: 'right',
                            grid: { display: false },
                            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
                        }
                    }
                }
            });
        }

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [electricityData]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!newBill.units || !newBill.amount) return;
        
        setIsSaving(true);
        const res = await window.gasClient.addElectricity(newBill);
        if (res.status === 'success') {
            setIsModalOpen(false);
            setNewBill({
                month: new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
                units: '',
                amount: '',
                note: ''
            });
            if (onUpdate) onUpdate();
        } else {
            alert("บันทึกไม่สำเร็จ");
        }
        setIsSaving(false);
    };

    const lastBill = electricityData && electricityData.length > 0 
        ? [...electricityData].sort((a,b) => new Date(b.date) - new Date(a.date))[0]
        : null;

    return (
        <window.BentoCard 
            title="ติดตามค่าไฟ" 
            subtitle="Energy Tracking" 
            icon="Zap" 
            accent="orange"
        >
            <div className="flex flex-col gap-4">
                {/* Stats Summary */}
                {lastBill && (
                    <div className="flex justify-between items-end mb-1">
                        <div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Latest Month</div>
                            <div className="text-sm font-semibold text-white">{lastBill.month}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-orange-400">฿{parseFloat(lastBill.amount).toLocaleString()}</div>
                            <div className="text-[10px] text-white/30">{lastBill.units} Units</div>
                        </div>
                    </div>
                )}

                {/* Chart Area */}
                <div className="h-[140px] w-full relative">
                    {!electricityData || electricityData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs italic">
                            ยังไม่มีข้อมูลการใช้ไฟ
                        </div>
                    ) : (
                        <canvas ref={chartRef}></canvas>
                    )}
                </div>

                {/* Action Button */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl text-[10px] font-bold text-orange-400 uppercase tracking-[0.15em] transition-all"
                >
                    <window.SafeIcon name="Plus" className="w-3 h-3 mr-1" /> บันทึกค่าไฟใหม่
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-[#111113] border border-white/10 rounded-[32px] p-8 w-full max-w-sm shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">บันทึกค่าไฟ</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/20 hover:text-white">
                                <window.SafeIcon name="X" className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">เดือนที่ชำระ</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-white/5 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-orange-500/50"
                                    value={newBill.month}
                                    onChange={e => setNewBill({...newBill, month: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">หน่วยไฟ (Units)</label>
                                    <input 
                                        type="number" 
                                        required
                                        className="w-full bg-white/5 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-orange-500/50"
                                        placeholder="0"
                                        value={newBill.units}
                                        onChange={e => setNewBill({...newBill, units: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">ยอดเงิน (บาท)</label>
                                    <input 
                                        type="number" 
                                        required
                                        className="w-full bg-white/5 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-orange-500/50"
                                        placeholder="0.00"
                                        value={newBill.amount}
                                        onChange={e => setNewBill({...newBill, amount: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">หมายเหตุ</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-white/5 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-orange-500/50"
                                    placeholder="..."
                                    value={newBill.note}
                                    onChange={e => setNewBill({...newBill, note: e.target.value})}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="w-full py-4 bg-orange-500 text-black font-bold rounded-2xl shadow-[0_10px_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'กำลังบันทึก...' : 'ยืนยันการบันทึก'}
                            </button>
                            <p className="text-[9px] text-white/20 text-center">
                                *ระบบจะบันทึกลงบัญชีรายจ่าย (หมวดบิล/ค่าเช่า) ให้คุณอัตโนมัติ
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </window.BentoCard>
    );
};

window.ElectricityTracker = ElectricityTracker;

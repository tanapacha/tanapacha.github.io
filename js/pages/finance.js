const { useState, useEffect, useMemo } = React;
const { motion, AnimatePresence } = window.Motion || { motion: (props) => <div {...props} />, AnimatePresence: ({children}) => <>{children}</> };
const Navbar = window.Navbar;
const BentoCard = window.BentoCard;

const INCOME_CATEGORIES = ["เงินเดือน", "รายได้พิเศษ", "ลงทุน", "อื่นๆ"];
const EXPENSE_CATEGORIES = ["อาหาร/เครื่องดื่ม", "การเดินทาง", "บิล/ค่าเช่า", "ช้อปปิ้ง", "สุขภาพ", "อื่นๆ"];

const Finance = () => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [filterPeriod, setFilterPeriod] = useState('daily'); // daily, weekly, monthly
    const [currentDate, setCurrentDate] = useState(new Date());

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newTx, setNewTx] = useState({
        type: 'expense',
        amount: '',
        category: EXPENSE_CATEGORIES[0],
        note: '',
        date: new Date().toISOString().slice(0, 10)
    });

    // AI Quick Entry
    const [aiInput, setAiInput] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    const loadFinances = async (silent = false) => {
        if (!silent) setIsLoading(true);
        // Optimization: Only fetch finance data
        const data = await window.gasClient.fetchData("finance");
        if (data && data.finance) {
            // Pre-parsing dates once during load to avoid new Date() in every filter loop
            const mapped = data.finance.map(tx => ({
                ...tx,
                dateObj: new Date(tx.date) 
            }));
            // Sort freshest first
            mapped.sort((a,b) => b.dateObj - a.dateObj);
            setTransactions(mapped);
        }
        setIsLoading(false);
        if (window.lucide) setTimeout(() => window.lucide.createIcons(), 100);
    };

    useEffect(() => { loadFinances(); }, []);

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const txDate = tx.dateObj; // Use pre-parsed date
            if (filterPeriod === 'daily') {
                return txDate.toDateString() === currentDate.toDateString();
            } else if (filterPeriod === 'monthly') {
                return txDate.getMonth() === currentDate.getMonth() && txDate.getFullYear() === currentDate.getFullYear();
            } else if (filterPeriod === 'weekly') {
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                startOfWeek.setHours(0,0,0,0);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23,59,59,999);
                return txDate >= startOfWeek && txDate <= endOfWeek;
            }
            return true;
        });
    }, [transactions, filterPeriod, currentDate]);

    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;
        filteredTransactions.forEach(tx => {
            if (tx.type === 'income') income += parseFloat(tx.amount);
            if (tx.type === 'expense') expense += parseFloat(tx.amount);
        });
        return { income, expense, balance: income - expense };
    }, [filteredTransactions]);

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        if (!newTx.amount || isNaN(newTx.amount)) return alert("กรุณาใส่จำนวนเงินที่ถูกต้อง");
        
        setIsSaving(true);
        const submitData = {
            ...newTx,
            amount: parseFloat(newTx.amount),
            date: newTx.date + "T12:00:00" // attach mock time
        };

        // Optimistic UI Update (Immediate feedback)
        const tempId = "TEMP-" + Date.now();
        const optimisticTx = {
            id: tempId,
            ...submitData,
            dateObj: new Date(submitData.date),
            isOptimistic: true // marker for UI styling if needed
        };
        setTransactions(prev => [optimisticTx, ...prev]);
        setIsModalOpen(false);

        const res = await window.gasClient.addTransaction(submitData);
        if (res.status === 'success') {
            setNewTx({ ...newTx, amount: '', note: '' });
            await loadFinances(true); // Silent reload to get official ID and confirm data
        } else {
            // Rollback on failure
            setTransactions(prev => prev.filter(tx => tx.id !== tempId));
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
        setIsSaving(false);
    };

    const handleDelete = async (id) => {
        if(!window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) return;
        
        // Optimistic UI Update
        const backup = [...transactions];
        setTransactions(prev => prev.filter(tx => tx.id !== id));
        
        const res = await window.gasClient.deleteTransaction(id);
        if(res && res.status === 'success') {
             // Success - refresh silently just in case
             loadFinances(true);
        } else {
            // Rollback
            setTransactions(backup);
            alert("ลบไม่สำเร็จ");
        }
    };

    const handleAILog = async (e) => {
        e.preventDefault();
        if(!aiInput.trim()) return;
        
        setIsAiProcessing(true);
        const prompt = `ผู้ใช้ต้องการบันทึกการเงิน: "${aiInput}" 
กรุณาตอบเป็นข้อความสั้นๆ ว่าบันทึกแล้ว และใส่ Smart Action ท้ายประโยคด้วยรูปแบบ: [ACTION:ADD_FINANCE|ประเภท(income/expense)|จำนวนเงิน|หมวดหมู่|หมายเหตุ]
ตัวอย่างหมวดหมู่รายรับ: เงินเดือน, รายได้พิเศษ, ลงทุน, อื่นๆ
ตัวอย่างหมวดหมู่รายจ่าย: อาหาร/เครื่องดื่ม, การเดินทาง, บิล/ค่าเช่า, ช้อปปิ้ง, สุขภาพ, อื่นๆ
ถ้าไม่ชัดเจนว่าคือหมวดไหน ให้ใช้ "อื่นๆ"`;
        
        const response = await window.gasClient.callAI(prompt, "Financial AI Logger");
        if(response && (response.includes("ACTION:ADD_FINANCE") || (typeof response === 'object' && response.actionPerformed))) {
            setAiInput('');
            await loadFinances(true); // Silent reload
            alert("บันทึกผ่าน AI สำเร็จ!");
        } else {
            alert("AI ไม่สามารถเข้าใจคำสั่งได้ กรุณาลองรูปแบบเช่น 'ค่าข้าว 50 บาท'");
        }
        setIsAiProcessing(false);
    };

    const changeDate = (amount) => {
        const newD = new Date(currentDate);
        if (filterPeriod === 'daily') newD.setDate(newD.getDate() + amount);
        else if (filterPeriod === 'weekly') newD.setDate(newD.getDate() + (amount * 7));
        else if (filterPeriod === 'monthly') newD.setMonth(newD.getMonth() + amount);
        setCurrentDate(newD);
    };

    const formatPeriodLabel = () => {
        if (filterPeriod === 'daily') return currentDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
        if (filterPeriod === 'monthly') return currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
        if (filterPeriod === 'weekly') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            return "สัปดาห์ของ " + startOfWeek.toLocaleDateString('th-TH', { day:'numeric', month: 'short' });
        }
    };

    return (
        <div className="app-container lg:pl-24">
            <Navbar />
            
            <main className="flex-1 min-h-screen p-6 lg:p-12 bg-midnight">
                {/* Header */}
                <header className="mb-8 p-6 bg-gradient-to-r from-[rgba(212,175,55,0.1)] to-transparent border border-[rgba(212,175,55,0.2)] rounded-[32px] relative overflow-hidden backdrop-blur-md">
                    <div className="absolute right-0 top-0 bottom-0 opacity-20 pointer-events-none">
                        <i data-lucide="Wallet" className="w-64 h-64 -mr-16 -mt-10" color="#D4AF37" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <p className="text-gold font-bold uppercase tracking-[0.15em] text-xs mb-2">Wealth Management</p>
                            <h1 className="text-white text-3xl lg:text-5xl tracking-tight">การจัดการการเงิน</h1>
                            <p className="text-text-secondary mt-2 text-sm max-w-md line-clamp-2">
                                ติดตามรายรับ รายจ่ายของคุณอย่างแม่นยำ พร้อมให้ AI ช่วยแนะนำพฤติกรรมการใช้เงิน
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full md:w-auto px-6 py-4 bg-gold text-midnight font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(212,175,55,0.4)]"
                        >
                            <i data-lucide="Plus" className="w-5 h-5"></i> เพิ่มรายการ
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Stats & List */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Filter Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/[0.02] border border-white/5 p-2 rounded-2xl gap-4">
                            <div className="flex gap-1 w-full sm:w-auto overflow-hidden bg-midnight rounded-xl p-1 border border-white/5">
                                {['daily','weekly','monthly'].map(p => (
                                    <button 
                                        key={p} onClick={() => setFilterPeriod(p)}
                                        className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${filterPeriod === p ? 'bg-gold text-midnight' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                                    >
                                        {p === 'daily' ? 'รายวัน' : p === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between px-2">
                                <button onClick={()=>changeDate(-1)} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"><i data-lucide="ChevronLeft" className="w-4 h-4"/></button>
                                <span className="text-white font-medium text-sm min-w-[120px] text-center">{formatPeriodLabel()}</span>
                                <button onClick={()=>changeDate(1)} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"><i data-lucide="ChevronRight" className="w-4 h-4"/></button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20 rounded-3xl p-5 md:p-6 backdrop-blur-sm">
                                <span className="text-green-500/70 text-xs font-bold uppercase tracking-widest block mb-2">รายรับ</span>
                                <h3 className="text-xl md:text-3xl text-green-400 font-semibold">฿{stats.income.toLocaleString()}</h3>
                            </div>
                            <div className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-3xl p-5 md:p-6 backdrop-blur-sm">
                                <span className="text-red-500/70 text-xs font-bold uppercase tracking-widest block mb-2">รายจ่าย</span>
                                <h3 className="text-xl md:text-3xl text-red-500 font-semibold">฿{stats.expense.toLocaleString()}</h3>
                            </div>
                            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-sm relative overflow-hidden">
                                {stats.balance >= 0 ? <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/20 blur-2xl"></div> : <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/20 blur-2xl"></div>}
                                <span className="text-white/40 text-xs font-bold uppercase tracking-widest block mb-2">คงเหลือ</span>
                                <h3 className="text-xl md:text-3xl text-white font-semibold">฿{stats.balance.toLocaleString()}</h3>
                            </div>
                        </div>

                        {/* Transaction List */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-2">
                            {isLoading ? (
                                <div className="py-12 flex justify-center text-gold"><span className="animate-spin"><i data-lucide="Loader" /></span></div>
                            ) : filteredTransactions.length === 0 ? (
                                <div className="py-20 text-center text-white/30 text-sm">ไม่มีรายการในรอบนี้</div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredTransactions.map((tx, idx) => (
                                        <div key={tx.id} className={`flex items-center gap-4 p-4 hover:bg-white/[0.04] transition-all rounded-2xl group ${tx.isOptimistic ? 'opacity-50 grayscale' : ''}`}>
                                            <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br border shadow-inner ${tx.type === 'income' ? 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400' : 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400'}`}>
                                                <i data-lucide={tx.type === 'income' ? 'ArrowDownLeft' : 'ArrowUpRight'} className="w-5 h-5"/>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="text-white font-medium truncate pr-4">{tx.note || tx.category} {tx.isOptimistic && <span className="text-[8px] text-gold animate-pulse italic">(กำลังบันทึก...)</span>}</h4>
                                                    <span className={`font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                                        {tx.type === 'income' ? '+' : '-'}฿{parseFloat(tx.amount).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px] text-white/40">
                                                    <span>{tx.category} • {new Date(tx.date).toLocaleDateString('th-TH')}</span>
                                                    {!tx.isOptimistic && <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">ลบ</button>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: AI & Summary */}
                    <div className="space-y-6">
                        <BentoCard title="AI Financial Assistant" subtitle="พิมพ์บอก AI ได้เลย" icon="Sparkles" gold={true}>
                            <form onSubmit={handleAILog} className="mt-4">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={aiInput}
                                        onChange={(e)=>setAiInput(e.target.value)}
                                        placeholder="เช่น: กินข้าว 60 บาท ช้อปปิ้ง 1500" 
                                        className="w-full bg-midnight/50 border border-gold/30 focus:border-gold p-4 pr-12 rounded-2xl text-sm text-white placeholder:text-white/20 transition-all outline-none"
                                        disabled={isAiProcessing}
                                    />
                                    <button type="submit" disabled={isAiProcessing || !aiInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gold/10 hover:bg-gold text-gold hover:text-midnight rounded-xl transition-all disabled:opacity-50">
                                        {isAiProcessing ? <i data-lucide="Loader" className="w-4 h-4 animate-spin"/> : <i data-lucide="Send" className="w-4 h-4"/>}
                                    </button>
                                </div>
                                <p className="text-[10px] text-text-secondary mt-3 px-1">AI ใช้วิธีวิเคราะห์ประโยคเพื่อแยก หมวดหมู่ ประเภทเงิน และลงบัญชีให้อัตโนมัติ</p>
                            </form>
                        </BentoCard>

                        <BentoCard title="ระบบแนะนำ" subtitle="Financial Advice">
                            <p className="text-sm text-text-secondary mt-4 leading-relaxed italic">
                                "การบันทึกรายจ่ายสม่ำเสมอ เป็นจุดเริ่มต้นของการมีอิสรภาพทางการเงิน ลองตั้งเป้าหมายการออมจากหน้า <a href="goals.html" className="text-gold hover:underline">Goals</a> ด้วยสิครับ"
                            </p>
                        </BentoCard>
                    </div>

                </div>

                {/* Manual Add Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-midnight/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#111318] border border-white/10 p-8 rounded-[32px] w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl text-white font-semibold">เพิ่มรายการ</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/20 hover:text-white"><i data-lucide="X" className="w-6 h-6"/></button>
                            </div>

                            <form onSubmit={handleSaveTransaction} className="space-y-5">
                                {/* Type Selector */}
                                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                                    <button type="button" onClick={() => setNewTx({...newTx, type: 'expense', category: EXPENSE_CATEGORIES[0]})} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${newTx.type === 'expense' ? 'bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-white/40 hover:text-white'}`}>
                                        รายจ่าย
                                    </button>
                                    <button type="button" onClick={() => setNewTx({...newTx, type: 'income', category: INCOME_CATEGORIES[0]})} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${newTx.type === 'income' ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'text-white/40 hover:text-white'}`}>
                                        รายรับ
                                    </button>
                                </div>

                                <div className="space-y-1.5 border-b border-white/10 pb-4">
                                    <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">จำนวนเงิน (บาท)</label>
                                    <input required type="number" step="0.01" className="w-full bg-transparent text-4xl text-white font-light placeholder:text-white/10 focus:outline-none px-2" placeholder="0.00" value={newTx.amount} onChange={e=>setNewTx({...newTx, amount: e.target.value})}/>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">หมวดหมู่</label>
                                    <select className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white focus:border-gold/50 outline-none appearance-none" value={newTx.category} onChange={e=>setNewTx({...newTx, category: e.target.value})}>
                                        {(newTx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c} value={c} className="bg-midnight">{c}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">วันที่</label>
                                        <input required type="date" className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white focus:border-gold/50 outline-none" value={newTx.date} onChange={e=>setNewTx({...newTx, date: e.target.value})} style={{colorScheme:'dark'}}/>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-white/40 uppercase tracking-widest pl-1">บันทึกเพิ่มเติม</label>
                                        <input type="text" placeholder="..." className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-white focus:border-gold/50 outline-none" value={newTx.note} onChange={e=>setNewTx({...newTx, note: e.target.value})}/>
                                    </div>
                                </div>

                                <button disabled={isSaving} type="submit" className="w-full py-4 mt-4 bg-gold text-midnight font-bold rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                    {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
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
root.render(<Finance />);

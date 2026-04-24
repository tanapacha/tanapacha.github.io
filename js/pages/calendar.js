const { useState, useEffect } = React;
const Navbar = window.Navbar;
const BentoCard = window.BentoCard;

const Calendar = () => {
    console.log("Rendering Calendar", { Navbar, BentoCard });
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadCalendarData = async () => {
            setIsLoading(true);
            const data = await window.gasClient.fetchData('events');
            if (data && data.events) {
                setEvents(data.events);
            }
            setIsLoading(false);
            if (window.lucide) {
                setTimeout(() => window.lucide.createIcons(), 100);
            }
        };
        
        loadCalendarData();
    }, [currentDate]);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderHeader = () => {
        const monthNames = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        ];
        return (
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-gold font-medium mb-1">Calendar Hub</h2>
                    <h1 className="text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-gold/50 transition-all"
                    >
                        <i data-lucide="ChevronLeft" className="w-5 h-5 text-white"></i>
                    </button>
                    <button 
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-gold/50 transition-all"
                    >
                        <i data-lucide="ChevronRight" className="w-5 h-5 text-white"></i>
                    </button>
                </div>
            </div>
        );
    };
    const renderDays = () => {
        const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
        return (
            <div className="grid grid-cols-7 gap-1 md:gap-4 mb-4">
                {days.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-text-secondary py-2">
                        {day}
                    </div>
                ))}
            </div>
        );
    };


    const renderCells = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const cells = [];

        // Padding for the first row
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="h-16 md:h-32"></div>);
        }


        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            
            // Get events for this specific day
            const dayEvents = events.filter(e => e.start.startsWith(dateStr));
            const hasEvents = dayEvents.length > 0;
            
            cells.push(
                <a 
                    href={`schedule.html?date=${dateStr}`}
                    key={day} 
                    className={`h-16 md:h-32 p-1 md:p-4 rounded-xl md:rounded-2xl border transition-all duration-300 group
                        ${isToday ? 'bg-gold/10 border-gold/50' : 'bg-white/5 border-white/5 hover:border-gold/30 hover:bg-white/10'}
                    `}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-sm md:text-xl font-light ${isToday ? 'text-gold' : 'text-white'}`}>{day}</span>
                        {/* Event Dot */}
                        {hasEvents && (
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>
                        )}
                    </div>
                    {hasEvents && (
                        <div className="mt-1 md:mt-4 hidden md:block">
                            <div className="text-[10px] text-gold/70 uppercase tracking-tighter mb-1">{dayEvents.length} กิจกรรม</div>
                            <div className="text-xs text-text-secondary truncate">{dayEvents[0].title}</div>
                        </div>
                    )}
                    {/* Small dot/badge for mobile if has events */}
                    {hasEvents && (
                        <div className="md:hidden mt-1 flex justify-center">
                            <div className="text-[8px] text-gold font-bold">{dayEvents.length}</div>
                        </div>
                    )}
                </a>
            );
        }
        return <div className="grid grid-cols-7 gap-1 md:gap-4">{cells}</div>;

    };

    return (
        <div className="app-container lg:pt-20">
            <Navbar />
            
            <main className="flex-1 min-h-screen p-6 lg:p-12 bg-midnight">
                <header className="animate-fade-in">
                    {renderHeader()}
                    <BentoCard className="p-4 md:p-8">
                        {renderDays()}
                        {renderCells()}
                    </BentoCard>
                </header>
            </main>
        </div>

    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Calendar />);

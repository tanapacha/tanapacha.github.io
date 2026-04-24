const { useState, useEffect } = React;

const HabitHeatmap = ({ habitId, logs = [], habitName = "Habit", auraColor = "var(--aura-primary)" }) => {
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
    });

    const logMap = logs.reduce((acc, log) => {
        if (log.habitId === habitId) {
            const dateStr = log.date ? String(log.date).split('T')[0] : "";
            if (dateStr) acc[dateStr] = (acc[dateStr] || 0) + 1;
        }
        return acc;
    }, {});

    const activeDays = Object.keys(logMap).length;
    const streak = (() => {
        let count = 0;
        for (let i = days.length - 1; i >= 0; i--) {
            if (logMap[days[i]]) count++;
            else break;
        }
        return count;
    })();

    return (
        <div className="p-5 rounded-2xl transition-all duration-300 group hover:scale-[1.01]"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full transition-all duration-500 group-hover:scale-125" 
                        style={{ background: auraColor, boxShadow: `0 0 10px ${auraColor}` }} />
                    <span className="text-sm font-bold text-white/85">{habitName}</span>
                </div>
                <div className="flex items-center gap-3">
                    {streak > 0 && (
                        <span className="text-[9px] font-bold px-3 py-1 rounded-full"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                            🔥 {streak}d streak
                        </span>
                    )}
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>{activeDays}/30</span>
                </div>
            </div>
            
            <div className="grid grid-cols-10 gap-[4px]">
                {days.map(date => {
                    const count = logMap[date] || 0;
                    const isToday = date === new Date().toISOString().split('T')[0];
                    const opacity = count > 0 ? Math.min(0.3 + (count * 0.25), 1) : 0.06;
                    
                    return (
                        <div 
                            key={date}
                            className={`aspect-square rounded-[4px] transition-all duration-300 hover:scale-[1.8] hover:z-10 cursor-pointer
                                ${isToday ? 'ring-1 ring-white/25' : ''}`}
                            style={{ 
                                backgroundColor: count > 0 ? auraColor : 'rgba(255,255,255,0.06)',
                                opacity: count > 0 ? opacity : 1,
                            }}
                            title={`${date}: ${count} completions`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

window.HabitHeatmap = HabitHeatmap;

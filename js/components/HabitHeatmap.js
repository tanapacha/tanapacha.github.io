const { useState, useEffect } = React;

const HabitHeatmap = ({ habitId, logs = [], habitName = "Habit", auraColor = "var(--accent)" }) => {
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
    });

    const logMap = logs.reduce((acc, log) => {
        if (log.habitId === habitId) {
            const ds = log.date ? String(log.date).split('T')[0] : "";
            if (ds) acc[ds] = (acc[ds] || 0) + 1;
        }
        return acc;
    }, {});

    const activeDays = Object.keys(logMap).length;
    const streak = (() => {
        let c = 0;
        for (let i = days.length - 1; i >= 0; i--) { if (logMap[days[i]]) c++; else break; }
        return c;
    })();

    return (
        <div className="p-4 rounded-xl transition-all duration-200"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: auraColor }} />
                    <span className="text-sm font-medium text-white/80">{habitName}</span>
                </div>
                <div className="flex items-center gap-2">
                    {streak > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--amber-subtle)', color: 'var(--amber)' }}>
                            🔥 {streak}d
                        </span>
                    )}
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{activeDays}/30</span>
                </div>
            </div>
            <div className="grid grid-cols-10 gap-[3px]">
                {days.map(date => {
                    const count = logMap[date] || 0;
                    const isToday = date === new Date().toISOString().split('T')[0];
                    const opacity = count > 0 ? Math.min(0.3 + (count * 0.25), 1) : 1;
                    return (
                        <div key={date}
                            className={`aspect-square rounded-sm transition-all duration-200 hover:scale-150 hover:z-10 cursor-pointer
                                ${isToday ? 'ring-1 ring-white/20' : ''}`}
                            style={{ 
                                backgroundColor: count > 0 ? auraColor : 'rgba(255,255,255,0.05)',
                                opacity: count > 0 ? opacity : 1,
                            }}
                            title={`${date}: ${count}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

window.HabitHeatmap = HabitHeatmap;

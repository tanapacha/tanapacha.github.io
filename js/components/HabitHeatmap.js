const { useState, useEffect } = React;

const HabitHeatmap = ({ habitId, logs = [], habitName = "Habit", auraColor = "var(--aura-primary)" }) => {
    // Generate last 30 days
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

    return (
        <div className="habit-heatmap-container">
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">{habitName}</span>
                <span className="text-[10px] text-text-secondary">{Object.keys(logMap).length} days active</span>
            </div>
            
            <div className="grid grid-cols-10 gap-1.5">
                {days.map(date => {
                    const count = logMap[date] || 0;
                    const opacity = count > 0 ? Math.min(0.2 + (count * 0.2), 1) : 0.05;
                    
                    return (
                        <div 
                            key={date}
                            className="aspect-square rounded-sm transition-all duration-500 hover:scale-125 hover:z-10 cursor-pointer"
                            style={{ 
                                backgroundColor: auraColor,
                                opacity: opacity,
                                boxShadow: count > 0 ? `0 0 8px ${auraColor === 'var(--aura-primary)' ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.2)'}` : 'none'
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

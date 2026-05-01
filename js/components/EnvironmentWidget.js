const { useState, useEffect } = React;

const WEATHER_CODES = {
    0: { label: 'ท้องฟ้าแจ่มใส', icon: 'Sun', color: '#fbbf24' },
    1: { label: 'ท้องฟ้าโปร่ง', icon: 'CloudSun', color: '#fbbf24' },
    2: { label: 'เมฆบางส่วน', icon: 'Cloud', color: '#94a3b8' },
    3: { label: 'เมฆครึ้ม', icon: 'Cloudy', color: '#64748b' },
    45: { label: 'หมอกลง', icon: 'CloudFog', color: '#94a3b8' },
    48: { label: 'หมอกน้ำค้างแข็ง', icon: 'CloudFog', color: '#94a3b8' },
    51: { label: 'ฝนละอองเบา', icon: 'CloudDrizzle', color: '#60a5fa' },
    53: { label: 'ฝนละอองปานกลาง', icon: 'CloudDrizzle', color: '#60a5fa' },
    55: { label: 'ฝนละอองหนาแน่น', icon: 'CloudDrizzle', color: '#3b82f6' },
    61: { label: 'ฝนตกเบา', icon: 'CloudRain', color: '#60a5fa' },
    63: { label: 'ฝนตกปานกลาง', icon: 'CloudRain', color: '#3b82f6' },
    65: { label: 'ฝนตกหนัก', icon: 'CloudRain', color: '#2563eb' },
    80: { label: 'ฝนโปรยปรายเบา', icon: 'CloudRainWind', color: '#60a5fa' },
    81: { label: 'ฝนโปรยปรายปานกลาง', icon: 'CloudRainWind', color: '#3b82f6' },
    82: { label: 'ฝนโปรยปรายหนัก', icon: 'CloudRainWind', color: '#2563eb' },
    95: { label: 'พายุฝนฟ้าคะนอง', icon: 'CloudLightning', color: '#f59e0b' },
};

const getAQIInfo = (pm25) => {
    if (pm25 <= 12) return { label: 'ดีมาก', color: '#34d399', advice: 'อากาศดีเยี่ยม เหมาะกับกิจกรรมกลางแจ้ง' };
    if (pm25 <= 35) return { label: 'ปานกลาง', color: '#fbbf24', advice: 'อากาศปกติ ออกกำลังกายกลางแจ้งได้' };
    if (pm25 <= 55) return { label: 'เริ่มมีผลต่อสุขภาพ', color: '#fb923c', advice: 'ควรสวมหน้ากากหากอยู่นอกบ้านนานๆ' };
    if (pm25 <= 150) return { label: 'มีผลต่อสุขภาพ', color: '#f87171', advice: 'ควรเลี่ยงกิจกรรมกลางแจ้งและสวมหน้ากาก N95' };
    return { label: 'อันตราย', color: '#ef4444', advice: 'อันตรายมาก! ควรอยู่แต่ในอาคารและปิดหน้าต่าง' };
};

const EnvironmentWidget = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEnvData = async (lat, lon) => {
            try {
                const [weather, air] = await Promise.all([
                    window.gasClient.fetchWeather(lat, lon),
                    window.gasClient.fetchAirQuality(lat, lon)
                ]);

                if (weather && air) {
                    const currentHourIdx = new Date().getHours();
                    setData({
                        temp: weather.current_weather.temperature,
                        code: weather.current_weather.weathercode,
                        humidity: weather.hourly.relativehumidity_2m[currentHourIdx],
                        uv: weather.hourly.uv_index[currentHourIdx],
                        pm25: air.hourly.pm2_5[currentHourIdx],
                        aqi: air.hourly.us_aqi[currentHourIdx]
                    });
                }
            } catch (err) {
                setError("ไม่สามารถดึงข้อมูลสภาพแวดล้อมได้");
            } finally {
                setLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchEnvData(pos.coords.latitude, pos.coords.longitude),
                () => {
                    // Fallback to Bangkok
                    fetchEnvData(13.7563, 100.5018);
                }
            );
        } else {
            fetchEnvData(13.7563, 100.5018);
        }
    }, []);

    if (loading) return <window.BentoCard isLoading={true} />;
    if (error) return <div className="text-red-400 text-xs p-4">{error}</div>;
    if (!data) return null;

    const weather = WEATHER_CODES[data.code] || { label: 'ไม่ทราบสภาพอากาศ', icon: 'Cloud', color: '#fff' };
    const aqiInfo = getAQIInfo(data.pm25);

    return (
        <window.BentoCard 
            title="สภาพแวดล้อม" 
            subtitle="Live Environment" 
            icon="CloudSun" 
            accent="cyan"
        >
            <div className="flex flex-col gap-6">
                {/* Weather Primary */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-3xl" style={{ color: weather.color }}>
                            <window.SafeIcon name={weather.icon} className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white leading-none mb-1">{data.temp}°C</div>
                            <div className="text-xs text-white/50">{weather.label}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Humidity</div>
                        <div className="text-sm font-semibold text-cyan-400">{data.humidity}%</div>
                    </div>
                </div>

                {/* PM2.5 Secondary */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: aqiInfo.color }}></div>
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <window.SafeIcon name="Wind" className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">PM 2.5 Index</span>
                        </div>
                        <div className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${aqiInfo.color}20`, color: aqiInfo.color, border: `1px solid ${aqiInfo.color}40` }}>
                            {aqiInfo.label}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-3xl font-bold text-white">{Math.round(data.pm25)}</div>
                        <div className="text-xs text-white/30">µg/m³</div>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed italic">
                        "{aqiInfo.advice}"
                    </p>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                        <window.SafeIcon name="Sun" className="w-3.5 h-3.5 text-amber-400" />
                        <div>
                            <div className="text-[8px] text-white/30 uppercase tracking-tighter">UV Index</div>
                            <div className="text-xs font-bold text-white">{data.uv}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                        <window.SafeIcon name="Thermometer" className="w-3.5 h-3.5 text-rose-400" />
                        <div>
                            <div className="text-[8px] text-white/30 uppercase tracking-tighter">Feels Like</div>
                            <div className="text-xs font-bold text-white">{Math.round(data.temp - 1)}°C</div>
                        </div>
                    </div>
                </div>
            </div>
        </window.BentoCard>
    );
};

window.EnvironmentWidget = EnvironmentWidget;

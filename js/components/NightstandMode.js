
// ══════════════════════════════════════════════════════════
//  Aura Nightstand Mode — Hands-Free Alarm + AI Wake-Up
//  v2: Stable interval via refs (no restart on state change)
// ══════════════════════════════════════════════════════════

const { useState: useNS, useEffect: useNSEffect, useRef: useNSRef, useMemo: useNSMemo } = React;

// ── Alarm sound via Web Audio API ──
const createAlarmSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const playTone = (freq, startTime, dur, vol = 0.3) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, startTime + dur);
            osc.start(startTime);
            osc.stop(startTime + dur + 0.1);
        };
        let t = ctx.currentTime;
        for (let round = 0; round < 3; round++) {
            const vol = 0.15 + round * 0.12;
            playTone(528, t, 0.4, vol); t += 0.5;
            playTone(660, t, 0.4, vol); t += 0.5;
            playTone(792, t, 0.6, vol); t += 1.2;
        }
        return (0.5 + 0.5 + 1.2) * 3 * 1000; // total ms
    } catch (e) {
        console.warn('Web Audio not available', e);
        return 500;
    }
};

const fmtHHmm = (d) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

// ── Wake-up intro: long, slow, gentle — ~30s at rate 0.72 ──
const wakeUpIntro = (weatherData) => {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour < 6)  greeting = 'ดึกมากเลยนะครับ ขอบคุณที่ไว้วางใจให้ Aura ปลุก';
    else if (hour < 10) greeting = 'อรุณสวัสดิ์ครับ';
    else if (hour < 12) greeting = 'สวัสดีตอนสายนะครับ วันใหม่มาถึงแล้วครับ';
    else greeting = 'สวัสดีครับ ได้เวลาตื่นแล้วนะครับ';

    let weatherSnippet = '';
    if (weatherData) {
        weatherSnippet = `เช้านี้อุณหภูมิอยู่ที่ ${Math.round(weatherData.temp)} องศาเซลเซียส `;
        if (weatherData.pm25 > 55) {
            weatherSnippet += `แต่ค่าฝุ่น พีเอ็ม 2.5 ค่อนข้างสูงอยู่ที่ ${Math.round(weatherData.pm25)} อย่าลืมใส่หน้ากากก่อนออกจากบ้านนะครับ `;
        } else if (weatherData.pm25 > 35) {
            weatherSnippet += `ค่าฝุ่น พีเอ็ม 2.5 อยู่ในระดับปานกลางครับ `;
        } else {
            weatherSnippet += `อากาศสดใสและค่าฝุ่นดีมากครับ `;
        }
    }

    return (
        `${greeting} ${weatherSnippet}` +
        `ค่อยๆ ลืมตาขึ้นช้าๆ นะครับ ไม่ต้องรีบ ` +
        `หายใจเข้าลึกๆ สักครั้ง แล้วค่อยๆ ปล่อยออกมา ` +
        `ร่างกายต้องการเวลาสักครู่เพื่อตื่นตัวอย่างเต็มที่ครับ ` +
        `วันนี้เป็นวันใหม่ที่เต็มไปด้วยโอกาสดีๆ ` +
        `Aura จะสรุปตารางงานสำคัญของวันนี้ให้ฟังต่อไปนี้ครับ`
    );
};

// ── Schedule briefing after intro ──
const buildBriefing = (alarms) => {
    if (!alarms || alarms.length === 0) return 'วันนี้ยังไม่มีกิจกรรมที่ลงไว้ครับ สามารถพักผ่อนได้ตามสบายเลยครับ';
    const lines = alarms.slice(0, 4).map((a, i) => {
        const prefix = i === 0 ? 'กิจกรรมแรกของวันคือ' : i === 1 ? 'ถัดมาคือ' : 'และ';
        return `${prefix} ${a.title} เวลา ${a.time} นาฬิกาครับ`;
    });
    const total = alarms.length;
    const tail = total > 4 ? ` รวมทั้งหมด ${total} กิจกรรมในวันนี้ครับ` : ' เท่านี้ครับสำหรับวันนี้';
    return lines.join(' ') + tail;
};


// ══════════════════════════════════════════════════════════
const NightstandMode = ({ onClose, todayEvents = [], todayTimetableClasses = [] }) => {

    const [clockNow, setClockNow] = useNS(new Date());
    const [activeAlarm, setActiveAlarm] = useNS(null);
    const [isSpeaking, setIsSpeaking] = useNS(false);
    const [snoozeUntil, setSnoozeUntil] = useNS(null);
    const [wakeLockActive, setWakeLockActive] = useNS(false);
    const [statusMsg, setStatusMsg] = useNS('');
    const [isListening, setIsListening] = useNS(false);
    const [weather, setWeather] = useNS(null);

    // ── Stable refs (interval reads these without stale closure) ──
    const firedRef = useNSRef(new Set());           // keys already triggered
    const activeAlarmRef = useNSRef(null);          // mirror of activeAlarm state
    const snoozeUntilRef = useNSRef(null);          // mirror of snoozeUntil state
    const alarmsRef = useNSRef([]);                 // latest alarm list
    const wakeLockRef = useNSRef(null);
    const tickRef = useNSRef(null);

    // Keep refs in sync with state
    useNSEffect(() => { activeAlarmRef.current = activeAlarm; }, [activeAlarm]);
    useNSEffect(() => { snoozeUntilRef.current = snoozeUntil; }, [snoozeUntil]);

    // ── Build flat alarm list from events + timetable ──
    const alarms = useNSMemo(() => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const list = [];

        (todayEvents || []).forEach(ev => {
            if (!ev.start) return;
            if (!ev.start.startsWith(todayStr)) return;
            const d = new Date(ev.start);
            if (isNaN(d)) return;
            list.push({ key: `ev-${ev.id || ev.title}-${fmtHHmm(d)}`, time: fmtHHmm(d), title: ev.title, hour: d.getHours(), min: d.getMinutes() });
        });

        (todayTimetableClasses || []).forEach(cls => {
            if (!cls.startTime) return;
            const m = String(cls.startTime).match(/(\d{1,2})[:.:](\d{2})/);
            if (!m) return;
            const h = parseInt(m[1]), min = parseInt(m[2]);
            list.push({ key: `tt-${cls.id || cls.subject}-${cls.startTime}`, time: cls.startTime, title: `คาบสอน ${cls.subject} (${cls.section || ''})`, hour: h, min });
        });

        return list.sort((a, b) => a.hour * 60 + a.min - (b.hour * 60 + b.min));
    }, [todayEvents, todayTimetableClasses]);

    // Keep alarmsRef updated whenever alarms list changes
    useNSEffect(() => { alarmsRef.current = alarms; }, [alarms]);

    // ── Speak with optional rate (slow = 0.72 for gentle wake) ──
    const speak = (text, rate = 0.9, onEnd = null) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'th-TH';
        utter.rate = rate;
        utter.pitch = 1.05;
        // pick best Thai voice
        const voices = window.speechSynthesis.getVoices();
        const thaiVoice = voices
            .filter(v => v.lang.includes('th') || v.name.includes('Thai'))
            .sort((a, b) => {
                const score = v => {
                    let s = 0;
                    const n = v.name.toLowerCase();
                    if (n.includes('natural') || n.includes('neural')) s += 100;
                    if (n.includes('google')) s += 50;
                    if (n.includes('premium') || n.includes('enhanced')) s += 30;
                    return s;
                };
                return score(b) - score(a);
            })[0];
        if (thaiVoice) utter.voice = thaiVoice;
        utter.onend = () => {
            setIsSpeaking(false);
            if (onEnd) onEnd();
        };
        utter.onerror = () => {
            setIsSpeaking(false);
            if (onEnd) onEnd();
        };
        window.speechSynthesis.speak(utter);
    };

    // ── Fire alarm: chime → intro (slow) → schedule ──
    const fireAlarm = (alarm) => {
        setActiveAlarm(alarm);
        activeAlarmRef.current = alarm;
        const soundMs = createAlarmSound();

        // Phase 1: after chime, speak gentle wake-up intro slowly
        setTimeout(() => {
            const intro = wakeUpIntro(weather);
            speak(intro, 0.72, () => {
                // Phase 2: after intro completes, speak the schedule
                const nowMins = alarm.hour * 60 + alarm.min;
                const upcoming = alarmsRef.current.filter(a => a.hour * 60 + a.min >= nowMins);
                const brief = buildBriefing(upcoming);
                if (brief) speak(brief, 0.85);
            });
        }, soundMs + 400);
    };

    // ── Dismiss ──
    const dismiss = () => {
        window.speechSynthesis?.cancel();
        setActiveAlarm(null);
        activeAlarmRef.current = null;
        setIsSpeaking(false);
        setStatusMsg('✅ ปิดปลุกแล้ว');
    };

    // ── Snooze 5 min ──
    const snooze = () => {
        window.speechSynthesis?.cancel();
        const until = new Date(Date.now() + 5 * 60 * 1000);
        setSnoozeUntil(until);
        snoozeUntilRef.current = until;
        setActiveAlarm(null);
        activeAlarmRef.current = null;
        setIsSpeaking(false);
        setStatusMsg(`⏰ Snooze จนถึง ${fmtHHmm(until)}`);
    };

    // ── Voice Command ──
    const listenForCommand = () => {
        if (!window.auraVoice || !activeAlarmRef.current) return;
        setIsListening(true);
        window.auraVoice.startListening((text) => {
            setIsListening(false);
            const t = (text || '').toLowerCase();
            if (t.includes('หยุด') || t.includes('ปิด') || t.includes('stop') || t.includes('dismiss')) {
                dismiss();
            } else if (t.includes('snooze') || t.includes('เลื่อน') || t.includes('อีกนิด') || t.includes('5 นาที')) {
                snooze();
            } else {
                setStatusMsg(`ไม่เข้าใจ "${text}" — พูดว่า "หยุด" หรือ "เลื่อน"`);
            }
        }, () => setIsListening(false));
    };

    // ── Wake Lock ──
    const requestWakeLock = async () => {
        if (!('wakeLock' in navigator)) { setStatusMsg('⚠️ เบราว์เซอร์ไม่รองรับ Wake Lock'); return; }
        try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            setWakeLockActive(true);
            setStatusMsg('🔒 หน้าจอจะไม่ดับขณะโหมดหัวเตียง');
            wakeLockRef.current.addEventListener('release', () => setWakeLockActive(false));
        } catch (e) { setStatusMsg('⚠️ ไม่สามารถล็อคหน้าจอได้'); }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
        setWakeLockActive(false);
    };

    // ── Fetch Weather ──
    useNSEffect(() => {
        const fetchWeather = async () => {
            const lat = 13.7563, lon = 100.5018; // Default BKK
            try {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                        const [w, a] = await Promise.all([
                            window.gasClient.fetchWeather(pos.coords.latitude, pos.coords.longitude),
                            window.gasClient.fetchAirQuality(pos.coords.latitude, pos.coords.longitude)
                        ]);
                        if (w && a) {
                            const h = new Date().getHours();
                            setWeather({ temp: w.current_weather.temperature, pm25: a.hourly.pm2_5[h] });
                        }
                    }, async () => {
                        const [w, a] = await Promise.all([
                            window.gasClient.fetchWeather(lat, lon),
                            window.gasClient.fetchAirQuality(lat, lon)
                        ]);
                        if (w && a) {
                            const h = new Date().getHours();
                            setWeather({ temp: w.current_weather.temperature, pm25: a.hourly.pm2_5[h] });
                        }
                    });
                }
            } catch (e) { console.error("Weather fetch error", e); }
        };
        fetchWeather();
    }, []);

    // ── SINGLE stable interval — reads state via refs ──
    useNSEffect(() => {
        requestWakeLock();

        tickRef.current = setInterval(() => {
            const n = new Date();
            setClockNow(new Date(n)); // update clock display

            // Skip if alarm already ringing
            if (activeAlarmRef.current) return;

            // Snooze check
            const sn = snoozeUntilRef.current;
            if (sn && n < sn) return;
            if (sn && n >= sn) {
                snoozeUntilRef.current = null;
                setSnoozeUntil(null);
            }

            // Only fire on :00 second
            if (n.getSeconds() !== 0) return;

            const hh = n.getHours();
            const mm = n.getMinutes();

            alarmsRef.current.forEach(alarm => {
                if (alarm.hour === hh && alarm.min === mm && !firedRef.current.has(alarm.key)) {
                    firedRef.current.add(alarm.key);
                    fireAlarm(alarm);
                }
            });
        }, 1000);

        return () => {
            clearInterval(tickRef.current);
            releaseWakeLock();
            window.speechSynthesis?.cancel();
        };
    }, []); // ← empty deps: runs ONCE, reads mutable refs

    // Auto-listen for voice commands after alarm fires
    useNSEffect(() => {
        if (activeAlarm && !isSpeaking) {
            const t = setTimeout(() => listenForCommand(), 1500);
            return () => clearTimeout(t);
        }
    }, [activeAlarm, isSpeaking]);

    // ── Display ──
    const hours   = String(clockNow.getHours()).padStart(2, '0');
    const minutes = String(clockNow.getMinutes()).padStart(2, '0');
    const seconds = String(clockNow.getSeconds()).padStart(2, '0');
    const dateLabel = clockNow.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });

    const nowMins = clockNow.getHours() * 60 + clockNow.getMinutes();
    const upcomingAlarms = alarms.filter(a => a.hour * 60 + a.min > nowMins).slice(0, 3);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: activeAlarm
                ? 'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, #050608 65%)'
                : '#050608',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            transition: 'background 2s ease',
            fontFamily: "'Inter','Noto Sans Thai',system-ui,sans-serif",
            color: 'rgba(255,255,255,0.9)',
            userSelect: 'none',
        }}>

            {/* EXIT */}
            <button onClick={() => { releaseWakeLock(); onClose(); }}
                style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 18px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em' }}>
                EXIT
            </button>

            {/* Wake Lock badge */}
            <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: wakeLockActive ? '#34d399' : '#f87171', boxShadow: wakeLockActive ? '0 0 8px #34d399' : 'none' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
                    {wakeLockActive ? 'SCREEN LOCKED' : 'NO WAKE LOCK'}
                </span>
            </div>

            {/* ── Normal clock view ── */}
            {!activeAlarm && (
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 16, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        {dateLabel}
                    </p>

                    {/* Big clock */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 6 }}>
                        <span style={{ fontSize: 'clamp(72px, 22vw, 168px)', fontWeight: 100, letterSpacing: '-0.04em', lineHeight: 1, color: 'rgba(255,255,255,0.92)', fontVariantNumeric: 'tabular-nums' }}>
                            {hours}:{minutes}
                        </span>
                        <span style={{ fontSize: 'clamp(22px, 4vw, 40px)', fontWeight: 300, color: 'rgba(255,255,255,0.25)', marginTop: 14, fontVariantNumeric: 'tabular-nums' }}>
                            {seconds}
                        </span>
                    </div>

                    {statusMsg && (
                        <p style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{statusMsg}</p>
                    )}

                    {snoozeUntil && (
                        <div style={{ marginTop: 20, padding: '7px 18px', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa' }} />
                            <span style={{ fontSize: 12, color: '#a78bfa' }}>Snooze จนถึง {fmtHHmm(snoozeUntil)}</span>
                        </div>
                    )}

                    {/* Upcoming */}
                    <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        {upcomingAlarms.length > 0 ? (
                            <>
                                <p style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.18)', marginBottom: 4, textTransform: 'uppercase' }}>
                                    กิจกรรมที่กำลังจะมาถึง
                                </p>
                                {upcomingAlarms.map(a => (
                                    <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, minWidth: 260 }}>
                                        <span style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', color: 'var(--accent, #a78bfa)', fontWeight: 600 }}>{a.time}</span>
                                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{a.title}</span>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>ไม่มีกิจกรรมที่กำลังจะมาถึงวันนี้</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Alarm ringing view ── */}
            {activeAlarm && (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
                    {/* Pulsing orb */}
                    <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'breathingOrb 2.5s ease infinite', fontSize: 52 }}>
                        ⏰
                    </div>

                    <div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>ได้เวลาแล้ว</p>
                        <h2 style={{ fontSize: 'clamp(28px, 8vw, 56px)', fontWeight: 600, color: '#fff', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{activeAlarm.time}</h2>
                        <p style={{ fontSize: 'clamp(15px, 3vw, 22px)', color: 'rgba(255,255,255,0.65)', marginTop: 10 }}>{activeAlarm.title}</p>
                    </div>

                    {isSpeaking && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {[0,1,2].map(i => <div key={i} className="thinking-dot" style={{ animationDelay: `${i * 0.16}s` }} />)}
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 10 }}>Aura กำลังพูด...</span>
                        </div>
                    )}

                    {isListening && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 99 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s ease infinite' }} />
                            <span style={{ fontSize: 12, color: '#34d399' }}>กำลังฟัง… พูดว่า "หยุด" หรือ "เลื่อน"</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 16 }}>
                        <button onClick={snooze} style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                            ⏱ Snooze 5 นาที
                        </button>
                        <button onClick={dismiss} style={{ padding: '14px 32px', background: 'var(--accent, #a78bfa)', border: 'none', borderRadius: 16, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 30px rgba(167,139,250,0.4)' }}>
                            ✓ ปิดปลุก
                        </button>
                    </div>

                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>หรือพูดว่า "หยุด" / "เลื่อน" เพื่อสั่งงานด้วยเสียง</p>
                </div>
            )}
        </div>
    );
};

window.NightstandMode = NightstandMode;

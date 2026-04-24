/**
 * Aura LifeOS - Unified API Client
 * Routes all requests (Data & AI) to the Google Apps Script Backend
 */

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxrybmqIUACBP1xZuMOX5WJJxA7FsKa2ussfSBkXCwJXdE4sA2iIV9UldWoQuNIb0XW/exec";


const gasClient = {
    _cache: {},
    _cacheTTL: 60000, // 1 minute cache for same sheet requests
    
    clearCache(key) {
        if (!key) this._cache = {};
        else delete this._cache[key];
    },

    /**
     * Fetch selective data (from GAS)
     * @param {string} sheets - Comma-separated list of sheet names (e.g., 'finance,goals')
     * @param {boolean} forceRefresh - If true, bypasses cache
     */
    async fetchData(sheets = "", forceRefresh = false) {
        const cacheKey = sheets || "all";
        const now = Date.now();

        // Check cache
        if (!forceRefresh && this._cache[cacheKey] && (now - this._cache[cacheKey].timestamp < this._cacheTTL)) {
            console.log(`[Aura Cache] Returning cached data for: ${cacheKey}`);
            return this._cache[cacheKey].data;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); 
        try {
            const url = `${GAS_WEB_APP_URL}?action=getData${sheets ? `&sheets=${sheets}` : ''}`;
            console.log(`[Aura Fetch] Requesting: ${sheets || 'all'}`);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();

            // Store in cache
            this._cache[cacheKey] = {
                data: data,
                timestamp: now
            };

            return data;
        } catch (error) {
            console.error("Error fetching from GAS:", error);
            if (error.name === 'AbortError') console.error("Fetch timed out");
            return null;
        }
    },

    /**
     * Sync a new event to Google Calendar (via GAS)
     */
    async addEvent(eventData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addEvent', data: eventData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error adding event:", error);
            return { status: "error" };
        }
    },

    /**
     * Delete an event from Google Calendar (via GAS)
     */
    async deleteEvent(eventId) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'deleteEvent', id: eventId })
            });
            return await response.json();
        } catch (error) {
            console.error("Error deleting event:", error);
            return { status: "error" };
        }
    },

    /**
     * Update goal progress in Google Sheets (via GAS)
     */
    async updateGoal(goalId, progress) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'updateGoal', id: goalId, progress: progress })
            });
            return await response.json();
        } catch (error) {
            console.error("Error updating goal:", error);
        }
    },

    /**
     * Add a new goal to Google Sheets (via GAS)
     */
    async addGoal(goalData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addGoal', data: goalData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error adding goal:", error);
            return { status: "error" };
        }
    },

    /**
     * Delete a goal from Google Sheets (via GAS)
     */
    async deleteGoal(goalId) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'deleteGoal', id: goalId })
            });
            return await response.json();
        } catch (error) {
            console.error("Error deleting goal:", error);
            return { status: "error" };
        }
    },

    /**
     * Add a financial transaction to Google Sheets (via GAS)
     */
    async addTransaction(transactionData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addFinance', data: transactionData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error adding transaction:", error);
            return { status: "error" };
        }
    },

    /**
     * Delete a financial transaction from Google Sheets (via GAS)
     */
    async deleteTransaction(transactionId) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'deleteFinance', id: transactionId })
            });
            return await response.json();
        } catch (error) {
            console.error("Error deleting transaction:", error);
            return { status: "error" };
        }
    },

    /**
     * Add a timetable item to Google Sheets (via GAS)
     */
    async addTimetableItem(itemData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addTimetable', data: itemData })
            });
            const result = await response.json();
            if (result.status === "success") this.clearCache('timetable');
            return result;
        } catch (error) {
            console.error("Error adding timetable item:", error);
            return { status: "error" };
        }
    },

    /**
     * Delete a timetable item from Google Sheets (via GAS)
     */
    async deleteTimetableItem(itemId) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'deleteTimetable', id: itemId })
            });
            const result = await response.json();
            if (result.status === "success") this.clearCache('timetable');
            return result;
        } catch (error) {
            console.error("Error deleting timetable item:", error);
            return { status: "error" };
        }
    },

    /**
     * Add a mood/energy entry to Google Sheets (via GAS)
     */
    async addMood(moodData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addMood', data: moodData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error adding mood:", error);
            return { status: "error" };
        }
    },

    /**
     * Wellness Logs (Water/Sleep)
     */
    async logWellness(wellnessData) {
        try {
            this._cache = {}; // Clear cache on update
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addWellness', data: wellnessData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error logging wellness:", error);
            return { status: "error" };
        }
    },

    async resetWellness() {
        try {
            this._cache = {}; // Clear cache on reset
            const targetDate = new Date().toISOString().split('T')[0];
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'resetWellness', targetDate: targetDate })
            });
            return await response.json();
        } catch (error) {
            console.error("Error resetting wellness:", error);
            return { status: "error" };
        }
    },

    /**
     * Habits
     */
    async addHabit(habitData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addHabit', data: habitData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error adding habit:", error);
            return { status: "error" };
        }
    },

    async logHabit(logData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'logHabit', data: logData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error logging habit:", error);
            return { status: "error" };
        }
    },

    /**
     * Journal (Golden Moments)
     */
    async saveJournal(journalData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addJournal', data: journalData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error saving journal:", error);
            return { status: "error" };
        }
    },

    /**
     * Resources
     */
    async saveResource(resourceData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addResource', data: resourceData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error saving resource:", error);
            return { status: "error" };
        }
    },

    /**
     * Focus Sessions
     */
    async logFocusSession(focusData) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addFocusSession', data: focusData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error logging focus session:", error);
            return { status: "error" };
        }
    },


    /**
     * Call Gemini AI via Google Apps Script (Unified)
     * With Auto-Fallback mechanism if a model is full or rate-limited
     */
    async callAI(prompt, context = "", modelName = "", image = null) {
        // Fallback sequence if the selected model fails due to quota/rate-limits
        const fallbackModels = [
            modelName, // Start with the requested model
            "gemini-2.0-flash-lite", // Extremely fast and usually always available
            "gemini-flash-latest", // Standard stable model
            "gemini-2.5-pro", // If flash fails, maybe pro has different quota
            "gemini-1.5-flash-8b" // Absolute last resort
        ];

        // Remove duplicates and keep only truthy values
        const modelsToTry = [...new Set(fallbackModels.filter(Boolean))];

        for (let i = 0; i < modelsToTry.length; i++) {
            const currentModel = modelsToTry[i];
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout for AI
            
            try {
                console.log(`Calling Unified AI (GAS)... Model: ${currentModel}, Attempt: ${i+1}/${modelsToTry.length}`, { hasImage: !!image });
                const response = await fetch(GAS_WEB_APP_URL, {
                    method: 'POST',
                    signal: controller.signal,
                    body: JSON.stringify({
                        action: 'callAI',
                        message: prompt,
                        context: context,
                        modelName: currentModel,
                        image: image
                    })
                });
                
                clearTimeout(timeoutId);
                
                let data;
                const responseText = await response.text();
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    console.error("Non-JSON response from server:", responseText);
                    if (i === modelsToTry.length - 1) return "⚠️ เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (Non-JSON) กรุณาตรวจสอบการตั้งค่า Apps Script หรือลองใหม่อีกครั้งครับ";
                    continue; // Try next model
                }
                
                if (data.error) {
                    const isRateLimit = data.error.toLowerCase().match(/429|exhausted|quota|overloaded|too many requests/);
                    if (isRateLimit && i < modelsToTry.length - 1) {
                        console.warn(`[Aura AI] Model ${currentModel} is full/rate-limited. Auto-switching to next model...`);
                        continue; // Try next model in the fallback list
                    }
                    if (i === modelsToTry.length - 1) return data.error; // Return error if all models fail
                }
                
                let reply = data.reply;
                if (data.actionPerformed) {
                    reply += `\n\n✨ [Aura Action]: ${data.actionPerformed}`;
                }
                
                // If it switched models, append a subtle note
                if (i > 0) {
                    reply += `\n\n*(⚡ Aura System: โมเดลหลักเต็มชั่วคราว ระบบได้สลับไปใช้ ${currentModel} อัตโนมัติเพื่อความต่อเนื่องครับ)*`;
                }
                
                return reply;
            } catch (error) {
                clearTimeout(timeoutId);
                console.error("Error calling Unified AI:", error);
                
                if (i < modelsToTry.length - 1) {
                    console.warn(`[Aura AI] Request failed for ${currentModel}. Retrying with next model...`);
                    continue; // Network error or timeout, try next model
                }
                
                if (error.name === 'AbortError') {
                    return "การเชื่อมต่อกับ 'สมอง Aura' ใช้เวลานานเกินไป (Timeout) โปรดลองใหม่อีกครั้งบนเครือข่ายที่เสถียรกว่านี้ครับ";
                }
                return "⚠️ ไม่สามารถติดต่อ 'สมอง Aura' ได้ครับ โปรดตรวจสอบการตั้งค่า Apps Script หรือ CORS policy";
            }
        }
    },

    /**
     * Nutrition & Meals
     */
    async addNutrition(nutritionData) {
        try {
            this._cache = {}; // Clear cache on update
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addNutrition', data: nutritionData })
            });
            return await response.json();
        } catch (error) {
            console.error("Error adding nutrition log:", error);
            return { status: "error" };
        }
    },

    /**
     * Specialized Food Analysis
     * @param {string} base64Image - Base64 string of the food image
     */
    async analyzeMealImage(base64Image) {
        const prompt = `ในฐานะ Aura AI (ที่ปรึกษาสุขภาพสาย Bio-hacking ที่ช่ำชองทฤษฏีแต่คุยสนุก) ช่วยวิเคราะห์สารอาหารในรูปภาพนี้อย่างละเอียดทีครับ:
1. ชื่อรายการอาหาร
2. ประมาณการ Metabolic Energy (แคลอรี่ kcal)
3. ประมาณการ Macronutrients: โปรตีน (g), คาร์โบไฮเดรต (g), ไขมัน (g)
4. วิเคราะห์ด้วยทฤษฎีการแพทย์หรือการทำงานของร่างกาย (เช่น ผลต่อระดับน้ำตาลหรือการซ่อมแซมกล้ามเนื้อ) แบบว้าวๆ และเป็นกันเอง

กรุณาตอบกลับเป็นภาษาไทยที่กระชับ และใช้ Smart Action เพื่อบันทึกข้อมูลดังนี้:
[ACTION:ADD_NUTRITION|ชื่ออาหาร|แคลอรี่|โปรตีน|คาร์บ|ไขมัน]`;

        return await this.callAI(prompt, "วิเคราะห์โภชนาการจากรูปภาพ", "gemini-flash-latest", base64Image);
    },

    /**
     * Specialized Food Analysis from Text
     * @param {string} foodText - Description of the food
     */
    async analyzeMealText(foodText) {
        const prompt = `ในฐานะ Aura AI (ที่ปรึกษาสุขภาพสาย Bio-hacking) ช่วยวิเคราะห์สารอาหารจากเมนูที่ฉันพิมพ์บอกนี้ทีครับ: "${foodText}"
1. ชื่อรายการอาหาร
2. ประมาณการ Metabolic Energy (แคลอรี่ kcal)
3. ประมาณการ Macronutrients: โปรตีน (g), คาร์โบไฮเดรต (g), ไขมัน (g)
4. วิเคราะห์สั้นๆ ว่าดีต่อร่างกายอย่างไร (เช่น ดัชนีน้ไตาลต่ำ หรือช่วยสร้างกล้ามเนื้อ)

กรุณาตอบกลับเป็นภาษาไทยที่กระชับ และใช้ Smart Action เพื่อบันทึกข้อมูลดังนี้:
[ACTION:ADD_NUTRITION|ชื่ออาหาร|แคลอรี่|โปรตีน|คาร์บ|ไขมัน]`;

        return await this.callAI(prompt, "วิเคราะห์โภชนาการจากข้อความ", "gemini-flash-latest");
    },

    /**
     * Specialized Workout Analysis
     * @param {string} base64Image - Base64 string of the workout image (Strava/Watch)
     */
    async analyzeWorkoutImage(base64Image) {
        const prompt = `ในฐานะ Aura AI (ผู้เชี่ยวชาญด้านวิทยาศาสตร์การกีฬาและฟิตเนส) ช่วยวิเคราะห์รูปภาพหน้าจอการออกกำลังกายนี้ (เช่น จาก Strava, Apple Watch, Garmin) ทีครับ:
1. ประเภทการออกกำลังกาย (เช่น วิ่ง, ปั่นจักรยาน, เวทเทรนนิ่ง)
2. ระยะเวลา (นาที)
3. พลังงานที่เผาผลาญ (Active Calories kcal)
4. ระยะทาง (ถ้ามี) หรืออัตราการเต้นหัวใจเฉลี่ย (ถ้ามี)
5. คำชื่นชมหรือวิเคราะห์ผลดีต่อร่างกายสั้นๆ แบบปลุกใจ

กรุณาตอบกลับเป็นภาษาไทยที่กระชับ และใช้ Smart Action เพื่อบันทึกข้อมูลดังนี้ (โปรดใช้ prefix [EXERCISE] ตรงชื่อกิจกรรม และใส่แคลอรี่เป็น ค่าติดลบ เสมอ เช่น -300):
[ACTION:ADD_NUTRITION|[EXERCISE] ชื่อกิจกรรม|-แคลอรี่|0|0|0]`;

        return await this.callAI(prompt, "วิเคราะห์การออกกำลังกายจากรูปภาพ", "gemini-flash-latest", base64Image);
    },

    /**
     * Settings
     */
    async updateSetting(key, value) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'updateSetting', key: key, value: value })
            });
            return await response.json();
        } catch (error) {
            console.error("Error updating setting:", error);
            return { status: "error" };
        }
    }
};

window.gasClient = gasClient;

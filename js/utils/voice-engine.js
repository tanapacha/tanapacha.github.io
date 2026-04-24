/**
 * Aura Voice Engine
 * Handles Text-to-Speech (TTS) and Speech-to-Text (STT)
 */

window.auraVoice = {
    // Current recognition instance
    recognition: null,
    isListening: false,
    
    /**
     * Text-to-Speech (TTS)
     */
    speak(text, onEnd = null) {
        if (!window.speechSynthesis) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Get all available voices
        const voices = window.speechSynthesis.getVoices();
        
        // Filter Thai voices
        const thaiVoices = voices.filter(v => v.lang.includes('th') || v.name.includes('Thai'));
        
        if (thaiVoices.length > 0) {
            // Priority: Natural/Neural > Google > Premium/Enhanced > Local
            thaiVoices.sort((a, b) => {
                const getScore = (v) => {
                    let score = 0;
                    const name = v.name.toLowerCase();
                    if (name.includes('natural') || name.includes('neural')) score += 100;
                    if (name.includes('google')) score += 50;
                    if (name.includes('premium') || name.includes('enhanced')) score += 30;
                    if (v.localService) score += 10;
                    return score;
                };
                return getScore(b) - getScore(a);
            });
            
            utterance.voice = thaiVoices[0];
            console.log("Selected Aura Voice:", thaiVoices[0].name);
        }
        
        utterance.lang = 'th-TH';
        
        // Fine-tuning for more "human" feel
        utterance.pitch = 1.05; // Slightly higher for a friendlier, energetic feel
        utterance.rate = 1.0;   // Normal rate
        
        utterance.onend = () => {
            if (onEnd) onEnd();
        };
        
        window.speechSynthesis.speak(utterance);
    },

    /**
     * Speech-to-Text (STT)
     */
    startListening(onResult, onEnd = null) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("ขออภัยครับ เบราว์เซอร์ของคุณไม่รองรับการสั่งงานด้วยเสียง");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'th-TH';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onstart = () => {
            this.isListening = true;
        };

        this.recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            if (onResult) onResult(result);
        };

        this.recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            this.isListening = false;
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (onEnd) onEnd();
        };

        this.recognition.start();
    },

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
            this.isListening = false;
        }
    }
};

// Prefetch voices (fixes issues in some browsers where voices are empty first time)
window.speechSynthesis.getVoices();
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

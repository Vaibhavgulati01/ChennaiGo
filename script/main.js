import { apiKey } from './config.js';

console.log("JS loaded");
let map; 
let startDestinationForMap;

// Game State Management
class GameState {
    constructor() {
        this.level = 1;
        this.xp = 0;
        this.streak = 0;
        this.lastPlayDate = null;
        this.totalAnswered = 0;
        this.correctAnswers = 0;
        this.completedQuests = [];
        this.learnedWords = [];
        this.dailyQuests = [];
        this.cultureCards = [];
        this.streakFreezes = 0;
        this.sessionStartTime = null;
        this.totalPlayTime = 0;
        this.masteryStars = {};
        this.cosmetics = {
            pins: [],
            frames: [],
            stickers: []
        };
        this.characterRelationships = {
            ravi: { trust: 0, conversations: 0, lastMet: null },
            anna: { trust: 0, conversations: 0, lastMet: null }
        };
        this.init();
    }

    init() {
        this.loadProgress();
        this.generateDailyQuests();
        this.updateStreak();
        this.sessionStartTime = Date.now();
        setTimeout(() => this.updateDailyQuestsDisplay(), 100);
    }

    getXPForLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    addXP(amount, reason = '') {
        this.xp += amount;
        this.totalAnswered++;
        
        const currentLevelXP = this.getXPForLevel(this.level);
        const nextLevelXP = this.getXPForLevel(this.level + 1);
        
        if (this.xp >= nextLevelXP) {
            this.levelUp();
        }
        
        this.updateXPDisplay();
        this.saveProgress();
        this.showXPGain(amount, reason);
    }

    levelUp() {
        this.level++;
        this.playSound('levelup');
    }

    updateStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (this.lastPlayDate === today) {
            return;
        } else if (this.lastPlayDate === yesterday) {
            this.streak++;
        } else if (this.lastPlayDate && this.streakFreezes > 0) {
            this.streakFreezes--;
            this.streak++;
        } else {
            this.streak = 1;
        }
        
        this.lastPlayDate = today;
        this.updateStreakDisplay();
        this.saveProgress();
    }

    generateDailyQuests() {
        const today = new Date().toDateString();
        const savedQuests = localStorage.getItem('dailyQuests');
        const savedDate = localStorage.getItem('dailyQuestsDate');
        
        if (savedDate === today && savedQuests) {
            this.dailyQuests = JSON.parse(savedQuests);
            return;
        }
        
        const questTemplates = [
            { id: 'identify', text: 'Identify 3 landmarks', target: 3, progress: 0, reward: 50, emoji: '🏛️' },
            { id: 'phrases', text: 'Learn 5 Tamil phrases', target: 5, progress: 0, reward: 40, emoji: '💬' },
            { id: 'perfect', text: 'Get 2 perfect answers', target: 2, progress: 0, reward: 60, emoji: '🎯' },
            { id: 'speed', text: 'Answer in under 10 seconds', target: 3, progress: 0, reward: 45, emoji: '⚡' },
            { id: 'culture', text: 'Collect 2 culture cards', target: 2, progress: 0, reward: 35, emoji: '📚' },
            { id: 'words', text: 'Learn 3 new words', target: 3, progress: 0, reward: 30, emoji: '📝' },
            { id: 'streak', text: 'Maintain daily streak', target: 1, progress: 0, reward: 25, emoji: '🔥' },
            { id: 'explore', text: 'Visit 2 different areas', target: 2, progress: 0, reward: 40, emoji: '🗺️' }
        ];
        
        this.dailyQuests = questTemplates
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        localStorage.setItem('dailyQuests', JSON.stringify(this.dailyQuests));
        localStorage.setItem('dailyQuestsDate', today);
    }

    updateDailyQuest(questId, increment = 1) {
        const quest = this.dailyQuests.find(q => q.id === questId);
        if (quest && quest.progress < quest.target) {
            quest.progress += increment;
            if (quest.progress >= quest.target) {
                quest.completed = true;
                this.addXP(quest.reward, 'Daily Quest Complete!');
                this.showReward(`🎯 Daily Quest Complete! +${quest.reward} XP`);
                this.playSound('correct');
            }
            this.updateDailyQuestsDisplay();
            localStorage.setItem('dailyQuests', JSON.stringify(this.dailyQuests));
        }
    }

    updateCharacterRelationship(character, trustChange) {
        if (!this.characterRelationships[character]) {
            this.characterRelationships[character] = { trust: 0, conversations: 0, lastMet: null };
        }
        
        this.characterRelationships[character].trust = Math.max(0, Math.min(100, 
            this.characterRelationships[character].trust + trustChange));
        this.characterRelationships[character].conversations++;
        this.characterRelationships[character].lastMet = new Date().toISOString();
        this.saveProgress();
    }

    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const sounds = {
                correct: { freq: 800, duration: 0.2 },
                incorrect: { freq: 300, duration: 0.5 },
                levelup: { freq: 1000, duration: 0.8 },
                chest: { freq: 600, duration: 0.3 },
                streak: { freq: 1200, duration: 0.15 }
            };
            
            const sound = sounds[type];
            if (!sound) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = sound.freq;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + sound.duration);
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    }

    showXPGain(amount, reason) {
        const xpGain = document.createElement('div');
        xpGain.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 5500;
            animation: xpGainPop 2s ease-out forwards;
            pointer-events: none;
        `;
        xpGain.textContent = `+${amount} XP ${reason ? '• ' + reason : ''}`;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes xpGainPop {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                100% { transform: translate(-50%, -70%) scale(1); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(xpGain);
        
        setTimeout(() => {
            if (xpGain.parentElement) document.body.removeChild(xpGain);
            if (style.parentElement) document.head.removeChild(style);
        }, 2000);
    }

    showReward(message) {
        const reward = document.createElement('div');
        reward.style.cssText = `
            position: fixed;
            top: 20%;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 5500;
            animation: slideInRight 3s ease-out forwards;
            max-width: 250px;
        `;
        reward.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                0% { transform: translateX(100%); opacity: 0; }
                20%, 80% { transform: translateX(0); opacity: 1; }
                100% { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(reward);
        
        setTimeout(() => {
            if (reward.parentElement) document.body.removeChild(reward);
            if (style.parentElement) document.head.removeChild(style);
        }, 3000);
    }

    updateXPDisplay() {
        const currentLevelXP = this.getXPForLevel(this.level);
        const nextLevelXP = this.getXPForLevel(this.level + 1);
        const progressXP = this.xp - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        const progressPercent = (progressXP / neededXP) * 100;
        
        let xpDisplay = document.querySelector('.xp-level-display');
        if (!xpDisplay) {
            xpDisplay = document.createElement('div');
            xpDisplay.className = 'xp-level-display';
            xpDisplay.innerHTML = `
                <div class="level-info">
                    <div class="level-number">${this.level}</div>
                    <div class="level-label">Level</div>
                </div>
                <div class="xp-info">
                    <div class="xp-text">${progressXP}/${neededXP} XP</div>
                    <div class="xp-bar">
                        <div class="xp-progress" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            `;
            const chittuContainer = document.getElementById('chittu-container');
            if (chittuContainer) chittuContainer.prepend(xpDisplay);
        } else {
            const levelNumber = xpDisplay.querySelector('.level-number');
            const xpText = xpDisplay.querySelector('.xp-text');
            const xpProgress = xpDisplay.querySelector('.xp-progress');
            
            if (levelNumber) levelNumber.textContent = this.level;
            if (xpText) xpText.textContent = `${progressXP}/${neededXP} XP`;
            if (xpProgress) xpProgress.style.width = `${progressPercent}%`;
        }
    }

    updateStreakDisplay() {
        const streakCount = document.getElementById('streak-count');
        const streakText = document.querySelector('.streak-text');
        
        if (streakCount && streakText) {
            streakCount.textContent = this.streak;
            streakText.textContent = this.streak === 1 ? 'day streak' : 'day streak';
            
            if (this.streak >= 7) {
                const streakDisplay = document.getElementById('streak-display');
                if (streakDisplay) {
                    streakDisplay.style.background = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
                }
            }
        }
    }

    updateDailyQuestsDisplay() {
        const questsList = document.getElementById('daily-quests-list');
        if (!questsList) return;
        
        questsList.innerHTML = '';
        
        if (this.dailyQuests.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'daily-quest-item';
            emptyMessage.innerHTML = `
                <div class="quest-text">No quests available</div>
                <div class="quest-progress">—</div>
            `;
            questsList.appendChild(emptyMessage);
            return;
        }
        
        this.dailyQuests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = `daily-quest-item ${quest.completed ? 'completed' : ''}`;
            
            questElement.innerHTML = `
                <div class="quest-icon" style="font-size: 1.2em; margin-right: 8px;">${quest.emoji || '📋'}</div>
                <div class="quest-content" style="flex: 1;">
                    <div class="quest-text">${quest.text}</div>
                    <div class="quest-reward" style="font-size: 0.8em; color: #6b7280;">+${quest.reward} XP</div>
                </div>
                <div class="quest-progress ${quest.completed ? 'completed' : ''}">
                    ${quest.completed ? '✓' : `${quest.progress}/${quest.target}`}
                </div>
            `;
            
            questsList.appendChild(questElement);
        });
    }

    saveProgress() {
        const saveData = {
            level: this.level,
            xp: this.xp,
            streak: this.streak,
            lastPlayDate: this.lastPlayDate,
            totalAnswered: this.totalAnswered,
            correctAnswers: this.correctAnswers,
            completedQuests: this.completedQuests,
            learnedWords: this.learnedWords,
            cultureCards: this.cultureCards,
            streakFreezes: this.streakFreezes,
            totalPlayTime: this.totalPlayTime + (Date.now() - this.sessionStartTime),
            masteryStars: this.masteryStars,
            cosmetics: this.cosmetics,
            characterRelationships: this.characterRelationships
        };
        localStorage.setItem('chennaiGoProgress', JSON.stringify(saveData));
    }

    loadProgress() {
        const saved = localStorage.getItem('chennaiGoProgress');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(this, data);
            this.sessionStartTime = Date.now();
        }
    }

    checkMysteryChest() {
        const chestChance = Math.min(0.1 + (this.streak * 0.02), 0.3);
        if (Math.random() < chestChance) {
            console.log('Mystery chest would appear here');
        }
    }
}

// Initialize game state
const gameState = new GameState();

// GLOBAL VARIABLES
let globalMap = null;
let globalStartQuestFunction = null;

// STREET VIEW FUNCTION
function showStreetView(location) { 
    console.log('Starting Street View at:', location);
    
    if (!globalMap) {
        console.error('Map not initialized yet!');
        return;
    }
    
    const mapContainer = document.getElementById('map-container'); 
    mapContainer.classList.add('map-zoom-out'); 
    
    setTimeout(() => { 
        try {
            const pano = new google.maps.StreetViewPanorama(document.getElementById("map"), { 
                position: location, 
                pov: { heading: 200, pitch: 10 }, 
                visible: true, 
                addressControl: false, 
                linksControl: true, 
                panControl: true, 
                fullscreenControl: false 
            }); 
            
            globalMap.setStreetView(pano); 
            console.log('Street View initialized successfully');
            
            setTimeout(() => {
                mapContainer.classList.remove('map-zoom-out');
            }, 50); 
        } catch (error) {
            console.error('Street View error:', error);
        }
    }, 800); 
}

// AUTO DRIVER ANNA'S CONVERSATION SYSTEM (WITH MANUAL NEXT SYSTEM)
const annaConversations = {
    introduction: {
        character: "Auto Driver Anna",
        manualText: [
            "Vanakkam!",
            "Welcome to Chennai! I'm Anna, your friendly auto driver.",
            "I've been driving these streets for 15 years and know every corner of our beautiful city!"
        ],
        options: [
            { text: "Nice to meet you! What makes Chennai special?", nextNode: "chennai_special", trust: 5 },
            { text: "I'm excited to explore! Where should I start?", nextNode: "where_to_start", trust: 8 },
            { text: "Can you teach me some Tamil while we ride?", nextNode: "tamil_basics", trust: 10 },
            { text: "Tell me about the best places to visit", nextNode: "best_places", trust: 7 }
        ]
    },
    
    chennai_special: {
        character: "Auto Driver Anna",
        text: "Ah, Chennai is where tradition meets modernity! We have ancient temples next to IT parks, classical music echoing from sabhas, and the most delicious South Indian food. The sea breeze, the warm people - this city has soul!",
        options: [
            { text: "That sounds amazing! Show me around!", nextNode: "ready_to_explore", trust: 8 },
            { text: "I want to see the traditional side first", nextNode: "traditional_places", trust: 6 },
            { text: "What about the food? I'm hungry!", nextNode: "food_culture", trust: 5 }
        ]
    },
    
    where_to_start: {
        character: "Auto Driver Anna",
        text: "Good question! Chennai has so much to offer. We have Marina Beach for relaxation, Kapaleeshwarar Temple for spirituality, T.Nagar for shopping, and many hidden gems. What interests you most?",
        options: [
            { text: "I love beaches and ocean views!", nextNode: "beach_recommendation", trust: 7 },
            { text: "I'm interested in temples and culture", nextNode: "temple_recommendation", trust: 6 },
            { text: "Shopping sounds fun!", nextNode: "shopping_recommendation", trust: 4 },
            { text: "Show me all the must-visit places!", nextNode: "complete_tour", trust: 10 }
        ]
    },
    
    tamil_basics: {
        character: "Auto Driver Anna",
        text: "Of course! Tamil is a beautiful language. Let me teach you some basics: 'Vanakkam' means hello, 'Nandri' means thank you, 'Vilai enna?' means what's the price? These will help you everywhere in Chennai!",
        options: [
            { text: "Nandri! Teach me more while we explore!", nextNode: "ready_to_explore", trust: 12 },
            { text: "That's helpful! Where can I practice?", nextNode: "practice_places", trust: 8 },
            { text: "What other useful phrases should I know?", nextNode: "useful_phrases", trust: 6 }
        ]
    },
    
    best_places: {
        character: "Auto Driver Anna",
        text: "I'll tell you the real gems! Marina Beach for sunrise, Kapaleeshwarar Temple for peace, T.Nagar for authentic shopping experience, and many more places where locals go. Each place has its own story!",
        options: [
            { text: "Tell me these stories while we visit!", nextNode: "ready_to_explore", trust: 10 },
            { text: "Which place has the most interesting story?", nextNode: "interesting_stories", trust: 7 },
            { text: "I want to experience Chennai like a local", nextNode: "local_experience", trust: 9 }
        ]
    },
    
    traditional_places: {
        character: "Auto Driver Anna",
        text: "Perfect choice! We have magnificent temples like Kapaleeshwarar, cultural centers where classical music flows, and traditional markets where you can hear pure Tamil. These places will show you Chennai's heart!",
        options: [
            { text: "Let's start this cultural journey!", nextNode: "ready_to_explore", trust: 8 },
            { text: "Which temple is the most beautiful?", nextNode: "temple_details", trust: 6 }
        ]
    },
    
    food_culture: {
        character: "Auto Driver Anna",
        text: "Ah, food! Chennai has the best idli, dosa, and filter coffee in the world! Every street has amazing food stalls. But first, let me show you the places, then we'll find the best food spots!",
        options: [
            { text: "Sounds like a plan! Let's go!", nextNode: "ready_to_explore", trust: 7 },
            { text: "I can't wait to try authentic Tamil food!", nextNode: "ready_to_explore", trust: 8 }
        ]
    },
    
    beach_recommendation: {
        character: "Auto Driver Anna",
        text: "Marina Beach is perfect for you! It's the world's second longest urban beach. You can watch fishermen, enjoy sea breeze, and see beautiful sunrises. There's also Elliot's Beach for a quieter experience.",
        options: [
            { text: "Marina Beach sounds perfect! Let's go there first!", nextNode: "ready_to_explore", trust: 8 },
            { text: "Show me all the beaches and other places too!", nextNode: "complete_tour", trust: 9 }
        ]
    },
    
    temple_recommendation: {
        character: "Auto Driver Anna",
        text: "Kapaleeshwarar Temple is our most famous one - over 1300 years old! The architecture will amaze you, and the spiritual energy is incredible. There are also many other beautiful temples around the city.",
        options: [
            { text: "That sounds incredible! I want to visit!", nextNode: "ready_to_explore", trust: 8 },
            { text: "Show me multiple temples and other places!", nextNode: "complete_tour", trust: 7 }
        ]
    },
    
    shopping_recommendation: {
        character: "Auto Driver Anna",
        text: "T.Nagar is a shopper's paradise! It's one of the busiest commercial areas in the world. You'll find everything from silk sarees to modern gadgets, all at great prices. The energy there is infectious!",
        options: [
            { text: "I love busy markets! Let's go shopping!", nextNode: "ready_to_explore", trust: 6 },
            { text: "Show me T.Nagar and other amazing places!", nextNode: "complete_tour", trust: 8 }
        ]
    },
    
    practice_places: {
        character: "Auto Driver Anna",
        text: "Markets are perfect for practicing Tamil! Vendors love when tourists try to speak Tamil. Also, temples where you can hear traditional Tamil, and tea stalls where locals gather for friendly chats!",
        options: [
            { text: "Let's visit these places so I can practice!", nextNode: "ready_to_explore", trust: 10 }
        ]
    },
    
    useful_phrases: {
        character: "Auto Driver Anna",
        text: "'Enge pōnum?' means 'Where are you going?', 'Evvalavu?' means 'How much?', 'Puriyala' means 'I don't understand'. These will make your Chennai trip much easier!",
        options: [
            { text: "Nandri! Now let's explore and practice!", nextNode: "ready_to_explore", trust: 9 }
        ]
    },
    
    interesting_stories: {
        character: "Auto Driver Anna",
        text: "Every place has tales! Marina Beach has stories of fishermen and freedom fighters. Kapaleeshwarar Temple has legends of Lord Shiva. T.Nagar transformed from a residential area to a shopping hub. Each visit reveals more!",
        options: [
            { text: "I want to hear all these stories! Let's go!", nextNode: "ready_to_explore", trust: 10 }
        ]
    },
    
    local_experience: {
        character: "Auto Driver Anna",
        text: "Perfect! We'll skip the tourist traps and go where locals go. Real Chennai is in the small tea stalls, the neighborhood temples, the busy markets, and the peaceful beach corners. Ready for an authentic adventure?",
        options: [
            { text: "Yes! Show me the real Chennai!", nextNode: "ready_to_explore", trust: 12 }
        ]
    },
    
    temple_details: {
        character: "Auto Driver Anna",
        text: "Kapaleeshwarar Temple is the crown jewel - ancient Dravidian architecture with colorful gopurams reaching the sky. The stone carvings tell stories from thousands of years ago. It's living history!",
        options: [
            { text: "I need to see this! Let's visit!", nextNode: "ready_to_explore", trust: 8 }
        ]
    },
    
    complete_tour: {
        character: "Auto Driver Anna",
        text: "Excellent! A complete Chennai experience it is! We have Marina Beach for the sea, Kapaleeshwarar Temple for culture, T.Nagar for shopping, and many more gems. Each place will teach you something new about our city!",
        options: [
            { text: "Perfect! I'm ready to explore everything!", nextNode: "show_all_places", trust: 15 }
        ]
    },
    
    ready_to_explore: {
        character: "Auto Driver Anna",
        text: "Wonderful! But before we start our journey, let me teach you one important Tamil phrase. When you want to ask 'What is the price?' you say 'Vilai enna?'. Can you repeat it?",
        options: [
            { text: "Where is it?", nextNode: "wrong_answer", trust: 0 },
            { text: "What is the price?", nextNode: "correct_answer", trust: 10 },
            { text: "Thank you", nextNode: "wrong_answer", trust: 0 }
        ]
    },
    
    show_all_places: {
        character: "Auto Driver Anna",
        text: "Before we begin exploring all these amazing places, let me teach you an essential phrase! To ask 'What is the price?' in Tamil, we say 'Vilai enna?'. This will be very useful! Can you say it back to me?",
        options: [
            { text: "Where is it?", nextNode: "wrong_answer", trust: 0 },
            { text: "What is the price?", nextNode: "correct_answer", trust: 10 },
            { text: "Thank you", nextNode: "wrong_answer", trust: 0 }
        ]
    },
    
    wrong_answer: {
        character: "Auto Driver Anna",
        text: "Haha, close but not quite! Remember, 'Vilai enna?' means 'What is the price?'. Don't worry, you'll learn as we explore. Now hop in my auto - Chennai awaits!",
        options: [
            { text: "Okay, let's go explore Chennai!", action: "start_map_view", trust: 5 }
        ]
    },
    
    correct_answer: {
        character: "Auto Driver Anna",
        text: "Perfect! 'Vilai enna?' - excellent pronunciation! You're going to do great in Chennai. Come, get in my auto and let's discover this beautiful city together!",
        options: [
            { text: "Let's explore Chennai!", action: "start_map_view", trust: 15 }
        ]
    }
};

// RAVI'S CONVERSATION SYSTEM (UPDATED WITH MANUAL NEXT SYSTEM)
const raviConversations = {
    introduction: {
        character: "Ravi",
        manualText: [
            "Vanakkam!",
            "I'm Ravi, been fishing these waters for 20 years.",
            "The sea here tells many stories... What brings you to Marina Beach today?"
        ],
        options: [
            { text: "I want to learn about this place", nextNode: "about_place", trust: 5 },
            { text: "Tell me about fishing culture", nextNode: "fishing_culture", trust: 8 },
            { text: "Just exploring Chennai", nextNode: "exploring", trust: 3 },
            { text: "Can you teach me Tamil?", nextNode: "tamil_interest", trust: 10 }
        ]
    },
    
    about_place: {
        character: "Ravi",
        manualText: [
            "Ah, Marina Beach!",
            "It's the world's second longest urban beach - 13 kilometers of golden sand.",
            "I've watched sunrises here for decades. The waves carry stories from the Bay of Bengal..."
        ],
        options: [
            { text: "That sounds beautiful! Show me around?", nextNode: "show_around", trust: 8 },
            { text: "What makes it special?", nextNode: "special_place", trust: 5 },
            { text: "I'd love to see the sunrise spot", nextNode: "sunrise_spot", trust: 7 }
        ]
    },
    
    fishing_culture: {
        character: "Ravi",
        manualText: [
            "Our fishing community has lived here for generations!",
            "We go out before dawn in our colorful boats.",
            "In Tamil, we call fishing 'மீன் பிடிப்பு' (meen pidippu). The sea provides, and we respect her moods."
        ],
        options: [
            { text: "Can you show me the fishing area?", nextNode: "fishing_area", trust: 10 },
            { text: "What do you catch here?", nextNode: "fish_types", trust: 6 },
            { text: "How do you predict the weather?", nextNode: "weather_wisdom", trust: 8 }
        ]
    },
    
    exploring: {
        character: "Ravi",
        text: "Exploring is good! Chennai has many faces, and Marina Beach is her most peaceful one. Here you can see the real spirit of our city - families enjoying, children playing, fishermen working...",
        options: [
            { text: "I'd love to see it all!", nextNode: "show_around", trust: 7 },
            { text: "What's the best time to visit?", nextNode: "best_time", trust: 4 },
            { text: "Are there other places like this?", nextNode: "other_beaches", trust: 3 }
        ]
    },
    
    tamil_interest: {
        character: "Ravi",
        manualText: [
            "Tamil is beautiful language! Like the sea - sometimes gentle, sometimes powerful.",
            "I can teach you words we use here daily.",
            "First word - 'கடல்' (kadal) means 'sea'. Can you say it?"
        ],
        options: [
            { text: "Kadal! Teach me more?", nextNode: "tamil_lesson", trust: 12 },
            { text: "What other words should I know?", nextNode: "useful_words", trust: 8 },
            { text: "Show me how you use Tamil here", nextNode: "tamil_in_action", trust: 10 }
        ]
    },
    
    show_around: {
        character: "Ravi",
        manualText: [
            "Perfect! Come, let me show you my favorite spots.",
            "We'll start with the lighthouse - can you see it from here?",
            "Then the fishing harbor where my boat is moored. Ready to explore?"
        ],
        options: [
            { text: "Yes! Let's go!", nextNode: "start_exploration", trust: 10 },
            { text: "What will we see first?", nextNode: "tour_preview", trust: 5 },
            { text: "I'm excited! Lead the way!", nextNode: "start_exploration", trust: 12 }
        ]
    },
    
    special_place: {
        character: "Ravi",
        manualText: [
            "Marina Beach is where Chennai breathes.",
            "Morning brings joggers and yoga people, evening brings families and lovers.",
            "The sand has heard a million prayers and dreams. It connects us all - rich, poor, young, old."
        ],
        options: [
            { text: "I want to feel that connection too", nextNode: "start_exploration", trust: 15 },
            { text: "Show me these different times", nextNode: "time_tour", trust: 8 },
            { text: "That's beautiful. Let's explore!", nextNode: "start_exploration", trust: 10 }
        ]
    },
    
    fishing_area: {
        character: "Ravi",
        manualText: [
            "Yes! The fishing harbor is just north from here.",
            "Early morning is magical - boats returning with silver catch, seagulls dancing.",
            "Families welcoming their fishermen home. Want to see it?"
        ],
        options: [
            { text: "Absolutely! Let's go there!", nextNode: "start_exploration", trust: 12 },
            { text: "That sounds amazing!", nextNode: "start_exploration", trust: 10 },
            { text: "I'd love to see the boats", nextNode: "start_exploration", trust: 8 }
        ]
    },
    
    tamil_lesson: {
        character: "Ravi",
        manualText: [
            "Wonderful! Here are fisherman's words:",
            "'படகு' (padagu) - boat, 'மீன்' (meen) - fish, 'நீர்' (neer) - water, 'காலை' (kaalai) - morning.",
            "Now, shall we walk and I'll show you where we use these words?"
        ],
        options: [
            { text: "Yes! Teach me while we explore!", nextNode: "start_exploration", trust: 15 },
            { text: "Let's practice these words around here", nextNode: "start_exploration", trust: 12 },
            { text: "Show me your boat - படகு!", nextNode: "start_exploration", trust: 18 }
        ]
    },
    
    start_exploration: {
        character: "Ravi",
        text: "Come then, my friend! *gestures toward the beach* Let me show you Marina Beach through a fisherman's eyes. The real Chennai starts here...",
        options: [
            { text: "I'm ready! Show me around!", action: "start_street_view", trust: 20 }
        ]
    },
    
    sunrise_spot: {
        character: "Ravi",
        manualText: [
            "Ah, the sunrise spot!",
            "Every morning at 5:30 AM, the sun rises from the Bay of Bengal like a golden coin from the water.",
            "Photographers, yogis, and old fishermen like me gather there. It's magical!"
        ],
        options: [
            { text: "Take me there!", nextNode: "start_exploration", trust: 10 },
            { text: "I'd love to see that magic", nextNode: "start_exploration", trust: 8 }
        ]
    },
    
    tour_preview: {
        character: "Ravi",
        manualText: [
            "First, the lighthouse - our guardian for ships.",
            "Then fishing boats with their bright colors.",
            "Maybe the memorial statues, and definitely the spot where waves are perfect for children to play. Ready?"
        ],
        options: [
            { text: "Perfect! Let's start the tour!", nextNode: "start_exploration", trust: 8 }
        ]
    },
    
    fish_types: {
        character: "Ravi",
        manualText: [
            "We catch many types! Pomfret, kingfish, prawns, crabs.",
            "The best catch comes at dawn when fish are closest to shore.",
            "Each season brings different fish - monsoon brings sardines, winter brings bigger fish."
        ],
        options: [
            { text: "Show me where you catch them!", nextNode: "start_exploration", trust: 10 },
            { text: "I'd love to see your fishing spot", nextNode: "start_exploration", trust: 8 }
        ]
    },
    
    weather_wisdom: {
        character: "Ravi",
        manualText: [
            "The sea tells us everything!",
            "When waves crash differently, storm is coming. When seabirds fly low, wind will change.",
            "My father taught me, his father taught him. This knowledge keeps fishermen safe."
        ],
        options: [
            { text: "That's amazing! Show me the sea", nextNode: "start_exploration", trust: 12 },
            { text: "I want to learn to read the waves", nextNode: "start_exploration", trust: 10 }
        ]
    },
    
    best_time: {
        character: "Ravi",
        text: "Dawn and evening are the best! Morning brings cool breeze and peaceful fishing boats. Evening brings families and food stalls. But any time is good to feel the sea's magic.",
        options: [
            { text: "Let's explore together!", nextNode: "start_exploration", trust: 8 }
        ]
    },
    
    other_beaches: {
        character: "Ravi",
        text: "There are many beaches in Chennai, but Marina is special. Besant Nagar has quieter spots, Elliot's Beach has rocky shores. But Marina... Marina has the soul of Chennai.",
        options: [
            { text: "Show me Marina's soul!", nextNode: "start_exploration", trust: 10 }
        ]
    },
    
    useful_words: {
        character: "Ravi",
        text: "Good question! For visitors: 'வணக்கம்' (vanakkam) - hello, 'நன்றி' (nandri) - thank you, 'எவ்வளவு?' (evvalavu) - how much? These will help you everywhere in Chennai!",
        options: [
            { text: "Let's use them while exploring!", nextNode: "start_exploration", trust: 12 }
        ]
    },
    
    tamil_in_action: {
        character: "Ravi",
        text: "Perfect! When I buy chai, I say 'ஒரு டீ' (oru tea). When greeting friends, 'எப்படி இருக்கே?' (eppadi irukke) - how are you? Tamil connects hearts here.",
        options: [
            { text: "I want to connect hearts too!", nextNode: "start_exploration", trust: 15 }
        ]
    },
    
    time_tour: {
        character: "Ravi",
        manualText: [
            "Imagine morning joggers breathing sea air, sunset couples sharing dreams.",
            "Children building sand castles. Each hour brings different energy.",
            "Marina never sleeps, she just changes her rhythm."
        ],
        options: [
            { text: "Let's feel that rhythm!", nextNode: "start_exploration", trust: 12 }
        ]
    }
};

// CORE FUNCTIONS
function customTransition() {
    return new Promise((resolve) => {
        const body = document.body;
        const loader = document.querySelector('.loader');
        const transitionText = document.querySelector('.transition-text');

        if (body) body.classList.add('transition-active');
        
        setTimeout(() => {
            if (loader) loader.classList.add('active');
            if (transitionText) transitionText.classList.add('active');
        }, 200);

        setTimeout(() => {
            if (body) body.classList.remove('transition-active');
            if (loader) loader.classList.remove('active');
            if (transitionText) transitionText.classList.remove('active');
            
            setTimeout(() => resolve(), 200);
        }, 2500);
    });
}

let sessionTimer;
function startSessionTimer() {
    let seconds = 0;
    sessionTimer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const sessionTimeElement = document.getElementById('session-time');
        if (sessionTimeElement) {
            sessionTimeElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        if (seconds % 900 === 0) {
            gameState.checkSessionTime();
        }
    }, 1000);
}

window.onload = () => {
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', beginGame);
    }
    
    setTimeout(() => {
        gameState.updateXPDisplay();
        gameState.updateStreakDisplay();
        gameState.updateDailyQuestsDisplay();
    }, 500);
    
    const toggleQuestsBtn = document.getElementById('toggle-quests');
    if (toggleQuestsBtn) {
        toggleQuestsBtn.addEventListener('click', () => {
            const questsList = document.getElementById('daily-quests-list');
            const toggleBtn = document.getElementById('toggle-quests');
            
            if (questsList && toggleBtn) {
                if (questsList.style.display === 'none') {
                    questsList.style.display = 'block';
                    toggleBtn.textContent = '−';
                } else {
                    questsList.style.display = 'none';
                    toggleBtn.textContent = '+';
                }
            }
        });
    }
    
    startSessionTimer();
};

async function beginGame() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    await customTransition();
    startAnnaConversation();
}

function startAnnaConversation() {
    const airportScene = document.getElementById('airport-road-scene');
    if (airportScene) {
        airportScene.style.display = 'none';
    }
    
    showAnnaConversationScene('introduction');
}

// UPDATED: Anna conversation with manual Next button system
function showAnnaConversationScene(nodeKey = 'introduction') {
    console.log('Starting Anna conversation:', nodeKey);
    const node = annaConversations[nodeKey];
    if (!node) {
        console.error('Anna conversation node not found:', nodeKey);
        return;
    }
    
    let annaScene = document.getElementById('anna-scene');
    if (!annaScene) {
        annaScene = document.createElement('div');
        annaScene.id = 'anna-scene';
        annaScene.className = 'character-scene';
        annaScene.innerHTML = `
            <div class="scene-background" style="background-image: url('autoanna.png'); background-size: cover; background-position: center;"></div>
            <div class="character-dialogue-container">
                <div class="character-info">
                    <h3 id="anna-character-name">Auto Driver Anna</h3>
                    <div class="character-avatar">🚗</div>
                </div>
                <div class="dialogue-content">
                    <p id="anna-dialogue-text" style="min-height: 80px; line-height: 1.6;">Loading...</p>
                    <div id="anna-dialogue-options" class="dialogue-options-grid"></div>
                </div>
            </div>
        `;
        document.body.appendChild(annaScene);
    }
    
    annaScene.style.display = 'block';
    
    const dialogueText = document.getElementById('anna-dialogue-text');
    const optionsContainer = document.getElementById('anna-dialogue-options');
    
    // Check if this node has manual text progression
    if (node.manualText) {
        showManualProgressiveText(dialogueText, optionsContainer, node.manualText, node.options);
    } else {
        // Regular single text display
        if (dialogueText) {
            dialogueText.innerHTML = node.text;
        }
        
        if (optionsContainer) {
            setupDialogueOptions(optionsContainer, node.options);
        }
    }
    
    // Add transition effect
    annaScene.style.opacity = '0';
    setTimeout(() => {
        annaScene.style.opacity = '1';
    }, 100);
}

// UPDATED: Ravi conversation with manual Next button system
function showRaviConversation(nodeKey = 'introduction') {
    console.log('Starting Ravi conversation:', nodeKey);
    const node = raviConversations[nodeKey];
    if (!node) {
        console.error('Conversation node not found:', nodeKey);
        return;
    }
    
    const mapElement = document.getElementById('map');
    const raviScene = document.getElementById('ravi-scene');
    
    if (mapElement) mapElement.style.display = 'none';
    if (raviScene) raviScene.style.display = 'block';
    
    const dialogueText = document.getElementById('ravi-dialogue-text');
    const optionsContainer = document.getElementById('ravi-dialogue-options');
    
    // Check if this node has manual text progression
    if (node.manualText) {
        showManualProgressiveText(dialogueText, optionsContainer, node.manualText, node.options);
    } else {
        // Regular single text display
        if (dialogueText) {
            dialogueText.innerHTML = node.text;
        }
        
        if (optionsContainer) {
            setupRaviDialogueOptions(optionsContainer, node.options);
        }
    }
    
    if (raviScene) {
        raviScene.style.opacity = '0';
        setTimeout(() => {
            raviScene.style.opacity = '1';
        }, 100);
    }
}

// Manual progressive text display with Next button
function showManualProgressiveText(textElement, optionsContainer, textArray, finalOptions) {
    let currentTextIndex = 0;
    
    function showCurrentText() {
        // Clear previous content
        textElement.innerHTML = '';
        optionsContainer.innerHTML = '';
        
        // Show current text
        textElement.innerHTML = textArray[currentTextIndex];
        
        // Show Next button or final options
        if (currentTextIndex < textArray.length - 1) {
            // Still have more text to show - show Next button
            const nextButton = document.createElement('button');
            nextButton.className = 'dialogue-option-btn next-btn';
            nextButton.textContent = 'Next';
            nextButton.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.3s ease;
            `;
            
            nextButton.onmouseover = () => {
                nextButton.style.background = '#45a049';
            };
            
            nextButton.onmouseout = () => {
                nextButton.style.background = '#4CAF50';
            };
            
            nextButton.onclick = () => {
                currentTextIndex++;
                showCurrentText();
            };
            
            optionsContainer.appendChild(nextButton);
        } else {
            // Last text - show actual dialogue options
            if (textElement.id === 'anna-dialogue-text') {
                setupDialogueOptions(optionsContainer, finalOptions);
            } else {
                setupRaviDialogueOptions(optionsContainer, finalOptions);
            }
        }
    }
    
    // Start with first text
    showCurrentText();
}

// Helper function for Anna's dialogue options
function setupDialogueOptions(optionsContainer, options) {
    optionsContainer.innerHTML = '';
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'dialogue-option-btn';
        button.textContent = option.text;
        
        button.onclick = () => {
            console.log('Anna button clicked:', option.text, 'Next:', option.nextNode, 'Action:', option.action);
            
            if (option.trust) {
                gameState.updateCharacterRelationship('anna', option.trust);
                gameState.addXP(option.trust, 'Building Friendship with Anna');
            }
            
            if (option.action === 'start_map_view') {
                console.log('Starting map view...');
                startMapView();
            } else if (option.nextNode) {
                showAnnaConversationScene(option.nextNode);
            }
        };
        
        optionsContainer.appendChild(button);
    });
}

// Helper function for Ravi's dialogue options
function setupRaviDialogueOptions(optionsContainer, options) {
    optionsContainer.innerHTML = '';
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'dialogue-option-btn';
        button.textContent = option.text;
        
        button.onclick = () => {
            console.log('Ravi button clicked:', option.text, 'Next:', option.nextNode, 'Action:', option.action);
            
            if (option.trust) {
                gameState.updateCharacterRelationship('ravi', option.trust);
                gameState.addXP(option.trust, 'Building Friendship');
            }
            
            if (option.action === 'start_street_view') {
                console.log('Starting street view exploration...');
                startMarinaBeachQuestDirectly();
            } else if (option.nextNode) {
                showRaviConversation(option.nextNode);
            }
        };
        
        optionsContainer.appendChild(button);
    });
}

function startMapView() {
    console.log('Starting map view after Anna conversation...');
    
    const annaScene = document.getElementById('anna-scene');
    if (annaScene) {
        annaScene.style.display = 'none';
    }
    
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
        const newMapContainer = document.createElement('div');
        newMapContainer.id = 'map-container';
        newMapContainer.style.opacity = '1';
        document.body.appendChild(newMapContainer);
        
        injectMainGameUI();
        window.runMainGameLogic = runMainGameLogic;
        const scriptTag = document.createElement('script');
        scriptTag.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=runMainGameLogic`;
        scriptTag.async = true;
        document.head.appendChild(scriptTag);
    } else {
        mapContainer.style.opacity = '1';
        injectMainGameUI();
        window.runMainGameLogic = runMainGameLogic;
        const scriptTag = document.createElement('script');
        scriptTag.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=runMainGameLogic`;
        scriptTag.async = true;
        document.head.appendChild(scriptTag);
    }
}

function injectMainGameUI() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <div id="map"></div>
        <div id="temple-toggle-button">📖</div>
        <div id="word-temple"><h2>Your Word Temple</h2><ul id="word-list"></ul></div>
        
        <div id="ravi-scene" class="character-scene" style="display: none;">
            <div class="scene-background" style="background-image: url('exp1.png'); background-size: cover; background-position: center;"></div>
            <div class="character-dialogue-container">
                <div class="character-info">
                    <h3 id="ravi-character-name">Ravi</h3>
                    <div class="character-avatar">🧔‍♂️</div>
                </div>
                <div class="dialogue-content">
                    <p id="ravi-dialogue-text">Loading...</p>
                    <div id="ravi-dialogue-options" class="dialogue-options-grid"></div>
                </div>
            </div>
        </div>
        
        <div id="chittu-container">
            <div style="display: flex; align-items: flex-end; gap: 10px;">
                <div id="chittu-avatar">🐦</div>
                <div id="chittu-speech-bubble"><p id="chittu-text">Vanakkam!</p></div>
            </div>
        </div>
        <div id="quest-box"><h2 id="quest-title"></h2><p id="quest-challenge"></p><div class="options-container" id="quest-options-main"></div></div>`;
}

function startMarinaBeachQuestDirectly() {
    console.log('Starting Marina Beach quest directly...');
    
    if (!globalMap) {
        console.error('Map not ready, waiting...');
        setTimeout(startMarinaBeachQuestDirectly, 1000);
        return;
    }
    
    if (!globalStartQuestFunction) {
        console.error('StartQuest function not ready, waiting...');
        setTimeout(startMarinaBeachQuestDirectly, 1000);
        return;
    }
    
    const raviScene = document.getElementById('ravi-scene');
    const mapElement = document.getElementById('map');
    
    if (raviScene) raviScene.style.display = 'none';
    if (mapElement) mapElement.style.display = 'block';
    
    const chittuText = document.getElementById('chittu-text');
    if (chittuText) {
        chittuText.textContent = "Following Ravi to explore Marina Beach...";
    }
    
    const marinaQuest = {
        id: 1,
        name: "Marina Beach",
        location: { lat: 13.0500, lng: 80.2824 },
        challenge: "Ravi asks: 'You see the endless sea for the first time! How do you say 'What is this?' in Tamil?'",
        options: ["இது என்ன? (Ithu enna?)", "எங்கே? (Engay?)", "நன்றி (Nandri)"],
        correctAnswer: "இது என்ன? (Ithu enna?)",
        cultureCard: {
            title: "Marina Beach",
            fact: "At 13km long, Marina Beach is the world's second-longest urban beach! Ravi's family has been fishing here for generations.",
            art: "🏖️"
        },
        baseXP: 25,
        speedBonusTime: 15
    };
    
    const fakeMarinaMarker = {
        setIcon: function(iconConfig) {
            console.log('Marina Beach marker updated:', iconConfig);
            if (window.marinaBechMarkerReference) {
                window.marinaBechMarkerReference.setIcon(iconConfig);
                window.marinaBechMarkerReference.setAnimation(null);
            }
        },
        setAnimation: function(animation) {
            console.log('Marina Beach marker animation:', animation);
        }
    };
    
    setTimeout(() => {
        console.log('Calling startQuest function...');
        if (globalStartQuestFunction) {
            globalStartQuestFunction(marinaQuest, fakeMarinaMarker);
        } else {
            console.error('StartQuest function still not available!');
        }
    }, 1000);
}

function runMainGameLogic() {
    const chittuText = document.getElementById('chittu-text'); 
    const questBox = document.getElementById('quest-box');
    const wordTemple = document.getElementById('word-temple');
    const templeToggleButton = document.getElementById('temple-toggle-button');

    const quests = [
        {
            id: 1,
            name: "Marina Beach",
            location: { lat: 13.0500, lng: 80.2824 },
            challenge: "You see the sea for the first time! How do you ask 'What is this?' in Tamil?",
            options: ["இது என்ன? (Ithu enna?)", "எங்கே? (Engay?)", "நன்றி (Nandri)"],
            correctAnswer: "இது என்ன? (Ithu enna?)",
            cultureCard: {
                title: "Marina Beach",
                fact: "At 13km long, Marina Beach is the world's second-longest urban beach!",
                art: "🏖️"
            },
            baseXP: 20,
            speedBonusTime: 15
        },
        {
            id: 2,
            name: "Kapaleeshwarar Temple",
            location: { lat: 13.0337, lng: 80.2698 },
            challenge: "You want to enter the temple. How do you politely ask 'May I enter?' in Tamil?",
            options: ["நான் நுழையலாமா? (Naan nuzhayalaamaa?)", "எங்கே? (Engay?)", "விலை என்ன? (Vilai enna?)"],
            correctAnswer: "நான் நுழையலாமா? (Naan nuzhayalaamaa?)",
            cultureCard: {
                title: "Kapaleeshwarar Temple",
                fact: "This 7th-century temple is dedicated to Lord Shiva and showcases classic Dravidian architecture.",
                art: "🕉️"
            },
            baseXP: 25,
            speedBonusTime: 20
        },
        {
            id: 3,
            name: "T. Nagar",
            location: { lat: 13.0418, lng: 80.2341 },
            challenge: "You see a shirt you like. How do you ask 'How much does this cost?' in Tamil?",
            options: ["விலை என்ன? (Vilai enna?)", "நன்றி! (Nandri!)", "சரி! (Sari!)"],
            correctAnswer: "விலை என்ன? (Vilai enna?)",
            cultureCard: {
                title: "T. Nagar Shopping District",
                fact: "T. Nagar is one of the largest commercial areas in the world by revenue per square foot!",
                art: "🛍️"
            },
            baseXP: 20,
            speedBonusTime: 10
        },
        {
            id: 4,
            name: "Santhome Basilica",
            location: { lat: 13.03349, lng: 80.2733 }, 
            challenge: "You admire the church's architecture. Which Tamil word means 'church'?",
            options: ["சேர்ச்சி (Searchi)", "கோவில் (Kovil)", "முகில் (Mugil)"],
            correctAnswer: "சேர்ச்சி (Searchi)",
            cultureCard: {
                title: "Santhome Basilica",
                fact: "Built over the tomb of St. Thomas the Apostle, this is one of only three churches built over apostles' tombs.",
                art: "⛪"
            },
            baseXP: 25,
            speedBonusTime: 18
        },
        {
            id: 5,
            name: "Valluvar Kottam",
            location: { lat: 13.0544, lng: 80.2418 },
            challenge: "You want to ask about the famous poet. How do you say 'Who wrote this?' in Tamil?",
            options: ["இதை யார் எழுதியது? (Idhai yaar ezhuthiyadhu?)", "எங்கே? (Engay?)", "நன்றி! (Nandri!)"],
            correctAnswer: "இதை யார் எழுதியது? (Idhai yaar ezhuthiyadhu?)",
            cultureCard: {
                title: "Thiruvalluvar",
                fact: "Thiruvalluvar wrote the Thirukkural, containing 1330 couplets on virtue, wealth, and love.",
                art: "📜"
            },
            baseXP: 30,
            speedBonusTime: 25
        },
        {
            id: 6,
            name: "St. Thomas Mount",
            location: { lat: 13.007806, lng: 80.192500 },
            challenge: "You are on top of the hill and want to say 'It's high!' in Tamil. How?",
            options: ["உயரமாக இருக்கிறது! (Uyaramaa irukiradhu!)", "கீழே போ! (Keezhe po!)", "நன்றி! (Nandri!)"],
            correctAnswer: "உயரமாக இருக்கிறது! (Uyaramaa irukiradhu!)",
            cultureCard: {
                title: "St. Thomas Mount",
                fact: "This 300-foot hillock is where St. Thomas is believed to have been martyred in 72 AD.",
                art: "⛰️"
            },
            baseXP: 22,
            speedBonusTime: 15
        },
        {
            id: 7,
            name: "Express Avenue",
            location: { lat: 13.058974, lng: 80.264135 },
            challenge: "You want to invite a friend to shop. How do you say 'Let's go shopping!' in Tamil?",
            options: ["வாங்க வாங்க! (Vaanga vaanga!)", "நம் செல்லலாம்! (Nam sellalaam!)", "வணிக மையம் (Vaniga Maiyam)"],
            correctAnswer: "நம் செல்லலாம்! (Nam sellalaam!)",
            cultureCard: {
                title: "Express Avenue Mall",
                fact: "One of the largest malls in Chennai, featuring over 300 brands and a 1.2 million sq ft area.",
                art: "🏬"
            },
            baseXP: 18,
            speedBonusTime: 12
        },
        {
            id: 8,
            name: "Guindy National Park",
            location: { lat: 13.0036, lng: 80.2293 },
            challenge: "You spot a deer. How do you say 'Look, a deer!' in Tamil?",
            options: ["பாரு, மான்! (Paaru, maan!)", "எங்கே? (Engay?)", "நன்றி! (Nandri!)"],
            correctAnswer: "பாரு, மான்! (Paaru, maan!)",
            cultureCard: {
                title: "Guindy National Park",
                fact: "India's 8th smallest national park, located entirely within a city, home to over 350 species of plants!",
                art: "🦌"
            },
            baseXP: 20,
            speedBonusTime: 14
        },
        {
            id: 9,
            name: "Anna University",
            location: { lat: 13.0111, lng: 80.2363 },
            challenge: "You want to ask a student 'Which department is this?' in Tamil. How?",
            options: ["இது எந்த துறை? (Idhu entha thurai?)", "நன்றி! (Nandri!)", "சரி! (Sari!)"],
            correctAnswer: "இது எந்த துறை? (Idhu entha thurai?)",
            cultureCard: {
                title: "Anna University",
                fact: "Named after C.N. Annadurai, this technical university is one of India's top engineering institutions.",
                art: "🎓"
            },
            baseXP: 25,
            speedBonusTime: 20
        },
        {
            id: 10,
            name: "Besant Nagar Beach",
            location: { lat: 12.9989, lng: 80.2718 },
            challenge: "You want to buy a coconut from a beach vendor. How do you ask 'How much for one?' in Tamil?",
            options: ["ஒன்று எவ்வளவு? (Ondru evvalavu?)", "நன்றி! (Nandri!)", "சரி! (Sari!)"],
            correctAnswer: "ஒன்று எவ்வளவு? (Ondru evvalavu?)",
            cultureCard: {
                title: "Besant Nagar Beach",
                fact: "Also known as Elliot's Beach, it's named after Edward Elliot, former governor of Madras.",
                art: "🥥"
            },
            baseXP: 20,
            speedBonusTime: 12
        }
    ];

    initMap();
    
    if (templeToggleButton && wordTemple) {
        templeToggleButton.addEventListener('click', () => { 
            wordTemple.classList.toggle('is-visible'); 
        });
    }
    
    window.addEventListener('click', (event) => { 
        if (wordTemple && wordTemple.classList.contains('is-visible') && 
            !wordTemple.contains(event.target) && 
            (!templeToggleButton || !templeToggleButton.contains(event.target))) { 
            wordTemple.classList.remove('is-visible'); 
        } 
    });
    
    function initMap() { 
        loadProgress(); 
        
        globalMap = new google.maps.Map(document.getElementById("map"), { 
            center: { lat: 13.06, lng: 80.25 }, 
            zoom: 13, 
            streetViewControl: false, 
            fullscreenControl: false, 
            mapTypeControl: false, 
            disableDefaultUI: true 
        }); 
        
        console.log('Map initialized:', globalMap);
        
        const speechBubble = document.getElementById('chittu-speech-bubble'); 
        if (speechBubble) {
            setTimeout(() => { 
                speechBubble.style.opacity = '1'; 
                speechBubble.style.transform = 'scale(1)'; 
            }, 1000); 
        }
        
        if (gameState.learnedWords.length > 0 && templeToggleButton) {
            templeToggleButton.style.display = 'flex'; 
        }
        
        if (chittuText) {
            chittuText.innerText = `Anna brought you to Chennai! Click any yellow marker to start exploring and learning Tamil.`;
        }
        
        quests.forEach(q => { 
            const isCompleted = gameState.completedQuests.includes(q.id); 
            
            const marker = new google.maps.Marker({ 
                position: q.location, 
                map: globalMap, 
                title: `Quest: ${q.name}`, 
                icon: { 
                    url: isCompleted ? 
                        "https://maps.google.com/mapfiles/ms/icons/green-dot.png" : 
                        "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png", 
                    scaledSize: new google.maps.Size(40, 40) 
                }
            }); 
            
            if (q.name === "Marina Beach") {
                window.marinaBechMarkerReference = marker;
            }
            
            marker.addListener('click', () => { 
                marker.setAnimation(null);
                console.log('Marker clicked:', q.name);
                
                if (q.name === "Marina Beach") {
                    console.log('Starting Ravi conversation...');
                    showRaviConversation('introduction');
                } else {
                    startQuest(q, marker);
                }
            }); 
        }); 
    }
                
    function startQuest(quest, marker) {    
        console.log('StartQuest called for:', quest.name);
        
        if (!globalMap) {
            console.error('Map not ready for startQuest!');
            return;
        }
        
        const startTime = Date.now();
        if (chittuText) {
            chittuText.innerText = quest.name === "Marina Beach" ? 
                "Here we are at Marina Beach with Ravi! He's asking you a question..." : 
                `Aha! Let's see where we are...`;
        }
            
        console.log('Starting Street View for location:', quest.location);
        showStreetView(quest.location);

        setTimeout(() => {
            console.log('Setting up quest UI for:', quest.name);
            
            const questTitle = document.getElementById('quest-title');
            const questChallenge = document.getElementById('quest-challenge');
            const optionsContainer = document.getElementById('quest-options-main');
            
            if (questTitle) {
                questTitle.innerText = quest.name === "Marina Beach" ? 
                    "Learning with Ravi" : "Guess this place!";
            }
            
            if (questChallenge) {
                questChallenge.innerText = quest.challenge;
            }
            
            if (optionsContainer) {
                optionsContainer.innerHTML = '';
                
                quest.options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.innerText = opt;
                    btn.onclick = (event) => checkAnswer(event.target, opt, quest, marker, startTime);
                    optionsContainer.appendChild(btn);
                });
            }
            
            if (questBox) {
                questBox.style.top = '20px';
            }
            
            console.log('Quest UI setup complete for:', quest.name);
        }, 2000);
    }

    globalStartQuestFunction = startQuest;
    console.log('StartQuest function reference stored globally');

    function checkAnswer(buttonElement, selected, quest, marker, startTime) { 
        const allButtons = buttonElement.parentElement.children; 
        for(let btn of allButtons) btn.disabled = true; 

        const optionsContainer = document.getElementById('quest-options-main');
        const responseTime = (Date.now() - startTime) / 1000;
        const isSpeedBonus = responseTime <= quest.speedBonusTime;

        if (selected === quest.correctAnswer) { 
            buttonElement.classList.add('correct'); 
            gameState.playSound('correct');
            gameState.correctAnswers++;
            
            setTimeout(() => { 
                let xpGained = quest.baseXP;
                let bonusText = quest.name === "Marina Beach" ? 
                    'Correct! Ravi is impressed!' : 'Correct Answer!';
                
                if (isSpeedBonus) {
                    xpGained += 10;
                    bonusText += ' Speed Bonus!';
                    gameState.updateDailyQuest('speed');
                }

                const currentMastery = gameState.masteryStars[quest.id] || 0;
                if (currentMastery === 0) {
                    xpGained += 5;
                    bonusText += quest.name === "Marina Beach" ? ' First Visit!' : ' First Clear!';
                    gameState.updateDailyQuest('perfect');
                }

                gameState.masteryStars[quest.id] = Math.min((gameState.masteryStars[quest.id] || 0) + 1, 3);

                if (!gameState.completedQuests.includes(quest.id)) {
                    gameState.completedQuests.push(quest.id);
                    gameState.updateDailyQuest('identify');
                }

                if (!gameState.learnedWords.includes(quest.correctAnswer)) {
                    gameState.learnedWords.push(quest.correctAnswer);
                    gameState.updateDailyQuest('words');
                }

                if (!gameState.cultureCards.find(c => c.title === quest.cultureCard.title)) {
                    gameState.cultureCards.push(quest.cultureCard);
                    gameState.updateDailyQuest('culture');
                }

                gameState.updateDailyQuest('explore');
                gameState.addXP(xpGained, bonusText);
                
                if (chittuText) {
                    chittuText.innerText = quest.name === "Marina Beach" ? 
                        `Perfect! Ravi smiles and says "You're learning fast, my friend!" I've added '${quest.correctAnswer}' to your Word Temple.` :
                        `Correct! I've added '${quest.correctAnswer}' to your Word Temple.`;
                }

                updateWordTemple(); 
                marker.setIcon({ 
                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png", 
                    scaledSize: new google.maps.Size(40, 40) 
                }); 
                marker.setAnimation(null); 

                if (optionsContainer) {
                    const masteryDisplay = document.createElement('div');
                    masteryDisplay.className = 'mastery-stars';
                    const currentStars = gameState.masteryStars[quest.id] || 0;
                    for (let i = 1; i <= 3; i++) {
                        const star = document.createElement('span');
                        star.className = `mastery-star ${i <= currentStars ? 'earned' : ''}`;
                        star.textContent = '⭐';
                        masteryDisplay.appendChild(star);
                    }

                    optionsContainer.innerHTML = '';
                    optionsContainer.appendChild(masteryDisplay);

                    const continueBtn = document.createElement('button');
                    continueBtn.innerText = "Continue Learning";
                    continueBtn.onclick = () => { 
                        if (questBox) questBox.style.top = '-350px'; 
                        
                        const mapContainer = document.getElementById('map-container');
                        if (mapContainer) {
                            mapContainer.classList.remove('map-zoom-out');
                        }
                        
                        if (globalMap && globalMap.getStreetView()) {
                            globalMap.getStreetView().setVisible(false);
                        }
                        
                        if (chittuText) {
                            chittuText.innerText = "Where to next? Click a quest marker on the map!";
                        }
                    };
                    optionsContainer.appendChild(continueBtn);
                }

                gameState.checkMysteryChest();

            }, 1000); 
        } else { 
            buttonElement.classList.add('incorrect'); 
            gameState.playSound('incorrect');
            
            setTimeout(() => { 
                if (chittuText) {
                    chittuText.innerText = quest.name === "Marina Beach" ? 
                        "Ravi gently corrects: 'Try again, my friend. Listen to the waves and think...'" :
                        "Not quite! Try again."; 
                }
                
                marker.setAnimation(google.maps.Animation.BOUNCE); 
                
                for(let btn of allButtons) { 
                    btn.disabled = false; 
                    btn.classList.remove('incorrect'); 
                } 
            }, 1200); 
        } 
    }

    function loadProgress() { 
        if (gameState.learnedWords.length > 0 && templeToggleButton) {
            templeToggleButton.style.display = 'flex';
        }
        updateWordTemple();
    }
    
    function updateWordTemple() {
        const wl = document.getElementById('word-list');
        const toggleButton = document.getElementById('temple-toggle-button');
        if (!wl || !toggleButton) return;
        
        wl.innerHTML = '';
        gameState.learnedWords.forEach(w => { 
            const li = document.createElement('li'); 
            li.innerText = w; 
            wl.appendChild(li); 
        });
        if (gameState.learnedWords.length > 0) {
            toggleButton.style.display = 'flex';
        }
    }
    // DEBUGGED Chennai Guru Chatbot Implementation
// ==========================================
// CHENNAI GURU CHATBOT - COMPLETE CODE
// ==========================================

class ChennaiGuruChatbot {
    constructor() {
        this.apiKey = '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';
        this.isOpen = false;
        this.isTyping = false;
        console.log('🧙‍♂️ Chennai Guru initialized');
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setupElements(), 500);
            });
        } else {
            setTimeout(() => this.setupElements(), 500);
        }
    }

    setupElements() {
        console.log('🔍 Setting up Chennai Guru elements...');
        
        const toggle = document.getElementById('chennai-guru-toggle');
        const chatContainer = document.getElementById('chennai-guru-chat');
        
        console.log('Toggle element found:', !!toggle);
        console.log('Chat container found:', !!chatContainer);
        
        if (!toggle || !chatContainer) {
            console.error('❌ Chennai Guru elements not found in DOM');
            return;
        }
        
        this.setupEventListeners();
        this.showWelcomeMessage();
        console.log('✅ Chennai Guru setup complete');
    }

    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        const toggle = document.getElementById('chennai-guru-toggle');
        const closeChat = document.getElementById('close-chat');
        const sendButton = document.getElementById('send-message');
        const chatInput = document.getElementById('chat-input');
        const quickButtons = document.querySelectorAll('.quick-btn');

        if (toggle) {
            toggle.addEventListener('click', (e) => {
                console.log('🖱️ Chennai Guru toggle clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.toggleChat();
            });
            console.log('✅ Toggle listener added');
        } else {
            console.error('❌ Toggle element not found');
        }

        if (closeChat) {
            closeChat.addEventListener('click', (e) => {
                console.log('❌ Close chat clicked');
                e.preventDefault();
                this.closeChat();
            });
        }

        if (sendButton) {
            sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        quickButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const message = e.target.getAttribute('data-message');
                console.log('Quick button clicked:', message);
                this.sendQuickMessage(message);
            });
        });

        console.log(`🎯 Event listeners setup complete. Quick buttons found: ${quickButtons.length}`);
    }

    toggleChat() {
        console.log('🔄 Toggling chat, current state:', this.isOpen);
        
        const chatContainer = document.getElementById('chennai-guru-chat');
        if (!chatContainer) {
            console.error('❌ Chat container not found during toggle');
            return;
        }

        this.isOpen = !this.isOpen;
        console.log('📱 Chat now:', this.isOpen ? 'OPEN' : 'CLOSED');
        
        if (this.isOpen) {
            chatContainer.style.display = 'flex';
            chatContainer.style.opacity = '0';
            chatContainer.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                chatContainer.style.transition = 'all 0.3s ease';
                chatContainer.style.opacity = '1';
                chatContainer.style.transform = 'translateY(0)';
            }, 10);
            
            const input = document.getElementById('chat-input');
            if (input) setTimeout(() => input.focus(), 400);
            
        } else {
            chatContainer.style.transition = 'all 0.3s ease';
            chatContainer.style.opacity = '0';
            chatContainer.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                chatContainer.style.display = 'none';
            }, 300);
        }
    }

    closeChat() {
        console.log('❌ Closing chat');
        const chatContainer = document.getElementById('chennai-guru-chat');
        if (chatContainer) {
            chatContainer.style.transition = 'all 0.3s ease';
            chatContainer.style.opacity = '0';
            chatContainer.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                chatContainer.style.display = 'none';
                this.isOpen = false;
            }, 300);
        }
    }

    showWelcomeMessage() {
        setTimeout(() => {
            console.log('👋 Showing welcome message');
            this.addMessage('bot', "Vanakkam! 🙏 I'm Chennai Guru, your cultural guide! Ask me anything about Chennai's places, food, culture, or traditions. How can I help you explore Namma Chennai today?");
        }, 1000);
    }

    async sendMessage() {
        console.log('📤 Sending message...');
        const input = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-message');
        
        if (!input || this.isTyping) {
            console.log('⏸️ Cannot send - input missing or already typing');
            return;
        }

        const message = input.value.trim();
        if (!message) {
            console.log('⏸️ Empty message, not sending');
            return;
        }

        console.log('💬 User message:', message);

        this.addMessage('user', message);
        input.value = '';
        
        if (sendButton) sendButton.disabled = true;
        this.showTypingIndicator();

        try {
            const response = await this.getGrokResponse(message);
            console.log('🤖 Bot response received');
            this.hideTypingIndicator();
            this.addMessage('bot', response);
        } catch (error) {
            console.error('🚫 Grok API Error:', error);
            this.hideTypingIndicator();
            this.addMessage('bot', "Sorry, I'm having trouble connecting right now. Let me use my local knowledge instead! 🙏");
            
            // Use fallback response
            setTimeout(() => {
                const fallbackResponse = this.getFallbackResponse(message);
                this.addMessage('bot', fallbackResponse);
            }, 1000);
        }

        if (sendButton) sendButton.disabled = false;
    }

    sendQuickMessage(message) {
        console.log('⚡ Quick message:', message);
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = message;
            this.sendMessage();
        }
    }

    async getGrokResponse(userMessage) {
        console.log('🧠 Getting Grok response for:', userMessage);
        
        const prompt = `You are Chennai Guru, a knowledgeable and friendly cultural guide for Chennai, India. You have deep expertise in:

- Chennai's famous places, temples, beaches, and attractions
- Tamil culture, traditions, and festivals  
- Chennai's food culture and famous dishes
- History and architecture of Chennai
- Local customs and etiquette
- Transportation and practical travel tips
- Tamil language basics for tourists

User asks: "${userMessage}"

Respond in a warm, enthusiastic way like a local Chennai guide. Include:
- Practical and cultural information
- Relevant Tamil phrases with pronunciation in brackets
- Specific recommendations when applicable
- Cultural context to help understanding

Keep response under 150 words, engaging and informative.`;

        try {
            console.log('📤 Sending request to Groq API...');
            
            const requestBody = {
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: 'llama-3.1-8b-instant',
                max_tokens: 300,
                temperature: 0.7,
                top_p: 1,
                stream: false
            };

            console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📡 API Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response Body:', errorText);
                
                let errorDetails = 'Unknown error';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetails = errorJson.error?.message || errorJson.message || errorText;
                } catch (e) {
                    errorDetails = errorText;
                }
                
                throw new Error(`API request failed: ${response.status} - ${errorDetails}`);
            }

            const data = await response.json();
            console.log('✅ API Response received:', data);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else {
                console.error('❌ Unexpected response structure:', data);
                throw new Error('Invalid response structure from API');
            }
            
        } catch (error) {
            console.error('🚫 Detailed API Error:', error);
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.log('🔄 Using fallback response due to network error');
                return this.getFallbackResponse(userMessage);
            }
            
            throw error;
        }
    }

    getFallbackResponse(userMessage) {
        console.log('🎭 Generating fallback response for:', userMessage);
        
        const message = userMessage.toLowerCase();
        
        if (message.includes('marina') || message.includes('beach')) {
            return "Marina Beach is Chennai's crown jewel! 🌊 At 13km, it's the world's second-longest urban beach. Best times: sunrise (6 AM) and sunset (6 PM). Try 'sundal' (சுண்டல்) - spiced chickpeas from beach vendors. The lighthouse offers great views! In Tamil: 'கடல் அழகு' (kadal alagu) means 'ocean beauty'. Perfect for morning walks and evening relaxation!";
        }
        
        if (message.includes('food') || message.includes('eat') || message.includes('restaurant') || message.includes('dish')) {
            return "Chennai food is incredible! 🍽️ Must-try: Idli-sambar (breakfast), Chettinad chicken (lunch), filter coffee (anytime). Visit Saravana Bhavan for authentic taste. Street food: kothu parotta, bajji, and vada pav. In Tamil: 'சாப்பாடு சுவையா இருக்கு' (saappadu suvaiya irukku) means 'food is delicious'. Don't miss Mylapore for traditional eats!";
        }
        
        if (message.includes('temple') || message.includes('kapaleeshwarar') || message.includes('worship') || message.includes('spiritual')) {
            return "Kapaleeshwarar Temple in Mylapore is magnificent! 🕉️ Over 1300 years old with stunning Dravidian architecture. Visit during morning (6-8 AM) or evening aarti (6-8 PM). Dress modestly - no shorts/sleeveless. The gopuram has 1000+ sculptures! In Tamil: 'கோவில்' (kovil) means temple. Free entry, but photography has restrictions inside.";
        }
        
        if (message.includes('transport') || message.includes('metro') || message.includes('bus') || message.includes('auto') || message.includes('travel')) {
            return "Chennai transport is well-connected! 🚇 Metro covers major areas (₹10-60). Buses are cheap (₹5-25) but crowded. Auto-rickshaws: negotiate fare or use Ola/Uber. For airport: take metro or taxi (₹300-500). In Tamil: 'எங்கே போறீங்க?' (enge poreenge) means 'where are you going?' Always keep small change ready!";
        }
        
        if (message.includes('festival') || message.includes('celebration') || message.includes('event') || message.includes('culture')) {
            return "Chennai festivals are vibrant! 🎊 Major ones: Pongal (January), Diwali (October/November), Navaratri (September/October). December Music Season brings classical concerts citywide. Kapaleeshwarar Temple festival (March/April) is spectacular. In Tamil: 'விழா' (vizha) means festival. Experience traditional music, dance, and delicious festive foods during these times!";
        }
        
        if (message.includes('shopping') || message.includes('market') || message.includes('buy') || message.includes('souvenir')) {
            return "Chennai shopping is fantastic! 🛍️ T.Nagar for traditional wear and jewelry. Express Avenue/Phoenix MarketCity for modern shopping. Pondy Bazaar for bargains. Must-buy: silk sarees, bronze items, sandalwood products. In Tamil: 'விலை என்ன?' (vilai enna) means 'what's the price?' Always negotiate in local markets!";
        }
        
        if (message.includes('weather') || message.includes('climate') || message.includes('temperature') || message.includes('season')) {
            return "Chennai weather is tropical! 🌡️ Best time: November-February (pleasant, 20-30°C). March-May is hot (35-40°C). Monsoon: June-September (heavy rains). Carry umbrella during monsoon, stay hydrated in summer. In Tamil: 'வெயில் அதிகம்' (veyil adhigam) means 'too hot', 'மழை வருது' (mazhai varudhu) means 'rain is coming'!";
        }
        
        if (message.includes('language') || message.includes('tamil') || message.includes('speak') || message.includes('phrase')) {
            return "Tamil basics for Chennai! 🗣️ Essential phrases: 'வணக்கம்' (vanakkam) - hello, 'நன்றி' (nandri) - thank you, 'மன்னிக்கவும்' (mannikkavum) - sorry, 'எங்கே?' (enge) - where?, 'எவ்வளவு?' (evvalavu) - how much? Most people understand English, but Tamil wins hearts! Practice with auto drivers and shopkeepers!";
        }
        
        return "Welcome to Chennai - Namma Chennai! 🏛️ I'm here to help you explore our beautiful city. Ask me about:\n\n🏖️ Marina Beach & beaches\n🕉️ Temples & spiritual sites\n🍽️ Food & restaurants\n🚇 Transportation tips\n🎊 Festivals & culture\n🛍️ Shopping areas\n🗣️ Tamil phrases\n\nWhat interests you most about Chennai? In Tamil we say 'என்ன வேணும்?' (enna veenum) - 'what do you want?'";
    }

    addMessage(sender, content) {
        console.log(`💬 Adding ${sender} message:`, content.substring(0, 50) + '...');
        
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            console.error('❌ Messages container not found');
            return;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'bot' ? '🧙‍♂️' : '👤';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        console.log('✅ Message added to chat');
    }

    showTypingIndicator() {
        console.log('⌨️ Showing typing indicator');
        this.isTyping = true;
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">🧙‍♂️</div>
            <div class="typing-indicator">
                <span>Chennai Guru is thinking...</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        console.log('🔇 Hiding typing indicator');
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// INITIALIZATION CODE
console.log('🚀 Initializing Chennai Guru Chatbot...');

function initializeChennaiGuru() {
    console.log('🎯 Attempting to initialize Chennai Guru');
    try {
        window.chennaiGuru = new ChennaiGuruChatbot();
        window.chennaiGuruInitialized = true;
    } catch (error) {
        console.error('❌ Chennai Guru initialization error:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeChennaiGuru, 1500);
    });
} else {
    setTimeout(initializeChennaiGuru, 1500);
}

window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.chennaiGuruInitialized) {
            console.log('🔄 Backup initialization triggered');
            initializeChennaiGuru();
        }
    }, 2000);
});

// ==========================================
// END OF CHENNAI GURU CHATBOT CODE
// ==========================================


}

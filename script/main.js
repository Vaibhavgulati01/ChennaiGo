import { apiKey } from './config.js';

console.log("JS loaded");
let map; 
let startDestinationForMap;

// NEW: Game State Management
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
        this.masteryStars = {}; // questId: stars (1-3)
        this.cosmetics = {
            pins: [],
            frames: [],
            stickers: []
        };
        this.init();
    }

    init() {
        this.loadProgress();
        this.generateDailyQuests();
        this.updateStreak();
        this.sessionStartTime = Date.now();
        
        // FIXED: Initialize daily quests display immediately
        setTimeout(() => {
            this.updateDailyQuestsDisplay();
        }, 100);
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
        
        // Show XP gain animation
        this.showXPGain(amount, reason);
    }

    levelUp() {
        this.level++;
        this.showLevelUpModal();
        this.playSound('levelup');
    }

    updateStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (this.lastPlayDate === today) {
            // Already played today
            return;
        } else if (this.lastPlayDate === yesterday) {
            // Streak continues
            this.streak++;
        } else if (this.lastPlayDate && this.streakFreezes > 0) {
            // Use streak freeze
            this.streakFreezes--;
            this.streak++;
        } else {
            // Streak broken
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
            console.log('Loaded existing daily quests:', this.dailyQuests);
            return;
        }
        
        // ENHANCED: Generate new daily quests with better variety
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
        
        // Select 3 random quests
        this.dailyQuests = questTemplates
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        console.log('Generated new daily quests:', this.dailyQuests);
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

    checkMysteryChest() {
        // Random chance for mystery chest (10% base, increases with streak)
        const chestChance = Math.min(0.1 + (this.streak * 0.02), 0.3);
        if (Math.random() < chestChance) {
            this.showMysteryChest();
        }
    }

    showMysteryChest() {
        const modal = document.getElementById('mystery-chest-modal');
        const chest = document.getElementById('mystery-chest');
        const message = document.getElementById('chest-message');
        const rewards = document.getElementById('chest-rewards');
        const closeBtn = document.getElementById('close-chest-btn');
        
        modal.style.display = 'block';
        chest.className = 'chest-closed';
        chest.textContent = '📦';
        message.textContent = 'Click to open your reward!';
        rewards.innerHTML = '';
        closeBtn.style.display = 'none';
        
        chest.onclick = () => {
            chest.className = 'chest-opening';
            setTimeout(() => {
                chest.className = 'chest-opened';
                chest.textContent = '✨';
                this.generateChestRewards();
                closeBtn.style.display = 'block';
            }, 500);
        };
        
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    generateChestRewards() {
        const rewards = document.getElementById('chest-rewards');
        const message = document.getElementById('chest-message');
        const possibleRewards = [
            { type: 'xp', amount: 25, text: '25 Bonus XP', icon: '⭐' },
            { type: 'freeze', amount: 1, text: 'Streak Freeze', icon: '❄️' },
            { type: 'cosmetic', item: 'pin', text: 'Chennai Pin', icon: '📍' },
            { type: 'cosmetic', item: 'sticker', text: 'Tamil Sticker', icon: '✨' }
        ];
        
        const reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        
        message.textContent = 'Congratulations!';
        
        const rewardElement = document.createElement('div');
        rewardElement.className = 'reward-item';
        rewardElement.innerHTML = `<span>${reward.icon}</span><span>${reward.text}</span>`;
        rewards.appendChild(rewardElement);
        
        // Apply reward
        switch (reward.type) {
            case 'xp':
                this.addXP(reward.amount, 'Mystery Chest');
                break;
            case 'freeze':
                this.streakFreezes += reward.amount;
                break;
            case 'cosmetic':
                this.cosmetics[reward.item + 's'].push(reward.text);
                break;
        }
        
        this.playSound('chest');
        this.saveProgress();
    }

    showLevelUpModal() {
        const modal = document.getElementById('level-up-modal');
        const levelDisplay = document.getElementById('new-level');
        const rewardText = document.getElementById('level-reward-text');
        const closeBtn = document.getElementById('close-level-btn');
        
        levelDisplay.textContent = `Level ${this.level}`;
        rewardText.textContent = this.getLevelRewardText(this.level);
        
        modal.style.display = 'block';
        this.createConfetti();
        
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    getLevelRewardText(level) {
        const rewards = [
            'Welcome to Chennai!',
            'Speed Bonus Unlocked!',
            'Culture Cards Available!',
            'Mastery Stars Unlocked!',
            'Advanced Hints Available!',
            'Expert Mode Unlocked!'
        ];
        return rewards[Math.min(level - 1, rewards.length - 1)] || 'New Adventures Await!';
    }

    createConfetti() {
        const container = document.createElement('div');
        container.className = 'celebration-confetti';
        document.body.appendChild(container);
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
        }
        
        setTimeout(() => {
            document.body.removeChild(container);
        }, 4000);
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
            document.body.removeChild(xpGain);
            document.head.removeChild(style);
        }, 2000);
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
            if (chittuContainer) {
                chittuContainer.prepend(xpDisplay);
            }
        } else {
            xpDisplay.querySelector('.level-number').textContent = this.level;
            xpDisplay.querySelector('.xp-text').textContent = `${progressXP}/${neededXP} XP`;
            xpDisplay.querySelector('.xp-progress').style.width = `${progressPercent}%`;
        }
    }

    updateStreakDisplay() {
        const streakCount = document.getElementById('streak-count');
        const streakText = document.querySelector('.streak-text');
        
        if (streakCount && streakText) {
            streakCount.textContent = this.streak;
            streakText.textContent = this.streak === 1 ? 'day streak' : 'day streak';
            
            if (this.streak >= 7) {
                document.getElementById('streak-display').style.background = 
                    'linear-gradient(135deg, #8b5cf6, #ec4899)';
            }
        }
    }

    updateDailyQuestsDisplay() {
        const questsList = document.getElementById('daily-quests-list');
        if (!questsList) {
            console.log('Daily quests list element not found');
            return;
        }
        
        console.log('Updating daily quests display with:', this.dailyQuests);
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

    checkSessionTime() {
        const sessionTime = Date.now() - this.sessionStartTime;
        const fifteenMinutes = 15 * 60 * 1000;
        
        if (sessionTime > fifteenMinutes) {
            this.showHealthySessionPrompt();
        }
    }

    showHealthySessionPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'session-warning';
        prompt.innerHTML = `
            <h3>🌟 Great Progress!</h3>
            <p>You've been learning for 15+ minutes.</p>
            <p>Take a break or end on this win?</p>
            <button onclick="this.parentElement.remove();" style="margin: 5px; padding: 8px 15px; border: none; border-radius: 20px; background: white; color: #d97706; font-weight: bold; cursor: pointer;">Continue</button>
            <button onclick="location.reload();" style="margin: 5px; padding: 8px 15px; border: none; border-radius: 20px; background: rgba(255,255,255,0.2); color: white; font-weight: bold; cursor: pointer;">Take Break</button>
        `;
        document.body.appendChild(prompt);
        
        setTimeout(() => {
            if (prompt.parentElement) {
                prompt.remove();
            }
        }, 10000);
    }

    playSound(type) {
        try {
            // Web Audio API implementation for sound effects
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
            if (reward.parentElement) {
                document.body.removeChild(reward);
                document.head.removeChild(style);
            }
        }, 3000);
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
            cosmetics: this.cosmetics
        };
        localStorage.setItem('chennaiGoProgress', JSON.stringify(saveData));
    }

    loadProgress() {
        const saved = localStorage.getItem('chennaiGoProgress');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(this, data);
            this.sessionStartTime = Date.now(); // Reset session timer
        }
    }
}

// Initialize game state
const gameState = new GameState();

// FIXED: Original dialogue script with proper feedback for all options
const script = { 
    start: { 
        character: "Auto Driver Anna", 
        text: "Hey! Over here! Welcome to Chennai, sir! Vanakkam! I saw you coming from airport. <i class='tamil-word'>Enge pōnum</i>? Where do you want to go?", 
        options: [ 
            { text: "I'd like to see a famous, ancient temple.", destination: "Kapaleeshwarar Temple" }, 
            { text: "Take me to the biggest shopping area!", destination: "T. Nagar" }, 
            { text: "I want to see the famous beach.", destination: "Marina Beach" } 
        ], 
        action: (choice) => showStreetDialogueNode('learning_moment', choice.destination) 
    }, 
    learning_moment: { 
        character: "Auto Driver Anna", 
        text: (dest) => `Ah, ${dest}! Excellent choice, sir! Before we go, let me teach you something. To ask 'What is the price?' in Tamil, we say <i class='tamil-word'>'Vilai enna?'</i>. Can you repeat it back to me?`, 
        options: [ 
            { text: "Where is it?" }, 
            { text: "What is the price?" },  // CORRECT answer
            { text: "Thank you" } 
        ], 
        action: (choice, dest) => { 
            // FIXED: Added proper feedback and effects for all options
            if (choice.text === "What is the price?") {
                gameState.addXP(15, 'Tamil Phrase');
                gameState.updateDailyQuest('phrases');
                gameState.updateDailyQuest('words');
                gameState.playSound('correct');
                showStreetDialogueNode('correct_answer', dest);
            } else {
                gameState.playSound('incorrect');
                showStreetDialogueNode('wrong_answer', dest);
            }
        } 
    }, 
    wrong_answer: { 
        character: "Auto Driver Anna", 
        text: "Haha, close but not quite! Remember, it's <i class='tamil-word'>'Vilai enna?'</i> which means 'What is the price?'. Don't worry, you'll learn. Hop in, let's go!", 
        options: [{text: "Okay, let's go!"}], 
        action: (c, d) => startGame(d) 
    }, 
    correct_answer: { 
        character: "Auto Driver Anna", 
        text: "Perfect! <i class='tamil-word'>Nalla sonninga!</i> You said 'What is the price?' correctly! You're a quick learner! Come, get in my auto. We're going to have fun exploring Chennai!", 
        options: [{text: "Let's explore Chennai!"}], 
        action: (c, d) => startGame(d) 
    } 
};

// Custom transition function (unchanged)
function customTransition() {
    return new Promise((resolve) => {
        const body = document.body;
        const loader = document.querySelector('.loader');
        const transitionText = document.querySelector('.transition-text');

        body.classList.add('transition-active');
        
        setTimeout(() => {
            loader.classList.add('active');
            transitionText.classList.add('active');
        }, 200);

        setTimeout(() => {
            body.classList.remove('transition-active');
            loader.classList.remove('active');
            transitionText.classList.remove('active');
            
            setTimeout(() => {
                resolve();
            }, 200);
        }, 2500);
    });
}

// Session timer
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
        
        // Check for healthy session prompts
        if (seconds % 900 === 0) { // Every 15 minutes
            gameState.checkSessionTime();
        }
    }, 1000);
}

window.onload = () => {
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', beginGame);
    
    // FIXED: Initialize UI with delay to ensure DOM is ready
    setTimeout(() => {
        gameState.updateXPDisplay();
        gameState.updateStreakDisplay();
        gameState.updateDailyQuestsDisplay();
    }, 500);
    
    // Daily quest panel toggle
    const toggleQuestsBtn = document.getElementById('toggle-quests');
    if (toggleQuestsBtn) {
        toggleQuestsBtn.addEventListener('click', () => {
            const questsList = document.getElementById('daily-quests-list');
            const toggleBtn = document.getElementById('toggle-quests');
            
            if (questsList.style.display === 'none') {
                questsList.style.display = 'block';
                toggleBtn.textContent = '−';
            } else {
                questsList.style.display = 'none';
                toggleBtn.textContent = '+';
            }
        });
    }
    
    startSessionTimer();
};

async function beginGame() {
    document.getElementById('start-screen').style.display = 'none';
    await customTransition();
    startDialogue();
}

function startDialogue() {
    document.getElementById('airport-road-scene').style.display = 'block';
    setTimeout(() => {
        showStreetDialogueNode('start');
    }, 1000);
}

function showStreetDialogueNode(nodeKey, context = null) {
    const node = script[nodeKey];
    const streetDialogueBox = document.getElementById('street-dialogue-box');
    const streetDialogueCharacter = document.getElementById('street-dialogue-character');
    const streetDialogueText = document.getElementById('street-dialogue-text');
    const streetDialogueOptions = document.getElementById('street-dialogue-options');
    
    streetDialogueCharacter.innerHTML = `<span class="driver-name">${node.character}</span>`;
    streetDialogueText.innerHTML = typeof node.text === 'function' ? node.text(context) : node.text;
    streetDialogueOptions.innerHTML = '';
    
    node.options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option.text;
        button.onclick = () => node.action(option, context);
        streetDialogueOptions.appendChild(button);
    });
    
    setTimeout(() => {
        streetDialogueBox.classList.add('show');
    }, 1000);
}

function startGame(destination) {
    startDestinationForMap = destination;
    
    const airportScene = document.getElementById('airport-road-scene');
    airportScene.style.opacity = '0';
    setTimeout(() => {
        airportScene.style.display = 'none';
    }, 500);

    const mapContainer = document.getElementById('map-container'); 
    mapContainer.style.opacity = '1'; 
    injectMainGameUI();
    window.runMainGameLogic = runMainGameLogic;
    const scriptTag = document.createElement('script'); 
    scriptTag.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=runMainGameLogic`; 
    scriptTag.async = true; 
    document.head.appendChild(scriptTag);
}

function injectMainGameUI() {
    document.getElementById('map-container').innerHTML = `
        <div id="map"></div>
        <div id="temple-toggle-button">📖</div>
        <div id="word-temple"><h2>Your Word Temple</h2><ul id="word-list"></ul></div>
        <div id="chittu-container">
            <div style="display: flex; align-items: flex-end; gap: 10px;">
                <div id="chittu-avatar">🐦</div>
                <div id="chittu-speech-bubble"><p id="chittu-text">Vanakkam!</p></div>
            </div>
        </div>
        <div id="quest-box"><h2 id="quest-title"></h2><p id="quest-challenge"></p><div class="options-container" id="quest-options-main"></div></div>`;
}

function runMainGameLogic() {
    const startDestination = startDestinationForMap; 
    const chittuText = document.getElementById('chittu-text'); 
    const questBox = document.getElementById('quest-box');
    const wordTemple = document.getElementById('word-temple');
    const templeToggleButton = document.getElementById('temple-toggle-button');

    // Enhanced quests with mastery and culture cards
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

    initMap(startDestination);
    templeToggleButton.addEventListener('click', () => { wordTemple.classList.toggle('is-visible'); });
    window.addEventListener('click', (event) => { 
        if (wordTemple.classList.contains('is-visible') && 
            !wordTemple.contains(event.target) && 
            !templeToggleButton.contains(event.target)) { 
            wordTemple.classList.remove('is-visible'); 
        } 
    });
    
    function initMap(startDest) { 
        loadProgress(); 
        map = new google.maps.Map(document.getElementById("map"), { 
            center: { lat: 13.06, lng: 80.25 }, 
            zoom: 13, 
            streetViewControl: false, 
            fullscreenControl: false, 
            mapTypeControl: false, 
            disableDefaultUI: true 
        }); 
        
        const speechBubble = document.getElementById('chittu-speech-bubble'); 
        setTimeout(() => { 
            speechBubble.style.opacity = '1'; 
            speechBubble.style.transform = 'scale(1)'; 
        }, 1000); 
        
        if (gameState.learnedWords.length > 0) templeToggleButton.style.display = 'flex'; 
        
        quests.forEach(q => { 
            const isCompleted = gameState.completedQuests.includes(q.id); 
            const masteryLevel = gameState.masteryStars[q.id] || 0;
            
            const marker = new google.maps.Marker({ 
                position: q.location, 
                map: map, 
                title: `Quest: ${q.name}`, 
                icon: { 
                    url: isCompleted ? 
                        "https://maps.google.com/mapfiles/ms/icons/green-dot.png" : 
                        "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png", 
                    scaledSize: new google.maps.Size(40, 40) 
                }, 
                animation: (isCompleted || q.name !== startDest) ? null : google.maps.Animation.BOUNCE 
            }); 
            
            if (q.name === startDest) chittuText.innerText = `Welcome to ${startDest}! Click the bouncing marker to begin.`; 
            if (!isCompleted || masteryLevel < 3) {
                marker.addListener('click', () => { 
                    marker.setAnimation(null); 
                    startQuest(q, marker); 
                }); 
            }
        }); 
    }
                
    function startQuest(quest, marker) {    
        const startTime = Date.now();
        chittuText.innerText = `Aha! Let's see where we are...`;
        showStreetView(quest.location);

        setTimeout(() => {
            document.getElementById('quest-title').innerText = "Guess this place!";
            document.getElementById('quest-challenge').innerText = quest.challenge;
            const optionsContainer = document.getElementById('quest-options-main');
            optionsContainer.innerHTML = '';
            
            quest.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.innerText = opt;
                btn.onclick = (event) => checkAnswer(event.target, opt, quest, marker, startTime);
                optionsContainer.appendChild(btn);
            });
            questBox.style.top = '20px';
        }, 2000);
    }

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
                // Calculate XP with bonuses
                let xpGained = quest.baseXP;
                let bonusText = 'Correct Answer!';
                
                if (isSpeedBonus) {
                    xpGained += 10;
                    bonusText += ' Speed Bonus!';
                    gameState.updateDailyQuest('speed');
                }

                // Check for perfect round (first try)
                const currentMastery = gameState.masteryStars[quest.id] || 0;
                if (currentMastery === 0) {
                    xpGained += 5;
                    bonusText += ' First Clear!';
                    gameState.updateDailyQuest('perfect');
                }

                // Update mastery stars
                gameState.masteryStars[quest.id] = Math.min((gameState.masteryStars[quest.id] || 0) + 1, 3);

                // Add to completed quests if not already there
                if (!gameState.completedQuests.includes(quest.id)) {
                    gameState.completedQuests.push(quest.id);
                    gameState.updateDailyQuest('identify');
                }

                // Add learned word
                if (!gameState.learnedWords.includes(quest.correctAnswer)) {
                    gameState.learnedWords.push(quest.correctAnswer);
                    gameState.updateDailyQuest('words');
                }

                // Add culture card
                if (!gameState.cultureCards.find(c => c.title === quest.cultureCard.title)) {
                    gameState.cultureCards.push(quest.cultureCard);
                    gameState.updateDailyQuest('culture');
                }

                // Check for area exploration
                gameState.updateDailyQuest('explore');

                gameState.addXP(xpGained, bonusText);
                chittuText.innerText = `Correct! I've added '${quest.correctAnswer}' to your Word Temple.`;

                updateWordTemple(); 
                marker.setIcon({ 
                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png", 
                    scaledSize: new google.maps.Size(40, 40) 
                }); 
                marker.setAnimation(null); 

                // Show mastery stars
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
                continueBtn.innerText = "Continue Exploring";
                continueBtn.onclick = () => { 
                    questBox.style.top = '-350px'; 
                    const mapContainer = document.getElementById('map-container');
                    mapContainer.classList.remove('map-zoom-out');
                    if (map.getStreetView()) {
                        map.getStreetView().setVisible(false);
                    }
                    chittuText.innerText = "Where to next? Click a quest marker on the map!";
                };
                optionsContainer.appendChild(continueBtn);

                // Check for mystery chest
                gameState.checkMysteryChest();

            }, 1000); 
        } else { 
            buttonElement.classList.add('incorrect'); 
            gameState.playSound('incorrect');
            
            setTimeout(() => { 
                chittuText.innerText = "Not quite! Try again."; 
                marker.setAnimation(google.maps.Animation.BOUNCE); 
                for(let btn of allButtons) { 
                    btn.disabled = false; 
                    btn.classList.remove('incorrect'); 
                } 
            }, 1200); 
        } 
    }

    function loadProgress() { 
        // This function is called from the global gameState, but we need local compatibility
        if (gameState.learnedWords.length > 0) {
            templeToggleButton.style.display = 'flex';
        }
        updateWordTemple();
    }
    
    function updateWordTemple() {
        const wl = document.getElementById('word-list');
        const toggleButton = document.getElementById('temple-toggle-button');
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
    
    function showStreetView(location) { 
        const mapContainer = document.getElementById('map-container'); 
        mapContainer.classList.add('map-zoom-out'); 
        setTimeout(() => { 
            const pano = new google.maps.StreetViewPanorama(document.getElementById("map"), { 
                position: location, 
                pov: { heading: 200, pitch: 10 }, 
                visible: true, 
                addressControl: false, 
                linksControl: true, 
                panControl: true, 
                fullscreenControl: false 
            }); 
            map.setStreetView(pano); 
            setTimeout(() => mapContainer.classList.remove('map-zoom-out'), 50); 
        }, 800); 
    }
}

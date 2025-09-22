// Enhanced main.js with AI Companion System Integration
import { apiKey } from './config.js';

console.log("Enhanced ChennaiGo with AI Companions loaded");

// Load AI Companion System
if (typeof window !== 'undefined') {
    const companionScript = document.createElement('script');
    companionScript.src = './script/ai_companion_system.js';
    companionScript.onload = () => {
        console.log('AI Companion System loaded successfully');
    };
    document.head.appendChild(companionScript);
}

let map; 
let startDestinationForMap;
let companionSystem; // Global companion system reference

// Enhanced Game State with Companion Integration
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
        // New companion-related properties
        this.companionRelationships = new Map();
        this.unlockedCompanionContent = new Map();
        this.companionInteractions = 0;
        this.culturalInsightsLearned = [];
        this.init();
    }

    init() {
        this.loadProgress();
        this.generateDailyQuests();
        this.updateStreak();
        this.sessionStartTime = Date.now();
        
        setTimeout(() => {
            this.updateDailyQuestsDisplay();
            this.initializeCompanionIntegration();
        }, 100);
    }

    initializeCompanionIntegration() {
        // Initialize companion system when available
        if (window.initializeCompanionSystem) {
            companionSystem = new window.AICompanionSystem();
            window.companionSystem = companionSystem;
            console.log('Companion system integrated with game state');
        } else {
            // Retry after a short delay
            setTimeout(() => this.initializeCompanionIntegration(), 500);
        }
    }

    getXPForLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    // Enhanced XP system with companion bonuses
    addXP(amount, reason = '') {
        let bonusXP = 0;
        
        // Companion relationship bonus
        if (companionSystem && companionSystem.currentCompanion) {
            const trustLevel = companionSystem.getTrustLevel(companionSystem.currentCompanion);
            bonusXP = Math.floor(trustLevel / 20); // 1-5 bonus XP based on trust level
            
            if (bonusXP > 0) {
                reason += ` (+${bonusXP} companion bonus)`;
            }
        }

        const totalXP = amount + bonusXP;
        this.xp += totalXP;
        this.totalAnswered++;
        
        const currentLevelXP = this.getXPForLevel(this.level);
        const nextLevelXP = this.getXPForLevel(this.level + 1);
        
        if (this.xp >= nextLevelXP) {
            this.levelUp();
        }
        
        this.updateXPDisplay();
        this.saveProgress();
        this.showXPGain(totalXP, reason);

        // Update companion relationship for learning progress
        if (companionSystem && companionSystem.currentCompanion) {
            companionSystem.updateTrust(companionSystem.currentCompanion, 'learning_tamil', {
                xpGained: totalXP,
                reason: reason
            });
        }
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

    // Enhanced daily quests with companion interactions
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
            { id: 'explore', text: 'Visit 2 different areas', target: 2, progress: 0, reward: 40, emoji: '🗺️' },
            // New companion-related quests
            { id: 'companion_trust', text: 'Build trust with a companion', target: 1, progress: 0, reward: 45, emoji: '🤝' },
            { id: 'companion_advice', text: 'Ask for advice from companions', target: 2, progress: 0, reward: 35, emoji: '💡' },
            { id: 'cultural_insight', text: 'Learn cultural insights', target: 3, progress: 0, reward: 50, emoji: '🌟' }
        ];
        
        this.dailyQuests = questTemplates
            .sort(() => Math.random() - 0.5)
            .slice(0, 4); // Increased to 4 quests
        
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

    // Enhanced save/load with companion data
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
            // Companion-related data
            companionInteractions: this.companionInteractions,
            culturalInsightsLearned: this.culturalInsightsLearned
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
}

// Initialize enhanced game state
const gameState = new GameState();

// Enhanced script with companion integration
const script = { 
    start: { 
        character: "Anna", 
        text: "வணக்கம் (Vanakkam)! Welcome to Chennai! I'm Anna, your guide through this beautiful city. I'll help you learn Tamil while we explore together!", 
        options: [ 
            { text: "I'd like to see a famous, ancient temple.", destination: "Kapaleeshwarar Temple" }, 
            { text: "Take me to the biggest shopping area!", destination: "T. Nagar" }, 
            { text: "I want to see the famous beach.", destination: "Marina Beach" } 
        ], 
        action: (choice) => {
            // Update companion relationship
            if (companionSystem) {
                companionSystem.updateTrust('anna', 'respectful_response', {
                    isFirstMeeting: true,
                    showsGenuineInterest: true
                });
            }
            showStreetDialogueNode('learning_moment', choice.destination);
        }
    }, 
    learning_moment: { 
        character: "Anna", 
        text: (dest) => `Ah, ${dest}! Excellent choice! Before we go, let me teach you something. To ask 'What is the price?' in Tamil, we say 'விலை என்ன? (Vilai enna?)'. Can you repeat it back to me?`, 
        options: [ 
            { text: "Where is it?" }, 
            { text: "What is the price?" },
            { text: "Thank you" } 
        ], 
        action: (choice, dest) => { 
            if (choice.text === "What is the price?") {
                gameState.addXP(15, 'Tamil Phrase');
                gameState.updateDailyQuest('phrases');
                gameState.updateDailyQuest('words');
                gameState.playSound('correct');
                
                // Update companion trust for learning
                if (companionSystem) {
                    companionSystem.updateTrust('anna', 'learning_tamil', {
                        correctAnswer: true,
                        culturalEngagement: true
                    });
                }
                
                showStreetDialogueNode('correct_answer', dest);
            } else {
                gameState.playSound('incorrect');
                
                // Slight trust penalty for not listening
                if (companionSystem) {
                    companionSystem.updateTrust('anna', 'ignoring_advice');
                }
                
                showStreetDialogueNode('wrong_answer', dest);
            }
        } 
    }, 
    wrong_answer: { 
        character: "Anna", 
        text: "Haha, close but not quite! Remember, it's 'விலை என்ன? (Vilai enna?)' which means 'What is the price?'. Don't worry, you'll learn. Hop in, let's go!", 
        options: [{text: "Okay, let's go!"}], 
        action: (c, d) => startGame(d) 
    }, 
    correct_answer: { 
        character: "Anna", 
        text: "Perfect! நல்லா சொன்னீங்க! (Nalla sonninga - You said it well!) You're a quick learner! Come, get in my auto. We're going to have fun exploring Chennai together!", 
        options: [{text: "Let's explore Chennai!"}], 
        action: (c, d) => startGame(d) 
    } 
};

// Enhanced dialogue system with companion integration
function showStreetDialogueNode(nodeKey, context = null) {
    const node = script[nodeKey];
    const streetDialogueBox = document.getElementById('street-dialogue-box');
    const streetDialogueCharacter = document.getElementById('street-dialogue-character');
    const streetDialogueText = document.getElementById('street-dialogue-text');
    const streetDialogueOptions = document.getElementById('street-dialogue-options');
    
    // Use companion name if available
    let characterName = node.character;
    if (companionSystem && companionSystem.currentCompanion) {
        const currentCompanion = companionSystem.companions.get(companionSystem.currentCompanion);
        if (currentCompanion) {
            characterName = `${currentCompanion.name} ${currentCompanion.avatar}`;
        }
    }
    
    streetDialogueCharacter.innerHTML = `<span class="driver-name">${characterName}</span>`;
    streetDialogueText.innerHTML = typeof node.text === 'function' ? node.text(context) : node.text;
    streetDialogueOptions.innerHTML = '';
    
    node.options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option.text;
        button.onclick = () => node.action(option, context);
        streetDialogueOptions.appendChild(button);
    });
    
    // Add companion interaction tracking
    if (companionSystem && companionSystem.currentCompanion) {
        companionSystem.userRelationships.get(companionSystem.currentCompanion).interactionCount++;
        gameState.companionInteractions++;
    }
    
    setTimeout(() => {
        streetDialogueBox.classList.add('show');
    }, 1000);
}

// Enhanced quest system with companion integration
function startGame(destination) {
    startDestinationForMap = destination;
    
    // Select appropriate companion based on destination
    if (companionSystem) {
        const companion = companionSystem.selectCompanionByDistrict(destination);
        console.log(`Selected companion: ${companion.name} for ${destination}`);
    }
    
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
        <div id="companion-info-panel" style="position: fixed; top: 20px; right: 20px; background: rgba(255,255,255,0.9); padding: 15px; border-radius: 10px; min-width: 200px; display: none;">
            <div id="current-companion-info"></div>
            <div id="companion-actions"></div>
        </div>
        <div id="chittu-container">
            <div style="display: flex; align-items: flex-end; gap: 10px;">
                <div id="chittu-avatar">🐦</div>
                <div id="chittu-speech-bubble"><p id="chittu-text">Vanakkam!</p></div>
            </div>
        </div>
        <div id="quest-box"><h2 id="quest-title"></h2><p id="quest-challenge"></p><div class="options-container" id="quest-options-main"></div></div>`;
}

// Enhanced main game logic with companion integration
function runMainGameLogic() {
    const startDestination = startDestinationForMap; 
    const chittuText = document.getElementById('chittu-text'); 
    const questBox = document.getElementById('quest-box');
    const wordTemple = document.getElementById('word-temple');
    const templeToggleButton = document.getElementById('temple-toggle-button');

    // Initialize companion system integration
    if (window.AICompanionSystem) {
        setTimeout(() => {
            if (!companionSystem) {
                companionSystem = new window.AICompanionSystem();
                companionSystem.integrateWithMainGame();
                window.companionSystem = companionSystem;
            }
            
            // Add companion info panel
            addCompanionInfoPanel();
        }, 1000);
    }

    // Enhanced quests with companion integration
    const quests = [
        {
            id: 1,
            name: "Marina Beach",
            location: { lat: 13.0500, lng: 80.2824 },
            challenge: "You see the sea for the first time! How do you ask 'What is this?' in Tamil?",
            options: ["இது என்ன? (Ithu enna?)", "எங்கே? (Engay?)", "நன்றி (Nandri)"],
            correctAnswer: "இது என்ன? (Ithu enna?)",
            companionId: 'ravi',
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
            companionId: 'meera',
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
            companionId: 'priya',
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
            name: "Express Avenue",
            location: { lat: 13.058974, lng: 80.264135 },
            challenge: "You want to invite a friend to shop. How do you say 'Let's go shopping!' in Tamil?",
            options: ["வாங்க வாங்க! (Vaanga vaanga!)", "நம் செல்லலாம்! (Nam sellalaam!)", "வணிக மையம் (Vaniga Maiyam)"],
            correctAnswer: "நம் செல்லலாம்! (Nam sellalaam!)",
            companionId: 'arjun',
            cultureCard: {
                title: "Express Avenue Mall",
                fact: "One of Chennai's largest malls, representing the modern face of the city.",
                art: "🏬"
            },
            baseXP: 18,
            speedBonusTime: 12
        }
    ];

    initMap(startDestination);
    templeToggleButton.addEventListener('click', () => { wordTemple.classList.toggle('is-visible'); });
    
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
            
            if (q.name === startDest) {
                let welcomeMessage = `Welcome to ${startDest}! Click the bouncing marker to begin.`;
                
                // Add companion-specific welcome
                if (companionSystem && q.companionId) {
                    const companion = companionSystem.companions.get(q.companionId);
                    if (companion) {
                        companionSystem.currentCompanion = q.companionId;
                        welcomeMessage = `Welcome to ${startDest}! ${companion.name} ${companion.avatar} is here to guide you. Click the marker to start!`;
                    }
                }
                
                chittuText.innerText = welcomeMessage;
            }
            
            if (!isCompleted || masteryLevel < 3) {
                marker.addListener('click', () => { 
                    marker.setAnimation(null);
                    
                    // Set current companion for this quest
                    if (companionSystem && q.companionId) {
                        companionSystem.currentCompanion = q.companionId;
                        updateCompanionInfoPanel(q.companionId);
                    }
                    
                    startQuest(q, marker); 
                }); 
            }
        }); 
    }

    function startQuest(quest, marker) {    
        const startTime = Date.now();
        
        // Get companion-specific intro
        let introText = `Aha! Let's see where we are...`;
        if (companionSystem && quest.companionId) {
            const companion = companionSystem.companions.get(quest.companionId);
            const relationship = companionSystem.userRelationships.get(quest.companionId);
            if (companion && relationship) {
                const stage = relationship.relationshipStage;
                introText = companion.dialoguePatterns[stage] || introText;
            }
        }
        
        chittuText.innerText = introText;
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
            
            // Update companion relationship for correct answer
            if (companionSystem && quest.companionId) {
                companionSystem.updateTrust(quest.companionId, 'respectful_response', {
                    correctAnswer: true,
                    culturalEngagement: true,
                    questCompleted: true
                });
                
                // Update cultural insights quest
                gameState.updateDailyQuest('cultural_insight');
                gameState.updateDailyQuest('companion_trust');
            }
            
            setTimeout(() => { 
                let xpGained = quest.baseXP;
                let bonusText = 'Correct Answer!';
                
                if (isSpeedBonus) {
                    xpGained += 10;
                    bonusText += ' Speed Bonus!';
                    gameState.updateDailyQuest('speed');
                }

                const currentMastery = gameState.masteryStars[quest.id] || 0;
                if (currentMastery === 0) {
                    xpGained += 5;
                    bonusText += ' First Clear!';
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

                // Companion-specific success message
                let successMessage = `Correct! I've added '${quest.correctAnswer}' to your Word Temple.`;
                if (companionSystem && quest.companionId) {
                    const companion = companionSystem.companions.get(quest.companionId);
                    if (companion) {
                        successMessage = `${companion.name}: "${companion.dialoguePatterns.friend}" Great job learning Tamil!`;
                    }
                }
                
                chittuText.innerText = successMessage;
                updateWordTemple(); 
                marker.setIcon({ 
                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png", 
                    scaledSize: new google.maps.Size(40, 40) 
                }); 
                marker.setAnimation(null); 

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

                gameState.checkMysteryChest();
            }, 1000); 
        } else { 
            buttonElement.classList.add('incorrect'); 
            gameState.playSound('incorrect');
            
            // Minor trust penalty for wrong answer
            if (companionSystem && quest.companionId) {
                companionSystem.updateTrust(quest.companionId, 'basic_interaction');
            }
            
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

    function addCompanionInfoPanel() {
        const panel = document.getElementById('companion-info-panel');
        if (!panel) return;

        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '👥';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 250px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 20px;
            cursor: pointer;
            z-index: 1001;
        `;
        toggleBtn.onclick = () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        };
        document.body.appendChild(toggleBtn);
    }

    function updateCompanionInfoPanel(companionId) {
        const panel = document.getElementById('companion-info-panel');
        const infoDiv = document.getElementById('current-companion-info');
        const actionsDiv = document.getElementById('companion-actions');
        
        if (!panel || !infoDiv || !actionsDiv || !companionSystem) return;

        const companion = companionSystem.companions.get(companionId);
        const relationship = companionSystem.userRelationships.get(companionId);
        
        if (!companion || !relationship) return;

        panel.style.display = 'block';
        
        infoDiv.innerHTML = `
            <h3>${companion.avatar} ${companion.name}</h3>
            <p><strong>${companion.title}</strong></p>
            <p><em>${companion.district}</em></p>
            <div class="relationship-status">
                <p>Relationship: <strong>${relationship.relationshipStage.replace('_', ' ')}</strong></p>
                <div class="trust-bar" style="width: 100%; height: 10px; background: #ecf0f1; border-radius: 5px; margin: 5px 0;">
                    <div style="width: ${relationship.trustLevel}%; height: 100%; background: linear-gradient(90deg, #e74c3c, #f39c12, #27ae60); border-radius: 5px;"></div>
                </div>
                <p style="font-size: 0.8em;">Trust Level: ${relationship.trustLevel}/100</p>
            </div>
        `;

        const actions = companionSystem.getSuggestedActions(companion, relationship);
        actionsDiv.innerHTML = `
            <h4>Available Actions:</h4>
            ${actions.slice(0, 3).map(action => 
                `<button class="companion-action-btn" style="display: block; width: 100%; margin: 2px 0; padding: 5px; border: none; background: #3498db; color: white; border-radius: 5px; cursor: pointer;">${action}</button>`
            ).join('')}
        `;
    }

    function loadProgress() { 
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

// Enhanced window load with companion integration
window.onload = () => {
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', beginGame);
    
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
    
    console.log('Enhanced ChennaiGo with AI Companions fully loaded!');
};

// Rest of the original functions remain the same...
async function beginGame() {
    document.getElementById('start-screen').style.display = 'none';
    await customTransition();
    startDialogue();
}

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

function startDialogue() {
    document.getElementById('airport-road-scene').style.display = 'block';
    setTimeout(() => {
        showStreetDialogueNode('start');
    }, 1000);
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
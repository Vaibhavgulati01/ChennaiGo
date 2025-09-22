// AI Companion System for ChennaiGo
// Dynamic relationship-based character interactions

class AICompanionSystem {
    constructor() {
        this.companions = new Map();
        this.userRelationships = new Map();
        this.currentCompanion = null;
        this.conversationHistory = new Map();
        this.culturalContext = new Map();
        this.initializeCompanions();
        this.loadUserProgress();
    }

    initializeCompanions() {
        // Anna - The Guide (Airport/Central)
        this.companions.set('anna', {
            id: 'anna',
            name: 'Anna',
            title: 'The Guide',
            district: 'Airport/Central',
            avatar: '🚗',
            personality: {
                traits: ['friendly', 'welcoming', 'practical'],
                voiceStyle: 'warm, encouraging, patient',
                expertise: ['transportation', 'basic Tamil', 'tourist help'],
                greetingStyle: 'traditional_welcoming'
            },
            relationshipArc: ['Mentor', 'Trusted friend', 'Cultural bridge'],
            dialoguePatterns: {
                stranger: "வணக்கம் (Vanakkam)! Welcome to Chennai! I'm Anna, your auto driver.",
                acquaintance: "Ready for another adventure around Chennai?",
                friend: "என் நண்பா (En nanba - My friend)! What shall we explore today?",
                close_friend: "You're becoming a true Chennai person! So proud of you!",
                family: "நீங்க இப்ப எங்க குடும்பத்தோட ஒரு பங்கு (You're now part of our family)!"
            },
            specialQuests: ['airport_pickup', 'city_tour', 'transport_help'],
            culturalInsights: ['chennai_traffic', 'auto_culture', 'tourist_spots']
        });

        // Priya - The Shopkeeper (T. Nagar)
        this.companions.set('priya', {
            id: 'priya',
            name: 'Priya',
            title: 'The Shopkeeper',
            district: 'T. Nagar',
            avatar: '🛍️',
            personality: {
                traits: ['business-savvy', 'fashion-conscious', 'energetic'],
                voiceStyle: 'quick-talking, enthusiastic, trend-aware',
                expertise: ['shopping', 'bargaining', 'modern Chennai lifestyle'],
                greetingStyle: 'energetic_sales'
            },
            relationshipArc: ['Stranger', 'Bargaining partner', 'Style advisor'],
            dialoguePatterns: {
                stranger: "அய்யா/அம்மா (Ayya/Amma)! Best prices in T. Nagar! What you need?",
                acquaintance: "You're back! Ready to find some great deals today?",
                friend: "My favorite customer! I saved something special for you!",
                close_friend: "You have such good taste! Let me teach you the art of bargaining!",
                family: "You're like family now! Take this with my blessing - no charge!"
            },
            specialQuests: ['bargaining_master', 'fashion_guide', 'shopping_spree'],
            culturalInsights: ['tnagar_shopping', 'bargaining_culture', 'fashion_trends']
        });

        // Ravi - The Fisherman (Marina Beach)
        this.companions.set('ravi', {
            id: 'ravi',
            name: 'Ravi',
            title: 'The Fisherman',
            district: 'Marina Beach',
            avatar: '🎣',
            personality: {
                traits: ['philosophical', 'storyteller', 'traditional'],
                voiceStyle: 'calm, wise, poetic',
                expertise: ['Chennai history', 'coastal culture', 'folk tales'],
                greetingStyle: 'contemplative_wisdom'
            },
            relationshipArc: ['Observer', 'Story companion', 'Cultural keeper'],
            dialoguePatterns: {
                stranger: "The sea has many stories... Would you like to hear one?",
                acquaintance: "Ah, you return to the sea. It calls to you, doesn't it?",
                friend: "Let me tell you about the time when Chennai was just Madras...",
                close_friend: "You understand the rhythm of the waves now. That's wisdom.",
                family: "The sea accepts you as its own. You carry Chennai in your heart."
            },
            specialQuests: ['marina_stories', 'fishing_wisdom', 'coastal_history'],
            culturalInsights: ['chennai_history', 'fishing_culture', 'coastal_traditions']
        });

        // Meera - The Temple Guide (Mylapore)
        this.companions.set('meera', {
            id: 'meera',
            name: 'Meera',
            title: 'The Temple Guide',
            district: 'Mylapore',
            avatar: '🛕',
            personality: {
                traits: ['spiritual', 'knowledgeable', 'respectful'],
                voiceStyle: 'gentle, reverent, educational',
                expertise: ['religious customs', 'classical music', 'traditions'],
                greetingStyle: 'spiritual_reverence'
            },
            relationshipArc: ['Teacher', 'Spiritual guide', 'Cultural mentor'],
            dialoguePatterns: {
                stranger: "நமஸ்கார் (Namaskar). Welcome to this sacred space. May I guide you?",
                acquaintance: "I see devotion growing in your heart. That's beautiful.",
                friend: "Come, let me show you the deeper meanings behind these rituals.",
                close_friend: "Your respect for our traditions touches my heart deeply.",
                family: "You have truly understood the soul of Tamil culture. I'm honored."
            },
            specialQuests: ['temple_rituals', 'classical_music', 'spiritual_journey'],
            culturalInsights: ['temple_culture', 'classical_arts', 'spiritual_traditions']
        });

        // Arjun - The Tech Guy (Express Avenue/IT Corridor)
        this.companions.set('arjun', {
            id: 'arjun',
            name: 'Arjun',
            title: 'The Tech Guy',
            district: 'Express Avenue/IT Corridor',
            avatar: '💻',
            personality: {
                traits: ['modern', 'bilingual', 'global perspective'],
                voiceStyle: 'code-switching English-Tamil, informal, relatable',
                expertise: ['contemporary Chennai', 'IT culture', 'fusion lifestyle'],
                greetingStyle: 'modern_casual'
            },
            relationshipArc: ['Peer', 'Tech buddy', 'Cultural bridge'],
            dialoguePatterns: {
                stranger: "Hey there! New to Chennai's tech scene? I can show you around!",
                acquaintance: "Back for more Chennai tech culture? Cool!",
                friend: "Dude, you're getting the hang of this Chennai vibe! Super!",
                close_friend: "நீ இப்ப full Chennai-க்கார ஆயிட்டே (You've become a complete Chennaite)!",
                family: "Bro, you're family now! Chennai runs in your blood!"
            },
            specialQuests: ['tech_tour', 'startup_culture', 'modern_tamil'],
            culturalInsights: ['it_culture', 'modern_chennai', 'youth_lifestyle']
        });

        // Initialize relationships for all companions
        this.companions.forEach((companion, id) => {
            this.userRelationships.set(id, {
                trustLevel: 0,
                relationshipStage: 'stranger',
                interactionCount: 0,
                lastInteraction: null,
                personalStories: [],
                sharedExperiences: [],
                culturalLessons: []
            });
        });
    }

    // Trust Level Management
    getTrustLevel(companionId) {
        return this.userRelationships.get(companionId)?.trustLevel || 0;
    }

    updateTrust(companionId, action, context = {}) {
        const relationship = this.userRelationships.get(companionId);
        if (!relationship) return;

        const trustChange = this.calculateTrustChange(action, context);
        relationship.trustLevel = Math.max(0, Math.min(100, relationship.trustLevel + trustChange));
        relationship.interactionCount++;
        relationship.lastInteraction = new Date();

        // Update relationship stage based on trust level
        const oldStage = relationship.relationshipStage;
        relationship.relationshipStage = this.getRelationshipStage(relationship.trustLevel);

        // Trigger relationship progression events
        if (oldStage !== relationship.relationshipStage) {
            this.onRelationshipProgression(companionId, oldStage, relationship.relationshipStage);
        }

        this.saveUserProgress();
        return relationship.trustLevel;
    }

    calculateTrustChange(action, context) {
        const trustModifiers = {
            respectful_response: 5,
            cultural_curiosity: 3,
            helping_others: 7,
            completing_quest: 2,
            learning_tamil: 3,
            showing_interest: 2,
            dismissive_behavior: -5,
            cultural_insensitivity: -8,
            impatience: -3,
            rude_response: -7,
            ignoring_advice: -2,
            task_focused: 0,
            factual_question: 1,
            basic_interaction: 0
        };

        let trustChange = trustModifiers[action] || 0;

        // Context-based modifiers
        if (context.isFirstMeeting) trustChange += 2;
        if (context.showsGenuineInterest) trustChange += 3;
        if (context.remembersPersonalInfo) trustChange += 4;
        if (context.culturallyInsensitive) trustChange -= 10;

        return trustChange;
    }

    getRelationshipStage(trustLevel) {
        if (trustLevel >= 81) return 'family';
        if (trustLevel >= 61) return 'close_friend';
        if (trustLevel >= 41) return 'friend';
        if (trustLevel >= 21) return 'acquaintance';
        return 'stranger';
    }

    // Companion Selection and Interaction
    selectCompanionByDistrict(district) {
        for (const [id, companion] of this.companions) {
            if (companion.district.includes(district)) {
                this.currentCompanion = id;
                return companion;
            }
        }
        return this.companions.get('anna'); // Default to Anna
    }

    async generateDialogue(companionId, context = {}) {
        const companion = this.companions.get(companionId);
        const relationship = this.userRelationships.get(companionId);
        
        if (!companion || !relationship) return null;

        const stage = relationship.relationshipStage;
        let baseDialogue = companion.dialoguePatterns[stage];

        // Enhance with AI if available (OpenAI integration)
        if (window.aiConversationManager) {
            const enhancedPrompt = this.buildCompanionPrompt(companion, relationship, context);
            try {
                const aiResponse = await window.aiConversationManager.generateResponse(
                    context.userInput || "Hello",
                    enhancedPrompt
                );
                return this.formatDialogueResponse(aiResponse, companion, relationship);
            } catch (error) {
                console.log('AI unavailable, using fallback dialogue');
            }
        }

        // Fallback to pattern-based dialogue
        return this.formatDialogueResponse(baseDialogue, companion, relationship);
    }

    buildCompanionPrompt(companion, relationship, context) {
        return {
            companionData: {
                name: companion.name,
                personality: companion.personality,
                expertise: companion.expertise,
                district: companion.district
            },
            relationshipData: {
                stage: relationship.relationshipStage,
                trustLevel: relationship.trustLevel,
                interactions: relationship.interactionCount,
                sharedExperiences: relationship.sharedExperiences
            },
            context: {
                location: context.location,
                currentQuest: context.currentQuest,
                userLevel: gameState?.level || 1,
                culturalContext: this.culturalContext.get(companion.id) || {}
            }
        };
    }

    formatDialogueResponse(response, companion, relationship) {
        return {
            companionId: companion.id,
            companionName: companion.name,
            companionTitle: companion.title,
            avatar: companion.avatar,
            response: response,
            relationshipStage: relationship.relationshipStage,
            trustLevel: relationship.trustLevel,
            suggestedActions: this.getSuggestedActions(companion, relationship),
            culturalInsights: this.getCulturalInsights(companion, relationship)
        };
    }

    getSuggestedActions(companion, relationship) {
        const actions = [];
        
        if (relationship.relationshipStage === 'stranger') {
            actions.push('Ask about their background', 'Show cultural interest');
        } else if (relationship.relationshipStage === 'acquaintance') {
            actions.push('Ask for advice', 'Share your experience');
        } else if (relationship.relationshipStage === 'friend') {
            actions.push('Ask personal questions', 'Request cultural lessons');
        } else if (relationship.relationshipStage === 'close_friend') {
            actions.push('Discuss deeper topics', 'Ask for life advice');
        } else if (relationship.relationshipStage === 'family') {
            actions.push('Share personal stories', 'Seek emotional support');
        }

        // Add companion-specific actions
        actions.push(...companion.specialQuests.map(quest => `Start ${quest} quest`));
        
        return actions;
    }

    getCulturalInsights(companion, relationship) {
        const insights = [];
        const availableInsights = companion.culturalInsights;
        const stageMultiplier = this.getStageMultiplier(relationship.relationshipStage);
        
        const numInsights = Math.min(availableInsights.length, stageMultiplier);
        for (let i = 0; i < numInsights; i++) {
            insights.push(availableInsights[i]);
        }
        
        return insights;
    }

    getStageMultiplier(stage) {
        const multipliers = {
            stranger: 1,
            acquaintance: 2,
            friend: 3,
            close_friend: 4,
            family: 5
        };
        return multipliers[stage] || 1;
    }

    // Relationship Progression Events
    onRelationshipProgression(companionId, oldStage, newStage) {
        const companion = this.companions.get(companionId);
        
        // Trigger special events and unlock content
        this.showRelationshipProgressNotification(companion, newStage);
        this.unlockCompanionContent(companionId, newStage);
        
        // Update game state
        if (gameState) {
            gameState.addXP(25, `${companion.name} relationship upgraded!`);
            gameState.updateDailyQuest('explore');
        }

        // Save milestone
        const relationship = this.userRelationships.get(companionId);
        relationship.sharedExperiences.push({
            type: 'relationship_milestone',
            stage: newStage,
            timestamp: new Date(),
            companion: companion.name
        });
    }

    showRelationshipProgressNotification(companion, newStage) {
        const notification = document.createElement('div');
        notification.className = 'relationship-progress-notification';
        notification.innerHTML = `
            <div class="relationship-upgrade">
                <div class="companion-avatar">${companion.avatar}</div>
                <div class="upgrade-text">
                    <h3>Relationship Upgraded!</h3>
                    <p><strong>${companion.name}</strong> now sees you as a <em>${newStage.replace('_', ' ')}</em></p>
                    <p class="upgrade-benefit">New conversations and insights unlocked!</p>
                </div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInScale 0.5s ease-out;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutScale 0.5s ease-in forwards';
            setTimeout(() => {
                if (notification.parentElement) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }

    unlockCompanionContent(companionId, stage) {
        const companion = this.companions.get(companionId);
        
        // Unlock stage-specific content
        switch (stage) {
            case 'acquaintance':
                // Unlock basic cultural insights
                this.culturalContext.set(companionId, {
                    ...this.culturalContext.get(companionId),
                    basicInsights: true
                });
                break;
                
            case 'friend':
                // Unlock personal stories and deeper conversations
                this.culturalContext.set(companionId, {
                    ...this.culturalContext.get(companionId),
                    personalStories: true,
                    casualTamil: true
                });
                break;
                
            case 'close_friend':
                // Unlock life advice and cultural mentorship
                this.culturalContext.set(companionId, {
                    ...this.culturalContext.get(companionId),
                    lifeAdvice: true,
                    culturalMentorship: true
                });
                break;
                
            case 'family':
                // Unlock deepest cultural insights and emotional support
                this.culturalContext.set(companionId, {
                    ...this.culturalContext.get(companionId),
                    deepCulturalSecrets: true,
                    emotionalSupport: true,
                    familyTreatment: true
                });
                break;
        }
    }

    // Companion Management
    getAllCompanions() {
        return Array.from(this.companions.values());
    }

    getCompanionStats(companionId) {
        const companion = this.companions.get(companionId);
        const relationship = this.userRelationships.get(companionId);
        
        return {
            ...companion,
            relationship: relationship,
            unlockedContent: this.culturalContext.get(companionId) || {}
        };
    }

    // Save/Load System
    saveUserProgress() {
        const progressData = {
            relationships: Object.fromEntries(this.userRelationships),
            culturalContext: Object.fromEntries(this.culturalContext),
            lastSaved: new Date()
        };
        
        localStorage.setItem('chennaiGo_companions', JSON.stringify(progressData));
    }

    loadUserProgress() {
        const saved = localStorage.getItem('chennaiGo_companions');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.userRelationships = new Map(Object.entries(data.relationships));
                this.culturalContext = new Map(Object.entries(data.culturalContext || {}));
            } catch (error) {
                console.error('Error loading companion progress:', error);
            }
        }
    }

    // Integration with main game
    integrateWithMainGame() {
        // Add companion selection UI
        this.addCompanionSelectionUI();
        
        // Hook into location changes
        if (window.map) {
            window.map.addListener('center_changed', () => {
                this.onLocationChange();
            });
        }
        
        // Hook into quest system
        if (gameState) {
            const originalAddXP = gameState.addXP.bind(gameState);
            gameState.addXP = (amount, reason) => {
                originalAddXP(amount, reason);
                if (this.currentCompanion) {
                    this.updateTrust(this.currentCompanion, 'completing_quest');
                }
            };
        }
    }

    addCompanionSelectionUI() {
        const companionPanel = document.createElement('div');
        companionPanel.id = 'companion-panel';
        companionPanel.innerHTML = `
            <div class="companion-header">
                <h3>🤝 Your Chennai Companions</h3>
            </div>
            <div class="companion-list" id="companion-list">
                ${this.generateCompanionListHTML()}
            </div>
        `;
        
        companionPanel.style.cssText = `
            position: fixed;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.95);
            padding: 15px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            max-width: 250px;
            z-index: 1000;
        `;
        
        document.body.appendChild(companionPanel);
    }

    generateCompanionListHTML() {
        return Array.from(this.companions.values()).map(companion => {
            const relationship = this.userRelationships.get(companion.id);
            const trustLevel = relationship.trustLevel;
            const stage = relationship.relationshipStage;
            
            return `
                <div class="companion-card" data-companion="${companion.id}">
                    <div class="companion-info">
                        <span class="companion-avatar">${companion.avatar}</span>
                        <div class="companion-details">
                            <strong>${companion.name}</strong>
                            <div class="companion-title">${companion.title}</div>
                            <div class="companion-district">${companion.district}</div>
                        </div>
                    </div>
                    <div class="relationship-indicator">
                        <div class="trust-bar">
                            <div class="trust-fill" style="width: ${trustLevel}%"></div>
                        </div>
                        <div class="relationship-stage">${stage.replace('_', ' ')}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    onLocationChange() {
        // Auto-select companion based on current location
        const center = window.map.getCenter();
        const lat = center.lat();
        const lng = center.lng();
        
        // Determine district based on coordinates (simplified)
        const district = this.getDistrictFromCoordinates(lat, lng);
        if (district) {
            const newCompanion = this.selectCompanionByDistrict(district);
            if (newCompanion && this.currentCompanion !== newCompanion.id) {
                this.currentCompanion = newCompanion.id;
                this.showCompanionTransition(newCompanion);
            }
        }
    }

    getDistrictFromCoordinates(lat, lng) {
        // Simplified district detection based on Chennai coordinates
        if (lat > 13.05 && lng < 80.25) return 'T. Nagar';
        if (lat < 13.05 && lng > 80.27) return 'Marina Beach';
        if (lat > 13.03 && lng < 80.27) return 'Mylapore';
        if (lat > 13.06) return 'Express Avenue/IT Corridor';
        return 'Airport/Central';
    }

    showCompanionTransition(newCompanion) {
        const chittuText = document.getElementById('chittu-text');
        if (chittuText) {
            chittuText.innerHTML = `You've entered ${newCompanion.district}! ${newCompanion.name} ${newCompanion.avatar} is here to help you.`;
        }
    }
}

// Initialize the AI Companion System
let companionSystem;

// Integration function
function initializeCompanionSystem() {
    companionSystem = new AICompanionSystem();
    companionSystem.integrateWithMainGame();
    
    console.log('AI Companion System initialized!');
    console.log('Available companions:', companionSystem.getAllCompanions().map(c => c.name));
    
    // Add CSS for companion system
    addCompanionSystemStyles();
}

function addCompanionSystemStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .companion-card {
            display: flex;
            flex-direction: column;
            padding: 10px;
            margin: 5px 0;
            border-radius: 10px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .companion-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .companion-info {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .companion-avatar {
            font-size: 24px;
            margin-right: 10px;
        }
        
        .companion-details strong {
            color: #2c3e50;
            display: block;
        }
        
        .companion-title {
            font-size: 0.8em;
            color: #7f8c8d;
        }
        
        .companion-district {
            font-size: 0.7em;
            color: #95a5a6;
        }
        
        .trust-bar {
            height: 4px;
            background: #ecf0f1;
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 4px;
        }
        
        .trust-fill {
            height: 100%;
            background: linear-gradient(90deg, #e74c3c 0%, #f39c12 50%, #27ae60 100%);
            transition: width 0.3s ease;
        }
        
        .relationship-stage {
            font-size: 0.7em;
            color: #34495e;
            text-transform: capitalize;
            font-weight: bold;
        }
        
        .relationship-progress-notification {
            backdrop-filter: blur(10px);
        }
        
        .relationship-upgrade {
            display: flex;
            align-items: center;
        }
        
        .relationship-upgrade .companion-avatar {
            font-size: 48px;
            margin-right: 15px;
        }
        
        .upgrade-text h3 {
            margin: 0 0 5px 0;
            font-size: 1.2em;
        }
        
        .upgrade-text p {
            margin: 0 0 5px 0;
            font-size: 0.9em;
        }
        
        .upgrade-benefit {
            font-style: italic;
            opacity: 0.9;
        }
        
        @keyframes slideInScale {
            from {
                transform: translateX(100%) scale(0.8);
                opacity: 0;
            }
            to {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
        }
        
        @keyframes slideOutScale {
            from {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
            to {
                transform: translateX(100%) scale(0.8);
                opacity: 0;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Export for use in main game
if (typeof window !== 'undefined') {
    window.AICompanionSystem = AICompanionSystem;
    window.initializeCompanionSystem = initializeCompanionSystem;
}
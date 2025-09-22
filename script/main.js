import { apiKey } from './config.js';
console.log("API Key:", apiKey);``

console.log("JS loaded");  // this will print in browser console

let map; let startDestinationForMap;

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
            { text: "What is the price?" }, 
            { text: "Thank you" } 
        ], 
        action: (choice, dest) => { 
            (choice.text === "What is the price?") ? showStreetDialogueNode('correct_answer', dest) : showStreetDialogueNode('wrong_answer', dest); 
        } 
    }, 
    wrong_answer: { 
        character: "Auto Driver Anna", 
        text: "Haha, close but not quite! Remember, it's <i class='tamil-word'>'Vilai enna?'</i> Don't worry, you'll learn. Hop in, let's go!", 
        options: [{text: "Okay, let's go!"}], 
        action: (c, d) => startGame(d) 
    }, 
    correct_answer: { 
        character: "Auto Driver Anna", 
        text: "Perfect! <i class='tamil-word'>Nalla sonninga!</i> You're a quick learner! Come, get in my auto. We're going to have fun exploring Chennai!", 
        options: [{text: "Let's explore Chennai!"}], 
        action: (c, d) => startGame(d) 
    } 
};

window.onload = () => {
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', beginGame);
};

function beginGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('intro-container').style.display = 'flex';
    setTimeout(startDialogue, 8000);
}

function startDialogue() {
    document.getElementById('intro-container').style.display = 'none';
    
    // Show airport road scene
    document.getElementById('airport-road-scene').style.display = 'block';
    
    setTimeout(() => {
        showStreetDialogueNode('start');
    }, 2000); // Allow scene to load with traffic animation
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
    
    // Animate dialogue box appearance
    setTimeout(() => {
        streetDialogueBox.classList.add('show');
    }, 1000);
}

function startGame(destination) {
    startDestinationForMap = destination;
    
    // Hide airport road scene with fade out
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
        <div id="chittu-container"><div id="chittu-avatar">🐦</div><div id="chittu-speech-bubble"><p id="chittu-text">Vanakkam!</p></div></div>
        <div id="quest-box"><h2 id="quest-title"></h2><p id="quest-challenge"></p><div class="options-container" id="quest-options-main"></div></div>`;
}

function runMainGameLogic() {
    const startDestination = startDestinationForMap; 
    const chittuText = document.getElementById('chittu-text'); 
    const questBox = document.getElementById('quest-box');
    const wordTemple = document.getElementById('word-temple');
    const templeToggleButton = document.getElementById('temple-toggle-button');
    let playerProgress = { completedQuests: [], learnedWords: [] };

    const quests = [
        {
            id: 1,
            name: "Marina Beach",
            location: { lat: 13.0500, lng: 80.2824 },
            challenge: "You see the sea for the first time! How do you ask 'What is this?' in Tamil?",
            options: ["இது என்ன? (Ithu enna?)", "எங்கே? (Engay?)", "நன்றி (Nandri)"],
            correctAnswer: "இது என்ன? (Ithu enna?)"
        },
        {
            id: 2,
            name: "Kapaleeshwarar Temple",
            location: { lat: 13.0337, lng: 80.2698 },
            challenge: "You want to enter the temple. How do you politely ask 'May I enter?' in Tamil?",
            options: ["நான் நுழையலாமா? (Naan nuzhayalaamaa?)", "எங்கே? (Engay?)", "விலை என்ன? (Vilai enna?)"],
            correctAnswer: "நான் நுழையலாமா? (Naan nuzhayalaamaa?)"
        },
        {
            id: 3,
            name: "T. Nagar",
            location: { lat: 13.0418, lng: 80.2341 },
            challenge: "You see a shirt you like. How do you ask 'How much does this cost?' in Tamil?",
            options: ["விலை என்ன? (Vilai enna?)", "நன்றி! (Nandri!)", "சரி! (Sari!)"],
            correctAnswer: "விலை என்ன? (Vilai enna?)"
        },
        {
            id: 4,
            name: "Santhome Basilica",
            location: { lat: 13.03349, lng: 80.2733 }, 
            challenge: "You admire the church's architecture. Which Tamil word means 'church'?",
            options: ["சேர்ச்சி (Searchi)", "கோவில் (Kovil)", "முகில் (Mugil)"],
            correctAnswer: "சேர்ச்சி (Searchi)"
        },
        {
            id: 5,
            name: "Valluvar Kottam",
            location: { lat: 13.0544, lng: 80.2418 },
            challenge: "You want to ask about the famous poet. How do you say 'Who wrote this?' in Tamil?",
            options: ["இதை யார் எழுதியது? (Idhai yaar ezhuthiyadhu?)", "எங்கே? (Engay?)", "நன்றி! (Nandri!)"],
            correctAnswer: "இதை யார் எழுதியது? (Idhai yaar ezhuthiyadhu?)"
        },
        {
            id: 6,
            name: "St. Thomas Mount",
            location: { lat: 13.007806, lng: 80.192500 },
            challenge: "You are on top of the hill and want to say 'It's high!' in Tamil. How?",
            options: ["உயரமாக இருக்கிறது! (Uyaramaa irukiradhu!)", "கீழே போ! (Keezhe po!)", "நன்றி! (Nandri!)"],
            correctAnswer: "உயரமாக இருக்கிறது! (Uyaramaa irukiradhu!)"
        },
        {
            id: 7,
            name: "Express Avenue",
            location: { lat: 13.058974, lng: 80.264135 },
            challenge: "You want to invite a friend to shop. How do you say 'Let's go shopping!' in Tamil?",
            options: ["வாங்க வாங்க! (Vaanga vaanga!)", "நம் செல்லலாம்! (Nam sellalaam!)", "வணிக மையம் (Vaniga Maiyam)"],
            correctAnswer: "நம் செல்லலாம்! (Nam sellalaam!)"
        },
        {
            id: 8,
            name: "Guindy National Park",
            location: { lat: 13.0036, lng: 80.2293 },
            challenge: "You spot a deer. How do you say 'Look, a deer!' in Tamil?",
            options: ["பாரு, மான்! (Paaru, maan!)", "எங்கே? (Engay?)", "நன்றி! (Nandri!)"],
            correctAnswer: "பாரு, மான்! (Paaru, maan!)"
        },
        {
            id: 9,
            name: "Anna University",
            location: { lat: 13.0111, lng: 80.2363 },
            challenge: "You want to ask a student 'Which department is this?' in Tamil. How?",
            options: ["இது எந்த துறை? (Idhu entha thurai?)", "நன்றி! (Nandri!)", "சரி! (Sari!)"],
            correctAnswer: "இது எந்த துறை? (Idhu entha thurai?)"
        },
        {
            id: 10,
            name: "Besant Nagar Beach",
            location: { lat: 12.9989, lng: 80.2718 },
            challenge: "You want to buy a coconut from a beach vendor. How do you ask 'How much for one?' in Tamil?",
            options: ["ஒன்று எவ்வளவு? (Ondru evvalavu?)", "நன்றி! (Nandri!)", "சரி! (Sari!)"],
            correctAnswer: "ஒன்று எவ்வளவு? (Ondru evvalavu?)"
        }
    ];

    initMap(startDestination);
    templeToggleButton.addEventListener('click', () => { wordTemple.classList.toggle('is-visible'); });
    window.addEventListener('click', (event) => { if (wordTemple.classList.contains('is-visible') && !wordTemple.contains(event.target) && !templeToggleButton.contains(event.target)) { wordTemple.classList.remove('is-visible'); } });
    
    function initMap(startDest) { 
        loadProgress(); 
        map = new google.maps.Map(document.getElementById("map"), { center: { lat: 13.06, lng: 80.25 }, zoom: 13, streetViewControl: false, fullscreenControl: false, mapTypeControl: false, disableDefaultUI: true }); 
        const speechBubble = document.getElementById('chittu-speech-bubble'); 
        setTimeout(() => { speechBubble.style.opacity = '1'; speechBubble.style.transform = 'scale(1)'; }, 1000); 
        if (playerProgress.learnedWords.length > 0) templeToggleButton.style.display = 'flex'; 
        quests.forEach(q => { 
            const isCompleted = playerProgress.completedQuests.includes(q.id); 
            const marker = new google.maps.Marker({ position: q.location, map: map, title: `Quest: ${q.name}`, icon: { url: isCompleted ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png" : "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png", scaledSize: new google.maps.Size(40, 40) }, animation: (isCompleted || q.name !== startDest) ? null : google.maps.Animation.BOUNCE }); 
            if (q.name === startDest) chittuText.innerText = `Welcome to ${startDest}! Click the bouncing marker to begin.`; 
            if (!isCompleted) marker.addListener('click', () => { marker.setAnimation(null); startQuest(q, marker); }); 
        }); 
    }
                
    function startQuest(quest, marker) {    
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
                btn.onclick = (event) => checkAnswer(event.target, opt, quest, marker);
                optionsContainer.appendChild(btn);
            });
            questBox.style.top = '20px';
        }, 2000);
    }

    function checkAnswer(buttonElement, selected, quest, marker) { 
        const allButtons = buttonElement.parentElement.children; 
        for(let btn of allButtons) btn.disabled = true; 

        const optionsContainer = document.getElementById('quest-options-main');

        if (selected === quest.correctAnswer) { 
            buttonElement.classList.add('correct'); 
            setTimeout(() => { 
                chittuText.innerText = `Correct! I've added '${quest.correctAnswer}' to your Word Temple.`;

                playerProgress.completedQuests.push(quest.id); 
                playerProgress.learnedWords.push(quest.correctAnswer); 
                saveProgress(); 
                updateWordTemple(); 
                marker.setIcon({ url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png", scaledSize: new google.maps.Size(40, 40) }); 
                marker.setAnimation(null); 
                google.maps.event.clearInstanceListeners(marker); 

                optionsContainer.innerHTML = '';
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

            }, 1000); 
        } else { 
            buttonElement.classList.add('incorrect'); 
            setTimeout(() => { 
                chittuText.innerText = "Not quite! Try again."; 
                marker.setAnimation(google.maps.Animation.BOUNCE); 
                for(let btn of allButtons) { btn.disabled = false; btn.classList.remove('incorrect'); } 
            }, 1200); 
        } 
    }

    function saveProgress() { localStorage.setItem('chennaiGoProgress', JSON.stringify(playerProgress)); }
    function loadProgress() { const d = localStorage.getItem('chennaiGoProgress'); if (d) { playerProgress = JSON.parse(d); updateWordTemple(); } }
    function updateWordTemple() {
        const wl = document.getElementById('word-list');
        const toggleButton = document.getElementById('temple-toggle-button');
        wl.innerHTML = '';
        playerProgress.learnedWords.forEach(w => { const li = document.createElement('li'); li.innerText = w; wl.appendChild(li); });
        if (playerProgress.learnedWords.length > 0) {
            toggleButton.style.display = 'flex';
        }
    }
    function showStreetView(location) { 
        const mapContainer = document.getElementById('map-container'); 
        mapContainer.classList.add('map-zoom-out'); 
        setTimeout(() => { 
            const pano = new google.maps.StreetViewPanorama(document.getElementById("map"), { position: location, pov: { heading: 200, pitch: 10 }, visible: true, addressControl: false, linksControl: true, panControl: true, fullscreenControl: false }); 
            map.setStreetView(pano); 
            setTimeout(() => mapContainer.classList.remove('map-zoom-out'), 50); 
        }, 800); 
    }
}
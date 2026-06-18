
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('word-form');
    const input = document.getElementById('word-input');
    const micButton = document.getElementById('mic-button');
    const randomButton = document.getElementById('random-button');
    const responseText = document.getElementById('response-text');
    const infoText = document.getElementById('info-text');
    const visualContainer = document.getElementById('visual-container');

    let speechUnlocked = false;

    // --- Safari iOS Speech Unlocker ---
    function unlockSpeech() {
        if (speechUnlocked) return;
        const silentUtterance = new SpeechSynthesisUtterance('');
        speechSynthesis.speak(silentUtterance);
        speechUnlocked = true;
    }

    // --- Silly Word Animation ---
    function animateWord(word) {
        if (!word) return;
        const floatingEl = document.createElement('div');
        floatingEl.className = 'floating-word';
        floatingEl.textContent = word;
        visualContainer.appendChild(floatingEl);
        
        // Remove element after animation ends
        setTimeout(() => floatingEl.remove(), 2000);
    }

    // --- Speech Synthesis ---
    function speak(text, callback) {
        unlockSpeech();
        const utterance = new SpeechSynthesisUtterance(text);
        if (callback) {
            utterance.onend = callback;
        }
        speechSynthesis.speak(utterance);
    }

    // --- API Communication ---
    async function sendWord(word) {
        unlockSpeech(); // Unlock as early as possible on user gesture
        animateWord(word);
        infoText.textContent = 'Thinking...';
        try {
            const response = await fetch('/api/sillyword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: word })
            });
            const data = await response.json();
            responseText.textContent = data.response;
            speak(data.response);
        } catch (error) {
            console.error('Error:', error);
            responseText.textContent = 'Oops! Something went wrong.';
        } finally {
            infoText.textContent = 'Give me another word!';
        }
    }

    async function fetchRandomWord() {
        unlockSpeech();
        infoText.textContent = 'Feeling silly...';
        try {
            const response = await fetch('/api/sillyword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ random: true })
            });
            const data = await response.json();
            
            // 1. Speak the silly word first
            animateWord(data.word);
            responseText.textContent = data.word;
            
            speak(data.word, () => {
                // 2. Wait 1 second AFTER it's finished, then speak the funny phrase
                setTimeout(() => {
                    speak(data.phrase);
                    responseText.textContent = `${data.word}. ${data.phrase}`;
                }, 1000);
            });
            
        } catch (error) {
            console.error('Error:', error);
            responseText.textContent = 'Oh no! I lost my marbles.';
        } finally {
            infoText.textContent = 'Tap again for more!';
        }
    }

    // --- Event Listeners ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const word = input.value.trim();
        if (word) {
            sendWord(word);
            input.value = '';
        }
    });

    randomButton.addEventListener('click', () => {
        fetchRandomWord();
    });

    // --- Web Speech API (for voice input) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        micButton.addEventListener('click', () => {
            recognition.start();
        });

        recognition.onstart = () => {
            micButton.classList.add('is-listening');
            infoText.textContent = 'Listening...';
        };

        recognition.onend = () => {
            micButton.classList.remove('is-listening');
            infoText.textContent = 'Press the mic and speak, or type a word!';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            input.value = transcript;
            sendWord(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            infoText.textContent = "Sorry, I couldn't understand that.";
        };

    } else {
        micButton.style.display = 'none';
        infoText.textContent = 'Your browser does not support voice input. Please type a word!';
    }
});

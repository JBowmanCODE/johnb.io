document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('textInput');
    const wordCountElement = document.getElementById('wordCount');
    const estimatedTimeElement = document.getElementById('estimatedTime');
    const timeRemainingElement = document.getElementById('timeRemaining');
    const subtitleDisplay = document.getElementById('subtitleDisplay');
    const voiceSelection = document.getElementById('voiceSelection');
    const speedControl = document.getElementById('speedControl');
    const startSpeechButton = document.getElementById('startSpeech');
    const pauseSpeechButton = document.getElementById('pauseSpeech');
    const stopSpeechButton = document.getElementById('stopSpeech');
    let speed = parseFloat(speedControl.value);
    let voices = [];
    let isPaused = false;
    let totalEstimatedTime = 0;
    let startTime = 0;
    let remainingTimeInterval;
    let sentences = [];
    let currentSentenceIndex = 0;
    let currentUtterance = null;
    let pauseStartTime = 0;
    let isSpeaking = false;
    let highlightSpeedFactor = 0.80; // Adjusted highlight speed factor

    function loadVoices() {
        voices = speechSynthesis.getVoices();
        if (voices.length !== 0) {
            voiceSelection.innerHTML = voices
                .map((voice, index) => `<option value="${index}" ${voice.name === 'Google UK English Female' ? 'selected' : ''}>${voice.name}</option>`)
                .join('');
            startSpeechButton.disabled = false;
        } else {
            setTimeout(loadVoices, 100);
        }
    }

    // Initialize voices
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    textInput.addEventListener('input', function() {
        const text = textInput.value.trim();
        const words = text.split(/\s+/).filter(word => word.length > 0);
        wordCountElement.textContent = `Words: ${words.length}`;
        calculateEstimatedTime(words.length);
    });

    function calculateEstimatedTime(wordCount) {
        const averageWordsPerMinute = 195; // Adjusted average WPM
        const timeInMinutes = wordCount / (averageWordsPerMinute * speed);
        const timeInSeconds = timeInMinutes * 60;
        totalEstimatedTime = timeInSeconds;
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.round(timeInSeconds % 60);
        estimatedTimeElement.textContent = `Estimated time: ${minutes > 0 ? minutes + ' minute(s) ' : ''}${seconds} second(s)`;
    }

    startSpeechButton.addEventListener('click', function() {
        const text = textInput.value.trim();
        if (!text) return;

        if (isSpeaking) {
            speechSynthesis.cancel();
            resetDisplay();
            return;
        }

        sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
        sentences = sentences.map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);

        if (sentences.length === 0) return;

        subtitleDisplay.style.display = 'block';
        isPaused = false;
        isSpeaking = true;
        pauseSpeechButton.textContent = 'Pause';

        startTime = Date.now();
        currentSentenceIndex = 0;

        speakNextSentence();
        remainingTimeInterval = setInterval(updateTimeRemaining, 500);
        updateTimeRemaining();
    });

    function speakNextSentence() {
        if (currentSentenceIndex >= sentences.length) {
            resetDisplay();
            return;
        }

        const sentence = sentences[currentSentenceIndex];
        currentUtterance = new SpeechSynthesisUtterance(sentence);
        currentUtterance.rate = speed;
        currentUtterance.voice = voices.find(voice => voice.name === 'Google UK English Female') || voices[parseInt(voiceSelection.value)];

        currentUtterance.onstart = function() {
            displaySentence(sentence); // Display only the current sentence
            startWordHighlighting(sentence);
        };

        currentUtterance.onend = function() {
            if (!isPaused) {
                currentSentenceIndex++;
                speakNextSentence();
            }
        };

        currentUtterance.onerror = function() {
            console.error('SpeechSynthesisUtterance.onerror');
        };

        speechSynthesis.speak(currentUtterance);
    }

    function displaySentence(sentence) {
        subtitleDisplay.innerHTML = sentence;
    }

    let wordHighlightInterval;
    let wordIndex = 0;
    function startWordHighlighting(sentence) {
        clearInterval(wordHighlightInterval);
        const words = sentence.split(/\s+/);
        wordIndex = 0;

        // Estimate total duration of the sentence
        const averageWordsPerMinute = 170; // Adjusted WPM
        const estimatedSentenceTime = (words.length / (averageWordsPerMinute * speed)) * 60 * 1000; // in milliseconds

        // Calculate duration per word with highlight speed factor
        const wordDuration = (estimatedSentenceTime / words.length) * highlightSpeedFactor;

        function highlightNextWord() {
            if (wordIndex >= words.length) {
                clearInterval(wordHighlightInterval);
                return;
            }
            updateSubtitle(words, wordIndex);
            wordIndex++;
        }

        highlightNextWord(); // Highlight the first word immediately
        wordHighlightInterval = setInterval(highlightNextWord, wordDuration);
    }

    pauseSpeechButton.addEventListener('click', function() {
        if (isSpeaking && !isPaused) {
            speechSynthesis.pause();
            isPaused = true;
            pauseSpeechButton.textContent = 'Resume';
            clearInterval(remainingTimeInterval);
            clearInterval(wordHighlightInterval);
            pauseStartTime = Date.now();
        } else if (isSpeaking && isPaused) {
            speechSynthesis.resume();
            isPaused = false;
            pauseSpeechButton.textContent = 'Pause';
            startTime += Date.now() - pauseStartTime;
            remainingTimeInterval = setInterval(updateTimeRemaining, 500);
            // Resume word highlighting
            const currentSentence = sentences[currentSentenceIndex];
            startWordHighlightingFrom(wordIndex);
        }
    });

    function startWordHighlightingFrom(index) {
        const sentence = sentences[currentSentenceIndex];
        const words = sentence.split(/\s+/);
        const remainingWords = words.slice(index);
        wordIndex = index;

        // Estimate remaining duration of the sentence
        const averageWordsPerMinute = 170; // Adjusted WPM
        const estimatedSentenceTime = (remainingWords.length / (averageWordsPerMinute * speed)) * 60 * 1000; // in milliseconds

        // Calculate duration per word with highlight speed factor
        const wordDuration = (estimatedSentenceTime / remainingWords.length) * highlightSpeedFactor;

        function highlightNextWord() {
            if (wordIndex >= words.length) {
                clearInterval(wordHighlightInterval);
                return;
            }
            updateSubtitle(words, wordIndex);
            wordIndex++;
        }

        highlightNextWord(); // Highlight the first word immediately
        wordHighlightInterval = setInterval(highlightNextWord, wordDuration);
    }

    function updateSubtitle(words, currentIndex) {
        const before = words.slice(0, currentIndex).join(' ');
        const currentWord = words[currentIndex];
        const after = words.slice(currentIndex + 1).join(' ');
        subtitleDisplay.innerHTML = `${before} <span class="highlight">${currentWord}</span> ${after}`;
    }

    stopSpeechButton.addEventListener('click', function() {
        if (isSpeaking) {
            speechSynthesis.cancel();
            resetDisplay();
        }
    });

    speedControl.addEventListener('change', function(event) {
        speed = parseFloat(event.target.value);
        const text = textInput.value.trim();
        const words = text.split(/\s+/).filter(word => word.length > 0);
        calculateEstimatedTime(words.length);
    });

    function resetDisplay() {
        subtitleDisplay.style.display = 'none';
        subtitleDisplay.innerHTML = '';
        isPaused = false;
        isSpeaking = false;
        pauseSpeechButton.textContent = 'Pause';
        clearInterval(remainingTimeInterval);
        clearInterval(wordHighlightInterval);
        timeRemainingElement.textContent = '';
    }

    function updateTimeRemaining() {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const remainingTime = Math.max(0, totalEstimatedTime - elapsedTime);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = Math.round(remainingTime % 60);
        timeRemainingElement.textContent = `Time remaining: ${minutes > 0 ? minutes + ' minute(s) ' : ''}${seconds} second(s)`;
    }
});

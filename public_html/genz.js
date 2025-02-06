document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('input-text');
    const translateBtn = document.getElementById('translate-btn');
    const outputText = document.getElementById('output-text');

    translateBtn.addEventListener('click', translateText);

    async function translateText() {
        const text = inputText.value;
        if (text) {
            try {
                outputText.textContent = 'Translating...';
                const response = await fetch('https://genz-1.ukjbowman.workers.dev', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                outputText.textContent = data.translatedText;
            } catch (error) {
                console.error('Error:', error);
                outputText.textContent = 'An error occurred during translation. Please try again.';
            }
        } else {
            alert('Please enter some text to translate.');
        }
    }
});

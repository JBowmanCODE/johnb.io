document.addEventListener('DOMContentLoaded', () => {
    const articleInput = document.getElementById('article-input');
    const fileUpload = document.getElementById('file-upload');
    const fileChosen = document.getElementById('file-chosen');
    const analyzeButton = document.getElementById('analyze-button');
    const analysisResults = document.getElementById('analysis-results');
    const downloadTxtButton = document.getElementById('download-txt');
    const downloadDocxButton = document.getElementById('download-docx');
    const loadingIndicator = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const toggleAdvancedBtn = document.getElementById('toggle-advanced');
    const advancedContent = document.getElementById('advanced-content');
    const wordCountDisplay = document.getElementById('word-count');
    const progressBar = document.getElementById('progress');
    const resetSettingsBtn = document.getElementById('reset-settings');
    let loadingInterval;

    const loadingMessages = [
        "Analysing this may take 30 seconds...",
        "\"The first draft is just you telling yourself the story.\" – Terry Pratchett",
        "\"You can always edit a bad page. You can't edit a blank page.\" – Jodi Picoult",
        "\"Write what should not be forgotten.\" – Isabel Allende",
        "\"The pen is mightier than the sword\" – Edward Bulwer-Lytton",
        "\"A drop of ink may make a million think.\" – Lord Byron",
        "Why did the writer cross the road? To get to the other plot twist!",
        "I have been trying to write a new pizza joke but I can't work out the delivery…"
    ];

    fileUpload.addEventListener('change', handleFileUpload);
    analyzeButton.addEventListener('click', analyzeContent);
    downloadTxtButton.addEventListener('click', () => downloadResult('txt'));
    downloadDocxButton.addEventListener('click', () => downloadResult('docx'));
    toggleAdvancedBtn.addEventListener('click', toggleAdvancedOptions);
    articleInput.addEventListener('input', updateWordCount);
    resetSettingsBtn.addEventListener('click', resetAdvancedSettings);

    function updateWordCount() {
        const text = articleInput.value.trim();
        const wordCount = text ? text.split(/\s+/).length : 0;
        const charCount = text.length;
        wordCountDisplay.textContent = `Words: ${wordCount} | Characters: ${charCount}`;
    }

    function toggleAdvancedOptions() {
        console.log('Toggle advanced options called'); // Debug log
        if (advancedContent.style.display === 'none' || advancedContent.style.display === '') {
            advancedContent.style.display = 'block';
            toggleAdvancedBtn.textContent = '(Hide)';
        } else {
            advancedContent.style.display = 'none';
            toggleAdvancedBtn.textContent = '(Show)';
        }
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            fileChosen.textContent = file.name;
            if (file.type === 'text/plain') {
                readTextFile(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                readDocxFile(file);
            } else {
                alert('Unsupported file type. Please upload a TXT or DOCX file.');
                fileChosen.textContent = 'No file chosen';
            }
        }
    }

    function readTextFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            articleInput.value = e.target.result;
            updateWordCount();
        };
        reader.onerror = (e) => {
            console.error('Error reading file:', e);
            alert('Failed to read the file. Please try again.');
        };
        reader.readAsText(file);
    }

    function readDocxFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(result => {
                    articleInput.value = result.value;
                    updateWordCount();
                })
                .catch(error => {
                    console.error('Error extracting text from DOCX:', error);
                    alert('Failed to extract text from the DOCX file. Please try again with a different file.');
                });
        };
        reader.onerror = (e) => {
            console.error('Error reading file:', e);
            alert('Failed to read the file. Please try again.');
        };
        reader.readAsArrayBuffer(file);
    }

    function getRandomLoadingMessage() {
        return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    }

    function updateLoadingMessage() {
        loadingText.textContent = getRandomLoadingMessage();
    }

    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
    }

    function showLoadingIndicator() {
        loadingIndicator.style.display = 'block';
        updateLoadingMessage();
        updateProgress(0);
        loadingInterval = setInterval(() => {
            updateLoadingMessage();
            updateProgress(Math.min(90, parseFloat(progressBar.style.width) + 10));
        }, 5000);
    }

    function hideLoadingIndicator() {
        loadingIndicator.style.display = 'none';
        clearInterval(loadingInterval);
    }

    async function analyzeContent() {
        const content = articleInput.value.trim();
        if (!content) {
            alert('Please enter some content to analyze.');
            return;
        }

        analyzeButton.disabled = true;
        showLoadingIndicator();
        analysisResults.innerHTML = '';
        document.querySelector('.results-section').style.display = 'none';

        loadingIndicator.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const advancedOptions = {
            language: document.getElementById('language-select').value,
            style: document.getElementById('style-select').value,
            brandGuide: document.getElementById('brand-guide').value.trim(),
            excludedWords: document.getElementById('excluded-words').value.trim(),
            articleLength: document.getElementById('article-length').value
        };

        try {
            const response = await fetch('https://editor2.ukjbowman.workers.dev/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, advancedOptions }),
                mode: 'cors',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            if (data.success) {
                document.querySelector('.results-section').style.display = 'block';
                displayAnalysis(data.analysis);
                document.querySelector('.results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            let errorMessage = error.message;
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                errorMessage = 'Failed to connect to the server. This might be due to a CORS issue or the server being unavailable.';
            }
            analysisResults.innerHTML = `<p>Error: ${errorMessage}</p>`;
            document.querySelector('.results-section').style.display = 'block';
            analysisResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } finally {
            analyzeButton.disabled = false;
            hideLoadingIndicator();
            updateProgress(100);
        }
    }

    function displayAnalysis(analysis) {
        const parts = analysis.split(/(?=Analysis Results:|Edited Version:|Flesch Reading Ease Score:|Word Count:|Overall Feedback:)/);
        let html = '';
        let editedVersion = '';
        let readabilityMetrics = '';

        parts.forEach(part => {
            if (part.startsWith('Analysis Results:')) {
                const analysisContent = part.replace('Analysis Results:', '').trim();
                const formattedAnalysis = analysisContent.replace(/(\d+\.)/g, '<br>$1');
                html += `
                    <div class="analysis-section">
                        <h3>Analysis Results</h3>
                        <div>${formattedAnalysis}</div>
                    </div>
                `;
            } else if (part.startsWith('Edited Version:')) {
                editedVersion = part.replace('Edited Version:', '').trim();
                html += `
                    <div class="edited-version-section">
                        <h3>Edited Version</h3>
                        <pre id="edited-version">${editedVersion}</pre>
                        <button class="copy-btn" onclick="copyToClipboard()">Copy Edited Version</button>
                    </div>
                `;
            } else if (part.startsWith('Flesch Reading Ease Score:') || part.startsWith('Word Count:') || part.startsWith('Overall Feedback:')) {
                const metricLines = part.split('\n').filter(line => line.trim() !== '');
                metricLines.forEach(line => {
                    const [label, value] = line.split(':');
                    readabilityMetrics += `
                        <p>
                            <strong>${label.trim()}:</strong>
                            <span>${value ? value.trim() : ''}</span>
                        </p>
                    `;
                });
            }
        });

        if (readabilityMetrics) {
            html += `
                <div class="readability-section">
                    <h3>Readability Metrics</h3>
                    <div id="readability-metrics">${readabilityMetrics}</div>
                </div>
            `;
        }

        if (!editedVersion) {
            html += '<p>No edited version was provided. The AI analysis did not generate specific edits for this content.</p>';
        }

        analysisResults.innerHTML = html;
        analysisResults.insertAdjacentHTML('beforeend', `
            <button id="new-analysis-button" class="new-analysis-btn">Analyse a New Article</button>
        `);
        const newAnalysisButton = document.getElementById('new-analysis-button');
        newAnalysisButton.addEventListener('click', resetAnalysis);

        downloadTxtButton.disabled = !editedVersion;
        downloadDocxButton.disabled = !editedVersion;
    }

    function resetAnalysis() {
        articleInput.value = '';
        analysisResults.innerHTML = '';
        document.querySelector('.results-section').style.display = 'none';
        fileUpload.value = '';
        fileChosen.textContent = 'No file chosen';
        downloadTxtButton.disabled = true;
        downloadDocxButton.disabled = true;
        
        loadAdvancedSettings();
        
        advancedContent.style.display = 'none';
        toggleAdvancedBtn.textContent = '(Show)';
        analyzeButton.disabled = false;
        window.scrollTo(0, 0);
        updateWordCount();
    }

    async function downloadResult(format) {
        const editedVersionElement = document.getElementById('edited-version');
        const readabilityMetricsElement = document.getElementById('readability-metrics');
        if (!editedVersionElement || !readabilityMetricsElement) {
            alert('No edited version or readability metrics available to download.');
            return;
        }
        const editedContent = editedVersionElement.textContent;
        const readabilityMetrics = readabilityMetricsElement.textContent;
        const originalContent = articleInput.value;

        if (format === 'txt') {
            const contentWithFooter = `${editedContent}\n\nReadability Metrics\n${readabilityMetrics}\n\nEdited by https://johnb.io/editor`;
            const blob = new Blob([contentWithFooter], { type: 'text/plain' });
            saveAs(blob, 'edited_version.txt');
        } else if (format === 'docx') {
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: [
                        ...parseContentToDocxElementsWithTrackedChanges(originalContent, editedContent, readabilityMetrics),
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({ text: '\n\n' }),
                                new docx.ExternalHyperlink({
                                    children: [
                                        new docx.TextRun({
                                            text: 'Edited by Johnb.io/editor',
                                            font: "Calibri",
                                            size: 22,
                                            color: "4EA72E",
                                            bold: true,
                                            underline: {
                                                type: docx.UnderlineType.SINGLE,
                                                color: "4EA72E",
                                            },
                                        })
                                    ],
                                    link: "https://johnb.io/editor"
                                })
                            ]
                        })
                    ]
                }]
            });

            try {
                const blob = await docx.Packer.toBlob(doc);
                saveAs(blob, 'edited_version.docx');
            } catch (error) {
                console.error('Error creating DOCX file:', error);
                alert('Failed to create the DOCX file. Please try again.');
            }
        }
    }

    function parseContentToDocxElementsWithTrackedChanges(originalContent, editedContent, readabilityMetrics) {
        const elements = [];
        const defaultStyle = {
            font: "Calibri",
            size: 24,
        };

        const headingStyles = {
            h1: { font: "Calibri", size: 36, bold: true },
            h2: { font: "Calibri", size: 32, bold: true },
            h3: { font: "Calibri", size: 28, bold: true },
        };

        const originalParagraphs = originalContent.split('\n\n');
        const editedParagraphs = editedContent.split('\n\n');

        let lastHeadingLevel = 0;

        for (let i = 0; i < Math.max(originalParagraphs.length, editedParagraphs.length); i++) {
            const originalPara = originalParagraphs[i] || '';
            const editedPara = editedParagraphs[i] || '';

            if (originalPara === editedPara) {
                const { paragraph, headingLevel } = createParagraph(editedPara, defaultStyle, headingStyles, lastHeadingLevel);
                elements.push(paragraph);
                lastHeadingLevel = headingLevel;
            } else {
                const { children, headingLevel } = createHeadingOrTextRun(editedPara, defaultStyle, headingStyles, lastHeadingLevel);
                elements.push(new docx.Paragraph({
                    children: [
                        new docx.DeletedTextRun({
                            text: originalPara,
                            ...defaultStyle,
                        }),
                        ...children
                    ],
                    spacing: { after: 200 }
                }));
                lastHeadingLevel = headingLevel;
            }
        }

        elements.push(new docx.Paragraph({
            text: "Readability Metrics",
            ...headingStyles.h2,
            spacing: { before: 400, after: 200 },
            heading: docx.HeadingLevel.HEADING_2
        }));
        
        const metricLines = readabilityMetrics.split('\n').filter(line => line.trim());
        metricLines.forEach(line => {
            const [label, value] = line.split(':').map(part => part.trim());
            elements.push(new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: `${label}: `,
                        ...defaultStyle,
                        bold: true
                    }),
                    new docx.TextRun({
                        text: value,
                        ...defaultStyle
                    })
                ],
                spacing: { after: 100 }
            }));
        });

        return elements;
    }

    function createParagraph(text, defaultStyle, headingStyles, lastHeadingLevel) {
        const headingLevel = detectHeadingLevel(text, lastHeadingLevel);
        if (headingLevel) {
            return {
                paragraph: new docx.Paragraph({
                    text: text,
                    ...headingStyles[`h${headingLevel}`],
                    spacing: { before: 400 - (headingLevel * 40), after: 200 - (headingLevel * 20) },
                    heading: docx.HeadingLevel[`HEADING_${headingLevel}`]
                }),
                headingLevel
            };
        } else {
            return {
                paragraph: new docx.Paragraph({
                    children: [new docx.TextRun({ text, ...defaultStyle })],
                    spacing: { after: 200 }
                }),
                headingLevel: 0
            };
        }
    }

    function createHeadingOrTextRun(text, defaultStyle, headingStyles, lastHeadingLevel) {
        const headingLevel = detectHeadingLevel(text, lastHeadingLevel);
        if (headingLevel) {
            return {
                children: [new docx.InsertedTextRun({
                    text: text,
                    ...headingStyles[`h${headingLevel}`]
                })],
                headingLevel
            };
        } else {
            return {
                children: [new docx.InsertedTextRun({
                    text: text,
                    ...defaultStyle
                })],
                headingLevel: 0
            };
        }
    }

    function detectHeadingLevel(text, lastHeadingLevel) {
        const trimmedText = text.trim();
        
        if (lastHeadingLevel === 0 && trimmedText.length <= 50) {
            return 1;
        }

        if (trimmedText.length <= 60 && !trimmedText.includes('\n')) {
            if (lastHeadingLevel === 1) {
                return 2;
            }
            if (lastHeadingLevel === 2 || lastHeadingLevel === 3) {
                return 3;
            }
        }

        return 0;
    }

    // Initialize tooltips for info bubbles
    const infoBubbles = document.querySelectorAll('.info-bubble');
    infoBubbles.forEach(bubble => {
        bubble.setAttribute('title', 'Share now');
    });

    // Initialize social share buttons
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        button.addEventListener('click', () => {
            const platform = button.getAttribute('data-platform');
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent('Check out this awesome AI Copyeditor tool!');
            let shareUrl;

            switch (platform) {
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
                    break;
            }

            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        });
    });

    // Ensure file upload is always enabled
    fileUpload.addEventListener('click', (event) => {
        event.target.value = null; // This allows re-uploading the same file if needed
    });

    // Functions for saving and loading advanced settings
    function saveAdvancedSettings() {
        const settings = {
            language: document.getElementById('language-select').value,
            style: document.getElementById('style-select').value,
            brandGuide: document.getElementById('brand-guide').value,
            excludedWords: document.getElementById('excluded-words').value,
            articleLength: document.getElementById('article-length').value
        };
        localStorage.setItem('advancedSettings', JSON.stringify(settings));
    }

    function loadAdvancedSettings() {
        const savedSettings = localStorage.getItem('advancedSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            document.getElementById('language-select').value = settings.language;
            document.getElementById('style-select').value = settings.style;
            document.getElementById('brand-guide').value = settings.brandGuide;
            document.getElementById('excluded-words').value = settings.excludedWords;
            document.getElementById('article-length').value = settings.articleLength;
        }
    }

    function resetAdvancedSettings() {
        // Set default values for the advanced settings
        document.getElementById('language-select').value = 'en-US';
        document.getElementById('style-select').value = 'keep-current';
        document.getElementById('brand-guide').value = '';
        document.getElementById('excluded-words').value = '';
        document.getElementById('article-length').value = 'natural';

        // Save the default settings
        saveAdvancedSettings();
    }

    // Load saved settings when the page loads
    loadAdvancedSettings();

    // Add event listeners to save settings when they change
    document.getElementById('language-select').addEventListener('change', saveAdvancedSettings);
    document.getElementById('style-select').addEventListener('change', saveAdvancedSettings);
    document.getElementById('brand-guide').addEventListener('input', saveAdvancedSettings);
    document.getElementById('excluded-words').addEventListener('input', saveAdvancedSettings);
    document.getElementById('article-length').addEventListener('change', saveAdvancedSettings);

    updateWordCount();
});

window.copyToClipboard = function() {
    const editedVersionElement = document.getElementById('edited-version');
    if (editedVersionElement) {
        navigator.clipboard.writeText(editedVersionElement.textContent)
            .then(() => {
                const copyBtn = document.querySelector('.copy-btn');
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy Edited Version';
                }, 2000);
            })
            .catch(err => console.error('Failed to copy: ', err));
    }
}
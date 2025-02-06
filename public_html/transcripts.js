// DOM Elements
const blogContainer = document.getElementById('blog-container');
const videoUrlInput = document.getElementById('video-url');
const manualTranscriptInput = document.getElementById('manual-transcript');
const copyButton = document.getElementById('copy-button');
const loadingIndicator = document.getElementById('loading-section');
const loadingMessage = document.getElementById('loading-message');
const resultContent = document.getElementById('result-content');

const WORKER_URL = 'https://bold-band-45a7.ukjbowman.workers.dev';

const copyIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`;

const tickIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

const loadingMessages = [
    "Generating blog post... This may take up to 90 seconds for longer videos.",
    "We are using Claude AI to Generate your content.",
    "Our prompts are designed to limit the amount of AI Content.",
    "Remember to re-write the article afterwards to avoid detection.",
    "For longer videos, the process might take more time. Please be patient.",
    "If you have any improvement suggestion please contact us."
];

let currentMessageIndex = 0;
let messageInterval;

function rotateLoadingMessages() {
    currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
    loadingMessage.textContent = loadingMessages[currentMessageIndex];
}

function startRotatingMessages() {
    loadingMessage.textContent = loadingMessages[0];
    messageInterval = setInterval(rotateLoadingMessages, 5000);
}

function stopRotatingMessages() {
    clearInterval(messageInterval);
}

function showLoadingIndicator() {
    loadingIndicator.style.display = 'block';
    loadingIndicator.scrollIntoView({behavior: 'smooth'});
    resultContent.style.display = 'none';
    blogContainer.innerHTML = '';
    copyButton.style.display = 'none';
}

function hideLoadingIndicator() {
    loadingIndicator.style.display = 'none';
    stopRotatingMessages();
}

async function generateBlogPostFromWorker(data) {
    showLoadingIndicator();
    startRotatingMessages();

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const body = await response.json();

        hideLoadingIndicator();
        if (body.success) {
            displayBlogPost(body.blogPost);
            copyButton.style.display = 'block';
            
            console.log('Claude Debug Info:', body.debugInfo);
            displayDebugInfo(body.debugInfo);
        } else {
            handleErrorResponse(body);
        }
    } catch (error) {
        console.error('Error generating blog post:', error);
        hideLoadingIndicator();
        handleErrorResponse({ error: error.message });
    } finally {
        updateLoadingTextColor();
    }
}

function generateBlogPost() {
    const videoUrl = videoUrlInput.value.trim();
    if (!videoUrl) {
        alert('Please enter a YouTube video URL');
        return;
    }

    const videoId = getVideoIdFromUrl(videoUrl);
    if (!videoId) {
        alert('Invalid YouTube video URL');
        return;
    }

    generateBlogPostFromWorker({ video_id: videoId });
}

function generateBlogPostFromText() {
    const transcriptText = manualTranscriptInput.value.trim();
    if (!transcriptText) {
        alert('Please enter a transcript');
        return;
    }

    generateBlogPostFromWorker({ manual_transcript: transcriptText });
}

function handleErrorResponse(body) {
    let errorMessage;
    if (body.error && body.error.includes("Input too long")) {
        displayVideoTooLongError();
    } else if (body.error && body.error.includes("Could not find player response")) {
        errorMessage = `Error: Unable to fetch video information. This could be due to:
        <ul>
            <li>The video might be private or age-restricted</li>
            <li>The video might have been removed or doesn't exist</li>
            <li>There might be an issue with YouTube's API</li>
        </ul>
        Please try another video or manually paste the transcript.`;
    } else if (body.error && body.error.includes("Daily limit exceeded")) {
        errorMessage = "Error: Daily limit exceeded. Please try again tomorrow.";
    } else if (body.error && body.error.includes("blocked by CORS policy")) {
        errorMessage = "Error: There's a CORS policy issue. Please contact the site administrator.";
    } else {
        errorMessage = `Error: ${body.error || 'An unknown error occurred'}`;
    }
    displayErrorMessage(errorMessage);
    copyButton.style.display = 'none';
}

function displayBlogPost(blogPost) {
    resultContent.style.display = 'block';
    blogContainer.innerHTML = marked.parse(blogPost);
    updateLoadingTextColor();
    
    const wordCount = blogPost.split(/\s+/).length;
    document.getElementById('word-count').textContent = `Word count: ${wordCount}`;
    
    generateSeoPreview(blogPost);
    embedVideo();
}

function generateSeoPreview(blogPost) {
    const lines = blogPost.split('\n');
    const title = lines[0].replace(/^#\s*/, '');
    const description = lines.slice(1).join(' ').substring(0, 160) + '...';
    
    const seoPreview = document.getElementById('seo-preview');
    seoPreview.querySelector('.seo-title').textContent = title;
    seoPreview.querySelector('.seo-url').textContent = 'https://example.com/blog/' + title.toLowerCase().replace(/\s+/g, '-');
    seoPreview.querySelector('.seo-description').textContent = description;
}

function embedVideo() {
    const videoId = getVideoIdFromUrl(videoUrlInput.value);
    if (videoId) {
        const videoEmbed = document.getElementById('video-embed');
        videoEmbed.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        videoEmbed.style.display = 'block';
    }
}

function getVideoIdFromUrl(url) {
    try {
        const urlObj = new URL(url);
        
        if (urlObj.hostname === 'youtube.com' || urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'm.youtube.com') {
            const videoId = urlObj.searchParams.get('v');
            if (videoId) return videoId;
        }
        
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        
        if (urlObj.pathname.startsWith('/shorts/')) {
            return urlObj.pathname.split('/')[2];
        }
    } catch (error) {
        console.error('Error parsing URL:', error);
    }

    return null;
}

function updateLoadingTextColor() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        blogContainer.style.color = '#e0e0e0';
        copyButton.style.color = '#e0e0e0';
    } else {
        blogContainer.style.color = '#333';
        copyButton.style.color = '#333';
    }
}

function copyBlogContent() {
    const content = blogContainer.innerText;
    navigator.clipboard.writeText(content).then(() => {
        copyButton.innerHTML = tickIcon;
        setTimeout(() => {
            copyButton.innerHTML = copyIcon;
        }, 1000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy content. Please try selecting and copying manually.');
    });
}

function shareOnTwitter() {
    const title = document.querySelector('.seo-title').textContent;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
}

function shareOnFacebook() {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
}

function shareOnLinkedIn() {
    const title = document.querySelector('.seo-title').textContent;
    const url = window.location.href;
    const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(linkedinUrl, '_blank');
}

function exportAsTXT() {
    const element = document.getElementById('blog-container');
    const textContent = element.innerText;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog_post.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function exportAsHTML() {
    const element = document.getElementById('blog-container');
    const htmlContent = element.innerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog_post.html';
    a.click();
    URL.revokeObjectURL(url);
}

function exportAsWord() {
    const element = document.getElementById('blog-container');
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head>
        <body>${element.innerHTML}</body>
        </html>
    `;
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog_post.doc';
    a.click();
    URL.revokeObjectURL(url);
}

function displayErrorMessage(message) {
    resultContent.style.display = 'block';
    blogContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

function displayVideoTooLongError() {
    resultContent.style.display = 'block';
    blogContainer.innerHTML = `
        <div class="error-message">
            <h2>Unfortunately this video is too long</h2>
            <p>Please head over to YouTube:</p>
            <ol>
                <li>Scroll down to the description and click more.</li>
                <li>Scroll down to the bottom of the description and click Transcript</li>
                <li>Transcript will be displayed on the top right hand of the screen</li>
                <li>Copy and paste a portion of the transcript to the Generate from Text Box</li>
            </ol>
        </div>
    `;
}

function displayDebugInfo(debugInfo) {
    console.log('Debug Info:', debugInfo);
}

document.addEventListener('DOMContentLoaded', () => {
    updateLoadingTextColor();
    if (copyButton) {
        copyButton.innerHTML = copyIcon;
        copyButton.addEventListener('click', copyBlogContent);
    }

    const generateFromUrlButton = document.getElementById('generate-from-url');
    const generateFromTextButton = document.getElementById('generate-from-text');

    if (generateFromUrlButton) {
        generateFromUrlButton.addEventListener('click', generateBlogPost);
    }
    if (generateFromTextButton) {
        generateFromTextButton.addEventListener('click', generateBlogPostFromText);
    }
});

window.matchMedia('(prefers-color-scheme: dark)').addListener(updateLoadingTextColor);

/* end of code */
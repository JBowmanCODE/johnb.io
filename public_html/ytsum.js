const videoUrlInput = document.getElementById('video-url');
const summarizeButton = document.getElementById('summarize-button');
const loadingIndicator = document.getElementById('loading-indicator');
const summaryContainer = document.getElementById('summary-container');
const summaryContent = document.getElementById('summary-content');
const questionInput = document.getElementById('question-input');
const askButton = document.getElementById('ask-button');
const answerContainer = document.getElementById('answer-container');

summarizeButton.addEventListener('click', summarizeVideo);
askButton.addEventListener('click', askQuestion);

const WORKER_URL = 'https://youtube-summary.ukjbowman.workers.dev';

async function summarizeVideo() {
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

  showLoading();

  try {
    const response = await fetch(`${WORKER_URL}/summarize?videoId=${videoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    displaySummary(data.summary);
  } catch (error) {
    console.error('Error:', error);
    alert(`An error occurred: ${error.message}`);
  } finally {
    hideLoading();
  }
}

async function askQuestion() {
  const question = questionInput.value.trim();
  if (!question) {
    alert('Please enter a question');
    return;
  }

  showLoading();

  try {
    const response = await fetch(`${WORKER_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    displayAnswer(data.answer);
  } catch (error) {
    console.error('Error:', error);
    alert(`An error occurred: ${error.message}`);
  } finally {
    hideLoading();
  }
}

function getVideoIdFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

function showLoading() {
  loadingIndicator.style.display = 'block';
}

function hideLoading() {
  loadingIndicator.style.display = 'none';
}

function displaySummary(summary) {
  summaryContent.innerHTML = `<p>${summary}</p>`;
  summaryContainer.style.display = 'block';
}

function displayAnswer(answer) {
  answerContainer.innerHTML = `<p>${answer}</p>`;
}

async function initiateOAuthFlow() {
  try {
    const response = await fetch(`${WORKER_URL}/auth`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    window.location.href = data.authUrl;
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    alert(`An error occurred: ${error.message}`);
  }
}

// Call this function when you need to start the OAuth flow
// For example, you might add a button to your HTML:
// <button onclick="initiateOAuthFlow()">Authenticate with YouTube</button>

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're returning from OAuth
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (code) {
    // We have an auth code, exchange it for tokens
    exchangeCodeForTokens(code);
  }
});

async function exchangeCodeForTokens(code) {
  try {
    const response = await fetch(`${WORKER_URL}/oauth2callback?code=${code}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    alert('Authentication successful! You can now use the summarize feature.');
    // Optionally, update UI to show authenticated state
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    alert(`Authentication failed: ${error.message}`);
  }
}
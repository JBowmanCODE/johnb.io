document.addEventListener('DOMContentLoaded', function () {
    // Dynamically load the header and footer HTML
    loadHeaderAndFooter();

    // Check and apply dark mode by default
    if (localStorage.getItem('darkMode') !== 'disabled') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
});

function loadHeaderAndFooter() {
    // Load header
    fetch('/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                initializeHeader();
                setTimeout(addInfoIconAndDownloadIcon, 200); // Delay to ensure DOM elements exist
            } else {
                console.error('Header placeholder not found in the DOM.');
            }
        })
        .catch(error => console.error('Error loading header:', error));

    // Load footer
    fetch('/footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = data;
                console.log('Footer successfully loaded');
                initializeFooter();
            } else {
                console.error('Footer placeholder not found in the DOM.');
            }
        })
        .catch(error => console.error('Error loading footer:', error));
}

// Initialize header functionality
function initializeHeader() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const closeMobileMenu = document.getElementById('close-mobile-menu');
    const logo = document.getElementById('logo');
    const extraText = document.getElementById('extra-text');
    const darkModeToggle = document.getElementById('toggle-dark-mode');

    if (mobileMenuToggle && mobileNavOverlay && closeMobileMenu) {
        mobileMenuToggle.addEventListener('click', () => mobileNavOverlay.classList.add('active'));
        closeMobileMenu.addEventListener('click', () => mobileNavOverlay.classList.remove('active'));
    }

    if (logo && extraText) {
        logo.addEventListener('mouseenter', () => {
            extraText.textContent = '';
            const fullText = 'owman}';
            let i = 0;
            function typeWriter() {
                if (i < fullText.length) {
                    extraText.textContent += fullText.charAt(i);
                    i++;
                    setTimeout(typeWriter, 30);
                }
            }
            extraText.classList.add('typing');
            typeWriter();
        });

        logo.addEventListener('mouseleave', () => {
            extraText.classList.remove('typing');
            extraText.textContent = '';
        });
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
}

// Toggle dark mode functionality
function toggleDarkMode() {
    if (document.body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
}

// Initialize footer functionality (cookie banner logic moved here from footer.js)
function initializeFooter() {
    const cookieBanner = document.getElementById('cookie-banner');
    console.log('Cookie banner:', cookieBanner); // Debug log

    const acceptButton = document.getElementById('accept-cookies');
    const rejectButton = document.getElementById('reject-cookies');

    if (!cookieBanner) {
        console.error('Cookie banner element not found in the footer.');
        return;
    }

    function setConsent(value) {
        localStorage.setItem('cookiesAccepted', value);
    }

    function getConsent() {
        return localStorage.getItem('cookiesAccepted');
    }

    function showCookieBanner() {
        cookieBanner.classList.remove('cookie-banner-hidden');
    }

    function hideCookieBanner() {
        cookieBanner.classList.add('cookie-banner-hidden');
    }

    function handleCookieAcceptance(accepted) {
        setConsent(accepted.toString());
        hideCookieBanner();
    }

    if (acceptButton) {
        acceptButton.addEventListener('click', () => handleCookieAcceptance(true));
    }

    if (rejectButton) {
        rejectButton.addEventListener('click', () => handleCookieAcceptance(false));
    }

    const consent = getConsent();
    if (consent === null) {
        showCookieBanner();
    } else {
        hideCookieBanner();
    }
}

// Add info and download icons to the container
function addInfoIconAndDownloadIcon() {
    const container = document.querySelector('.container');
    const title = document.querySelector('h1');

    // Check if container and title exist before proceeding
    if (!container || !title) {
        console.error('Container or title element not found. Cannot insert icons.');
        return; // Exit the function if the elements are not found
    }

    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;margin-bottom:10px;';

    const infoIcon = document.createElement('i');
    infoIcon.className = 'fas fa-info-circle';
    infoIcon.style.cssText = 'margin-right:10px;cursor:pointer;';
    infoIcon.setAttribute('title', 'Please ensure your data includes the titles Date, Metric and Value');
    iconContainer.appendChild(infoIcon);

    const downloadIcon = document.createElement('i');
    downloadIcon.className = 'fas fa-download';
    downloadIcon.style.cursor = 'pointer';
    downloadIcon.setAttribute('title', 'Download example file');
    downloadIcon.onclick = function () {
        const exampleData = 'Date,Metric,Value\n2023,Website Views,300000\n2024,Website Views,425000';
        const blob = new Blob([exampleData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, 'example_data.csv');
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = 'example_data.csv';
            link.click();
        }
    };
    iconContainer.appendChild(downloadIcon);

    container.appendChild(iconContainer);
}

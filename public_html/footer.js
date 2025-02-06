document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    const cookieBanner = document.getElementById('cookie-banner');
    const acceptButton = document.getElementById('accept-cookies');
    const rejectButton = document.getElementById('reject-cookies');

    if (!cookieBanner) {
        console.error('Cookie banner element not found');
        return;
    }

    if (!acceptButton || !rejectButton) {
        console.error('Accept or Reject button not found');
        return;
    }

    function setConsent(value) {
        console.log('Setting consent to:', value);
        localStorage.setItem('cookiesAccepted', value);
    }

    function getConsent() {
        const consent = localStorage.getItem('cookiesAccepted');
        console.log('Retrieved consent:', consent);
        return consent;
    }

    function showCookieBanner() {
        console.log('Showing cookie banner');
        cookieBanner.classList.remove('cookie-banner-hidden');
    }

    function hideCookieBanner() {
        console.log('Hiding cookie banner');
        cookieBanner.classList.add('cookie-banner-hidden');
    }

    function handleCookieAcceptance(accepted) {
        console.log('Handling cookie acceptance:', accepted);
        setConsent(accepted.toString());
        hideCookieBanner();
    }

    acceptButton.addEventListener('click', function() {
        console.log('Accept button clicked');
        handleCookieAcceptance(true);
    });

    rejectButton.addEventListener('click', function() {
        console.log('Reject button clicked');
        handleCookieAcceptance(false);
    });

    // Check consent status on page load
    const consent = getConsent();
    if (consent === null) {
        showCookieBanner();
    } else {
        hideCookieBanner(); // If consent exists, hide the banner
    }
});

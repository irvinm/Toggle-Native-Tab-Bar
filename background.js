let hideTabBar = JSON.parse(localStorage.getItem('hideTabBar')) || false;

function setPrefaceAndIcon() {
    // Set Preface for all open windows
    browser.windows.getAll().then((windows) => {
        let titlePreface = hideTabBar ? " " : "";
        windows.forEach((window) => {
            browser.windows.update(window.id, { titlePreface: titlePreface });
        });
    });

    // Set the icon
    let path = hideTabBar ? 'icon-hidden.png' : 'icon-visible.png';
    browser.browserAction.setIcon({ path: path });
}

browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        browser.tabs.create({ url: 'options.html' });
    }
});

browser.browserAction.onClicked.addListener((tab) => {
    // Flip the hideTabBar value and save it
    hideTabBar = !hideTabBar;
    localStorage.setItem('hideTabBar', JSON.stringify(hideTabBar));
    
    // Set the titlePreface for all open windows and the icon
    setPrefaceAndIcon();
});

// Initialize the addon by setting the titlePreface for all open windows
setPrefaceAndIcon();
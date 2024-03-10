let hideTabBar = JSON.parse(localStorage.getItem('hideTabBar')) || false;

function updateIcon() {
    let path = hideTabBar ? 'icon-hidden.png' : 'icon-visible.png';
    browser.browserAction.setIcon({ path: path });
}

browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        browser.tabs.create({ url: 'options.html' });
    }
});

browser.browserAction.onClicked.addListener((tab) => {
    browser.windows.getAll().then((windows) => {
        let titlePreface = hideTabBar ? "" : "XXX ";
        windows.forEach((window) => {
            browser.windows.update(window.id, { titlePreface: titlePreface });
        });
        hideTabBar = !hideTabBar;
        localStorage.setItem('hideTabBar', JSON.stringify(hideTabBar));
        updateIcon();
    });
});

// Initialize the addon by setting the titlePreface for all open windows
browser.windows.getAll().then((windows) => {
    let titlePreface = hideTabBar ? "XXX " : "";
    windows.forEach((window) => {
        browser.windows.update(window.id, { titlePreface: titlePreface });
    });
});

updateIcon();
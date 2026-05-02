let hideTabBar = false;
let windowStates = new Map(); // windowId -> boolean (true if hidden)

async function getToggleScope() {
    const storage = await browser.storage.local.get('toggleScope');
    return storage.toggleScope || 'global';
}

async function updateIcon(hidden, windowId = null) {
    const iconPath = hidden ? 'icons/icon-hidden.svg' : 'icons/icon-visible.svg';
    let details = { path: iconPath };
    if (windowId !== null) {
        details.windowId = windowId;
    }
    try {
        await browser.browserAction.setIcon(details);
    } catch (e) {
        // Window might be closed or invalid, ignore
    }
}

async function setPrefaceAndIconGlobal() {
    const windows = await browser.windows.getAll();
    const titlePreface = hideTabBar ? " " : "";
    
    for (const window of windows) {
        windowStates.set(window.id, hideTabBar);
        await browser.windows.update(window.id, { titlePreface: titlePreface });
        try {
            await browser.sessions.setWindowValue(window.id, 'hideTabBar', hideTabBar);
        } catch (e) {}
        // Explicitly update each window's icon to clear any per-window overrides
        await updateIcon(hideTabBar, window.id);
    }
    await updateIcon(hideTabBar); // Sets global icon for any future windows
}

async function setPrefaceAndIconPerWindow(windowId, hidden) {
    const titlePreface = hidden ? " " : "";
    windowStates.set(windowId, hidden);
    await browser.windows.update(windowId, { titlePreface: titlePreface });
    await updateIcon(hidden, windowId);
    try {
        await browser.sessions.setWindowValue(windowId, 'hideTabBar', hidden);
    } catch (e) {}
}

async function restoreWindowState(windowId) {
    let hidden = hideTabBar; // Default to global state
    try {
        const value = await browser.sessions.getWindowValue(windowId, 'hideTabBar');
        if (value !== undefined) {
            hidden = value === true || value === 'true';
        }
    } catch (e) {}
    await setPrefaceAndIconPerWindow(windowId, hidden);
}

async function initialize() {
    // Migrate from localStorage to browser.storage.local
    const storage = await browser.storage.local.get(['hideTabBar', 'lastAcknowledgedVersion', 'acknowledgeFF133Changes']);
    
    // Check if we need to migrate from localStorage (for existing users)
    if (localStorage.getItem('hideTabBar') !== null) {
        hideTabBar = JSON.parse(localStorage.getItem('hideTabBar'));
        await browser.storage.local.set({ hideTabBar });
        localStorage.removeItem('hideTabBar');
    } else {
        hideTabBar = storage.hideTabBar || false;
    }

    if (localStorage.getItem('lastAcknowledgedVersion') !== null) {
        await browser.storage.local.set({ lastAcknowledgedVersion: localStorage.getItem('lastAcknowledgedVersion') });
        localStorage.removeItem('lastAcknowledgedVersion');
    }

    const scope = await getToggleScope();
    const windows = await browser.windows.getAll();
    
    if (scope === 'global') {
        await setPrefaceAndIconGlobal();
    } else {
        for (const window of windows) {
            await restoreWindowState(window.id);
        }
    }

    createContextMenu();
}

function createContextMenu() {
    browser.menus.removeAll().then(() => {
        browser.menus.create({
            id: "open-options",
            title: "Options",
            contexts: ["browser_action"]
        });
    });
}

browser.runtime.onInstalled.addListener(async (details) => {
    await initialize();
    const currentVersion = browser.runtime.getManifest().version;

    if (details.reason === 'install') {
        await browser.tabs.create({ url: 'options/options.html' });
    } else if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        
        // Re-read storage to ensure we have the most authoritative values
        const storage = await browser.storage.local.get(['lastAcknowledgedVersion', 'showUpdatePage', 'acknowledgeFF133Changes']);
        let lastAcknowledged = storage.lastAcknowledgedVersion;
        let showUpdatePage = storage.showUpdatePage !== undefined ? storage.showUpdatePage : true;

        // Force show instructions for v0.9.6 update due to major reorganization
        // This overrides the user's "skip" preference just for this version
        let isCriticalUpdate = (currentVersion === '0.9.6' && lastAcknowledged !== '0.9.6');

        // Migrate/Cleanup old flag
        if (storage.acknowledgeFF133Changes !== undefined || localStorage.getItem('acknowledgeFF133Changes') !== null) {
            const legacyVal = storage.acknowledgeFF133Changes || localStorage.getItem('acknowledgeFF133Changes');
            if (legacyVal === 'true' || legacyVal === true) {
                showUpdatePage = false;
            }
            await browser.storage.local.set({ showUpdatePage });
            await browser.storage.local.remove('acknowledgeFF133Changes');
            localStorage.removeItem('acknowledgeFF133Changes');
        }

        // Only open the tab if the user wants it, OR if it's a critical update
        if (lastAcknowledged !== currentVersion && (showUpdatePage || isCriticalUpdate)) {
            await browser.tabs.create({ url: browser.runtime.getURL('options/options.html') });
        }

        console.log(`Add-on updated from version ${previousVersion} to ${currentVersion}`);
        const info = await browser.runtime.getBrowserInfo();
        console.log(`Firefox version: ${info.version}`);
    }
});

// Add a listener for the browser action -- Triggered via the toolbar icon
browser.browserAction.onClicked.addListener((tab) => {
    toggleTabBar(tab.windowId);
});

// Add a listener for the command -- Triggered via keyboard shortcut
browser.commands.onCommand.addListener(async (command) => {
    if (command === "toggle-tab-bar") {
        const win = await browser.windows.getLastFocused();
        if (win) {
            toggleTabBar(win.id);
        }
    }
});

// Add a listener for the context menu
browser.menus.onClicked.addListener((info) => {
    if (info.menuItemId === "open-options") {
        browser.runtime.openOptionsPage();
    }
});

// Function to toggle the tab bar
async function toggleTabBar(targetWindowId) {
    const scope = await getToggleScope();
    
    if (scope === 'global') {
        hideTabBar = !hideTabBar;
        await browser.storage.local.set({ hideTabBar });
        await setPrefaceAndIconGlobal();
    } else {
        let windowId = targetWindowId;
        if (!windowId) {
            const win = await browser.windows.getLastFocused();
            if (win) windowId = win.id;
        }
        
        if (windowId) {
            let currentState = windowStates.has(windowId) ? windowStates.get(windowId) : hideTabBar;
            let newState = !currentState;
            await setPrefaceAndIconPerWindow(windowId, newState);
        }
    }
}

// Listen for when a new window is created
browser.windows.onCreated.addListener(async (window) => {
    const scope = await getToggleScope();
    if (scope === 'global') {
        windowStates.set(window.id, hideTabBar);
        await browser.windows.update(window.id, { titlePreface: hideTabBar ? " " : "" });
        try {
            await browser.sessions.setWindowValue(window.id, 'hideTabBar', hideTabBar);
        } catch (e) {}
    } else {
        await restoreWindowState(window.id);
    }
});

// Listen for when a window is removed to clean up the Map
browser.windows.onRemoved.addListener((windowId) => {
    windowStates.delete(windowId);
});

// Listen for scope changes in options
browser.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && changes.toggleScope) {
        if (changes.toggleScope.newValue === 'global') {
            // Adopt the state of the currently focused window as the new global state
            const win = await browser.windows.getLastFocused();
            if (win && windowStates.has(win.id)) {
                hideTabBar = windowStates.get(win.id);
                await browser.storage.local.set({ hideTabBar });
            }
            setPrefaceAndIconGlobal();
        }
    }
});

// Start initialization
initialize();
document.addEventListener('DOMContentLoaded', async () => {
    const instructions = document.getElementById('instructions-container');
    const dismissContainer = document.getElementById('dismiss-container');
    const showBtn = document.getElementById('show-instructions-btn');
    const upgradeBanner = document.getElementById('upgrade-dismiss-banner');
    const dismissUpgradeBtn = document.getElementById('dismiss-upgrade-btn');
    const addonVersionSpan = document.getElementById('addon-version');

    // Rename checkbox ID for version-agnosticism
    const checkbox = document.getElementById('acknowledge-version-checkbox');

    const currentVersion = browser.runtime.getManifest().version;
    const toggleScopeSelect = document.getElementById('toggle-scope');
    
    // Changelog elements
    const changelogContainer = document.getElementById('changelog-container');
    const viewHistoryBtn = document.getElementById('view-full-history-btn');
    const githubHistoryLink = document.getElementById('github-history-link');

    // Helper to compare semantic versions
    function compareVersions(v1, v2) {
        if (!v1) return -1;
        if (!v2) return 1;
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        const len = Math.max(parts1.length, parts2.length);
        for (let i = 0; i < len; i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    }

    async function renderChangelog(lastAck, showAll = false) {
        if (!changelogContainer) return;
        
        try {
            const response = await fetch('changelog.json');
            const changelog = await response.json();
            
            changelogContainer.innerHTML = ''; 
            let displayedCount = 0;
            
            for (const release of changelog) {
                let isNewToUser = false;
                if (!lastAck) {
                    // If no acknowledged version, only show the current one to avoid spam
                    isNewToUser = (release.version === currentVersion); 
                } else {
                    // Show if the release version is strictly greater than the last acknowledged version
                    isNewToUser = compareVersions(release.version, lastAck) > 0;
                }
                
                // If they are opening the options page manually and have seen everything,
                // we should at least show the current version as a default.
                if (lastAck === currentVersion && release.version === currentVersion && !showAll) {
                    isNewToUser = true;
                }
                
                if (showAll || isNewToUser) {
                    displayedCount++;
                    const card = document.createElement('div');
                    card.style.marginBottom = '20px';
                    if (displayedCount > 1) {
                        card.style.paddingTop = '20px';
                        card.style.borderTop = '1px solid #444';
                    }
                    
                    let itemsHtml = release.items.map(item => `<li style="padding-bottom: 0.5em;">${item}</li>`).join('');
                    
                    card.innerHTML = `
                        <h3 style="color: #fff; margin-bottom: 5px;">v${release.version} - ${release.title}</h3>
                        <p style="color: #aaa; font-size: 0.85em; margin-bottom: 10px;">${release.date}</p>
                        <ul style="padding-left: 1.2em;">
                            ${itemsHtml}
                        </ul>
                    `;
                    changelogContainer.appendChild(card);
                }
            }
            
            if (displayedCount === 0 && !showAll) {
                changelogContainer.innerHTML = '<p>No new updates to show.</p>';
            }
        } catch (e) {
            changelogContainer.innerHTML = '<p>Error loading updates.</p>';
        }
    }
    
    // Use asynchronous browser.storage.local instead of localStorage
    const storage = await browser.storage.local.get(['lastAcknowledgedVersion', 'showUpdatePage', 'toggleScope']);
    const lastAcknowledged = storage.lastAcknowledgedVersion;
    const showUpdatePage = storage.showUpdatePage !== undefined ? storage.showUpdatePage : true;

    if (addonVersionSpan) {
        addonVersionSpan.textContent = `v${currentVersion}`;
    }

    if (toggleScopeSelect) {
        toggleScopeSelect.value = storage.toggleScope || 'global';
    }

    // Render the changelog on load
    renderChangelog(lastAcknowledged);

    let isManuallyExpanded = false;

    function hideInstructions() {
        instructions.classList.add('collapsed');
        dismissContainer.classList.remove('hidden');
        upgradeBanner.classList.add('hidden');
        isManuallyExpanded = false;
    }

    function showInstructions(isManual = false) {
        instructions.classList.remove('collapsed');
        dismissContainer.classList.add('hidden');
        if (isManual) {
            isManuallyExpanded = true;
        }
    }

    async function updateBannerVisibility() {
        const storage = await browser.storage.local.get(['lastAcknowledgedVersion', 'showUpdatePage']);
        const lastAcknowledgedVersion = storage.lastAcknowledgedVersion;
        
        if (lastAcknowledgedVersion === currentVersion) {
            // Only auto-collapse if the user hasn't explicitly asked to see them
            if (!isManuallyExpanded) {
                hideInstructions();
            }
        } else {
            showInstructions();
            if (lastAcknowledgedVersion) {
                upgradeBanner.classList.remove('hidden');
            } else {
                upgradeBanner.classList.add('hidden');
            }
        }
    }

    async function acknowledgeCurrentVersion(shouldCollapse = false) {
        await browser.storage.local.set({ lastAcknowledgedVersion: currentVersion });
        // We don't force-check the checkbox here anymore, 
        // as the checkbox now represents the 'showUpdatePage' preference.
        if (shouldCollapse) {
            hideInstructions();
        }
    }

    // Logic to determine initial state
    if (lastAcknowledged === currentVersion) {
        hideInstructions();
    } else {
        // We are showing the instructions because of a version update.
        // Keep them open until the user explicitly dismisses them.
        showInstructions(true); 
        if (lastAcknowledged) {
            upgradeBanner.classList.remove('hidden');
        }
    }

    // Event Listeners
    showBtn.addEventListener('click', () => showInstructions(true));

    dismissUpgradeBtn.addEventListener('click', () => acknowledgeCurrentVersion(true));

    if (checkbox) {
        // Checkbox is "Don't show...", so it's the inverse of showUpdatePage
        checkbox.checked = !showUpdatePage;
        checkbox.addEventListener('change', async () => {
            const suppressUpdates = checkbox.checked;
            await browser.storage.local.set({ showUpdatePage: !suppressUpdates });
            
            if (suppressUpdates) {
                // If they checked "Don't show", also acknowledge current version to clean up UI
                await acknowledgeCurrentVersion(false);
            } else {
                // If they want to see updates again, we remove current acknowledgment 
                // so the banner shows up if they refresh
                await browser.storage.local.remove('lastAcknowledgedVersion');
                await updateBannerVisibility();
            }
        });
    }

    if (toggleScopeSelect) {
        toggleScopeSelect.addEventListener('change', async () => {
            await browser.storage.local.set({ toggleScope: toggleScopeSelect.value });
        });
    }

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => {
            renderChangelog(lastAcknowledged, true);
            viewHistoryBtn.style.display = 'none';
            if (githubHistoryLink) githubHistoryLink.style.display = 'block';
        });
    }

    // Listen for storage changes from the background script or other pages
    browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && (changes.lastAcknowledgedVersion || changes.showUpdatePage || changes.hideTabBar)) {
            updateBannerVisibility();
            if (checkbox && changes.showUpdatePage) {
                checkbox.checked = !changes.showUpdatePage.newValue;
            }
        }
    });

    // Get the Firefox version and display it
    browser.runtime.getBrowserInfo().then((info) => {
        const versionElement = document.getElementById('firefox-version');
        if (versionElement) {
            versionElement.textContent = `You are using Firefox version: ${info.version}`;
        }
    }).catch((error) => {
        console.error('Error getting Firefox version:', error);
    });
});
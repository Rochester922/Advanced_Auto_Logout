// background.js

// Set up the uninstall URL on installation
chrome.runtime.onInstalled.addListener(() => {
    setUninstallUrl();
});

// Function to set the uninstall survey URL
function setUninstallUrl() {
    if (!chrome.runtime.setUninstallURL) return;
    const manifest = chrome.runtime.getManifest();
    const appname = manifest.name || "Advanced Auto Logout";
    const appv = manifest.version || "6.5.0";
    chrome.runtime.setUninstallURL(`http://www.get.safetyredirector.com/uninstall/survey.php?a=${appname}&v=${appv}`);
}

// Logout function to remove all cookies
function LogOutAllOptions() {
    chrome.cookies.getAll({}, (cookies) => {
        cookies.forEach((cookie) => {
            chrome.cookies.remove({
                url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`,
                name: cookie.name
            });
        });
    });
}

// Logout function for specific sites after a delay
function LogOutSpecificSites(urlProvided, timeInMins) {
    if (timeInMins && timeInMins !== "0") {
        chrome.alarms.create(urlProvided, { delayInMinutes: parseInt(timeInMins) });
    } else {
        performLogout(urlProvided);
    }
}

// Listen for alarms to trigger site logout
chrome.alarms.onAlarm.addListener((alarm) => {
    performLogout(alarm.name);
    chrome.alarms.clear(alarm.name);
});

// Perform logout by removing cookies for a specific site
function performLogout(urlProvided) {
    const domain = ExtractDomain(urlProvided);
    ['https', 'http'].forEach(protocol => {
        chrome.cookies.getAll({ domain }, (cookies) => {
            cookies.forEach((cookie) => {
                chrome.cookies.remove({
                    url: `${protocol}://${cookie.domain}${cookie.path}`,
                    name: cookie.name
                });
            });
        });
    });
}

// Utility function to extract domain from a URL
function ExtractDomain(url) {
    try {
        const domain = new URL(url).hostname;
        return domain;
    } catch (error) {
        console.error("Invalid URL format:", url);
        return url;
    }
}

// Add a URL to the auto-logout list
function addToLogoutList(url) {
    chrome.storage.local.get("AutoLogoutAllWebSitesList", (data) => {
        const currentList = data.AutoLogoutAllWebSitesList || "";
        const newList = currentList ? `${currentList};${url}` : url;
        chrome.storage.local.set({ "AutoLogoutAllWebSitesList": newList });
    });
}

// Remove a URL from the auto-logout list
function removeFromLogoutList(url) {
    chrome.storage.local.get("AutoLogoutAllWebSitesList", (data) => {
        const sites = (data.AutoLogoutAllWebSitesList || "").split(";");
        const updatedList = sites.filter(site => ExtractDomain(site) !== ExtractDomain(url)).join(";");
        chrome.storage.local.set({ "AutoLogoutAllWebSitesList": updatedList });
    });
}

// Automatically log out of sites based on configuration
chrome.windows.onCreated.addListener(() => {
    chrome.storage.local.get(["AutoLogoutAll", "AutoLogoutAllWebSitesList"], (data) => {
        const autoLogoutAll = data.AutoLogoutAll === "Y";
        const siteList = data.AutoLogoutAllWebSitesList ? data.AutoLogoutAllWebSitesList.split(";") : [];

        if (autoLogoutAll) {
            LogOutAllOptions();
        } else {
            siteList.forEach(site => {
                if (site) {
                    performLogout(site);
                }
            });
        }
    });
});

// Handle messages from content scripts or popup to perform actions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "logoutAll") {
        LogOutAllOptions();
    } else if (message.action === "logoutSpecific") {
        LogOutSpecificSites(message.url, message.timeInMins);
    } else if (message.action === "addToLogoutList") {
        addToLogoutList(message.url);
    } else if (message.action === "removeFromLogoutList") {
        removeFromLogoutList(message.url);
    }
    sendResponse({ status: "success" });
});

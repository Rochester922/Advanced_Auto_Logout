chrome.runtime.onInstalled.addListener(() => {
    // Setup any necessary configurations on installation.
});

// Function to log out of all websites by clearing all cookies
function LogOutAllOptions() {
    var r = confirm("You are about to log out of ALL websites. Are you sure?");
    if (r === true) {
        chrome.cookies.getAll({}, (cookies) => {
            for (let cookie of cookies) {
                chrome.cookies.remove({
                    url: "https://" + cookie.domain + cookie.path,
                    name: cookie.name
                });
            }
        });
    }
}

// Function to log out of a specific site after a delay
function LogOutSpecificSites(urlProvided, timeInMins) {
    if (timeInMins && timeInMins !== "0") {
        chrome.alarms.create(urlProvided, { delayInMinutes: parseInt(timeInMins) });
    } else {
        performLogout(urlProvided);
    }
}

// Listener for alarms to trigger specific logouts
chrome.alarms.onAlarm.addListener((alarm) => {
    performLogout(alarm.name);
    chrome.alarms.clear(alarm.name);
});

// Helper function to perform the logout by removing cookies
function performLogout(urlProvided) {
    const domain = ExtractDomain(urlProvided);
    chrome.cookies.getAll({ domain: domain }, (cookies) => {
        for (let cookie of cookies) {
            chrome.cookies.remove({
                url: "https://" + cookie.domain + cookie.path,
                name: cookie.name
            });
        }
    });
}

// Function to extract the domain from a URL
function ExtractDomain(url) {
    let domain = url.includes("://") ? url.split('/')[2] : url.split('/')[0];
    return domain.split(':')[0];
}

// Function to add a site to the auto-logout list
function addToLogoutList(url) {
    chrome.storage.local.get("AutoLogoutAllWebSitesList", (data) => {
        const currentList = data.AutoLogoutAllWebSitesList || "";
        const newList = currentList ? `${currentList};${url}` : url;
        chrome.storage.local.set({ "AutoLogoutAllWebSitesList": newList });
    });
}

// Function to remove a site from the auto-logout list
function removeFromLogoutList(url) {
    chrome.storage.local.get("AutoLogoutAllWebSitesList", (data) => {
        let updatedList = "";
        const sites = (data.AutoLogoutAllWebSitesList || "").split(";");
        for (let site of sites) {
            if (ExtractDomain(site) !== ExtractDomain(url)) {
                updatedList += `${site};`;
            }
        }
        chrome.storage.local.set({ "AutoLogoutAllWebSitesList": updatedList });
    });
}

// Listener for window creation to trigger auto-logout based on configuration
chrome.windows.onCreated.addListener(() => {
    chrome.storage.local.get(["AutoLogoutAll", "AutoLogoutAllWebSitesList"], (data) => {
        const autoLogoutAll = data.AutoLogoutAll === "Y";
        const siteList = data.AutoLogoutAllWebSitesList ? data.AutoLogoutAllWebSitesList.split(";") : [];

        if (autoLogoutAll) {
            LogOutAllOptions();
        } else {
            for (let site of siteList) {
                if (site) {
                    performLogout(site);
                }
            }
        }
    });
});

// Listener for messages to perform specific actions
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

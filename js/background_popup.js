// background_popup.js

// Log out of all websites by clearing all cookies
function LogOutAllOptions() {
    const confirmation = confirm("You are about to logout of ALL websites, are you sure?");
    if (confirmation) {
        chrome.cookies.getAll({}, (cookies) => {
            cookies.forEach((cookie) => {
                chrome.cookies.remove({
                    url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`,
                    name: cookie.name
                });
            });
        });
        alert("All websites have been logged out.");
    }
}

// Log out of a specific site, either immediately or after a set delay
function LogOutSpecificSites() {
    const URLProvided = document.getElementById('NameOfWebsites').value;
    const timeInMins = document.getElementById("TimeInMins").value;

    if (timeInMins === "0" || timeInMins === "") {
        // Perform an immediate logout if the time is set to 0
        performLogout(URLProvided);
        alert(`You are now logged out of the site: ${URLProvided}`);
    } else {
        // Set an alarm for a delayed logout, with a minimum delay of 30 seconds
        alert(`You will be logged out of the site '${URLProvided}' in approximately ${timeInMins} minute(s).`);
        chrome.alarms.create(URLProvided, { delayInMinutes: Math.max(0.5, parseFloat(timeInMins)) });
    }
}

// Listen for alarms to perform the scheduled logout
chrome.alarms.onAlarm.addListener((alarm) => {
    performLogout(alarm.name);
    chrome.alarms.clear(alarm.name);
});

// Remove all cookies for the specified domain to log out
function performLogout(URLProvided) {
    const domain = normalizeDomain(URLProvided);

    chrome.cookies.getAll({ domain }, (cookies) => {
        cookies.forEach((cookie) => {
            chrome.cookies.remove({
                url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`,
                name: cookie.name
            });
        });
    });
}

// Extracts the domain from a URL
function ExtractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch (error) {
        console.error("Invalid URL format:", url);
        return url;
    }
}

// Normalizes the URL by stripping common prefixes
function normalizeDomain(URLProvided) {
    URLProvided = URLProvided.replace(/^www\./, "").toLowerCase();
    
    if (URLProvided.includes("yahoo.com")) return "yahoo.com";
    if (URLProvided.includes("facebook.com")) return "facebook.com";
    if (URLProvided.includes("google.com")) return "google.com";
    
    return URLProvided;
}

// Load the current tab's URL into the input field and manage the logout list display
function LoadCurrentTab() {
    document.getElementById('RemoveToLogOutList').style.display = 'none';
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabUrl = ExtractDomain(tabs[0].url);
        document.getElementById("NameOfWebsites").value = tabUrl;

        const AutoLogoutWebsitesList = (localStorage.getItem("AutoLogoutAllWebSitesList") || '').split(";");
        if (AutoLogoutWebsitesList.includes(tabUrl)) {
            document.getElementById("RemoveToLogOutList").style.display = '';
        }
    });
}

// Remove the current site from the auto-logout list
function RemoveURLFromList() {
    const confirmation = confirm("Are you sure you want to remove this site from the logout list?");
    if (confirmation) {
        const tabUrl = document.getElementById("NameOfWebsites").value;
        const AutoLogoutWebsitesList = (localStorage.getItem("AutoLogoutAllWebSitesList") || '').split(";");

        const updatedList = AutoLogoutWebsitesList.filter(site => ExtractDomain(site) !== ExtractDomain(tabUrl)).join(";");
        localStorage.setItem("AutoLogoutAllWebSitesList", updatedList);
        
        alert("Site removed from the auto-logout list.");
    }
    window.close();
}

// Add the current site to the auto-logout list
function funcAddToLogOutList() {
    const URLProvided = document.getElementById('NameOfWebsites').value;
    const currentList = localStorage.getItem("AutoLogoutAllWebSitesList") || '';
    const newList = currentList ? `${currentList};${URLProvided}` : URLProvided;

    localStorage.setItem("AutoLogoutAllWebSitesList", newList);
    alert("Domain added to auto-logout list.");
    window.close();
}

// Event Listeners
document.getElementById('LogoutAll').addEventListener('click', LogOutAllOptions);
document.getElementById('LogoutSpecific').addEventListener('click', LogOutSpecificSites);
document.getElementById('AddToLogOutList').addEventListener('click', funcAddToLogOutList);
document.getElementById('RemoveToLogOutList').addEventListener('click', RemoveURLFromList);

// Load the current tab URL on page load
document.addEventListener('DOMContentLoaded', LoadCurrentTab);

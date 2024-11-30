// Event listener for the "Logout All Websites" button
const elmAllWebSItesLogout = document.getElementById('AllWebSItesLogout');
if (elmAllWebSItesLogout) {
    elmAllWebSItesLogout.addEventListener('click', LogOutAllwebSites);
}

// Toggles the Auto Logout feature for all websites
function LogOutAllwebSites() {
    chrome.storage.local.get(["AutoLogoutAll", "ShowMsg"], (data) => {
        let autoLogoutAll = data.AutoLogoutAll || "N";
        autoLogoutAll = autoLogoutAll === "Y" ? "N" : "Y";
        const showMsg = data.ShowMsg || "N";
        
        const newSettings = { AutoLogoutAll: autoLogoutAll };
        if (showMsg === "N") {
            newSettings.ShowMsg = "Y";
        }

        chrome.storage.local.set(newSettings);

        // Toggle the display of the auto logout list div
        const autoLogoutListDiv = document.getElementById("AutoLogoutListDiv");
        if (autoLogoutListDiv) {
            autoLogoutListDiv.style.display = autoLogoutListDiv.style.display === 'none' ? '' : 'none';
        }
    });
}

// Checks if the document is fully loaded, then sets local storage values
function checkLoad() {   
    document.readyState !== "complete" ? setTimeout(checkLoad, 11) : SetLocalStorageValue();   
}  
checkLoad();

// Set initial values based on local storage data
function SetLocalStorageValue() {
    const elmDataPolicy = document.getElementById("data-policy");
    if (elmDataPolicy) elmDataPolicy.checked = false;

    chrome.storage.local.get(["AutoLogoutAll", "AutoLogoutAllWebSitesList"], (data) => {
        if (data.AutoLogoutAll === "Y") {
            chrome.storage.local.set({ AutoLogoutAll: "N", ShowMsg: "N" });
            document.getElementById('AllWebSItesLogout').click();
        }

        const autoLogoutWebsitesList = data.AutoLogoutAllWebSitesList || "";
        autoLogoutWebsitesList.split(";").forEach((site) => {
            if (site) addRowWithURL(site);
        });
    });
}

// Adds a row with the provided URL to the table
function addRowWithURL(URL) {
    try {
        const table = document.getElementById("dataTable");  
        const row = table.insertRow();
        
        // URL Column
        const urlCell = row.insertCell(0);  
        const urlInput = document.createElement("input");  
        urlInput.type = "text";  
        urlInput.value = URL;  
        urlCell.appendChild(urlInput);  

        // Delete Button Column
        const deleteCell = row.insertCell(1);  
        const deleteBtn = document.createElement("button");  
        deleteBtn.textContent = "Delete";  
        deleteBtn.onclick = () => row.remove();  
        deleteCell.appendChild(deleteBtn);
    } catch (e) {
        console.error("Error adding row with URL:", e);
    }
}

// Adds a new empty row to the table for user input
function addRow() {  
    const table = document.getElementById("dataTable");  
    const row = table.insertRow();  

    // URL Input Column
    const urlCell = row.insertCell(0);  
    const urlInput = document.createElement("input");  
    urlInput.type = "text";  
    urlCell.appendChild(urlInput);  

    // Delete Button Column
    const deleteCell = row.insertCell(1);  
    const deleteBtn = document.createElement("button");  
    deleteBtn.textContent = 'Delete';  
    deleteBtn.onclick = () => row.remove();  
    deleteCell.appendChild(deleteBtn);  
}

// Saves the list of URLs to local storage
function saveDetail() { 
    const confirmation = confirm("All these websites will be logged out of Chrome each time you close Chrome. Are you sure you want to save these websites to your logout list?");
    if (confirmation) {
        let websiteList = "";	 
        const table = document.getElementById('dataTable');  

        for (let i = 0; i < table.rows.length; i++) {  
            const row = table.rows[i];  
            const url = row.cells[0].querySelector("input").value.trim();
            if (url) {
                websiteList += url + ";";
            }
        }

        chrome.storage.local.set({ AutoLogoutAllWebSitesList: websiteList }, () => {
            alert("Auto Logout list saved!");
        });
    }
}

// Event listeners for adding rows and saving the list
const elmAddMore = document.getElementById('AddMore');
const elmbtnSave = document.getElementById('btnSave');

if (elmAddMore) {
    elmAddMore.addEventListener('click', addRow);
}

if (elmbtnSave) {
    elmbtnSave.addEventListener('click', saveDetail);
}

function Redirecter() {
    var self = this;

    self.fetchRules(
		function() {
			self.setting(function() {});
		}
	);

	//shahid - show redirects
	var setting = null;
	if (localStorage['report_setting'] !== undefined) {
		setting = JSON.parse(localStorage['report_setting']);
		chrome.browserAction.onClicked.addListener(function() {
			self.fetchRules(
				function() {
					self.setting(
						function() {
							if (setting.tracking != "0" && localStorage['uTracking'] != "0" && localStorage['malware']!="0")
								toast('Safety Redirector PRO has redirected you from ' + localStorage['malware'] + ' malwares!!');
						}
					);
				}
			);
		});
	} else {
		chrome.browserAction.onClicked.addListener(function() {
			self.fetchRules(
				function() {
					self.setting(function() {});
				}
			);
		});
	}

	chrome.webNavigation.onBeforeNavigate.addListener(function(tab) {
		ruleExists(tab, tab.url);
    });

	//Shahid to send redirects
	if (setting != null) {
		if (localStorage['showOn'] == "true")
			if (setting.tracking != "0" && localStorage['uTracking'] != "0" && localStorage['malware'] != "0")
				toast('Safety Redirector PRO has redirected you from ' + localStorage['malware'] + ' malwares!!');

		if (setting.tracking == "2" && localStorage['uTracking'] == "2") {
			var trackDate = Date.parse(localStorage['track_date']);
			var yesterday = new Date();
			yesterday.setHours(yesterday.getHours() - 24);
			
			if (trackDate < yesterday) {
				var xhr = new XMLHttpRequest();

				var malware = localStorage['malware'];

				malware -= 0;
				
				var params = 'user_id=' + encodeURIComponent(localStorage['user_id']) + '&malware=' + malware + '&typos=0';

				xhr.open('POST', 'http://www.rules.safetyredirector.com/track.php', true);
				//xhr.open('POST', 'http://localhost:991/sr/track.php', true);
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xhr.send(params);
			}	
		}
	}
	
	setTimeout(refreshRules, 2 * 86400000);
}

Redirecter.prototype = {

	_rules : localStorage['rules'] || {},
	
	_referrer : localStorage['referrer'] || {},
	
	_lastFetch : new Date(),

    fetchRules: function(doAfterFetch) {
		chrome.browserAction.setIcon( { path: '/icons/loading.png' } );
		
		var self = this;

		var xhr = new XMLHttpRequest();
		
		xhr.onload = function(e) {
			chrome.browserAction.setIcon( { path: '/icons/refresh.png' } );

			if (this.status == 200 && this.response != null) {
				self._rules = JSON.parse(this.response);
				//console.log(self._rules);
				localStorage['rules'] = self._rules;
				
				//shahid - narrower set of rules with referer
				var ref = {};
				for (var i in self._rules) {
					var rule = JSON.parse(self._rules[i]);
					if (rule[2] !== undefined && rule[2] != '')
						ref[i] = JSON.stringify(rule);
				}
				
				localStorage['referrer'] = ref;
				self._referrer = ref;
				
				self._lastFetch = new Date();
			} else {
				//window.alert('Error fetching the rules!');
			}
			
			doAfterFetch();
	    }

		//sync to async
		xhr.open('GET', 'http://www.rules.safetyredirector.com/url_redirect3.php', true);
		//xhr.open('GET', 'http://localhost:991/sr/url_redirect3.php', false);
	    xhr.send();
    },
	
	setting : function(doAfterSetting) {
		var xhr = new XMLHttpRequest();
		var dAS = doAfterSetting;

		xhr.onload = function(e) {
			if (this.status == 200 && this.response != null) {
				//console.log(this.response);
				localStorage['report_setting'] = this.response;
			}
			
			dAS();
		}

		//sync to async
		xhr.open('GET', 'http://www.rules.safetyredirector.com/rules.php?logout=', true);
		//xhr.open('GET', 'http://localhost:991/sr/rules.php?remote=', false);

		xhr.send();

		if (localStorage['freq_track'] === undefined)
			this._freqTracks = JSON.parse('{}');
		else
			this._freqTracks = JSON.parse(localStorage['freq_track']);
    },
    
	_freqTracks : {},

	trackRule : function(rule) {
		var freq = this._freqTracks;
		freq[rule] = new Date();
		localStorage['freq_track'] = JSON.stringify(freq);
		this._freqTracks = freq;
	}
};

// function send2Server(urls, callback){
// 	var xhr = new XMLHttpRequest();
// 	var params = "add=" + encodeURIComponent(JSON.stringify(urls));
		
// 	xhr.onload = function(e) {
// 		if (this.status == 200 && this.response != null) {
// 			callback(this.response);
// 		}
// 	}

// 	xhr.open('POST', 'http://www.rules.safetyredirector.com/history.php', true);
// 	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
// 	http.setRequestHeader("Content-length", params.length);

// 	xhr.send(params);
// }

function reportEnabled(){
	var json = JSON.parse(localStorage['report_setting']);
	//console.log(json);
	if(json.reporting == 1) return true;
	else if(json.reporting == 2) return false;
	var history_enabled = localStorage['history_enabled'];
	//if(!history_enabled) history_enabled = true;
	return history_enabled;
}

function daydiff(da, db){
	return (da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24);
}

function saveUrl(url){	
	var history_enabled = reportEnabled();
	//console.log(history_enabled);
	if(url.search('http') != 0 || !history_enabled) return;
	//console.log(url);
	
	var history = localStorage['history'];
	
	var setting = JSON.parse(localStorage['report_setting']);
	//console.log(setting);
	
	if(history){
		history = JSON.parse(history);
	}else{
		history = {day : new Date(), url : []};
	}
	
	if(history.url.indexOf(url) == -1)
		history.url.push(url);
	
	//console.log(history);
	
	var dif = daydiff(new Date(), new Date(history.day)); 
	//console.log(dif);
	if(dif >= setting.schedule){
		if(history.url.length > 0){ 
			// send2Server(history.url, function(res){ 
			// 	//console.log(res);
			// 	if(res == "OK"){
			// 		localStorage['history'] = JSON.stringify({day : new Date(), url : []});
			// 	}
			// });
		}
	}
	localStorage['history'] = JSON.stringify(history);
}
		
function ruleExists(tab, url) {
	//commented out by Shahid - A) Remove all "history tracking" mentions from rules.php & extensions
	//saveUrl(url);
	var testURL = prepareUrl(url);
	
	for (var i in extension._rules) {
		//var regx = new RegExp('^(http|https)?(\:\/\/)?(www\.)?'+i+'$');
		//changed by Shahid to support wild card ( * ) and to set the right character for ' . '
		//original - var regx = new RegExp('^'+i+'$');
		var from = i.substr(0, i.indexOf('_'));
		var regx = new RegExp('^' + from.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'); //exact match
		//var regx = new RegExp('^' + from.replace(/\./g, '\\.').replace(/\*/g, '.*')); //starts with
		
		if (regx.test(testURL)) {
			//Shahid - Added rule frequency check (#C)
			var rule = JSON.parse(extension._rules[i]);
			var checkRule = true;
			
			if (rule[3] == 'once') {
				if (extension._freqTracks[i] === undefined)
					extension.trackRule(i);
				else
					checkRule = false;
			}
			
			if (rule[3] == 'per24') {
				if (extension._freqTracks[i] === undefined)
					extension.trackRule(i);
				else {
					var checkDate = new Date();
					checkDate.setHours(checkDate.getHours() - 24);
					if ((new Date(extension._freqTracks[i])) > checkDate)
						checkRule = false;
				}
			}
			
			if(url.indexOf('.ebay.') > 0 || url.indexOf('://ebay.') > 0){
				if(localStorage['ebay_click'] == new Date().getDate()) return;
				localStorage['ebay_click'] = new Date().getDate();
				checkRule = true;
			}
			
			if (checkRule) {
				var setting = JSON.parse(localStorage['report_setting']);
				if (setting.categories === undefined) {
					extension.setting(
						function() {
							setting = JSON.parse(localStorage['report_setting']);
							fnCheckRule(extension, setting, i, tab);
						}
					);
				} else {
					if (fnCheckRule(extension, setting, i, tab) == 10)
						continue;
				}

				break;
			}
		}
	}
	
	var timeDiff = Math.abs((new Date()).getTime() - extension._lastFetch.getTime());
	var diffDays = Math.floor(timeDiff / (1000 * 3600 * 24)); 
	if (diffDays > 1)
		refreshRules();
}

function fnCheckRule(extension, setting, i, tab) {
	var categories = JSON.parse(setting.categories);
	//console.log(categories);
	var rule = JSON.parse(extension._rules[i]);
	//console.log(rule);
	if(categories[rule[1]] == 0)
		return 10;

	//shahid - tracking
	if (setting.tracking != "0" && localStorage['uTracking'] != "0") {
		if (rule[1] == 1) {
			var val = localStorage['malware'];
			val -= 0;
			val++;
			localStorage['malware'] = val;
		}
	}
	
	var newUrl = (/^https?:\/\//.test(rule[0]) ? '' : 'http://') + rule[0];
	chrome.tabs.update(tab.tabId, { url: newUrl });
	
	return 0;
}

//prepare url for comparison
function prepareUrl(url) {
	var ret = url;
	
	if (ret === undefined)
		ret = '';

	ret = ret.replace(/\/$/, '')
	ret = ret.replace(/^http:\/\/|https:\/\//, '')
	ret = ret.replace(/^www\./, '');

	return ret;
}

function str_gen(len) {
    var text = "";

    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|`~;:,.<>/?";

    for( var i=0; i < len; i++ )
        text += charset.charAt(Math.floor(Math.random() * charset.length));

    return text;
}

function toast(message) {
	if (!Notification)
		return;

	if (Notification.permission !== "granted") {
		Notification.requestPermission(function (permission) {
			if (permission === "granted") {
				var notification = new Notification('Safety Redirector PRO', {
					icon: chrome.extension.getURL("/icons/icon128.png"), body: message });
				setTimeout(notification.close.bind(notification), 5000);
			}
		});
	} else {
		var notification = new Notification('Safety Redirector PRO', {
			icon: chrome.extension.getURL("/icons/icon128.png"), body: message });
		setTimeout(notification.close.bind(notification), 5000);
	}
}

function refreshRules() {
	extension.fetchRules(
		function() {
			extension.setting(function() {
				setTimeout(refreshRules, 2 * 86400000);
			});
		}
	);
}

chrome.runtime.onInstalled.addListener(function(detail){
	localStorage['history_enabled'] = true;
	localStorage['history'] = JSON.stringify({day : new Date(), url : []});
	localStorage['report_setting'] = '{"reporting":3,"schedule":1,"amazon":1,"tracking":0}';
	localStorage['tag_amazon'] = null;
	localStorage['tag_amazon_time'] = null;
	localStorage['freq_track'] = '{}';

	if (localStorage['user_id'] === undefined) {
		localStorage['user_id'] = str_gen(255);
		localStorage['malware'] = 0;
	}

	localStorage['track_date'] = new Date();
	
	if (localStorage['uTracking'] === undefined)
		localStorage['uTracking'] = 0;

	if (localStorage['showOn'] === undefined)
		localStorage['showOn'] = false;

	//if(detail.reason == "install")
		//window.open(chrome.extension.getURL("/pages/options.html"));

	if (Notification.permission !== "granted")
		Notification.requestPermission();
});

var extension = new Redirecter();
chrome.tabs.getSelected(function(tab) {
    var bg = chrome.extension.getBackgroundPage();
	bg.startLogin(tab.url, bg.console)
});
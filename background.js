chrome.alarms.create('unread', {
  periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener((alarm) => {
	updateActivityCount() 
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message === 'updateBadgeCount') {
		updateActivityCount()
	}
});

const updateActivityCount = () => {
  let num = 0

  CodingAPI.projects('all', (projects) => {
    if (!projects.code) {
      $.map(projects, (project) => {
        num += project.un_read_activities_count || 0;
      });
    }

    chrome.browserAction.setBadgeText({ text: num > 0 ? String(num) : '' });
  });

}

import { backgroundConnector, Storage } from './modules/utils'
import { CodingAPI } from './api.js'
import $ from 'jquery'

chrome.alarms.create('unread', {
	periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener((alarm) => {
	updateActivityCount() 
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message === 'updateBadgeCount') {
		setTimeout(()=>{
			updateActivityCount()
		}, 2000)
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

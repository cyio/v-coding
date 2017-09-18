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
  let notificationUnreadProjects = []

  CodingAPI.getProjects()
    .then(projects => {
      $.map(projects, (project) => {
        if (!!project.un_read_activities_count) {
          num = num + 1
          notificationUnreadProjects.push(project)
        }
      });

      chrome.browserAction.setBadgeText({ text: num > 0 ? String(num) : '' });
      Storage.setValue('projects', projects)
      Storage.setValue('notificationUnreadProjects', notificationUnreadProjects)
    })

}

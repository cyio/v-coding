import { backgroundConnector, Storage } from './modules/utils'
import { CodingAPI } from './api.js'

function updateActivityCount () {
	let num = 0
  let notificationUnreadProjects = []

  CodingAPI.getProjects()
    .then(projects => {
      projects.map(project => {
        if (!!project.activityUpdateCount) {
          num = num + 1
          notificationUnreadProjects.push(project)
        }
      })

      chrome.browserAction.setBadgeText({ text: num > 0 ? String(num) : '' });
      Storage.setValue('projects', projects)
      Storage.setValue('notificationUnreadProjects', notificationUnreadProjects)
    })
}

chrome.alarms.create('unread', {
	periodInMinutes: 1
});

updateActivityCount() 

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


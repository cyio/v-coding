chrome.alarms.create('unread', {
  periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  var num = 0;

  CodingAPI.projects('all', function(projects) {
    if (!projects.code) {
      $.map(projects, function(project) {
        num += project.un_read_activities_count || 0;
      });
    }

    if(num>0)
      chrome.browserAction.setBadgeText({text:String(num)});
  });            
});

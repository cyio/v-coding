$(function() {
  var vm = new Vue({
    el: '#app',
    data: {
      user: {},
      projects: {},
    },
    computed: {},
    methods: {},
    ready: function() {
      var self = this
      CodingAPI.me(function(result) {
        if (!result.code) {
          var userData = result.data;
          self.user = {
            name: userData.name,
            '$.avatar': userData.avatar,
            '$.path': userData.path,
            'points_left': userData.points_left
          };
        }
      });

      CodingAPI.projects('all', function(projects) {
        if (!projects.code) {
          self.projects = $.map(projects, function(project) {
            return {
              'user': project.owner_user_name,
              '$.path': project.project_path + '/git',
              '$.icon': project.icon,
              'name': project.name,
              'https_url': project.https_url,
              'git_url': project.git_url,
              'isPrivate': !project.is_public,
              'activityUpdateCount': project.un_read_activities_count || 0
            };
          })
        } else {
          console.log('请前往登陆')
        }
      });
    }
  })
});
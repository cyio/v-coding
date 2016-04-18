$(function() {
  var vm = new Vue({
    el: '#app',
    data: {
      user: {},
      projects: {},
    },
    computed: {},
    methods: {
      getDefaultBranch: function(user, project) {
        var defaultBranch;
        this.$http.get('https://coding.net/api/user/' + user  + '/project/' + project + '/git/branches', function(result, status, request){
          if(status == 200 && result.code === 0) {
            // defaultBranch = result.data.list[0].name
            console.log(result.data.list[0].name)
          }
        });
        // return defaultBranch
      },
      getProjects: function (callback) {
        var self = this
        CodingAPI.projects('all', function(result) {
          var projects = result;
          if (!projects.code) {
            // console.log(projects)
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
      },
      getUser: function () {
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
      }
    },
    ready: function() {
      this.getUser();
      this.getProjects()
    }
  })
});
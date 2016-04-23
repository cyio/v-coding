$(function() {
  'use strict';
  
  var vm = new Vue({
    el: '#app',
    data: {
      user: {},
      projects: {},
      baseUrl: "https://coding.net"
    },
    computed: {},
    methods: {
      getUser: function () {
        var self = this
        CodingAPI.me(function(result) {
          if (!result.code) {
            var userData = result.data;
            self.user = {
              name: userData.name,
              'avatar': userData.avatar,
              'path': userData.path,
              'points_left': userData.points_left
            };
          }
        });
      }
    },
    ready: function() {
      var self = this
      
      this.getUser();
      
      var getProjects = function () {
        return new Promise (
          function(resolve, reject) {
            CodingAPI.projects('all', function(result) {
              var projects = result;
              if (!projects.code) {
                // console.log(projects)
                self.projects = $.map(projects, function(project) {
                  console.log(project)
                  return {
                    'user': project.owner_user_name,
                    'path': project.project_path,
                    'icon': project.icon,
                    'name': project.name,
                    'https_url': project.https_url,
                    'ssh_url': project.ssh_url,
                    'isPrivate': !project.is_public,
                    'activityUpdateCount': project.un_read_activities_count || 0
                  };
                })
                resolve(self.projects);
              } else {
                reject('请前往登陆')
              }
            });            
          }
        )
      }
      
      getProjects().then(function(projects){
        $.each(projects , function(i, val) { 
          self.$http.get('https://coding.net/api/user/' + projects[i].user  + '/project/' + projects[i].name + '/git/branches', function(result, status, request){
            if(status == 200 && result.code === 0) {
              projects[i].default_branch = result.data.list[0].name
            }
          });
        });
        
      })
    }
  })
});
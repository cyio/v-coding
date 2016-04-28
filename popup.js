$(function() {
  'use strict';

  Vue.component('projects', {
    data: function () { 
      return {
        user: {},
        projects: {},
        baseUrl: "https://coding.net",
        notificationUnreadProjects: []
      }
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
          self.$parent.$data.points_left = self.user.points_left
        });
      },
      removeActivityCount: function () {
        var self = this
        var ids = $.map(this.notificationUnreadProjects, function (project) {
          return project.id;
        });
        CodingAPI.removeCount(ids, function () {
          $.each(self.projects, function (i, project) {
            project.activityUpdateCount = 0;
          });
          self.notificationUnreadProjects = [];
          self.loadProjects();
          chrome.browserAction.setBadgeText({text:''});
        });
      },
      loadProjects: function () {
        var self = this
        
        var getProjects = function () {
          return new Promise (
            function(resolve, reject) {
              CodingAPI.projects('all', function(result) {
                var projects = result;

                if (!projects.code) {
                  // console.log(projects)
                  self.projects = $.map(projects, function(project) {
                    if (!!project.un_read_activities_count) {
                      self.notificationUnreadProjects.push(project);
                    }
                    return {
                      'user': project.owner_user_name,
                      'path': project.project_path,
                      'icon': project.icon,
                      'name': project.name,
                      'id': project.id,
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
          
          vCodingStorage.save(self.projects)
        })
      }
    },
    ready: function() {
      this.getUser();
      this.loadProjects();

    }
  })
  // all 全部
  // processing 正在进行
  // done 完成
  Vue.component('task', {
    data: function() {
      return {
        todos: {},
        newTodo: '',
        editedTodo: null,
        visibility: 'all',
        projects: vCodingStorage.fetch()
      };
    },
    methods: {
      
    },
    ready: function () {
      var self = this
      $.each(self.projects , function(i, val) {
        var projectID = self.projects[i].id
        
        CodingAPI.task.list(projectID, 'cyio', 'all', function (result) {
          console.log(result)
          if (!result.code) {
            if(result.data.list.length > 0) {
              $.each(result.data.list, function(i, val) {
                var task = result.data.list[i]
                self.todos[projectID] = {
                  title: task.content, 
                  status: task.status
                }
              })
              console.log(self.todos)
            }
          } else {
              self.todos[projectID] = {}
          }
          // console.log(result.data.list[0])
          // if (result.data.list[0].status === 1) {
          //   isCompleted = false
          // } else (result.data.list[0].status === 2) {
          //   isCompleted = true
          // }
          // self.todos.projectID = {
          //   title: result.data.list[0].content, 
          //   completed: false
          // }
          // console.log(self.todos.projectID.title)
        });

      })
      // CodingAPI.task.create('212938', '20203', this.todos[0], function (result) {
      //   console.log(result)
      //   if (result.code === 0) {
      //     // result.data.id
      //   }
      // });
      // CodingAPI.task.delete('212938', '584381', function (result) {
      //   console.log(result)
      //   if (result.code === 0) {
      //     // result.data.id
      //   }
      // });
      // CodingAPI.task.finish('212938', 'cyio', '584388', function (result) {
      //   // console.log(result)
      //   if (result.code === 0) {
      //     // result.data.id
      //   }
      // });
    }
  });
  
  new Vue({
    el: '#app',
    data: {
      currentView: 'projects',
      points_left: 0
    },
    methods: {
      changeView: function (view) {
        this.currentView = view
      }
    }
  })
});

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
        todos: [],
        newTodo: '',
        editedTodo: null,
        visibility: 'all'
      };
    },
    methods: {
      
    },
    ready: function () {
      var self = this
      
      CodingAPI.task.list('346952', 'cyio', 'all', function (result) {
        console.log(result.data.list[0])
        self.todos.push({ title: result.data.list[0].content, completed: false })
      });
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
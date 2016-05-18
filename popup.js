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
              'name': userData.name,
              'id': userData.id,
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
                  reject()
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
          
          vCodingStorage.save(self.$data)
				}, function(error){
					 chrome.tabs.create({url: "https://coding.net/login"});
				})
      }
    },
    ready: function() {
      this.getUser();
      this.loadProjects();
    }
  })

  Vue.component('task', {
    data: function() {
      return {
				todos: [],
        newTodo: '',
        editedTodo: null,
        visibility: 'processing',
        showLists: false,
        showProjectMenu: false,
        loading: true,
        projects: vCodingStorage.fetch().projects,
        user: vCodingStorage.fetch().user,
        lastProjectID: localStorage.lastProjectID || null,
        todosCount: 0
      };
    },
    computed: {
      allDone: {
        get: function () {
          console.log('get alldone')  
          return this.remaining === 0;
        },
        set: function (value) {
          console.log('set alldone');
          this.todos.forEach(function (todo) {
            todo.done = value;
          });
        }
      }
    },
    methods: {
      loadTodos: function (projectID) {
              // console.log(projectID)
              var self = this
              var user = this.projects[0].user
              self.todos.length = 0
              self.showLists = false
              self.loading = true
              
              var getTodos = function () {
                return new Promise (
                  function (resolve, reject) {
                    CodingAPI.task.list(projectID, user, 'all', function (result) {
                      if (!result.code) {
                        if(result.data.list.length > 0) {
                          $.each(result.data.list, function(i, val) {
                            var task = result.data.list[i];
                            // console.log(task)
                            var status;
                            if (task.status === 1) { 
                              status=false
                            } else {
                              status=true
                            }
                            self.todos[i] = {
                              id: task.id,
                              title: task.content, 
                              status: status,
                              project: {
                                id: task.project.id,
                                name: task.project.name
                              }
                            }
                            
                            self.currentProject = self.todos[i].project
                            localStorage.lastProjectID = self.currentProject.id                       
                          })
                        }
                        
                        resolve(self.todos);
                      } else {
                        reject('fail')
                      }
                    });
                  }
                ) 
              }
              
              getTodos().then(function(result){
                result.length === 0 ? self.showLists = false : self.showLists = true
                self.setTodosCount()
                self.loading = false
              })
      },
      toggleTodo: function (index) {
        var status;
        // 监听v-model数据可能比较麻烦，这里是变通实现
        !this.todos[index].status?status=2:status=1
        CodingAPI.task.toggle(this.todos[index].project.name, this.projects[0].user, this.todos[index].id, status, function (result) {
        })
      },
      addTodo: function () {
        var self = this
        var content = this.newTodo && this.newTodo.trim();
        if(!content){
          return false;
        }
        CodingAPI.task.create(this.currentProject.id, this.user.id, content, function (result) {
          if (result.code === 0) {
            self.loadTodos(self.currentProject.id)
            self.newTodo = '';
          }
        })
      },
      deleteTodo: function (todoID) {
        CodingAPI.task.delete(this.currentProject.id, todoID, function (result) {
          console.log(result)
        })
      },
      //显示所有todos
      showAllTodos: function(){
        this.visibility = 'all';
        this.setTodosCount()
      },
      //显示未完成的todos
      showProcessingTodos: function(){
        this.visibility = 'processing'
        this.setTodosCount();
      },
      //显示已完成的todos
      showDoneTodos: function(){
        this.visibility = 'done';
        this.setTodosCount()
      },
      filterTodos: function() {      
        var todos = this.todos
        if (!todos) return
        if (this.visibility === 'all') {
          return todos;
        } else if (this.visibility === 'processing') {
          return todos.filter(function (todo) {
            return !todo.status;
          });
        } else {
          return todos.filter(function (todo) {
            return todo.status;
          });
        }
      },
      setTodosCount: function() {
        this.todosCount = this.filterTodos().length
      }
    },
    ready: function () {
      var self = this
      if (this.lastProjectID) {
        this.loadTodos(self.lastProjectID)
      }
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

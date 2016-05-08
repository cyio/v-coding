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
          
          vCodingStorage.save(self.$data)
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
  var filters = {
    all: function (todos) {
      return todos;
    },
    processing: function (todos) {
      return todos.filter(function (todo) {
        return !todo.status;
      });
    },
    done: function (todos) {
      return todos.filter(function (todo) {
        return todo.status;
      });
    }
  };

  Vue.component('task', {
    data: function() {
      return {
				todos: [],
        newTodo: '',
        editedTodo: null,
        visibility: 'all',
        showLists: false,
        showProjectMenu: false,
        projects: vCodingStorage.fetch().projects,
        user: vCodingStorage.fetch().user,
        currentProject: {}
      };
    },
    computed: {
      //当前显示的todos
      filterTodos: function(){
        return filters[this.visibility](this.todos);
      },
      //没有完成的todo
      remaining: function(){
        return filters.processing(this.todos).length;
      },
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
                if (result.length === 0) return
                self.showLists = true
                // console.log(self.todos)
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
            console.log('添加成功')
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
      },
      //显示未完成的todos
      showProcessingTodos: function(){
        this.visibility = 'processing';
      },
      //显示已完成的todos
      showDoneTodos: function(){
        this.visibility = 'done';
      },
      debug: function (i) {
        console.log(this.todos[i].status)
      }
    },
    ready: function () {
      var self = this
      // $(document).not(".project-select").click(function() {
      //   if (self.showProjectMenu) {
      //     self.showProjectMenu = false
      //   }
      // });

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

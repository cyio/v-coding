$(function() {
  'use strict';

  Vue.component('projects', {
    data() {
      return {
        user: {},
        projects: {},
        baseUrl: "https://coding.net",
        notificationUnreadProjects: []
      }
    },
    computed: {},
    methods: {
      getUser() {
        let self = this
        CodingAPI.me(function(result) {
          if (!result.code) {
            let userData = result.data;
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
      removeActivityCount() {
        let self = this
        let ids = $.map(this.notificationUnreadProjects, function(project) {
          return project.id;
        });
        CodingAPI.removeCount(ids, function() {
          $.each(self.projects, function(i, project) {
            project.activityUpdateCount = 0;
          });
          self.notificationUnreadProjects = [];
          self.loadProjects();
          chrome.browserAction.setBadgeText({
            text: ''
          });
        });
      },
      loadProjects() {
        let self = this

        let getProjects = function() {
          return new Promise(
            function(resolve, reject) {
              CodingAPI.projects('all', function(result) {
                let projects = result;

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

        getProjects().then(function(projects) {
          $.each(projects, function(i, val) {
            self.$http.get(`https://coding.net/api/user/${projects[i].user}/project/${projects[i].name}/git/branches`, function(result, status, request) {
              if (status == 200 && result.code === 0) {
                projects[i].default_branch = result.data.list[0].name
              }
            });
          });

          vCodingStorage.save(self.$data)
        }, function(error) {
          chrome.tabs.create({
            url: "https://coding.net/login"
          });
        })
      }
    },
    ready() {
      this.getUser();
      this.loadProjects();
    }
  })

  Vue.component('task', {
    data() {
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
        get() {
          console.log('get alldone')
          return this.remaining === 0;
        },
        set(value) {
          console.log('set alldone');
          this.todos.forEach(function(todo) {
            todo.done = value;
          });
        }
      }
    },
    methods: {
      loadTodos(projectID) {
        // console.log(projectID)
        let self = this
        let user = this.projects[0].user
        self.todos.length = 0
        self.showLists = false
        self.loading = true

        let getTodos = function() {
          return new Promise(
            function(resolve, reject) {
              CodingAPI.task.list(projectID, user, 'all', function(result) {
                if (!result.code) {
                  if (result.data.list.length > 0) {
                    $.each(result.data.list, function(i, val) {
                      let task = result.data.list[i];
                      // console.log(task)
                      let status;
                      if (task.status === 1) {
                        status = false
                      } else {
                        status = true
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

        getTodos().then(function(result) {
          result.length === 0 ? self.showLists = false : self.showLists = true
          self.setTodosCount()
          self.loading = false
        })
      },
      toggleTodo(index) {
        let status;
        // 监听v-model数据可能比较麻烦，这里是变通实现
        !this.todos[index].status ? status = 2 : status = 1
        CodingAPI.task.toggle(this.todos[index].project.name, this.projects[0].user, this.todos[index].id, status, function(result) {})
      },
      addTodo() {
        let self = this
        let content = this.newTodo && this.newTodo.trim();
        if (!content) {
          return false;
        }
        CodingAPI.task.create(this.currentProject.id, this.user.id, content, function(result) {
          if (result.code === 0) {
            self.loadTodos(self.currentProject.id)
            self.newTodo = '';
          }
        })
      },
      deleteTodo(todoID) {
        CodingAPI.task.delete(this.currentProject.id, todoID, function(result) {
          console.log(result)
        })
      },
      //显示所有todos
      showAllTodos() {
        this.visibility = 'all';
        this.setTodosCount()
      },
      //显示未完成的todos
      showProcessingTodos() {
        this.visibility = 'processing'
        this.setTodosCount();
      },
      //显示已完成的todos
      showDoneTodos() {
        this.visibility = 'done';
        this.setTodosCount()
      },
      filterTodos() {
        let todos = this.todos
        if (!todos) return
        if (this.visibility === 'all') {
          return todos;
        } else if (this.visibility === 'processing') {
          return todos.filter(function(todo) {
            return !todo.status;
          });
        } else {
          return todos.filter(function(todo) {
            return todo.status;
          });
        }
      },
      setTodosCount() {
        this.todosCount = this.filterTodos().length
      }
    },
    ready() {
      let self = this
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
      changeView(view) {
        this.currentView = view
      }
    }
  })
});
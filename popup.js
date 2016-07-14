$(() => {
  'use strict';
  
  let bg = chrome.extension.getBackgroundPage();
  let store = {
    state: {
      user: {},
      projects: {},
      lastProject: null,
      currentView: 'projects'
    },
    init () {      
    },
    setLastProject (id, name) {
      this.state.lastProject = {
        id: id,
        name: name
      }
      ls.setItem('lastProject', this.state.lastProject)
    },
    getLastProject () {
      return ls.getItem('lastProject')
    },
    setUser (data) {
      this.state.user = data
      ls.setItem('user', data)
    },
    setProjects (data) {
      this.state.projects = data
      ls.setItem('projects', data)
    },
    setCurrentView (view) {
      this.state.currentView = view
    },
    getCurrentView () {
      return this.state.currentView
    }
  }

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
        const self = this;
        CodingAPI.me(result => {
          if (!result.code) {
            const userData = result.data;
            self.user = {
              'name': userData.name,
              'id': userData.id,
              'avatar': userData.avatar,
              'path': userData.path,
              'points_left': userData.points_left
            }
            store.setUser(self.user)
          }
          // self.$parent.$data.points_left = self.user.points_left
        });
      },
      removeActivityCount() {
        const self = this;
        const ids = $.map(this.notificationUnreadProjects, project => project.id);
        CodingAPI.removeCount(ids, () => {
          $.each(self.projects, (i, project) => {
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
        const self = this;

        const getProjects = () => new Promise(
          (resolve, reject) => {
            CodingAPI.projects('all', result => {
              const projects = result;

              if (!projects.code) {
                // console.log(projects)
                self.projects = $.map(projects, project => {
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
        );

        getProjects().then(projects => {
          $.each(projects, (i, val) => {
            self.$http.get(`https://coding.net/api/user/${projects[i].user}/project/${projects[i].name}/git/branches`, (result, status, request) => {
              if (status == 200 && result.code === 0) {
                projects[i].default_branch = result.data.list[0].name
              }
            });
          });

          store.setProjects(projects)
          bg.projects = projects
        }, error => {
          chrome.tabs.create({
            url: "https://coding.net/login"
          });
        })
      },
      openTodo (id, name) {
        this.$dispatch('getLastProject', id, name)
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
        todosCount: 0,
        baseUrl: "https://coding.net",
        publicState: store.state
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
          this.todos.forEach(todo => {
            todo.done = value;
          });
        }
      }
    },
    methods: {
      loadTodos(projectID) {
        // console.log(ProjectID)
        const self = this
        const user = this.publicState.projects[0].user
        self.todos.length = 0
        self.showLists = false
        self.loading = true

        const getTodos = () => new Promise(
          (resolve, reject) => {
            CodingAPI.task.list(projectID, user, 'all', result => {
              if (!result.code) {
                if (result.data.list.length > 0) {
                  $.each(result.data.list, (i, val) => {
                    const task = result.data.list[i];
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
                      status,
                      project: {
                        id: task.project.id,
                        name: task.project.name,
                        path: task.project.project_path
                      }
                    }

                    self.currentProject = self.todos[i].project
                    store.setLastProject(self.currentProject.id, self.currentProject.name)
                  })
                }
                
                resolve(self.todos);
              } else {
                reject('fail')
              }
            });
          }
        );

        getTodos().then(result => {
          result.length === 0 ? self.showLists = false : self.showLists = true
          self.setTodosCount()
          self.loading = false
        })
      },
      toggleTodo(index) {
        let status;
        // 监听v-model数据可能比较麻烦，这里是变通实现
        !this.todos[index].status ? status = 2 : status = 1
        CodingAPI.task.toggle(this.todos[index].project.name, this.publicState.projects[0].user, this.todos[index].id, status, result => {})
      },
      addTodo() {
        this.loading = true
        const self = this
        const content = this.newTodo && this.newTodo.trim();
        if (!content) {
          return false;
        }
        CodingAPI.task.create(this.currentProject.id, this.publicState.user.id, content, result => {
          if (result.code === 0) {            
            self.loadTodos(self.currentProject.id)
            self.newTodo = ''
            self.loading = false
          }
        })
      },
      deleteTodo(todoID) {
        this.loading = true
        const self = this
        CodingAPI.task.delete(this.currentProject.id, todoID, result => {
          if (result.code === 0) {
            self.loadTodos(self.currentProject.id)
            self.loading = false
          }
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
        const todos = this.todos;
        if (!todos) return
        if (this.visibility === 'all') {
          return todos;
        } else if (this.visibility === 'processing') {
          return todos.filter(todo => !todo.status);
        } else {
          return todos.filter(todo => todo.status);
        }
      },
      setTodosCount() {
        this.todosCount = this.filterTodos().length
      },
      goBack () {
        store.setCurrentView('projects')
        bg.snapshot = {
          view: this.publicState.currentView
        }
      }
    },
    events: {
    },
    ready() {
      const self = this
      this.loadTodos(this.publicState.lastProject.id)
      // if (this.lastProjectID) {
      //   this.loadTodos(self.lastProjectID)
      // }
    }
  });

  new Vue({
    el: '#app',
    data: {
      points_left: 0,
      publicState: store.state
    },
    methods: {
    },
    events: {
      getLastProject (id, name) {
        store.setCurrentView('task')
        bg.snapshot = {
          view: this.publicState.currentView,
          id: id,
          name: name
        }
        store.setLastProject(id, name)
      }
    },
    ready () {
      if (bg.snapshot && bg.snapshot.view === 'task') {
        store.setCurrentView(bg.snapshot.view)
        store.setProjects(bg.projects)
        store.setLastProject(bg.snapshot.id, bg.snapshot.name)
      }
    }
  })
});
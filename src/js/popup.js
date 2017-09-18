import React from 'react'
import ReactDOM from 'react-dom';
import axios from 'axios'
import $ from 'jquery'
import { mainConnector, Storage } from './modules/utils'
import Navbar from './components/Navbar'
import ProjectList from './components/ProjectList'
import { CodingAPI } from './api.js'
// console.log(CodingAPI)

const port  = new mainConnector();
port.name = "chrome-extension-skeleton";
port.init();
port.onMessage((msg) => {
  // console.log('frontend msg', msg)
})

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: null,
      projects: null,
      filteredProjects: null,
      notificationUnreadProjects: [],
      loading: true
    }
  }

  async addDefaultBranch(projects) {
    for (let project of projects) {
      await $.get(`https://coding.net/api/user/${project.user}/project/${project.name}/git/branches`, (result, status, request) => {
        if (result.code === 0) {
          project.default_branch = result.data.list[0].name
        }
      })
    }

    return projects
  }

  loadProjects() {
    this.setState({loading: true})

    CodingAPI.getProjects()
      .then(projects => {
        this.setState({
          projects: projects,
          loading: false
        })
        let notificationUnreadProjects = []
        $.map(projects, (project) => {
          if (!!project.un_read_activities_count) {
            notificationUnreadProjects.push(project)
          }
        });
				Storage.setValue('projects', projects)
        Storage.setValue('notificationUnreadProjects', notificationUnreadProjects)
      })
      .catch(error => {
				Storage.setValue('projects', null)
				Storage.setValue('user', null)
        chrome.tabs.create({
          url: "https://coding.net/login"
        });
      })
  }

  getUser() {
    CodingAPI.me(result => {
      if (!result.code) {
        const userData = result.data;
        const user = {
          'name': userData.name,
          'key': userData.global_key,
          'id': userData.id,
          'avatar': userData.avatar,
          'path': userData.path,
          'points_left': userData.points_left
        }
        this.setState({user: user})
				Storage.setValue('user', user)
      }
    });
  }


  removeActivityCount() {
    // console.log(this.state.notificationUnreadProjects)
    const ids = $.map(this.state.notificationUnreadProjects, project => project.id);
    CodingAPI.removeCount(ids, () => {
      $.each(this.state.projects, (i, project) => {
        project.activityUpdateCount = 0;
      });
      this.setState({notificationUnreadProjects: []})
      Storage.setValue('notificationUnreadProjects', [])
      this.loadProjects();
      chrome.browserAction.setBadgeText({
        text: ''
      });
    });
  }

  filterProjects(event) {
    const input = event.target.value
    let tmp = this.state.projects.filter(project => {
      const re = new RegExp(input, 'i')
      return re.test(project.name)
    })

    this.setState({filteredProjects: tmp})
  }

  componentDidMount() {
    const projects = Storage.getValue('projects')
    const user = Storage.getValue('user')
    const notificationUnreadProjects = Storage.getValue('notificationUnreadProjects')
    if (projects) {
      this.setState({
        projects: projects,
        notificationUnreadProjects: notificationUnreadProjects,
        loading: false
      })
    } else {
      this.loadProjects()
    }
    if (user) {
      this.setState({
        user: user
      })
    } else {
      this.getUser()
    }
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <div>
        <Navbar user={this.state.user} loadProjects={this.loadProjects.bind(this)} removeActivityCount={this.removeActivityCount.bind(this)} filterProjects={this.filterProjects.bind(this)} />
        <ProjectList projects={this.state.filteredProjects || this.state.projects} loading={this.state.loading} />
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'))

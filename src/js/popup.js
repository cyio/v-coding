import React from 'react'
import ReactDOM from 'react-dom';
import axios from 'axios'
import $ from 'jquery'
import { mainConnector, Storage } from './modules/utils'
import Navbar from './Navbar'
import ProjectList from './ProjectList'
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
      notificationUnreadProjects: [],
      loading: true
    }
  }

  getProjects() {
    return new Promise(
      (resolve, reject) => {
        CodingAPI.projects('all', result => {
          if (!result.code) {
            console.log(result)
            const projects = $.map(result, project => {
              if (!!project.un_read_activities_count) {
                let tmp = this.state.notificationUnreadProjects
                tmp.push(project)
                this.setState({notificationUnreadProjects: tmp})
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
            resolve(projects);
          } else {
            reject()
          }
        });
      }
    );
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

    this.getProjects()
      .then(projects => {
        // return this.addDefaultBranch(projects)
        this.setState({
          projects: projects,
          loading: false
        })
				Storage.setValue('projects', projects)
      })
      .catch(error => console.error(error))
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
      }
    });
  }


  removeActivityCount() {
    console.log(this.state.notificationUnreadProjects)
    const ids = $.map(this.state.notificationUnreadProjects, project => project.id);
    CodingAPI.removeCount(ids, () => {
      $.each(this.state.projects, (i, project) => {
        project.activityUpdateCount = 0;
      });
      this.setState({notificationUnreadProjects: []})
      this.loadProjects();
      chrome.browserAction.setBadgeText({
        text: ''
      });
    });
  }

  componentDidMount() {
    const projects = Storage.getValue('projects')
    this.getUser()
    if (projects) {
      this.setState({
        projects: projects,
        loading: false
      })
    } else {
      this.loadProjects()
    }
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <div>
        <Navbar user={this.state.user} loadProjects={this.loadProjects.bind(this)} removeActivityCount={this.removeActivityCount.bind(this)} />
        <ProjectList projects={this.state.projects} loading={this.state.loading} />
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'))

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
      user: {},
      projects: [],
      notificationUnreadProjects: [],
      loading: true
    }
  }

  getProjects() {
    return new Promise(
      (resolve, reject) => {
        CodingAPI.projects('all', result => {
          if (!result.code) {
            // console.log(projects)
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

  getDefaultBranch(projects) {
    return new Promise(
      (resolve, reject) => {
        for (let [index, project] in projects) {
          $.get(`https://coding.net/api/user/${projects[index].user}/project/${projects[index].name}/git/branches`, (result, status, request) => {
            if (status == 200 && result.code === 0) {
              projects[index].default_branch = result.data.list[0].name
              console.log('exec')
              if (index === projects.length - 1) {
                console.log('resolve', projects)
                resolve(projects)
              }
            }
          });
        }
      }
    );
  }

  loadProjects() {
    this.setState({loading: true})

    this.getProjects()
      .then(projects => {
        console.log(projects)
        this.setState({
          projects: projects,
          loading: false
        })
      })
      .catch(error => console.error(error))
  }
  componentDidMount() {
    this.loadProjects()
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <div>
        <Navbar user={{name: 'oaker'}}/>
        <ProjectList projects={this.state.projects} loading={this.state.loading}/>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'))

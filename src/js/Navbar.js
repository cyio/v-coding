import React from 'react'
import ReactDOM from 'react-dom';

export default class Navbar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  loadProjects() {
    const self = this
    self.loading = true

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
      self.loading = false
    }, error => {
      chrome.tabs.create({
        url: "https://coding.net/login"
      });
    })
  }

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
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    const { user } = this.props
    return (
      <div className="navbar">
        <input className="search-projects" autoFocus="autofocus" value="name" onChange={() => console.log()}/>
        <div className="navbar-buttons">
          <div className="toolbar-item refresh-projects" id="refresh-projects" onClick={this.loadProjects}>
            <img src="/images/sync.svg" />
          </div>
          <div className="toolbar-item remove-activity-update-count" onClick={this.removeActivityCount} title="清除提醒">
            <img src="/images/trashcan.svg" />
          </div>
        </div>
        {
          user.name && <div className="username"><a tabIndex={-1} href="{{baseUrl + '/user'}}" title="个人中心" target="blank">{'{'}{'{'}user.name{'}'}{'}'}</a></div>
        }
      </div>
    )
  }
}

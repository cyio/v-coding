import React from 'react'

export default class ProjectList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
    }

    this.baseUrl = 'https://coding.net'
  }

  updateBadgeCount() {
    chrome.runtime.sendMessage("updateBadgeCount")
  }

  openTodo(id, name) {
    // this.$dispatch('getLastProject', id, name)
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    const { projects, loading } = this.props
    const baseUrl = this.baseUrl
    if (loading) return <div className="progress-spinner" />
    return (
			<div id="projects">
        {
          projects.map((project, index) => {
            return (
              <div className="project" key={index}>
                <div className="main-link">
                  { project.isPrivate && <i className="icon"><img src="/images/lock.svg" /></i> } 
                  <a className href={baseUrl + project.path} target="_blank" onClick={this.updateBadgeCount}>{project.name}</a>
                  { project.activityUpdateCount > 0 && <span className="activity-update-count update-count-tip" >{project.activityUpdateCount}</span> } 
                </div>
                <a className="project-link" title="代码" href={baseUrl + project.path  + '/git'} target="_blank"><img src="/images/code.svg" /></a>
                <a className="project-link" title="提交历史" href={baseUrl + project.path  + '/git/commits/' + project.default_branch} target="_blank"><img src="/images/history.svg" /></a>
                <a className="project-link" title="合并请求" href={baseUrl + project.path  + '/git/merges/review'} target="_blank"><img src="/images/git-pull-request.svg" /></a>
              </div>
            )
          })
        }
			</div>
    )
  }
}

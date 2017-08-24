import React from 'react'
import ReactDOM from 'react-dom';

export default class Navbar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
    }
    this.baseUrl = 'https://coding.net'
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    const { user, loadProjects, removeActivityCount } = this.props
    return (
      <div className="navbar">
        <input className="search-projects" autoFocus="autofocus" value="name" onChange={() => console.log()}/>
        <div className="navbar-buttons">
          <div className="toolbar-item refresh-projects" id="refresh-projects" onClick={loadProjects}>
            <img src="/images/sync.svg" />
          </div>
          <div className="toolbar-item remove-activity-update-count" onClick={removeActivityCount} title="清除提醒">
            <img src="/images/trashcan.svg" />
          </div>
        </div>
        {
          user && user.name && <div className="username"><a tabIndex={-1} href={this.baseUrl + '/user'} title="个人中心" target="blank">{user.name}</a></div>
        }
      </div>
    )
  }
}

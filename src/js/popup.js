import React from 'react'
import ReactDOM from 'react-dom';
import axios from 'axios'
import { mainConnector, Storage } from './modules/utils'

const port  = new mainConnector();
port.name = "chrome-extension-skeleton";
port.init();
port.onMessage((msg) => {
  // console.log('frontend msg', msg)
})

// 5种状态　component + (Will, Did) + (Mount, Update, Unmount)
// 特例是 unmound，没有 did，卸载后程序也就没了
// 函数转换而来，拥有 state
class Clock extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      date: new Date()
    }
  }

  componentDidMount() {
    // 临时存储给 this
    this.timerID = setInterval(
      () => this.tick(),
      1000
    )
  }

  componentWillUnmount() {
    clearInterval(this.timerID)
  }

  tick() {
    this.setState({
      date: new Date()
    })
  }

  render() {
    return (
      <div>
        <h1>Hello, world!</h1>
        <h2>It is {this.state.date.toLocaleTimeString()}</h2>
      </div>
    )
  }
}

ReactDOM.render(<Clock />, document.getElementById('app'))
// render(<h1>hello world</h1>, document.getElementById('app'))

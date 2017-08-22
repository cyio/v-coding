import $ from 'jquery'
import axios from 'axios'
import { mainConnector, Storage } from './modules/utils'

const port  = new mainConnector();
port.name = "chrome-extension-skeleton";
port.init();
port.onMessage((msg) => {
  // console.log('frontend msg', msg)
})


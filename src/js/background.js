import axios from 'axios'
import { backgroundConnector, Storage } from './modules/utils'

var port = new backgroundConnector();
port.name = "chrome-extension-skeleton";
port.init((msg) => {
  // console.log('backend msg', msg)
  switch(msg.act){
    case "say hello":
      console.log('hello')
      port.send({act: 'world'})
      console.log('version value is ' + Storage.getValue('ver'))
      break;
  }
});

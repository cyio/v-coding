export const backgroundConnector = function(){
	this.cache = null;//chrome extention connect object
	this.name = null;//connect name
	this.onConnect = null;//function
	this.onDisConnect = null;//function
	//发送消息
	this.send = function(msg){
		if(this.cache != null){
			var port = this.cache;
			if(port.name==this.name){
				port.postMessage(msg);
			}
		}
	};
	//初始化
	this.init = function(fn){
		var This = this;
		//console.log(this);
		chrome.extension.onConnect.addListener(function(port){
			This.cache = port;
			if(port.name==This.name){
				port.onDisconnect.addListener(function(){
					This.cache = null;
					if(typeof(This.onDisConnect)=="function")
						This.onDisConnect(port);
				});
				port.onMessage.addListener(function(msg){
					fn(msg)	;
				});
				if(typeof(This.onConnect)=="function")
					This.onConnect(port);
				port.postMessage({act:"connected"});
			}
			
		});
	};
};

export const mainConnector = function(){
	this.cache=null;//chrome extention connect object
	this.name=null;//connect name
	//初始化
	this.init=function(){
		var port = chrome.extension.connect({name:this.name});
		this.cache = port;
	};
	//发送消息
	this.send=function(msg){
		if(this.cache != null){
			var port = this.cache;
			port.postMessage(msg);
		}
	};
	//接收消息
	this.onMessage=function(fn){
		if(this.cache != null){
			var port = this.cache;
			if(port.name==this.name){
				port.onMessage.addListener(function(msg){
					fn(msg);
				});
			}
		}
	};
};

import storage from './storage'
export const Storage = storage

export const formatTime = function(value) {
		var sec = Number(value);
        var min = 0;
        var hour = 0;
        //alert(sec);
        if(sec > 60) {
        	min = Number(sec/60);
        	sec = Number(sec%60);
        	//alert(min+"-"+sec);
        	if(min > 60) {
        		hour = Number(min/60);
        		min = Number(sec%60);
        	}
        }
        var secTemp =  String( parseInt(sec));
        if(secTemp.length==1)
        	secTemp = "0"+secTemp;
        
        var result = secTemp;
        var minTemp = String( parseInt(min));
        if(minTemp.length==1)
        	minTemp = "0"+minTemp;
		result = minTemp+":"+result;

        if(hour > 0) {
        	result = ""+parseInt(hour)+":"+result;
        }
        return result;
};

export function sleep(ms = 0) {
		return new Promise((resolve, reject) => setTimeout(resolve, ms));
}
export function IsJsonString(str) {
		try {
				JSON.parse(str);
		} catch (e) {
				return false;
		}
		return true;
}

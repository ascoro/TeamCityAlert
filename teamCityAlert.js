//
// teamCityAlert.js
//
// https://github.com/ascoro/teamCityAlert
//
// Copyright (c) 2014 Albert Serra <ascorodev@gmail.com>. All rights reserved.
//

var alertNoConnection=false;

var init = function(){
	detectStatus();
	setInterval(detectStatus,30000);
}

var getServerDetails = function(){
try
  {
	var servers = JSON.parse(localStorage["teamcitysettings"]||"[]")||[];
	var server=servers[0];
	if(server&&server.host&&server.username&&server.password){
		return server;
	}
	}catch(err){
	}
	return undefined;
}

var getURLContent = function(url,callback,callbackError){
	var serverDetails=getServerDetails();
	if(!serverDetails){
		showMessage("warning.png","TeamCity no set up!","");
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.open("GET", serverDetails.host+url, true,serverDetails.username,serverDetails.password);
	xhr.withCredentials = "true"; 
	xhr.onreadystatechange = function() {
		//console.log(xhr.readyState);
		if (xhr.readyState == 4) {
			if(xhr.status == 200)
				callback(xhr.responseText);
			else{
				if(callbackError){
					callbackError(xhr.status);
				}
			}
		}
	}
	xhr.send();
}

var detectStatus = function(callback){
	getURLContent("/httpAuth/app/rest/builds/",function(text){
		validateReturnURL(text);
	},function(status){if(!alertNoConnection)showMessage("failure.png","Server not reachable!","Check that you set up the settings properly");alertNoConnection=true;});
}

var getValueBetween=function(content,a,b){
	var index = content.indexOf(a);
	if(index<0){
		return "";
	}
	var contentaux = content.substr(index+a.length);
	index = contentaux.indexOf(b);
	if(index<0){
		return "";
	}
	return contentaux.substr(0,index);
}

var validateReturnURL = function(content){
	if(content.length==0){
		console.log("Response empty");
		return;
	}
	
	
	var status = getValueBetween(content,"status=\"","\"");
	var build = getValueBetween(content,"id=\"","\"");
	var buildTypeId = getValueBetween(content,"buildTypeId=\"","\"");
	getURLContent("/httpAuth/app/rest/changes?locator=build:(id:"+build+")",function(text){
		var changeId = getValueBetween(text,"id=\"","\"");
		getURLContent("/httpAuth/app/rest/changes/id:"+changeId,function(textChange){
			var username = getValueBetween(textChange,"username=\"","\"");
			parseOutput(username,status,build,"");
		});
	});
	
	
}

var currentVersion=-1;
var parseOutput=function(who,status,version,type){
	var newVersion=false;
	console.log(who+" - "+status+" - "+version);
	if(version!=currentVersion){
		newVersion=true;
		currentVersion=version;
	}
	switch(status){
		case "SUCCESS":
			if(newVersion){
				showMessage("success.png","Build "+version+" "+type+" success!","Great job "+who+"!");
			}
		break;
		case "WARNING":
			if(newVersion){
				showMessage("warning.png","Build "+version+" "+type+" warning!",who+".....");
			}
		break;
		case "FAILURE":
			if(newVersion){
				showMessage("failure.png","Build "+version+" "+type+" failure!",who.toUpperCase()+"!!!!!");
			}
		break;
	}
}
var showMessage=function(image,title,message){
var opt = {
  type: "basic",
  title: title,
  message: message,
  iconUrl: image,
  buttons: [{ title: 'Settings', 
                  iconUrl: 'cog.png'}]
}
//opt.type="image";
//opt.imageUrl = opt.iconUrl;
chrome.notifications.create("", opt,function(){});
}


init();


chrome.notifications.onButtonClicked.addListener(function(e){
	chrome.tabs.create({ url: "/options.html" });
});
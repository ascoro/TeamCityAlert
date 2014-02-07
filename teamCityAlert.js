//
// teamCityAlert.js
//
// https://github.com/ascoro/teamCityAlert
//
// Copyright (c) 2014 Albert Serra <ascorodev@gmail.com>. All rights reserved.
//

var Settings = new function(){
	var thiz=this;
	thiz.getServerDetails = function(){
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
	};
}();

var Http = new function(){
	var thiz=this;
	thiz.getURLContent = function(url,callback,callbackError){
		var serverDetails=Settings.getServerDetails();
		if(!serverDetails){
			showMessage("warning.png","TeamCity no set up!","");
			return;
		}
		var xhr = new XMLHttpRequest();
		xhr.open("GET", serverDetails.host+url, true,serverDetails.username,serverDetails.password);
		xhr.withCredentials = "true"; 
		xhr.onreadystatechange = function() {
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
}();

var TeamCityService = new function(){
	var thiz=this;
	var builds=[];
	var notReachable = function(){
		Notification.showMessage("failure.png","Server not reachable!","Check that you set up the settings properly");
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
	var findBuildById = function(buildId){
		var i=0;
		while(builds[i]){
			if(builds[i].buildId==buildId){
				return builds[i];
			}
			i++;
		}
		return;
	}
	thiz.findBuildById = function(buildId,callback){
		var build = findBuildById(buildId);
		if(build){
			if(!build.changes){
				thiz.getBuildDetails(build, callback);
			}else{
				setTimeout(function(){callback(build);},1);
			}
		}
	}
	var addBuildToList = function(build){
		if(build&&!findBuildById(build.buildId)){
			builds.unshift(build);
		}
	}
	var parseBuilds = function(content){
		if(content.length==0){
			console.log("Response empty");
			return;
		}
		var arrayBuilds = content.split("<build ");
		
		var i=1;
		while(arrayBuilds[arrayBuilds.length-i]){
			var build=parseBuild(arrayBuilds[arrayBuilds.length-i]);
			addBuildToList(build);
			i++;
		}
	}
	var parseBuild = function(content){
		var status = getValueBetween(content,"status=\"","\"");
		var buildId = getValueBetween(content,"id=\"","\"");
		var buildTypeId = getValueBetween(content,"buildTypeId=\"","\"");
				
		if(status&&buildId&&buildTypeId){
			build={status:status,buildId:buildId,buildTypeId:buildTypeId};
			return build;
		}
	}
	thiz.getBuildDetails = function(build, callback){
		Http.getURLContent("/httpAuth/app/rest/changes?locator=build:(id:"+build.buildId+")",function(text){
			var changeId = getValueBetween(text,"id=\"","\"");
			Http.getURLContent("/httpAuth/app/rest/changes/id:"+changeId,function(textChange){
				var username = getValueBetween(textChange,"username=\"","\"");
				build.changes =[{username:username,changeId:changeId}];
				callback(build);
			});
		});
	}
	thiz.getBuilds=function(callback){
		Http.getURLContent("/httpAuth/app/rest/builds/",function(xmlBuilds){
			parseBuilds(xmlBuilds);
			callback(builds);
		},notReachable);
	};
}();

var Notification = new function(){
	var thiz=this;	
	var getDateTimeMinute = function(){
		var d=new Date();
		return d.getHours()+":"+d.getMinutes();
	}
	
	thiz.showMessage=function(image,title,message){
		var opt = {
			type: "basic",
			title: title,// +" "+ getDateTimeMinute(),
			message: message,
			iconUrl: image,
			buttons: [{ title: 'Settings', iconUrl: 'cog.png'}]
		}
		//opt.type="image";
		//opt.imageUrl = opt.iconUrl;
		chrome.notifications.create("", opt,function(){});
	}
	
	chrome.notifications.onButtonClicked.addListener(function(e){
		chrome.tabs.create({ url: "/options.html" });
	});
}();

var Messaging = new function(){
	var thiz = this;
	var newestBuild;
	var showNotifications = function(){
		var build = TeamCityService.findBuildById(newestBuild+1,function(build){
			if(build){
				newestBuild++;
				console.log("Show build "+newestBuild);
				console.log(build);
				sendMessage(build);
				showNotifications();
			}
		});
	}
	thiz.checkBuilds = function(){
		TeamCityService.getBuilds(function(builds){
			if(!newestBuild){
				newestBuild=builds[0].buildId-1;
			}
			showNotifications();
		});
		
	}
	var sendMessage=function(build){
		var messageBuild = build.buildTypeId+" Build "+build.buildId;
		var title = "";
		var message = "";
		var username = "";
		if(build.changes[0]){
			username = build.changes[0].username;
		}
		var img="warning.png";
		switch(build.status){
			case "SUCCESS":
				title="Great job "+username+"!";
				img="success.png";
			break;
			case "WARNING":
				title=username+".........";
				img="warning.png";
			break;
			case "FAILURE":
				title=username.toUpperCase()+"!!!!!";
				img="failure.png";
			break;
		}
		Notification.showMessage(img,title,messageBuild+"\n\n"+message);
	}
}();

var init = function(){
	Messaging.checkBuilds();
	setInterval(Messaging.checkBuilds,30000);
}

init();
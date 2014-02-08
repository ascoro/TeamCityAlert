function getOptionFromElement(elementId){
	var element = document.getElementById(elementId);
	if(element){
		return element.value;
	}
	 //var select = document.getElementById("color").value;
		//var color = select.children[select.selectedIndex].value;
}
function setOptionFromElement(elementId,value){
	document.getElementById(elementId).value=value;
	 //var select = document.getElementById("color").value;
		//var color = select.children[select.selectedIndex].value;
}
function setHTMLElement(elementId,html){
	document.getElementById(elementId).innerHTML = html;
	 //var select = document.getElementById("color").value;
		//var color = select.children[select.selectedIndex].value;
}

function saveLocalStorage(name,value){
	localStorage[name] = JSON.stringify(value);	
}

function getLocalStorage(name){
	return JSON.parse(localStorage[name]||"[]")||[];
}

// Saves options to localStorage.
function save_options() {
	var host=getOptionFromElement("host");
	var username=getOptionFromElement("username");
	var password=getOptionFromElement("password");
	var servers = getLocalStorage("teamcitysettings");
	var server=servers[0]||{};
	if(server.host!=host||server.username!=username||server.password!=password){
		server = {host:host,username:username,password:password};
		servers[0]=server;
	}else{
		console.log("No credentials changed");
	}
	
	for(var buildTypeId in server.listBuildTypeIds){
		var key="input_"+buildTypeId;
		var value = getOptionFromElement(key);
		if(value){
		
			console.log(key+" -> "+value);
			server.listBuildTypeIds[buildTypeId]=value;
		}
	}
	console.log(servers);
	console.log(server);
	saveLocalStorage("teamcitysettings",servers);
	
	loadTeamCityData();
	
	// Update status to let user know options were saved.
	var status = document.getElementById("status");
	status.innerHTML = "Options Saved.";
	setTimeout(function() {
		status.innerHTML = "";
	}, 750);
}

function loadTeamCityData(){
	var serverStatus = document.getElementById("serverStatus");
	serverStatus.innerHTML = "Checking server...";
	TeamCityService.getBuilds(function(builds){
			var servers = getLocalStorage("teamcitysettings");
			
			servers[0].builds=builds;
			servers[0].listBuildTypeIds =servers[0].listBuildTypeIds||{};
			var i=0;
			while(builds[i]){
				if(!servers[0].listBuildTypeIds[builds[i].buildTypeId]){
					servers[0].listBuildTypeIds[builds[i].buildTypeId]=builds[i].buildTypeId;
				}
				i++;
			}
			saveLocalStorage("teamcitysettings",servers);
			
		showBuildTypeIds(servers[0]);
	
			serverStatus.innerHTML = "Server ok";
		},function(){
			serverStatus.innerHTML = "Server error";
		});
}

function showBuildTypeIds(server){			
	var elementsHtml="";
	for(var buildTypeId in server.listBuildTypeIds){
		console.log(buildTypeId + " - "+server.listBuildTypeIds[buildTypeId]);
		var key="input_"+buildTypeId;
		elementsHtml+=buildTypeId+":<input id='"+key+"' value='"+server.listBuildTypeIds[buildTypeId]+"' /><br/>";
	}
	setHTMLElement("listBuildTypeId",elementsHtml);
}

// Restores select box state to saved value from localStorage.
function restore_options() {

try
  {
	var servers = getLocalStorage("teamcitysettings");
	var server = servers[0]||{};
	
  setOptionFromElement("host",server.host||"");
  setOptionFromElement("username",server.username||"");
  setOptionFromElement("password",server.password||"");
  showBuildTypeIds(server);
  }catch(err){
	console.log("Error exception");
  }
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
function getOptionFromElement(elementId){
	return document.getElementById(elementId).value;
	 //var select = document.getElementById("color").value;
		//var color = select.children[select.selectedIndex].value;
}
function setOptionFromElement(elementId,value){
	document.getElementById(elementId).value=value;
	 //var select = document.getElementById("color").value;
		//var color = select.children[select.selectedIndex].value;
}

// Saves options to localStorage.
function save_options() {
  localStorage["teamcitysettings"] = JSON.stringify([{
	host:getOptionFromElement("host"),
	username:getOptionFromElement("username"),
	password:getOptionFromElement("password"),
  }]);

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() {

try
  {
	var servers = JSON.parse(localStorage["teamcitysettings"]||"[]")||[];
	console.log(servers);
	var server = servers[0]||{};
	console.log(server);
  setOptionFromElement("host",server.host||"");
  setOptionFromElement("username",server.username||"");
  setOptionFromElement("password",server.password||"");
  }catch(err){
	localStorage["teamcitysettings"]="[]";
  }
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
//
// app.js
//
// https://github.com/ascoro/teamCityAlert
//
// Copyright (c) 2014 Albert Serra <ascorodev@gmail.com>. All rights reserved.
//

var init = function(){
	Messaging.checkBuilds();
	setInterval(Messaging.checkBuilds,30000);
}

init();
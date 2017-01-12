/**
 * @title youVid.js
 * @overview A JavaScript module that extends menu options for HTML5 videos on YouTube and similar sites.
 * @author Tim Scott Long
 * @contact contact@timlongcreative.com
 * @copyright Tim Scott Long 2017
 * @version 1.1.0
 * @modified January 11, 2017
 * @license Available for use under the MIT License
 */
;var youVid = (function(elm) {
	var vid = elm || document.querySelector("video"),
		panels = [],
		jumpBack,
		jumpAhead,
		jumpBackReverse,
		vidLoopId,
		sloMoId,
		reverseId,
		linksCreated = 0,
		looping = false,
		sloMoing = false,
		reversing = false,
		storedSMDelay = 250,
		storedSMAdvance = 0.05,
		storedLoopStart = 0,
		storedLoopEnd = 5,
		skipAdButton = null,
		frameDoc;

	// If there is no HTML5 video element in the current document, attempt to access video from an embedded iframe document.
	if(!vid) {		
		if(document.querySelector("iframe")) {
			frameDoc = document.querySelector("iframe").contentDocument || document.querySelector("iframe").contentWindow.documentElement;
			vid = frameDoc.querySelector("video");
		}
		
		if(!vid && window.console) {
			console.log("unable to find HTML5 video on the page - cannot use this code with flash videos");
		}
	}

	// Return the video to a loop start when it reaches the entered loop end.
	vid.addEventListener("timeupdate", function(){
		if(!looping) {
			return;
		}

		if(reversing) {
			if(this.currentTime < storedLoopStart) {
				this.currentTime = storedLoopEnd;
			}
		} else {			
			if(this.currentTime > storedLoopEnd) {
				this.currentTime = storedLoopStart;
			}
		}
	}, false);

	// Turns on looping.
	var loop = function() {
		vid.currentTime = storedLoopStart;
		looping = true;
		
		if(vid.paused) {
			vid.play();
		}
		
		return this;
	}; // End loop()

	// Ends the currently running loop.
	var endLoop = function() {
		looping = false;
		
		return this;
	}; // End endLoop()

	// Restarts the video at zero.
	var restart = function(e) {
		vid.currentTime = 0;
		
		return this;
	}; // End restart()

	/**
	 * @description Skips to a specific time in the video.
	 * @param {number} timeDest - The time (in seconds) to skip to in the video.
	 * @return {Object} The current youVid object.
	 */
	var gotoTime = function(timeDest) {
		vid.currentTime = timeDest;
		
		return this;
	}; // End gotoTime()

	/**
	 * @description Starts the changed speed operation. Mainly used for slow motion, though some fast motion is possible as well.
	 * @param {number} delay - The time (in milliseconds) to wait before each frame change.
	 *   {number} advance - The time in the video (in seconds) to advance in each frame change.
	 * @return {Object} The current youVid object.
	 */
	var sloMo = function(delay, advance) {
		vid.pause();

		if(typeof delay === "undefined") {
			if(document.getElementById("sloMoRange")) {
				var delay = storedSMDelay = 1020 - document.getElementById("sloMoRange").value;
			} else {
				var delay = storedSMDelay;
			}
		}
		
		if(typeof advance === "undefined") {
			var advance = storedSMAdvance;
		}
		
		if(reversing) {
			advance *= -1;
		}

		if(sloMoing) {
			clearTimeout(sloMoId);
			sloMoing = false;
		}
		
		jumpAhead = function() {
			if(sloMoing) {
				clearTimeout(sloMoId);
				sloMoing = false;
			}
			
			vid.currentTime = vid.currentTime + advance;
			sloMoing = true;
			sloMoId = setTimeout(jumpAhead, delay);
		};

		sloMoing = true;
		sloMoId = setTimeout(jumpAhead, delay);
		
		return this;
	}; // End sloMo()

	// Ends slow motion operation, and returns to normal play.
	var endSloMo = function() {
		clearTimeout(sloMoId);
		sloMoing = false;
		
		if(!reversing) {
			vid.play();
		} else {
			reverse();
		}
		
		return this;
	}; // End endSloMo()
	
	/**
	 * @description Begins the operation that plays the video backwards.
	 * @return {Object} The current youVid object.
	 */
	var reverse = function() {
		vid.pause();

		if(reversing) {
			clearTimeout(reverseId);
			reversing = false;
		}
		
		jumpBackReverse = function(){
			if(reversing) {
				clearTimeout(reverseId);
				reversing = false;
			}
			
			if(sloMoing) {
				reversing = true;
				return;
			}
		
			vid.currentTime = vid.currentTime - .100;
			reversing = true;
			reverseId = setTimeout(jumpBackReverse, (function(){
					if(sloMoing) {
						return 1020 - document.getElementById("sloMoRange").value;
					}
					
					return undefined;
				}()) || 100
			);
		};
		
		reversing = true;
		setTimeout(jumpBackReverse, 100);
		
		return this;
	}; // End reverse()

	/**
	 * @description Ends the operation that plays the video backwards. Returns to forward play.
	 * @return {Object} The current youVid object.
	 */
	var endReverse = function() {
		clearTimeout(reverseId);
		reversing = false;
		if(sloMoing) {
			endSloMo();
			sloMo(storedSMDelay, storedSMAdvance);
		} else {
			vid.play();
		}

		return this;
	}; // End endReverse()
	
	/**
	 * @description Apply a CSS transform to the video.
	 * @param {string} The CSS value that the video's transform property will be set to.
	 * @return {Object} The current youVid object.
	 */
	var setTransform = function(tform) {
		vid.style.transform = tform;
		return this;
	};

	// Removes any CSS transforms applied to the video with setTransform()
	var resetTransform = function() {
		vid.style.transform = "matrix(1,0,0,1,0,0)";
		return this;
	};

	/**
	 * @description For adding custom single-button (single-function) items.
	 * @param {Object} opts - A list of options to plug in for the new menu item: id (an HTML id attribute for the newly created element), text (the text to write in the item), callback (function to call when the new menu item is clicked).
	 * @returns {Object} - The current youVid object.
	 */
	var addMenuItem = function (opts) {
		var panelMenus = document.getElementsByClassName("ytp-panel-menu");

		if(window.location.hostname.indexOf("youtube.com") === -1 && window.location.hostname.indexOf("youtu.be") === -1 && panelMenus.length === 0) {
			console.log("not youtube");
			var panelMenu = document.createElement("DIV");
			panelMenu.style.zIndex = 999;
			panelMenu.style.background = "rgba(0, 0, 0, 0.5)";
			panelMenu.style.color = "white";
			panelMenu.style.font = "bold 11px Arial";
			panelMenu.style.position = "fixed";
			panelMenu.style.right = "5px";
			panelMenu.style.bottom = "5px";
			panelMenu.style.minHeight = "20px";
			panelMenu.style.minWidth = "500px";
			panelMenu.className = "ytp-panel-menu";
			
			var styleObj;
			if(document.styleSheets.length === 0) {
				styleObj = document.createElement("style");
				document.body.appendChild(styleObj);
			}
			
			var sheet = document.styleSheets[0];
			
			var cssLen = (sheet.cssRules || []).length;

			sheet.insertRule(".ytp-panel-menu > div {width: 300px; padding: 3px 5px; font: bold 14px Arial; line-height: 22px; height: 22px;}", cssLen);
			sheet.insertRule(".ytp-panel-menu > div:hover {background: rgba(169, 169, 169, 0.5); cursor: default;}", cssLen + 1);
			document.body.appendChild(panelMenu);
			panelMenus = document.getElementsByClassName("ytp-panel-menu");
		}

		var menuItem = document.createElement("DIV");
		menuItem.className = "ytp-menuitem";
		menuItem["aria-haspopup"] = false;
		menuItem.role = "menuitem";
		menuItem.tabindex = "0";
		menuItem.id = opts.id;
		menuItem.onclick = opts.callback;

		var menuItemLabel = document.createElement("DIV");
		menuItemLabel.className = "ytp-menuitem-label";
		menuItemLabel.innerHTML = opts.text;
		
		var menuItemContent = document.createElement("DIV");
		menuItemContent.className = "ytp-menuitem-content";
		menuItem.appendChild(menuItemLabel);
		menuItem.appendChild(menuItemContent);
		
		for(var i = 0; i < panelMenus.length; i++) {
			panelMenus[i].appendChild(menuItem);
			linksCreated++;
		}
		
		return this;
	}; // End addMenuItem()
	
	/**
	 * @description Read user entries for loop's start and end times.
	 *	@param {string} entry - The string entered for the loop start or end. Can be a number, a string in the form mm:ss (with decimals allowed), "now" (indicating the current time on the video), "start" (the beginning of the video), "end" (the end of the video).
	 * @return {number} - The entered video time in seconds.
	 */
	var nowOrNumber = function(entry) {
		if(!entry) {
			return entry;
		}

		if(entry.toLowerCase() === "now") {
			return formatTime(vid.currentTime);
		} else if(entry.toLowerCase() === "start") {
			return "0:00";
		} else if(entry.toLowerCase() === "end") {
			return formatTime(vid.duration || vid.currentTime);
		}

		if(entry.startsWith("-")) {
			return formatTime(vid.duration - unformatTime(entry.replace("-", "")));
		}
		
		return entry;
	}; // End nowOrNumber()

	/**
	 * @description Adds all of the standard buttons to the menu.
	 * @param {boolean} anotherDomain - Set to true if the domain is not youtube.
	 */
	var addItems = function(anotherDomain) {
		console.log("adding menu items");
		
		var panelMenus = [];

		if(anotherDomain) {
			var panelMenu = document.createElement("DIV");
			panelMenu.style.position = "fixed";
			panelMenu.style.right = "0";
			panelMenu.style.bottom = "20px";
			panelMenu.style.width = "400px";
			panelMenu.style.zIndex = "999";
			panelMenu.style.color = "white";
			panelMenu.style.font = "bold 14px Arial;";
			panelMenu.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
			panelMenu.className = "ytp-panel-menu";
			document.body.appendChild(panelMenu);
			panelMenus = [panelMenu];
		} else {
			panelMenus = document.getElementsByClassName("ytp-panel-menu") || [document.body];
		}

		// Slo mo checkbox and slider
		var menuItem = document.createElement("DIV");
		menuItem.className = "ytp-menuitem";
		menuItem["aria-haspopup"] = false;
		menuItem.role = "menuitem";
		menuItem.tabindex = "0";
		menuItem.id = "sloMoVid";
		menuItem.style.height = "30px";
		menuItem.style.padding = "0 15px";
		menuItem.style.verticalAlign = "middle";

		var menuItemLabel = document.createElement("DIV");

		menuItemLabel.className = "ytp-menuitem-label";
		menuItemLabel.innerHTML = "<span style='float: left;'>Speed: </span>";
		menuItem.appendChild(menuItemLabel);
 
		var menuItemInput = document.createElement("INPUT");
		menuItemInput.type = "checkbox";
		menuItemInput.id = "sloMoCheck";
		menuItemInput.onchange = function(){
			if(this.checked) {
				sloMo(1020 - document.getElementById("sloMoRange").value, 0.5);
			} else {
				endSloMo();
			}
		};

		menuItem.appendChild(menuItemInput);

		var menuItemInput = document.createElement("INPUT");
		menuItemInput.type = "range";
		menuItemInput.id = "sloMoRange";
		menuItemInput.min = "0";
		menuItemInput.max = "1000";
		menuItemInput.value = "540";
		menuItemInput.style = "margin-left: 20px";
		menuItemInput.onchange = function(){
			endSloMo();
			setSMDelay(this.value);
			sloMo(1020 - (this.value), 0.5);
		};

		menuItem.appendChild(menuItemInput);

		var menuItemContent = document.createElement("DIV");
		menuItemContent.className = "ytp-menuitem-content";
		menuItem.appendChild(menuItemContent);

		for(var i = 0; i < panelMenus.length; i++) {
			panelMenus[i].appendChild(menuItem);
			linksCreated++;
		}

		// Loop from-to checkbox and two inputs
		var menuItem = document.createElement("DIV");
		menuItem.className = "ytp-menuitem";
		menuItem["aria-haspopup"] = false;
		menuItem.role = "menuitem";
		menuItem.tabindex = "0";
		menuItem.style.height = "30px";
		menuItem.style.padding = "0 15px";
		menuItem.style.verticalAlign = "middle";
		menuItem.id = "loopVideo";

		var menuItemLabel = document.createElement("DIV");
		menuItemLabel.className = "ytp-menuitem-label";
		menuItemLabel.innerHTML = "<span style='float: left'>Loop: </span>";
		menuItem.appendChild(menuItemLabel);
		
		var menuItemInput = document.createElement("INPUT");
		menuItemInput.type = "checkbox";
		menuItemInput.id = "loopCheck";
		menuItemInput.onchange = function() {
			if(this.checked) {
				loop();
			} else {
				endLoop();
			}
		};

		menuItem.appendChild(menuItemInput);
		
		var secTo = document.createTextNode(" From ");
		menuItem.appendChild(secTo);
		
		var menuItemInput = document.createElement("INPUT");
		menuItemInput.type = "text";
		menuItemInput.style.width = "80px";
		menuItemInput.id = "loopFrom";
		menuItemInput.step = "0.1";
		menuItemInput.value = formatTime(vid.currentTime).split(".")[0];
		menuItemInput.placeholder = "0:00";
		menuItemInput.onclick = function(){this.value = nowOrNumber(window.prompt("Enter loop start time")) || this.value || 0; this.focus(); setLoopStart(this.value);};
		menuItemInput.onchange = function(){ setLoopStart(this.value); };
		menuItem.appendChild(menuItemInput);

		var secTo = document.createTextNode(" To ");
		menuItem.appendChild(secTo);
		
		var menuItemInput = document.createElement("INPUT");
		menuItemInput.type = "text";
		menuItemInput.style.width = "80px";
		menuItemInput.id = "loopTo";
		menuItemInput.step = "0.1";
		menuItemInput.value = formatTime(vid.currentTime + 5).split(".")[0];
		menuItemInput.placeholder = "0:05";
		menuItemInput.onclick = function(){this.value = nowOrNumber(window.prompt("Enter loop end time")) || this.value || 5; this.focus(); setLoopEnd(this.value);};
		menuItemInput.onchange = function(){ setLoopEnd(this.value); };
		menuItem.appendChild(menuItemInput);

		var menuItemContent = document.createElement("DIV");
		menuItemContent.className = "ytp-menuitem-content";
		menuItem.appendChild(menuItemContent);
		
		menuItem.style.padding = "0 15px";
		menuItem.style.verticalAlign = "middle";
		for(var i = 0; i < panelMenus.length; i++) {
			panelMenus[i].appendChild(menuItem);
			linksCreated++;
		}

		// Reverse
		var menuItem = document.createElement("DIV");
		menuItem.className = "ytp-menuitem";
		menuItem["aria-haspopup"] = false;
		menuItem.role = "menuitem";
		menuItem.tabindex = "0";
		menuItem.style.height = "30px";
		menuItem.style.padding = "0 15px";
		menuItem.style.verticalAlign = "middle";
		menuItem.id = "reverseVideo";

		var menuItemLabel = document.createElement("DIV");
		menuItemLabel.className = "ytp-menuitem-label";
		menuItemLabel.innerHTML = "<span style='float: left;'>Reverse </span>";
		menuItem.appendChild(menuItemLabel);
		
		var menuItemInput = document.createElement("INPUT");
		menuItemInput.type = "checkbox";
		menuItemInput.id = "reverseCheck";
		menuItemInput.onchange = function(){
			if(this.checked) {
				reverse();
				
				if(sloMoing) {
					endSloMo();
					sloMo(storedSMDelay, storedSMAdvance);
				}
			} else {
				endReverse();
			}
		};

		menuItem.appendChild(menuItemInput);
		
		var menuItemContent = document.createElement("DIV");
		menuItemContent.className = "ytp-menuitem-content";
		menuItem.appendChild(menuItemContent);

		for(var i = 0; i < panelMenus.length; i++) {
			panelMenus[i].appendChild(menuItem);
			linksCreated++;
		}

		// Flip horizontal/vertical
		var menuItem = document.createElement("DIV");
		menuItem.className = "ytp-menuitem";
		menuItem["aria-haspopup"] = false;
		menuItem.role = "menuitem";
		menuItem.tabindex = "0";
		menuItem.style.height = "30px";
		menuItem.style.padding = "0 15px";
		menuItem.style.verticalAlign = "middle";
		menuItem.id = "loopVideo";

		if(!anotherDomain) {
			var menuItemLabel = document.createElement("DIV");
			menuItemLabel.className = "ytp-menuitem-label";
			menuItemLabel.innerHTML = "<span style='float: left;'>Flip: </span>";
			menuItem.appendChild(menuItemLabel);
		}
		
		if(anotherDomain) {
			var horText = document.createTextNode("Flip Horizontal: ");
		} else {
			var horText = document.createTextNode(" Horizontal: ");
		}
		
		menuItem.appendChild(horText);

		var menuItemInput = document.createElement("INPUT");
		menuItemInput.type = "checkbox";
		menuItemInput.id = "flipHor";
		menuItemInput.onchange = function(){
			if(this.checked) { // Horizontally flipped
				if(document.getElementById("flipVer").checked) {
					vid.style.transform = "matrix(-1, 0, 0, -1, 0, 0)";
				} else {
					vid.style.transform = "matrix(-1, 0, 0, 1, 0, 0)";
				}
			} else { // Not horizontally flipped
				if(document.getElementById("flipVer").checked) {
					vid.style.transform = "matrix(1, 0, 0, -1, 0, 0)";
				} else {
					vid.style.transform = "matrix(1, 0, 0, 1, 0, 0)";
				}
			}	
		};

		menuItem.appendChild(menuItemInput);
		
		if(anotherDomain) {
			var secTo = document.createTextNode("Flip Vertical: ");
		} else {
			var secTo = document.createTextNode(" Vertical: ");
		}

		menuItem.appendChild(secTo);
		
		var menuItemInput = document.createElement("INPUT");
		menuItemInput.type = "checkbox";
		menuItemInput.id = "flipVer";
		menuItemInput.onchange = function(){
			if(this.checked) { // Vertically flipped
				if(document.getElementById("flipHor").checked) {
					vid.style.transform = "matrix(-1, 0, 0, -1, 0, 0)";
				} else {
					vid.style.transform = "matrix(1, 0, 0, -1, 0, 0)";
				}
			} else { // Not vertically flipped
				if(document.getElementById("flipHor").checked) {
					vid.style.transform = "matrix(-1, 0, 0, 1, 0, 0)";
				} else {
					vid.style.transform = "matrix(1, 0, 0, 1, 0, 0)";
				}
			}
		};

		menuItem.appendChild(menuItemInput);

		var menuItemContent = document.createElement("DIV");
		menuItemContent.className = "ytp-menuitem-content";
		menuItem.appendChild(menuItemContent);

		for(var i = 0; i < panelMenus.length; i++) {
			panelMenus[i].appendChild(menuItem);
			linksCreated++;
		}
		
		// Skip intro ad
		if(!anotherDomain) {
			var menuItem = document.createElement("DIV");
			menuItem.className = "ytp-menuitem";
			menuItem["aria-haspopup"] = false;
			menuItem.role = "menuitem";
			menuItem.tabindex = "0";
			menuItem.style.height = "30px";
			menuItem.style.padding = "0 15px";
			menuItem.style.verticalAlign = "middle";
			menuItem.id = "skipIntroAd";
			menuItem.onclick = function(e) {
				vid.currentTime = vid.duration;
				this.parentNode.removeChild(this);
			};

			skipAdButton = menuItem;
			
			var menuItemLabel = document.createElement("DIV");
			menuItemLabel.className = "ytp-menuitem-label";
			menuItemLabel.innerHTML = "Skip intro ad";
			
			var menuItemContent = document.createElement("DIV");
			menuItemContent.className = "ytp-menuitem-content";
			menuItem.appendChild(menuItemLabel);
			menuItem.appendChild(menuItemContent);
			
			for(var i = 0; i < panelMenus.length; i++) {
				panelMenus[i].appendChild(menuItem);
				linksCreated++;
			}
		}
	}; // End addItems()

	/**
	 * @description Calls the function to create the contextmenu items for the HTML5 video.
	 * @returns {undefined|number} Returns undefined if menu has been created. Returns a number from a setTimeout if the necessary components don't exist yet on YouTube. Returns a call to addItems otherwise (this will return undefined).
	 */
	var createCustomMenu = function() {		
		if(document.getElementById("customLoop")) {
			return;
		}

		if(window.location.hostname.indexOf("youtube") === -1 && window.location.hostname.indexOf("youtu.be") === -1) {
			return addItems(true);
		}
		
		if(document.getElementsByClassName("ytp-panel-menu").length < 2) {
			return setTimeout(createCustomMenu, 1000);
		}
		
		return addItems();
	}; // End createCustomMenu()

	/**
	 * @description Takes a number describing the time in an HTML5 video, and converts it to mm:ss format (up to one decimal space).
	 * @param {number} time - The time in seconds.
	 * @return {string}
	 */
	var formatTime = function(time) {
		var sign = (time <  0) ? -1 : 1;
		
		time = Math.abs(time);
		return sign * Math.floor(time / 60) + ":" + (time % 60 < 10 ? "0" : "" ) + (time % 60).toFixed(1);
	}; // End formatTime()
	
	/**
	 * @description Takes a string of mm:ss format (including decimals), and converts to a number (as seconds).
	 * @param {string} val - The time string (of format mm:ss) to be converted.
	 * @return {number}
	 */
	var unformatTime = function(val) {
		val = val + "";
		if(val.indexOf(":") !== -1) {
			var timeArr = val.split(":"),
				valMin = parseInt(timeArr[0], 10),
				valSec = parseFloat(timeArr[1], 10);
		
			if(valMin < 0) {
				val = valMin * 60 - valSec;
			} else {
				val = valMin * 60 + valSec;
			}
		}
		
		return parseFloat(val, 10);
	}; // End unformatTime()
	
	// Returns the internal "delay" number to be used in the sloMo() function if no parameter is given for it.
	var getSMDelay = function() {
		return storedSMDelay;
	};
	
	// Returns the internal "advance" number to be used in the sloMo() function if no parameter is given for it.
	var getSMAdvance = function() {
		return storedSMAdvance;
	};

	// Returns the internal "loop start" value, to be used with the loop() function.
	var getLoopStart = function() {
		return storedLoopStart;
	};
	
	// Returns the internal "loop end" value, to be used with the loop() function.
	var getLoopEnd = function() {
		return storedLoopEnd;
	};
	
	// Sets the internal "delay" number to be used in the sloMo() function if no parameter is given for it.
	var setSMDelay = function(val) {
		storedSMDelay = val;
		return this;
	};
	
	// Sets the internal "advance" number to be used in the sloMo() function if no parameter is given for it.
	var setSMAdvance = function(val) {
		storedSMAdvance = val;
		return this;
	};

	// Sets the internal "loop start" value, to be used with the loop() function.
	var setLoopStart = function(val) {
		storedLoopStart = unformatTime(val);
		return this;
	};
	
	// Sets the internal "loop end" value, to be used with the loop() function.
	var setLoopEnd = function(val) {
		storedLoopEnd = unformatTime(val);
		return this;
	};

	// Play the video this menu was built for.
	var play = function() {
		vid.play();
		return this;
	};
	
	// Pause the video this menu was built for.
	var pause = function() {
		vid.pause();
		return this;
	};

	// Begin attempting to build the menu items, automatically.
	createCustomMenu();

	// Expose the internal methods.
	return {
		loop: loop,
		endLoop: endLoop,
		restart: restart,
		gotoTime: gotoTime,
		sloMo: sloMo,
		endSloMo: endSloMo,
		reverse: reverse,
		endReverse: endReverse,
		setTransform: setTransform,
		setSMDelay: setSMDelay,
		setSMAdvance: setSMAdvance,
		setLoopStart: setLoopStart,
		setLoopEnd: setLoopEnd,
		getSMDelay: getSMDelay,
		getSMAdvance: getSMAdvance,
		getLoopStart: getLoopStart,
		getLoopEnd: getLoopEnd,
		resetTransform: resetTransform,
		addMenuItem: addMenuItem,
		createCustomMenu: createCustomMenu,
		video: vid,
		play: play,
		pause: pause
	};
}());

// alias
if(typeof window.yv === "undefined") {
	window.yv = youVid;
}
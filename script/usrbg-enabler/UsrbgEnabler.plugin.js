//META{"name":"Usrbg Enabler","authorId":"97051685918109696","source":"https://github.com/EpicSkullYT/Naidrus-USRBG-Database/blob/master/script/usrbg-enabler/UsrbgEnabler.plugin.js"}*//
(_ => {
	if (window.BDFDB && window.BDFDB.PluginUtils && typeof window.BDFDB.PluginUtils.cleanUp == "function") window.BDFDB.PluginUtils.cleanUp(window.BDFDB);
	
	const BDFDB = {
		myPlugins: Object.assign({}, window.BDFDB && window.BDFDB.myPlugins),
		InternalData: Object.assign({
			pressedKeys: [],
			mousePosition: {
				pageX: 0,
				pageY: 0
			},
			componentPatchQueries: {}
		},
		window.BDFDB && window.BDFDB.InternalData,
		{
			creationTime: performance.now()
		}),
		name: "BDFDB"
	};
	const InternalBDFDB = {
		name: "BDFDB",
		started: true,
		patchPriority: 0
	};
	const loadId = Math.round(Math.random() * 10000000000000000), myId = "278543574059057154", myGuildId = "410787888507256842";
	BDFDB.InternalData.loadId = loadId;
	
	var settings = {};
	
	if (typeof Array.prototype.flat != "function") Array.prototype.flat = function () {return this;}

	InternalBDFDB.defaults = {
		settings: {
			showToasts:				{value:true,	description:"Show Plugin start and stop Toasts"},
			showSupportBadges:		{value:true,	description:"Show little Badges for Users who support my Patreon"}
		}
	};

	BDFDB.LogUtils = {};
	BDFDB.LogUtils.log = function (string, name) {
		console.log(`%c[${typeof name == "string" && name || "BDFDB"}]`, "color: #3a71c1; font-weight: 700;", (typeof string == "string" && string || "").trim());
	};
	BDFDB.LogUtils.warn = function (string, name) {
		console.warn(`%c[${typeof name == "string" && name || "BDFDB"}]`, "color: #3a71c1; font-weight: 700;", (typeof string == "string" && string || "").trim());
	};
	BDFDB.LogUtils.error = function (string, name) {
		console.error(`%c[${typeof name == "string" && name || "BDFDB"}]`, "color: #3a71c1; font-weight: 700;", "Fatal Error: " + (typeof string == "string" && string || "").trim());
	};
	
	BDFDB.LogUtils.log("Loading library.");
	
	BDFDB.cleanUp =
	
	BDFDB.PluginUtils = {};
	BDFDB.PluginUtils.init = BDFDB.loadMessage = function (plugin) {
		plugin.name = plugin.name || (typeof plugin.getName == "function" ? plugin.getName() : null);
		plugin.version = plugin.version || (typeof plugin.getVersion == "function" ? plugin.getVersion() : null);
		plugin.author = plugin.author || (typeof plugin.getAuthor == "function" ? plugin.getAuthor() : null);
		plugin.description = plugin.description || (typeof plugin.getDescription == "function" ? plugin.getDescription() : null);
		
		if (typeof plugin.getSettingsPanel != "function") plugin.getSettingsPanel = _ => {return plugin.started && BDFDB.PluginUtils.createSettingsPanel(plugin, []);};

		let loadMessage = BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_started", "v" + plugin.version);
		BDFDB.LogUtils.log(loadMessage, plugin.name);
		if (!BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts) && settings.showToasts) BDFDB.NotificationUtils.toast(plugin.name + " " + loadMessage, {nopointer: true, selector: "plugin-started-toast"});

		let url = typeof plugin.getRawUrl == "function" && typeof plugin.getRawUrl() == "string" ? plugin.getRawUrl() : `https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;
		BDFDB.PluginUtils.checkUpdate(plugin.name, url);

		if (typeof plugin.initConstructor === "function") BDFDB.TimeUtils.suppress(plugin.initConstructor.bind(plugin), "Could not initiate constructor!", plugin.name)();
		if (typeof plugin.css === "string") BDFDB.DOMUtils.appendLocalStyle(plugin.name, plugin.css);

		InternalBDFDB.patchPlugin(plugin);
		InternalBDFDB.addSpecialListeners(plugin);

		BDFDB.PluginUtils.translate(plugin);

		BDFDB.PluginUtils.checkChangeLog(plugin);

		if (!window.PluginUpdates || typeof window.PluginUpdates !== "object") window.PluginUpdates = {plugins: {} };
		window.PluginUpdates.plugins[url] = {name: plugin.name, raw: url, version: plugin.version};
		if (typeof window.PluginUpdates.interval === "undefined") window.PluginUpdates.interval = BDFDB.TimeUtils.interval(_ => {BDFDB.PluginUtils.checkAllUpdates();}, 1000*60*60*2);

		plugin.started = true;
		delete plugin.stopping;
		
		let startAmount = 1;
		for (let name in BDFDB.myPlugins) if (!BDFDB.myPlugins[name].started && typeof BDFDB.myPlugins[name].initialize == "function") setTimeout(_ => {BDFDB.TimeUtils.suppress(BDFDB.myPlugins[name].initialize.bind(BDFDB.myPlugins[name]), "Could not initiate plugin!", name)();}, 100 * (startAmount++));
	};
	BDFDB.PluginUtils.clear = BDFDB.unloadMessage = function (plugin) {
		InternalBDFDB.clearStartTimeout(plugin);

		delete BDFDB.myPlugins[plugin.name];

		let unloadMessage = BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_stopped", "v" + plugin.version);
		BDFDB.LogUtils.log(unloadMessage, plugin.name);
		if (!BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts) && settings.showToasts) BDFDB.NotificationUtils.toast(plugin.name + " " + unloadMessage, {nopointer: true, selector: "plugin-stopped-toast"});

		let url = typeof plugin.getRawUrl == "function" && typeof plugin.getRawUrl() == "string" ? plugin.getRawUrl() : `https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;

		if (typeof plugin.css === "string") BDFDB.DOMUtils.removeLocalStyle(plugin.name);

		BDFDB.PluginUtils.cleanUp(plugin);
		
		for (let type in BDFDB.InternalData.componentPatchQueries) BDFDB.ArrayUtils.remove(BDFDB.InternalData.componentPatchQueries[type].query, plugin, true);
		
		for (let modal of document.querySelectorAll(`.${plugin.name}-modal, .${plugin.name.toLowerCase()}-modal, .${plugin.name}-settingsmodal, .${plugin.name.toLowerCase()}-settingsmodal`)) {
			let closeButton = modal.querySelector(BDFDB.dotCN.modalclose);
			if (closeButton) closeButton.click();
		}
		
		delete BDFDB.DataUtils.cached[plugin.name]
		delete window.PluginUpdates.plugins[url];

		delete plugin.started;
		BDFDB.TimeUtils.timeout(_ => {delete plugin.stopping;});
	};
	BDFDB.PluginUtils.translate = function (plugin) {
		plugin.labels = {};
		if (typeof plugin.setLabelsByLanguage === "function" || typeof plugin.changeLanguageStrings === "function") {
			if (LibraryModules.LanguageStore.chosenLocale) translate();
			else BDFDB.TimeUtils.interval(interval => {
				if (LibraryModules.LanguageStore.chosenLocale) {
					BDFDB.TimeUtils.clear(interval);
					translate();
				}
			}, 100);
			function translate() {
				let language = BDFDB.LanguageUtils.getLanguage();
				if (typeof plugin.setLabelsByLanguage === "function") plugin.labels = plugin.setLabelsByLanguage(language.id);
				if (typeof plugin.changeLanguageStrings === "function") plugin.changeLanguageStrings();
				BDFDB.LogUtils.log(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_translated", language.ownlang), plugin.name);
			}
		}
	};
	BDFDB.PluginUtils.cleanUp = function (plugin) {
		BDFDB.ListenerUtils.remove(plugin);
		BDFDB.StoreChangeUtils.remove(plugin);
		BDFDB.ObserverUtils.disconnect(plugin);
		BDFDB.ModuleUtils.unpatch(plugin);
		BDFDB.WindowUtils.closeAll(plugin);
		BDFDB.WindowUtils.removeListener(plugin);
	};
	BDFDB.PluginUtils.checkUpdate = function (pluginName, url) {
		if (pluginName && url) return new Promise(callback => {
			LibraryRequires.request(url, (error, response, result) => {
				if (error) return callback(null);
				let newVersion = result.match(/['"][0-9]+\.[0-9]+\.[0-9]+['"]/i);
				if (!newVersion) return callback(null);
				if (BDFDB.NumberUtils.getVersionDifference(newVersion[0], window.PluginUpdates.plugins[url].version) > 0.2) {
					BDFDB.NotificationUtils.toast(`${pluginName} will be force updated, because your version is heavily outdated.`, {
						type: "warn",
						nopointer: true,
						selector: "plugin-forceupdate-toast"
					});
					BDFDB.PluginUtils.downloadUpdate(pluginName, url);
					return callback(2);
				}
				else if (BDFDB.NumberUtils.compareVersions(newVersion[0], window.PluginUpdates.plugins[url].version)) {
					BDFDB.PluginUtils.showUpdateNotice(pluginName, url);
					return callback(1);
				}
				else {
					BDFDB.PluginUtils.removeUpdateNotice(pluginName);
					return callback(0);
				}
			});
		});
		return new Promise(_ => {callback(null);});
	};
	BDFDB.PluginUtils.checkAllUpdates = function () {
		return new Promise(callback => {
			let finished = 0, amount = 0;
			for (let url in window.PluginUpdates.plugins) {
				let plugin = window.PluginUpdates.plugins[url];
				if (plugin) BDFDB.PluginUtils.checkUpdate(plugin.name, plugin.raw).then(state => {
					finished++;
					if (state == 1) amount++;
					if (finished >= Object.keys(window.PluginUpdates.plugins).length) callback(amount);
				});
			}
		});
	};
	BDFDB.PluginUtils.showUpdateNotice = function (pluginName, url) {
		if (!pluginName || !url) return;
		let updateNotice = document.querySelector("#pluginNotice");
		if (!updateNotice) {
			updateNotice = BDFDB.NotificationUtils.notice(`${BDFDB.LanguageUtils.LibraryStrings.update_notice_update}&nbsp;&nbsp;&nbsp;&nbsp;<strong id="outdatedPlugins"></strong>`, {html:true, id:"pluginNotice", type:"info", btn:!BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.automaticLoading) ? BDFDB.LanguageUtils.LanguageStrings.ERRORS_RELOAD : "", customicon:`<svg height="100%" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="100%" version="1.1" viewBox="0 0 2000 2000"><metadata /><defs><filter id="shadow1"><feDropShadow dx="20" dy="0" stdDeviation="20" flood-color="rgba(0,0,0,0.35)"/></filter><filter id="shadow2"><feDropShadow dx="15" dy="0" stdDeviation="20" flood-color="rgba(255,255,255,0.15)"/></filter><filter id="shadow3"><feDropShadow dx="10" dy="0" stdDeviation="20" flood-color="rgba(0,0,0,0.35)"/></filter></defs><g><path style="filter: url(#shadow3)" d="M1195.44+135.442L1195.44+135.442L997.6+136.442C1024.2+149.742+1170.34+163.542+1193.64+179.742C1264.34+228.842+1319.74+291.242+1358.24+365.042C1398.14+441.642+1419.74+530.642+1422.54+629.642L1422.54+630.842L1422.54+632.042C1422.54+773.142+1422.54+1228.14+1422.54+1369.14L1422.54+1370.34L1422.54+1371.54C1419.84+1470.54+1398.24+1559.54+1358.24+1636.14C1319.74+1709.94+1264.44+1772.34+1193.64+1821.44C1171.04+1837.14+1025.7+1850.54+1000+1863.54L1193.54+1864.54C1539.74+1866.44+1864.54+1693.34+1864.54+1296.64L1864.54+716.942C1866.44+312.442+1541.64+135.442+1195.44+135.442Z" fill="#171717" opacity="1"/><path style="filter: url(#shadow2)" d="M1695.54+631.442C1685.84+278.042+1409.34+135.442+1052.94+135.442L361.74+136.442L803.74+490.442L1060.74+490.442C1335.24+490.442+1335.24+835.342+1060.74+835.342L1060.74+1164.84C1150.22+1164.84+1210.53+1201.48+1241.68+1250.87C1306.07+1353+1245.76+1509.64+1060.74+1509.64L361.74+1863.54L1052.94+1864.54C1409.24+1864.54+1685.74+1721.94+1695.54+1368.54C1695.54+1205.94+1651.04+1084.44+1572.64+999.942C1651.04+915.542+1695.54+794.042+1695.54+631.442Z" fill="#3E82E5" opacity="1"/><path style="filter: url(#shadow1)" d="M1469.25+631.442C1459.55+278.042+1183.05+135.442+826.65+135.442L135.45+135.442L135.45+1004C135.45+1004+135.427+1255.21+355.626+1255.21C575.825+1255.21+575.848+1004+575.848+1004L577.45+490.442L834.45+490.442C1108.95+490.442+1108.95+835.342+834.45+835.342L664.65+835.342L664.65+1164.84L834.45+1164.84C923.932+1164.84+984.244+1201.48+1015.39+1250.87C1079.78+1353+1019.47+1509.64+834.45+1509.64L135.45+1509.64L135.45+1864.54L826.65+1864.54C1182.95+1864.54+1459.45+1721.94+1469.25+1368.54C1469.25+1205.94+1424.75+1084.44+1346.35+999.942C1424.75+915.542+1469.25+794.042+1469.25+631.442Z" fill="#FFFFFF" opacity="1"/></g></svg>`});
			updateNotice.style.setProperty("display", "block", "important");
			updateNotice.style.setProperty("visibility", "visible", "important");
			updateNotice.style.setProperty("opacity", "1", "important");
			updateNotice.querySelector(BDFDB.dotCN.noticedismiss).addEventListener("click", _ => {
				BDFDB.DOMUtils.remove(".update-clickme-tooltip");
			});
			let reloadButton = updateNotice.querySelector(BDFDB.dotCN.noticebutton);
			if (reloadButton) {
				BDFDB.DOMUtils.toggle(reloadButton, true);
				reloadButton.addEventListener("click", _ => {
					LibraryRequires.electron.remote.getCurrentWindow().reload();
				});
				reloadButton.addEventListener("mouseenter", _ => {
					if (window.PluginUpdates.downloaded) BDFDB.TooltipUtils.create(reloadButton, window.PluginUpdates.downloaded.join(", "), {type:"bottom", selector:"update-notice-tooltip", style: "max-width: 420px"});
				});
			}
		}
		if (updateNotice) {
			let updateNoticeList = updateNotice.querySelector("#outdatedPlugins");
			if (updateNoticeList && !updateNoticeList.querySelector(`#${pluginName}-notice`)) {
				if (updateNoticeList.querySelector("span")) updateNoticeList.appendChild(BDFDB.DOMUtils.create(`<span class="separator">, </span>`));
				let updateEntry = BDFDB.DOMUtils.create(`<span id="${pluginName}-notice">${pluginName}</span>`);
				updateEntry.addEventListener("click", _ => {BDFDB.PluginUtils.downloadUpdate(pluginName, url);});
				updateNoticeList.appendChild(updateEntry);
				if (!updateNoticeList.hasTooltip) {
					updateNoticeList.hasTooltip = true;
					BDFDB.TooltipUtils.create(updateNoticeList, BDFDB.LanguageUtils.LibraryStrings.update_notice_click, {
						type: "bottom",
						unhideable: true,
						delay: 500,
						onHide: _ => {updateNoticeList.hasTooltip = false;}
					});
				}
			}
		}
	};
	BDFDB.PluginUtils.removeUpdateNotice = function (pluginName, updateNotice = document.querySelector("#pluginNotice")) {
		if (!pluginName || !updateNotice) return;
		let updateNoticeList = updateNotice.querySelector("#outdatedPlugins");
		if (updateNoticeList) {
			let noticeEntry = updateNoticeList.querySelector(`#${pluginName}-notice`);
			if (noticeEntry) {
				let nextSibling = noticeEntry.nextSibling;
				let prevSibling = noticeEntry.prevSibling;
				if (nextSibling && BDFDB.DOMUtils.containsClass(nextSibling, "separator")) nextSibling.remove();
				else if (prevSibling && BDFDB.DOMUtils.containsClass(prevSibling, "separator")) prevSibling.remove();
				noticeEntry.remove();
			}
			if (!updateNoticeList.querySelector("span")) {
				let reloadButton = updateNotice.querySelector(BDFDB.dotCN.noticebutton);
				if (reloadButton) {
					updateNotice.querySelector(".notice-message").innerText = BDFDB.LanguageUtils.LibraryStrings.update_notice_reload;
					BDFDB.DOMUtils.toggle(reloadButton, false);
				}
				else updateNotice.querySelector(BDFDB.dotCN.noticedismiss).click();
			}
		}
	};
	BDFDB.PluginUtils.downloadUpdate = function (pluginName, url) {
		if (!pluginName || !url) return;
		LibraryRequires.request(url, (error, response, body) => {
			if (error) return BDFDB.LogUtils.warn("Unable to get update for " + pluginName);
			BDFDB.InternalData.creationTime = 0;
			let wasEnabled = BDFDB.BDUtils.isPluginEnabled(pluginName);
			let newName = (body.match(/"name"\s*:\s*"([^"]+)"/) || [])[1] || pluginName;
			let newVersion = body.match(/['"][0-9]+\.[0-9]+\.[0-9]+['"]/i).toString().replace(/['"]/g, "");
			let oldVersion = window.PluginUpdates.plugins[url].version;
			LibraryRequires.fs.writeFile(LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), newName + ".plugin.js"), body, _ => {
				if (pluginName != newName) {
					url = url.replace(new RegExp(pluginName, "g"), newName);
					LibraryRequires.fs.unlink(LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), pluginName + ".plugin.js"), _ => {});
					let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), pluginName + ".config.json");
					LibraryRequires.fs.exists(configPath, exists => {
						if (exists) LibraryRequires.fs.rename(configPath, LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), newName + ".config.json"), _ => {});
					});
					BDFDB.TimeUtils.timeout(_ => {if (wasEnabled && !BDFDB.BDUtils.isPluginEnabled(newName)) BDFDB.BDUtils.enablePlugin(newName);}, 3000);
				}
				BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_updated", pluginName, "v" + oldVersion, newName, "v" + newVersion), {nopointer:true, selector:"plugin-updated-toast"});
				let updateNotice = document.querySelector("#pluginNotice");
				if (updateNotice) {
					if (updateNotice.querySelector(BDFDB.dotCN.noticebutton)) {
						window.PluginUpdates.plugins[url].version = newVersion;
						if (!window.PluginUpdates.downloaded) window.PluginUpdates.downloaded = [];
						if (!window.PluginUpdates.downloaded.includes(pluginName)) window.PluginUpdates.downloaded.push(pluginName);
					}
					BDFDB.PluginUtils.removeUpdateNotice(pluginName, updateNotice);
				}
			});
		});
	};
	BDFDB.PluginUtils.checkChangeLog = function (plugin) {
		if (!BDFDB.ObjectUtils.is(plugin) || !plugin.changelog) return;
		let changeLog = BDFDB.DataUtils.load(plugin, "changelog");
		if (!changeLog.currentversion || BDFDB.NumberUtils.compareVersions(plugin.version, changeLog.currentversion)) {
			changeLog.currentversion = plugin.version;
			BDFDB.DataUtils.save(changeLog, plugin, "changelog");
			BDFDB.PluginUtils.openChangeLog(plugin);
		}
	};
	BDFDB.PluginUtils.openChangeLog = function (plugin) {
		if (!BDFDB.ObjectUtils.is(plugin) || !plugin.changelog) return;
		let changeLogHTML = "", headers = {
			added: "New Features",
			fixed: "Bug Fixes",
			improved: "Improvements",
			progress: "Progress"
		};
		for (let type in plugin.changelog) {
			type = type.toLowerCase();
			let className = BDFDB.disCN["changelog" + type];
			if (className) {
				changeLogHTML += `<h1 class="${className} ${BDFDB.disCN.margintop20}"${changeLogHTML.indexOf("<h1") == -1 ? `style="margin-top: 0px !important;"` : ""}>${headers[type]}</h1><ul>`;
				for (let log of plugin.changelog[type]) changeLogHTML += `<li><strong>${log[0]}</strong>${log[1] ? (": " + log[1] + ".") : ""}</li>`;
				changeLogHTML += `</ul>`
			}
		}
		if (changeLogHTML) BDFDB.ModalUtils.open(plugin, {header:`${plugin.name} ${BDFDB.LanguageUtils.LanguageStrings.CHANGE_LOG}`, subheader:`Version ${plugin.version}`, children:BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(changeLogHTML)), className:BDFDB.disCN.modalchangelogmodal, contentClassName:BDFDB.disCNS.changelogcontainer + BDFDB.disCN.modalminicontent});
	};
	BDFDB.PluginUtils.addLoadingIcon = function (icon) {
		if (!Node.prototype.isPrototypeOf(icon)) return;
		let app = document.querySelector(BDFDB.dotCN.app);
		if (!app) return;
		BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.loadingicon);
		let loadingIconWrapper = document.querySelector(BDFDB.dotCN.app + ">" + BDFDB.dotCN.loadingiconwrapper)
		if (!loadingIconWrapper) {
			loadingIconWrapper = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCN.loadingiconwrapper}"></div>`);
			app.appendChild(loadingIconWrapper);
			let killObserver = new MutationObserver(changes => {if (!loadingIconWrapper.firstElementChild) BDFDB.DOMUtils.remove(loadingIconWrapper);});
			killObserver.observe(loadingIconWrapper, {childList:true});
		}
		loadingIconWrapper.appendChild(icon);
	};
	BDFDB.PluginUtils.createSettingsPanel = function (plugin, children) {
		if (!BDFDB.ObjectUtils.is(plugin) || !children || (!BDFDB.ReactUtils.isValidElement(children) && !BDFDB.ArrayUtils.is(children))) return;
		let settingsPanel = BDFDB.DOMUtils.create(`<div class="${plugin.name}-settings ${BDFDB.disCN.settingsPanel}"></div>`);
		BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsPanel, {
			key: `${plugin.name}-settingsPanel`,
			title: plugin.name,
			controls: [
				plugin.changelog && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
					className: BDFDB.disCN.settingspanelheaderbutton,
					children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
						text: BDFDB.LanguageUtils.LanguageStrings.CHANGE_LOG,
						children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
							name: InternalComponents.LibraryComponents.SvgIcon.Names.CHANGELOG,
							onClick: _ => {BDFDB.PluginUtils.openChangeLog(plugin);}
						})
					})
				}),
				plugin != BDFDB && !plugin.noLibrary && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Button, {
					size: InternalComponents.LibraryComponents.Button.Sizes.MIN,
					children: BDFDB.LanguageUtils.LibraryStrings.library_settings,
					onClick: event => {
						let wrapper = BDFDB.DOMUtils.getParent(BDFDB.dotCN._repocard, event.currentTarget);
						if (wrapper) {
							let settingsPanel = InternalBDFDB.createLibrarySettings();
							if (settingsPanel) {
								let savedChildren = [];
								while (wrapper.childElementCount) {
									savedChildren.push(wrapper.firstChild);
									wrapper.firstChild.remove();
								}
								let closeButton = BDFDB.DOMUtils.create(`<div style="float: right; cursor: pointer;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" style="width: 18px; height: 18px;"><g class="background" fill="none" fill-rule="evenodd"><path d="M0 0h12v12H0"></path><path class="fill" fill="#dcddde" d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6"></path></g></svg></div>`);
								wrapper.appendChild(closeButton);
								closeButton.addEventListener("click", _ => {
									while (wrapper.childElementCount) wrapper.firstChild.remove();
									while (savedChildren.length) wrapper.appendChild(savedChildren.shift());
									let settings = wrapper.querySelector(BDFDB.dotCN._reposettings);
									if (settings) {
										while (settings.childElementCount) settings.firstChild.remove();
										settings.appendChild(plugin.getSettingsPanel());
									}
								});
								wrapper.appendChild(settingsPanel);
							}
						}
					}
				})
			],
			children: children
		}), settingsPanel);
		return settingsPanel;
	};
	BDFDB.PluginUtils.refreshSettingsPanel = function (plugin, settingsPanel, ...args) {
		if (!BDFDB.ObjectUtils.is(plugin) || typeof plugin.getSettingsPanel != "function" || !Node.prototype.isPrototypeOf(settingsPanel) || !settingsPanel.parentElement) return;
		settingsPanel.parentElement.appendChild(plugin.getSettingsPanel(...args));
		settingsPanel.remove();
	};
	InternalBDFDB.createLibrarySettings = function () {
		if (!window.BDFDB || typeof BDFDB != "object" || !BDFDB.loaded) return;
		let settingsPanel, settingsItems = [];
		
		let bdToastSetting = BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts);
		for (let key in settings) settingsItems.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsSaveItem, {
			className: BDFDB.disCN.marginbottom8,
			type: "Switch",
			plugin: InternalBDFDB,
			disabled: key == "showToasts" && bdToastSetting,
			keys: ["settings", key],
			label: InternalBDFDB.defaults.settings[key].description,
			note: key == "showToasts" && bdToastSetting && "Disable BBDs general 'Show Toast' setting before disabling this",
			dividerbottom: true,
			value: settings[key] || key == "showToasts" && bdToastSetting
		}));
		
		return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(BDFDB, settingsItems);
	};
	InternalBDFDB.clearStartTimeout = function (plugin) {
		if (!BDFDB.ObjectUtils.is(plugin)) return;
		BDFDB.TimeUtils.clear(plugin.startTimeout, plugin.libLoadTimeout);
		delete plugin.startTimeout;
		delete plugin.libLoadTimeout;
	};
	InternalBDFDB.addSpecialListeners = function (plugin) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (BDFDB.ObjectUtils.is(plugin)) {
			if (typeof plugin.onSettingsClosed === "function") {
				let SettingsLayer = BDFDB.ModuleUtils.findByName("StandardSidebarView");
				if (SettingsLayer) BDFDB.ModuleUtils.patch(plugin, SettingsLayer.prototype, "componentWillUnmount", {after: e => {
					plugin.onSettingsClosed();
				}});
			}
			if (typeof plugin.onSwitch === "function") {
				let spacer = document.querySelector(`${BDFDB.dotCN.guildswrapper} ~ * > ${BDFDB.dotCN.chatspacer}`);
				if (spacer) {
					let noChannelObserver = new MutationObserver(changes => {changes.forEach(change => {
						if (change.target && BDFDB.DOMUtils.containsClass(change.target, BDFDB.disCN.nochannel)) plugin.onSwitch();
					});});
					BDFDB.ObserverUtils.connect(plugin, spacer.querySelector(BDFDB.dotCNC.chat + BDFDB.dotCN.nochannel), {name:"switchFixNoChannelObserver", instance:noChannelObserver}, {attributes: true});
					let spacerObserver = new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(node => {
						if (BDFDB.DOMUtils.containsClass(node, BDFDB.disCN.chat, BDFDB.disCN.nochannel, false)) {
							BDFDB.ObserverUtils.connect(plugin, node, {name:"switchFixNoChannelObserver", instance:noChannelObserver}, {attributes: true});
						}
					});}});});
					BDFDB.ObserverUtils.connect(plugin, spacer, {name:"switchFixSpacerObserver", instance:spacerObserver}, {childList: true});
				}
			}
			InternalBDFDB.addContextListeners(plugin);
		}
	};
	
	BDFDB.ObserverUtils = {};
	BDFDB.ObserverUtils.connect = function (plugin, eleOrSelec, observer, config = {childList: true}) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || !eleOrSelec || !observer) return;
		if (BDFDB.ObjectUtils.isEmpty(plugin.observers)) plugin.observers = {};
		if (!BDFDB.ArrayUtils.is(plugin.observers[observer.name])) plugin.observers[observer.name] = [];
		if (!observer.multi) for (let subinstance of plugin.observers[observer.name]) subinstance.disconnect();
		if (observer.instance) plugin.observers[observer.name].push(observer.instance);
		let instance = plugin.observers[observer.name][plugin.observers[observer.name].length - 1];
		if (instance) {
			let node = Node.prototype.isPrototypeOf(eleOrSelec) ? eleOrSelec : typeof eleOrSelec === "string" ? document.querySelector(eleOrSelec) : null;
			if (node) instance.observe(node, config);
		}
	};
	BDFDB.ObserverUtils.disconnect = function (plugin, observer) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (BDFDB.ObjectUtils.is(plugin) && !BDFDB.ObjectUtils.isEmpty(plugin.observers)) {
			let observername = typeof observer == "string" ? observer : (BDFDB.ObjectUtils.is(observer) ? observer.name : null);
			if (!observername) {
				for (let observer in plugin.observers) for (let instance of plugin.observers[observer]) instance.disconnect();
				delete plugin.observers;
			}
			else if (!BDFDB.ArrayUtils.is(plugin.observers[observername])) {
				for (let instance of plugin.observers[observername]) instance.disconnect();
				delete plugin.observers[observername];
			}
		}
	};

	BDFDB.StoreChangeUtils = {};
	BDFDB.StoreChangeUtils.add = function (plugin, store, callback) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(store) || typeof store.addChangeListener != "function" ||  typeof callback != "function") return;
		BDFDB.ListenerUtils.remove(plugin, store, callback);
		if (!BDFDB.ArrayUtils.is(plugin.changeListeners)) plugin.changeListeners = [];
		plugin.changeListeners.push({store, callback});
		store.addChangeListener(callback);
	};
	BDFDB.StoreChangeUtils.remove = function (plugin, store, callback) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.changeListeners)) return;
		if (!store) {
			while (plugin.changeListeners.length) {
				let listener = plugin.changeListeners.pop();
				listener.store.removeChangeListener(listener.callback);
			}
		}
		else if (BDFDB.ObjectUtils.is(store) && typeof store.addChangeListener == "function") {
			if (!callback) {
				for (let listener of plugin.changeListeners) {
					let removedListeners = [];
					if (listener.store == store) {
						listener.store.removeChangeListener(listener.callback);
						removedListeners.push(listener);
					}
					if (removedListeners.length) plugin.changeListeners = plugin.changeListeners.filter(listener => !removedListeners.includes(listener));
				}
			}
			else if (typeof callback == "function") {
				store.removeChangeListener(callback);
				plugin.changeListeners = plugin.changeListeners.filter(listener => listener.store == store && listener.callback == callback);
			}
		}
	};

	BDFDB.ListenerUtils = {};
	BDFDB.ListenerUtils.add = function (plugin, ele, actions, selectorOrCallback, callbackOrNothing) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || (!Node.prototype.isPrototypeOf(ele) && ele !== window) || !actions) return;
		let callbackIs4th = typeof selectorOrCallback == "function";
		let selector = callbackIs4th ? undefined : selectorOrCallback;
		let callback = callbackIs4th ? selectorOrCallback : callbackOrNothing;
		if (typeof callback != "function") return;
		BDFDB.ListenerUtils.remove(plugin, ele, actions, selector);
		for (let action of actions.split(" ")) {
			action = action.split(".");
			let eventName = action.shift().toLowerCase();
			if (!eventName) return;
			let origEventName = eventName;
			eventName = eventName == "mouseenter" || eventName == "mouseleave" ? "mouseover" : eventName;
			let namespace = (action.join(".") || "") + plugin.name;
			if (!BDFDB.ArrayUtils.is(plugin.eventListeners)) plugin.eventListeners = [];
			let eventCallback = null;
			if (selector) {
				if (origEventName == "mouseenter" || origEventName == "mouseleave") {
					eventCallback = e => {
						for (let child of e.path) if (typeof child.matches == "function" && child.matches(selector) && !child[namespace + "BDFDB" + origEventName]) {
							child[namespace + "BDFDB" + origEventName] = true;
							if (origEventName == "mouseenter") callback(BDFDB.ListenerUtils.copyEvent(e, child));
							let mouseout = e2 => {
								if (e2.target.contains(child) || e2.target == child || !child.contains(e2.target)) {
									if (origEventName == "mouseleave") callback(BDFDB.ListenerUtils.copyEvent(e, child));
									delete child[namespace + "BDFDB" + origEventName];
									document.removeEventListener("mouseout", mouseout);
								}
							};
							document.addEventListener("mouseout", mouseout);
							break;
						}
					};
				}
				else {
					eventCallback = e => {
						for (let child of e.path) if (typeof child.matches == "function" && child.matches(selector)) {
							callback(BDFDB.ListenerUtils.copyEvent(e, child));
							break;
						}
					};
				}
			}
			else eventCallback = e => {callback(BDFDB.ListenerUtils.copyEvent(e, ele));};

			plugin.eventListeners.push({ele, eventName, origEventName, namespace, selector, eventCallback});
			ele.addEventListener(eventName, eventCallback, true);
		}
	};
	BDFDB.ListenerUtils.remove = function (plugin, ele, actions = "", selector) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.eventListeners)) return;
		if (!ele) {
			while (plugin.eventListeners.length) {
				let listener = plugin.eventListeners.pop();
				listener.ele.removeEventListener(listener.eventName, listener.eventCallback, true);
			}
		}
		else if (Node.prototype.isPrototypeOf(ele) || ele === window) {
			for (let action of actions.split(" ")) {
				action = action.split(".");
				let eventName = action.shift().toLowerCase();
				let namespace = (action.join(".") || "") + plugin.name;
				for (let listener of plugin.eventListeners) {
					let removedListeners = [];
					if (listener.ele == ele && (!eventName || listener.origEventName == eventName) && listener.namespace == namespace && (selector === undefined || listener.selector == selector)) {
						listener.ele.removeEventListener(listener.eventName, listener.eventCallback, true);
						removedListeners.push(listener);
					}
					if (removedListeners.length) plugin.eventListeners = plugin.eventListeners.filter(listener => !removedListeners.includes(listener));
				}
			}
		}
	};
	BDFDB.ListenerUtils.multiAdd = function (node, actions, callback) {
		if (!Node.prototype.isPrototypeOf(node) || !actions || typeof callback != "function") return;
		for (let action of actions.trim().split(" ").filter(n => n)) node.addEventListener(action, callback, true);
	};
	BDFDB.ListenerUtils.multiRemove = function (node, actions, callback) {
		if (!Node.prototype.isPrototypeOf(node) || !actions || typeof callback != "function") return;
		for (let action of actions.trim().split(" ").filter(n => n)) node.removeEventListener(action, callback, true);
	};
	BDFDB.ListenerUtils.addToChildren = function (node, actions, selector, callback) {
		if (!Node.prototype.isPrototypeOf(node) || !actions || !selector || !selector.trim() || typeof callback != "function") return;
		for (let action of actions.trim().split(" ").filter(n => n)) {
			let eventCallback = callback;
			if (action == "mouseenter" || action == "mouseleave") eventCallback = e => {if (e.target.matches(selector)) callback(e);};
			node.querySelectorAll(selector.trim()).forEach(child => {child.addEventListener(action, eventCallback, true);});
		}
	};
	BDFDB.ListenerUtils.copyEvent = function (e, ele) {
		if (!e || !e.constructor || !e.type) return e;
		let eCopy = new e.constructor(e.type, e);
		Object.defineProperty(eCopy, "originalEvent", {value: e});
		Object.defineProperty(eCopy, "which", {value: e.which});
		Object.defineProperty(eCopy, "keyCode", {value: e.keyCode});
		Object.defineProperty(eCopy, "path", {value: e.path});
		Object.defineProperty(eCopy, "relatedTarget", {value: e.relatedTarget});
		Object.defineProperty(eCopy, "srcElement", {value: e.srcElement});
		Object.defineProperty(eCopy, "target", {value: e.target});
		Object.defineProperty(eCopy, "toElement", {value: e.toElement});
		if (ele) Object.defineProperty(eCopy, "currentTarget", {value: ele});
		return eCopy;
	};
	BDFDB.ListenerUtils.stopEvent = function (e) {
		if (BDFDB.ObjectUtils.is(e)) {
			if (typeof e.preventDefault == "function") e.preventDefault();
			if (typeof e.stopPropagation == "function") e.stopPropagation();
			if (typeof e.stopImmediatePropagation == "function") e.stopImmediatePropagation();
			if (BDFDB.ObjectUtils.is(e.originalEvent)) {
				if (typeof e.originalEvent.preventDefault == "function") e.originalEvent.preventDefault();
				if (typeof e.originalEvent.stopPropagation == "function") e.originalEvent.stopPropagation();
				if (typeof e.originalEvent.stopImmediatePropagation == "function") e.originalEvent.stopImmediatePropagation();
			}
		}
	};
	
	var NotificationBars = [], DesktopNotificationQueue = {queue:[], running:false};
	BDFDB.NotificationUtils = {};
	BDFDB.NotificationUtils.toast = function (text, options = {}) {
		let toasts = document.querySelector(".toasts, .bd-toasts");
		if (!toasts) {
			let channels = document.querySelector(BDFDB.dotCN.channels + " + div");
			let channelRects = channels ? BDFDB.DOMUtils.getRects(channels) : null;
			let members = channels ? channels.querySelector(BDFDB.dotCN.memberswrap) : null;
			let left = channelRects ? channelRects.left : 310;
			let width = channelRects ? (members ? channelRects.width - BDFDB.DOMUtils.getRects(members).width : channelRects.width) : window.outerWidth - 0;
			let form = channels ? channels.querySelector("form") : null;
			let bottom = form ? BDFDB.DOMUtils.getRects(form).height : 80;
			toasts = BDFDB.DOMUtils.create(`<div class="toasts bd-toasts" style="width:${width}px; left:${left}px; bottom:${bottom}px;"></div>`);
			(document.querySelector(BDFDB.dotCN.app) || document.body).appendChild(toasts);
		}
		const {type = "", icon = true, timeout = 3000, html = false, selector = "", nopointer = false, color = ""} = options;
		let toast = BDFDB.DOMUtils.create(`<div class="toast bd-toast">${html === true ? text : BDFDB.StringUtils.htmlEscape(text)}</div>`);
		if (type) {
			BDFDB.DOMUtils.addClass(toast, "toast-" + type);
			if (icon) BDFDB.DOMUtils.addClass(toast, "icon");
		}
		else if (color) {
			let rgbcolor = BDFDB.ColorUtils.convert(color, "RGB");
			if (rgbcolor) toast.style.setProperty("background-color", rgbcolor);
		}
		BDFDB.DOMUtils.addClass(toast, selector);
		toasts.appendChild(toast);
		toast.close = _ => {
			if (document.contains(toast)) {
				BDFDB.DOMUtils.addClass(toast, "closing");
				toast.style.setProperty("pointer-events", "none", "important");
				BDFDB.TimeUtils.timeout(_ => {
					toast.remove();
					if (!toasts.querySelectorAll(".toast, .bd-toast").length) toasts.remove();
				}, 3000);
			}
		};
		if (nopointer) toast.style.setProperty("pointer-events", "none", "important");
		else toast.addEventListener("click", toast.close);
		BDFDB.TimeUtils.timeout(_ => {toast.close();}, timeout > 0 ? timeout : 600000);
		return toast;
	};
	BDFDB.NotificationUtils.desktop = function (parsedcontent, parsedoptions = {}) {
		const queue = _ => {
			DesktopNotificationQueue.queue.push({parsedcontent, parsedoptions});
			runqueue();
		};
		const runqueue = _ => {
			if (!DesktopNotificationQueue.running) {
				let notification = DesktopNotificationQueue.queue.shift();
				if (notification) notify(notification.parsedcontent, notification.parsedoptions);
			}
		};
		const notify = (content, options) => {
			DesktopNotificationQueue.running = true;
			let muted = options.silent;
			options.silent = options.silent || options.sound ? true : false;
			let notification = new Notification(content, options);
			let audio = new Audio();
			let timeout = BDFDB.TimeUtils.timeout(_ => {close();}, options.timeout ? options.timeout : 3000);
			if (typeof options.click == "function") notification.onclick = _ => {
				BDFDB.TimeUtils.clear(timeout);
				close();
				options.click();
			};
			if (!muted && options.sound) {
				audio.src = options.sound;
				audio.play();
			}
			const close = _ => {
				audio.pause();
				notification.close();
				DesktopNotificationQueue.running = false;
				BDFDB.TimeUtils.timeout(_ => {runqueue();}, 1000);
			};
		};
		if (!("Notification" in window)) {}
		else if (Notification.permission === "granted") queue();
		else if (Notification.permission !== "denied") Notification.requestPermission(function (response) {if (response === "granted") queue();});
	};
	BDFDB.NotificationUtils.notice = function (text, options = {}) {
		if (!text) return;
		let layers = document.querySelector(BDFDB.dotCN.layers);
		if (!layers) return;
		let id = BDFDB.NumberUtils.generateId(NotificationBars);
		let notice = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCNS.notice + BDFDB.disCN.noticewrapper}" notice-id="${id}"><div class="${BDFDB.disCN.noticedismiss}" style="height: 36px !important; position: absolute !important; top: 0 !important; right: 0 !important; left: unset !important;"></div><span class="notice-message"></span></div>`);
		layers.parentElement.insertBefore(notice, layers);
		let noticeMessage = notice.querySelector(".notice-message");
		if (options.platform) for (let platform of options.platform.split(" ")) if (DiscordClasses["noticeicon" + platform]) {
			let icon = BDFDB.DOMUtils.create(`<i class="${BDFDB.disCN["noticeicon" + platform]}"></i>`);
			BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.noticeplatformicon);
			BDFDB.DOMUtils.removeClass(icon, BDFDB.disCN.noticeicon);
			notice.insertBefore(icon, noticeMessage);
		}
		if (options.customicon) {
			let iconinner = BDFDB.DOMUtils.create(options.customicon)
			let icon = BDFDB.DOMUtils.create(`<i></i>`);
			if (iconinner.tagName == "span" && !iconinner.firstElementChild) icon.style.setProperty("background", `url(${options.customicon}) center/cover no-repeat`);
			else icon.appendChild(iconinner);
			BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.noticeplatformicon);
			BDFDB.DOMUtils.removeClass(icon, BDFDB.disCN.noticeicon);
			notice.insertBefore(icon, noticeMessage);
		}
		if (options.btn || options.button) notice.appendChild(BDFDB.DOMUtils.create(`<button class="${BDFDB.disCNS.noticebutton + BDFDB.disCN.titlesize14}">${options.btn || options.button}</button>`));
		if (options.id) notice.id = options.id.split(" ").join("");
		if (options.selector) BDFDB.DOMUtils.addClass(notice, options.selector);
		if (options.css) BDFDB.DOMUtils.appendLocalStyle("BDFDBcustomNotificationBar" + id, options.css);
		if (options.style) notice.style = options.style;
		if (options.html === true) noticeMessage.innerHTML = text;
		else {
			let link = document.createElement("a");
			let newText = [];
			for (let word of text.split(" ")) {
				let encodedWord = BDFDB.StringUtils.htmlEscape(word);
				link.href = word;
				newText.push(link.host && link.host !== window.location.host ? `<label class="${BDFDB.disCN.textlink}">${encodedWord}</label>` : encodedWord);
			}
			noticeMessage.innerHTML = newText.join(" ");
		}
		let type = null;
		if (options.type && !document.querySelector(BDFDB.dotCNS.chatbase + BDFDB.dotCN.noticestreamer)) {
			if (type = BDFDB.disCN["notice" + options.type]) BDFDB.DOMUtils.addClass(notice, type);
			if (options.type == "premium") {
				let noticeButton = notice.querySelector(BDFDB.dotCN.noticebutton);
				if (noticeButton) BDFDB.DOMUtils.addClass(noticeButton, BDFDB.disCN.noticepremiumaction);
				BDFDB.DOMUtils.addClass(noticeMessage, BDFDB.disCN.noticepremiumtext);
				notice.insertBefore(BDFDB.DOMUtils.create(`<i class="${BDFDB.disCN.noticepremiumlogo}"></i>`), noticeMessage);
			}
		}
		if (!type) {
			let comp = BDFDB.ColorUtils.convert(options.color, "RGBCOMP");
			if (comp) {
				let fontColor = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? "#000" : "#FFF";
				let backgroundcolor = BDFDB.ColorUtils.convert(comp, "HEX");
				let filter = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? "brightness(0%)" : "brightness(100%)";
				BDFDB.DOMUtils.appendLocalStyle("BDFDBcustomNotificationBarColorCorrection" + id, `${BDFDB.dotCN.noticewrapper}[notice-id="${id}"]{background-color:${backgroundcolor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] .notice-message {color:${fontColor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticebutton} {color:${fontColor} !important;border-color:${BDFDB.ColorUtils.setAlpha(fontColor, 0.25, "RGBA")} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticebutton}:hover {color:${backgroundcolor} !important;background-color:${fontColor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticedismiss} {filter:${filter} !important;}`);
			}
			else BDFDB.DOMUtils.addClass(notice, BDFDB.disCN.noticedefault);
		}
		notice.style.setProperty("height", "36px", "important");
		notice.style.setProperty("min-width", "70vw", "important");
		notice.style.setProperty("left", "unset", "important");
		notice.style.setProperty("right", "unset", "important");
		let sideMargin = ((BDFDB.DOMUtils.getWidth(document.body.firstElementChild) - BDFDB.DOMUtils.getWidth(notice))/2);
		notice.style.setProperty("left", `${sideMargin}px`, "important");
		notice.style.setProperty("right", `${sideMargin}px`, "important");
		notice.style.setProperty("min-width", "unset", "important");
		notice.style.setProperty("width", "unset", "important");
		notice.style.setProperty("max-width", `calc(100vw - ${sideMargin*2}px)`, "important");
		notice.querySelector(BDFDB.dotCN.noticedismiss).addEventListener("click", _ => {
			notice.style.setProperty("overflow", "hidden", "important");
			notice.style.setProperty("height", "0px", "important");
			BDFDB.TimeUtils.timeout(_ => {
				BDFDB.ArrayUtils.remove(NotificationBars, id);
				BDFDB.DOMUtils.removeLocalStyle("BDFDBcustomNotificationBar" + id);
				BDFDB.DOMUtils.removeLocalStyle("BDFDBcustomNotificationBarColorCorrection" + id);
				notice.remove();
			}, 500);
		});
		return notice;
	};
	BDFDB.NotificationUtils.alert = function (header, body) {
		if (typeof header == "string" && typeof header == "string" && window.BdApi && typeof BdApi.alert == "function") BdApi.alert(header, body);
	};

	var Tooltips = [];
	BDFDB.TooltipUtils = {};
	BDFDB.TooltipUtils.create = function (anker, text, options = {}) {
		let itemLayerContainer = document.querySelector(BDFDB.dotCN.appmount +  " > " + BDFDB.dotCN.itemlayercontainer);
		if (!itemLayerContainer || (typeof text != "string" && !BDFDB.ObjectUtils.is(options.guild)) || !Node.prototype.isPrototypeOf(anker) || !document.contains(anker)) return null;
		let id = BDFDB.NumberUtils.generateId(Tooltips);
		let itemLayer = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCNS.itemlayer + BDFDB.disCN.itemlayerdisabledpointerevents}"><div class="${BDFDB.disCN.tooltip}" tooltip-id="${id}"><div class="${BDFDB.disCN.tooltippointer}"></div><div class="${BDFDB.disCN.tooltipcontent}"></div></div></div>`);
		itemLayerContainer.appendChild(itemLayer);
		
		let tooltip = itemLayer.firstElementChild;
		let tooltipContent = itemLayer.querySelector(BDFDB.dotCN.tooltipcontent);
		let tooltipPointer = itemLayer.querySelector(BDFDB.dotCN.tooltippointer);
		
		if (options.id) tooltip.id = options.id.split(" ").join("");
		
		if (typeof options.type != "string" || !BDFDB.disCN["tooltip" + options.type.toLowerCase()]) options.type = "top";
		let type = options.type.toLowerCase();
		BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN["tooltip" + type]);
		
		let fontColorIsGradient = false, customBackgroundColor = false, style = "";
		if (options.style) style += options.style;
		if (options.fontColor) {
			fontColorIsGradient = BDFDB.ObjectUtils.is(options.fontColor);
			if (!fontColorIsGradient) style = (style ? (style + " ") : "") + `color: ${BDFDB.ColorUtils.convert(options.fontColor, "RGBA")} !important;`
		}
		if (options.backgroundColor) {
			customBackgroundColor = true;
			let backgroundColorIsGradient = BDFDB.ObjectUtils.is(options.backgroundColor);
			let backgroundColor = !backgroundColorIsGradient ? BDFDB.ColorUtils.convert(options.backgroundColor, "RGBA") : BDFDB.ColorUtils.createGradient(options.backgroundColor);
			style = (style ? (style + " ") : "") + `background: ${backgroundColor} !important; border-color: ${backgroundColorIsGradient ? BDFDB.ColorUtils.convert(options.backgroundColor[type == "left" ? 100 : 0], "RGBA") : backgroundColor} !important;`;
		}
		if (style) tooltip.style = style;
		if (typeof options.zIndex == "number" || options.unhideable) {
			itemLayer.style.setProperty("z-index", options.zIndex || 1002, "important");
			tooltip.style.setProperty("z-index", options.zIndex || 1002, "important");
			tooltipContent.style.setProperty("z-index", options.zIndex || 1002, "important");
		}
		if (customBackgroundColor || options.unhideable) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltipcustom);
		else if (options.color && BDFDB.disCN["tooltip" + options.color.toLowerCase()]) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN["tooltip" + options.color.toLowerCase()]);
		else BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltipblack);
		
		if (options.list || BDFDB.ObjectUtils.is(options.guild)) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltiplistitem);
		
		if (options.selector) BDFDB.DOMUtils.addClass(tooltip, options.selector);
		
		if (BDFDB.ObjectUtils.is(options.guild)) {
			let streamOwnerIds = LibraryModules.StreamUtils.getAllApplicationStreams().filter(app => app.guildId === options.guild.id).map(app => app.ownerId) || [];
			let streamOwners = streamOwnerIds.map(ownerId => LibraryModules.UserStore.getUser(ownerId)).filter(n => n);
			let connectedUsers = Object.keys(LibraryModules.VoiceUtils.getVoiceStates(options.guild.id)).map(userId => !streamOwnerIds.includes(userId) && BDFDB.LibraryModules.UserStore.getUser(userId)).filter(n => n);
			let tooltipText = text || options.guild.toString();
			if (fontColorIsGradient) tooltipText = `<span style="pointer-events: none; -webkit-background-clip: text !important; color: transparent !important; background-image: ${BDFDB.ColorUtils.createGradient(options.fontColor)} !important;">${BDFDB.StringUtils.htmlEscape(tooltipText)}</span>`;
			BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(BDFDB.ReactUtils.Fragment, {
				children: [
					BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltiprow, BDFDB.disCN.tooltiprowguildname),
						children: [
							BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Badge, {
								guild: options.guild,
								size: LibraryModules.StringUtils.cssValueToNumber(DiscordClassModules.TooltipGuild.iconSize),
								className: BDFDB.disCN.tooltiprowicon
							}),
							BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltipguildnametext, (connectedUsers.length || streamOwners.length) && BDFDB.disCN.tooltipguildnametextlimitedsize),
								children: fontColorIsGradient || options.html ? BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(tooltipText)) : tooltipText
							})
						]
					}),
					connectedUsers.length ? BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.tooltiprow,
						children: [
							BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
								name: InternalComponents.LibraryComponents.SvgIcon.Names.SPEAKER,
								className: BDFDB.disCN.tooltipactivityicon
							}),
							BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.UserSummaryItem, {
								users: connectedUsers,
								max: 6
							})
						]
					}) : null,
					streamOwners.length ? BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.tooltiprow,
						children: [
							BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
								name: InternalComponents.LibraryComponents.SvgIcon.Names.STREAM,
								className: BDFDB.disCN.tooltipactivityicon
							}),
							BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.UserSummaryItem, {
								users: streamOwners,
								max: 6
							})
						]
					}) : null
				].filter(n => n)
			}), tooltipContent);
		}
		else {
			if (fontColorIsGradient) tooltipContent.innerHTML = `<span style="pointer-events: none; -webkit-background-clip: text !important; color: transparent !important; background-image: ${BDFDB.ColorUtils.createGradient(options.fontColor)} !important;">${BDFDB.StringUtils.htmlEscape(text)}</span>`;
			else if (options.html === true) tooltipContent.innerHTML = text;
			else tooltipContent.innerText = text;
		}

		let mouseLeave = _ => {BDFDB.DOMUtils.remove(itemLayer);};
		if (!options.perssist) anker.addEventListener("mouseleave", mouseLeave);
		
		let observer = new MutationObserver(changes => changes.forEach(change => {
			let nodes = Array.from(change.removedNodes);
			if (nodes.indexOf(itemLayer) > -1 || nodes.indexOf(anker) > -1 || nodes.some(n => n.contains(anker))) {
				BDFDB.ArrayUtils.remove(Tooltips, id);
				observer.disconnect();
				BDFDB.DOMUtils.remove(itemLayer);
				BDFDB.DOMUtils.removeLocalStyle("BDFDBhideOtherTooltips" + id, itemLayerContainer);
				anker.removeEventListener("mouseleave", mouseLeave);
				if (typeof options.onHide == "function") options.onHide(itemLayer, anker);
			}
		}));
		observer.observe(document.body, {subtree:true, childList:true});
		
		(tooltip.update = itemLayer.update = _ => {
			let left, top, tRects = BDFDB.DOMUtils.getRects(anker), iRects = BDFDB.DOMUtils.getRects(itemLayer), aRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.appmount)), positionOffsets = {height: 10, width: 10}, offset = typeof options.offset == "number" ? options.offset : 0;
			switch (type) {
				case "top":
					top = tRects.top - iRects.height - positionOffsets.height + 2 - offset;
					left = tRects.left + (tRects.width - iRects.width) / 2;
					break;
				case "bottom":
					top = tRects.top + tRects.height + positionOffsets.height - 2 + offset;
					left = tRects.left + (tRects.width - iRects.width) / 2;
					break;
				case "left":
					top = tRects.top + (tRects.height - iRects.height) / 2;
					left = tRects.left - iRects.width - positionOffsets.width + 2 - offset;
					break;
				case "right":
					top = tRects.top + (tRects.height - iRects.height) / 2;
					left = tRects.left + tRects.width + positionOffsets.width - 2 + offset;
					break;
				}
				
			itemLayer.style.setProperty("top", `${top}px`, "important");
			itemLayer.style.setProperty("left", `${left}px`, "important");
			
			tooltipPointer.style.removeProperty("margin-left");
			tooltipPointer.style.removeProperty("margin-top");
			if (type == "top" || type == "bottom") {
				if (left < 0) {
					itemLayer.style.setProperty("left", "5px", "important");
					tooltipPointer.style.setProperty("margin-left", `${left - 10}px`, "important");
				}
				else {
					let rightMargin = aRects.width - (left + iRects.width);
					if (rightMargin < 0) {
						itemLayer.style.setProperty("left", `${aRects.width - iRects.width - 5}px`, "important");
						tooltipPointer.style.setProperty("margin-left", `${-1*rightMargin}px`, "important");
					}
				}
			}
			else if (type == "left" || type == "right") {
				if (top < 0) {
					itemLayer.style.setProperty("top", "5px");
					tooltipPointer.style.setProperty("margin-top", `${top - 10}px`, "important");
				}
				else {
					let bottomMargin = aRects.height - (top + iRects.height);
					if (bottomMargin < 0) {
						itemLayer.style.setProperty("top", `${aRects.height - iRects.height - 5}px`, "important");
						tooltipPointer.style.setProperty("margin-top", `${-1*bottomMargin}px`, "important");
					}
				}
			}
			if (options.unhideable) {
				for (let node of [itemLayer, tooltip, tooltipContent]) {
					node.style.setProperty("position", "absolute", "important");
					node.style.setProperty("right", "unset", "important");
					node.style.setProperty("bottom", "unset", "important");
					node.style.setProperty("display", "block", "important");
					node.style.setProperty("opacity", "1", "important");
					node.style.setProperty("visibility", "visible", "important");
					node.style.setProperty("max-width", "unset", "important");
					node.style.setProperty("min-width", "50px", "important");
					node.style.setProperty("width", "unset", "important");
					node.style.setProperty("max-height", "unset", "important");
					node.style.setProperty("min-height", "14px", "important");
					node.style.setProperty("height", "unset", "important");
					node.style.setProperty("animation", "unset", "important");
					node.style.setProperty("transform", "unset", "important");
				}
				for (let node of [tooltip, tooltipContent]) {
					node.style.setProperty("position", "static", "important");
					node.style.setProperty("top", "unset", "important");
					node.style.setProperty("left", "unset", "important");
				}
				tooltip.style.setProperty("background", "#000", "important");
				tooltipContent.style.setProperty("color", "#dcddde", "important");
				tooltipPointer.style.setProperty(`border-top-color`, "#000", "important");
			}
		})();
		
		if (options.delay) {
			BDFDB.DOMUtils.toggle(itemLayer);
			BDFDB.TimeUtils.timeout(_ => {
				BDFDB.DOMUtils.toggle(itemLayer);
				if (typeof options.onShow == "function") options.onShow(itemLayer, anker);
			}, options.delay);
		}
		else {
			if (typeof options.onShow == "function") options.onShow(itemLayer, anker);
		}
		return itemLayer;
	};

	BDFDB.ObjectUtils = {};
	BDFDB.ObjectUtils.is = function (obj) {
		return obj && Object.prototype.isPrototypeOf(obj) && !Array.prototype.isPrototypeOf(obj);
	};
	BDFDB.ObjectUtils.extract = function (obj, ...keys) {
		let newObj = {};
		if (BDFDB.ObjectUtils.is(obj)) for (let key of keys.flat(10).filter(n => n)) if (obj[key]) newObj[key] = obj[key];
		return newObj;
	};
	BDFDB.ObjectUtils.exclude = function (obj, ...keys) {
		let newObj = Object.assign({}, obj);
		BDFDB.ObjectUtils.delete(newObj, ...keys)
		return newObj;
	};
	BDFDB.ObjectUtils.delete = function (obj, ...keys) {
		if (BDFDB.ObjectUtils.is(obj)) for (let key of keys.flat(10).filter(n => n)) delete obj[key];
	};
	BDFDB.ObjectUtils.sort = function (obj, sort, except) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = {};
		if (sort === undefined || !sort) for (let key of Object.keys(obj).sort()) newObj[key] = obj[key];
		else {
			let values = [];
			for (let key in obj) values.push(obj[key]);
			values = BDFDB.ArrayUtils.keySort(values, sort, except);
			for (let value of values) for (let key in obj) if (BDFDB.equals(value, obj[key])) {
				newObj[key] = value;
				break;
			}
		}
		return newObj;
	};
	BDFDB.ObjectUtils.reverse = function (obj, sort) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = {};
		for (let key of (sort === undefined || !sort) ? Object.keys(obj).reverse() : Object.keys(obj).sort().reverse()) newObj[key] = obj[key];
		return newObj;
	};
	BDFDB.ObjectUtils.filter = function (obj, filter, byKey = false) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		if (typeof filter != "function") return obj;
		return Object.keys(obj).filter(key => filter(byKey ? key : obj[key])).reduce((newObj, key) => (newObj[key] = obj[key], newObj), {});
	};
	BDFDB.ObjectUtils.push = function (obj, value) {
		if (BDFDB.ObjectUtils.is(obj)) obj[Object.keys(obj).length] = value;
	};
	BDFDB.ObjectUtils.pop = function (obj, value) {
		if (BDFDB.ObjectUtils.is(obj)) {
			let keys = Object.keys(obj);
			if (!keys.length) return;
			let value = obj[keys[keys.length-1]];
			delete obj[keys[keys.length-1]];
			return value;
		}
	};
	BDFDB.ObjectUtils.map = function (obj, mapfunc) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		if (typeof mapfunc != "string" && typeof mapfunc != "function") return obj;
		let newObj = {};
		for (let key in obj) if (BDFDB.ObjectUtils.is(obj[key])) newObj[key] = typeof mapfunc == "string" ? obj[key][mapfunc] : mapfunc(obj[key], key);
		return newObj;
	};
	BDFDB.ObjectUtils.toArray = function (obj) {
		if (!BDFDB.ObjectUtils.is(obj)) return [];
		return Object.entries(obj).map(n => n[1]);
	};
	BDFDB.ObjectUtils.deepAssign = function (obj, ...objs) {
		if (!objs.length) return obj;
		let nextObj = objs.shift();
		if (BDFDB.ObjectUtils.is(obj) && BDFDB.ObjectUtils.is(nextObj)) {
			for (let key in nextObj) {
				if (BDFDB.ObjectUtils.is(nextObj[key])) {
					if (!obj[key]) Object.assign(obj, {[key]:{}});
					BDFDB.ObjectUtils.deepAssign(obj[key], nextObj[key]);
				}
				else Object.assign(obj, {[key]:nextObj[key]});
			}
		}
		return BDFDB.ObjectUtils.deepAssign(obj, ...objs);
	};
	BDFDB.ObjectUtils.isEmpty = function (obj) {
		return !BDFDB.ObjectUtils.is(obj) || Object.getOwnPropertyNames(obj).length == 0;
	};

	BDFDB.ArrayUtils = {};
	BDFDB.ArrayUtils.is = function (array) {
		return array && Array.isArray(array);
	};
	BDFDB.ArrayUtils.sum = function (array) {
		return Array.isArray(array) ? array.reduce((total, num) => total + Math.round(num), 0) : 0;
	};
	BDFDB.ArrayUtils.keySort = function (array, key, except) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		if (key == null) return array;
		if (except === undefined) except = null;
		return array.sort((x, y) => {
			let xValue = x[key], yValue = y[key];
			if (xValue !== except) return xValue < yValue ? -1 : xValue > yValue ? 1 : 0;
		});
	};
	BDFDB.ArrayUtils.numSort = function (array) {
		return array.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
	};
	BDFDB.ArrayUtils.includes = function (array, ...values) {
		if (!BDFDB.ArrayUtils.is(array)) return null;
		if (!array.length) return false;
		let all = values.pop();
		if (typeof all != "boolean") {
			values.push(all);
			all = true;
		}
		if (!values.length) return false;
		let contained = undefined;
		for (let v of values) {
			if (contained === undefined) contained = all;
			if (all && !array.includes(v)) contained = false;
			if (!all && array.includes(v)) contained = true;
		}
		return contained;
	};
	BDFDB.ArrayUtils.remove = function (array, value, all = false) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		if (!array.includes(value)) return array;
		if (!all) array.splice(array.indexOf(value), 1);
		else while (array.indexOf(value) > -1) array.splice(array.indexOf(value), 1);
		return array;
	};
	BDFDB.ArrayUtils.getAllIndexes = function (array, value) {
		if (!BDFDB.ArrayUtils.is(array) && typeof array != "string") return [];
		var indexes = [], index = -1;
		while ((index = array.indexOf(value, index + 1)) !== -1) indexes.push(index);
		return indexes;
	};
	BDFDB.ArrayUtils.removeCopies = function (array) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		return [...new Set(array)];
	};
	
	BDFDB.ModuleUtils = {};
	BDFDB.ModuleUtils.cached = window.BDFDB && window.BDFDB.ModuleUtils && window.BDFDB.ModuleUtils.cached || {};
	BDFDB.ModuleUtils.find = function (filter, getExport) {
		getExport = typeof getExport != "boolean" ? true : getExport;
		let req = InternalBDFDB.getWebModuleReq();
		for (let i in req.c) if (req.c.hasOwnProperty(i)) {
			let m = req.c[i].exports;
			if (m && (typeof m == "object" || typeof m == "function") && filter(m)) return getExport ? m : req.c[i];
			if (m && m.__esModule) {
				for (let j in m) if (m[j] && (typeof m[j] == "object" || typeof m[j] == "function") && filter(m[j])) return getExport ? m[j] : req.c[i];
				if (m.default && (typeof m.default == "object" || typeof m.default == "function")) for (let j in m.default) if (m.default[j] && (typeof m.default[j] == "object" || typeof m.default[j] == "function") && filter(m.default[j])) return getExport ? m.default[j] : req.c[i];
			}
		}
		for (let i in req.m) if (req.m.hasOwnProperty(i)) {
			let m = req.m[i];
			if (m && typeof m == "function" && filter(m)) {
				if (req.c[i]) return getExport ? req.c[i].exports : req.c[i];
				else {
					let resolved = {};
					req.m[i](resolved, null, req);
					return getExport ? resolved.exports : resolved;
				}
			}
		}
	};
	BDFDB.ModuleUtils.findByProperties = function (...properties) {
		properties = properties.flat(10);
		let getExport = properties.pop();
		if (typeof getExport != "boolean") {
			properties.push(getExport);
			getExport = true;
		}
		return InternalBDFDB.findModule("prop", JSON.stringify(properties), m => properties.every(prop => m[prop] !== undefined), getExport);
	};
	BDFDB.ModuleUtils.findByName = function (name, getExport) {
		return InternalBDFDB.findModule("name", JSON.stringify(name), m => m.displayName === name || m.render && m.render.displayName === name, typeof getExport != "boolean" ? true : getExport);
	};
	BDFDB.ModuleUtils.findByString = function (...strings) {
		strings = strings.flat(10);
		let getExport = strings.pop();
		if (typeof getExport != "boolean") {
			strings.push(getExport);
			getExport = true;
		}
		return InternalBDFDB.findModule("string", JSON.stringify(strings), m => strings.every(string => typeof m == "function" && (m.toString().indexOf(string) > -1 || typeof m.__originalMethod == "function" && m.__originalMethod.toString().indexOf(string) > -1 || typeof m.__originalFunction == "function" && m.__originalFunction.toString().indexOf(string) > -1) || BDFDB.ObjectUtils.is(m) && typeof m.type == "function" && m.type.toString().indexOf(string) > -1), getExport);
	};
	BDFDB.ModuleUtils.findByPrototypes = function (...protoprops) {
		protoprops = protoprops.flat(10);
		let getExport = protoprops.pop();
		if (typeof getExport != "boolean") {
			protoprops.push(getExport);
			getExport = true;
		}
		return InternalBDFDB.findModule("proto", JSON.stringify(protoprops), m => m.prototype && protoprops.every(prop => m.prototype[prop] !== undefined), getExport);
	};
	InternalBDFDB.findModule = function (type, cachestring, filter, getExport) {
		if (!BDFDB.ObjectUtils.is(BDFDB.ModuleUtils.cached[type])) BDFDB.ModuleUtils.cached[type] = {module:{}, export:{}};
		if (getExport && BDFDB.ModuleUtils.cached[type].export[cachestring]) return BDFDB.ModuleUtils.cached[type].export[cachestring];
		else if (!getExport && BDFDB.ModuleUtils.cached[type].module[cachestring]) return BDFDB.ModuleUtils.cached[type].module[cachestring];
		else {
			let m = BDFDB.ModuleUtils.find(filter, getExport);
			if (m) {
				if (getExport) BDFDB.ModuleUtils.cached[type].export[cachestring] = m;
				else BDFDB.ModuleUtils.cached[type].module[cachestring] = m;
				return m;
			}
			else BDFDB.LogUtils.warn(`${cachestring} [${type}] not found in WebModules`);
		}
	};
	InternalBDFDB.getWebModuleReq = function () {
		if (!InternalBDFDB.getWebModuleReq.req) {
			const id = "BDFDB-WebModules";
			const req = window.webpackJsonp.push([[], {[id]: (module, exports, req) => module.exports = req}, [[id]]]);
			delete req.m[id];
			delete req.c[id];
			InternalBDFDB.getWebModuleReq.req = req;
		}
		return InternalBDFDB.getWebModuleReq.req;
	};
	
	var WebModulesData = {};
	WebModulesData.PatchTypes = ["before", "instead", "after"];
	WebModulesData.PatchMap = {
		BannedCard: "BannedUser",
		ChannelWindow: "Channel",
		InvitationCard: "InviteRow",
		InviteCard: "InviteRow",
		MemberCard: "Member",
		PopoutContainer: "Popout",
		QuickSwitchResult: "Result",
		UserProfile: "UserProfileBody"
	};
	WebModulesData.ForceObserve = [
		"DirectMessage",
		"GuildIcon"
	];
	WebModulesData.MemoComponent = [
		"EmojiPicker",
		"ExpressionPicker",
		"GuildFolder",
		"MessageContent",
		"NowPlayingHeader"
	];
	WebModulesData.NonRender = BDFDB.ArrayUtils.removeCopies([].concat(WebModulesData.MemoComponent, [
		"Attachment",
		"ChannelCallHeader",
		"ConnectedPrivateChannelsList",
		"DiscordTag",
		"IncomingCallModal",
		"InviteModalUserRow",
		"Mention",
		"Menu",
		"MenuCheckboxItem",
		"MenuControlItem",
		"MenuItem",
		"Message",
		"MessageTimestamp",
		"NameTag",
		"NowPlayingItem",
		"PictureInPictureVideo",
		"PrivateChannelEmptyMessage",
		"RecentsChannelHeader",
		"RecentsHeader",
		"SystemMessage",
		"SimpleMessageAccessories",
		"UnreadMessages",
		"UserInfo",
		"WebhookCard"
	]));
	WebModulesData.LoadedInComponents = {
		AutocompleteChannelResult: "LibraryComponents.AutocompleteItems.Channel",
		AutocompleteUserResult: "LibraryComponents.AutocompleteItems.User",
		QuickSwitchChannelResult: "LibraryComponents.QuickSwitchItems.Channel",
		QuickSwitchGroupDMResult: "LibraryComponents.QuickSwitchItems.GroupDM",
		QuickSwitchGuildResult: "LibraryComponents.QuickSwitchItems.Guild",
		QuickSwitchUserResult: "LibraryComponents.QuickSwitchItems.User"
	};
	WebModulesData.SpecialFilter = {
		V2C_ContentColumn: ins => ins && ins.return && ins.return.stateNode && ins.return.stateNode.props && typeof ins.return.stateNode.props.title == "string" && (ins.return.stateNode.props.title.toUpperCase().indexOf("PLUGINS") == 0 || ins.return.stateNode.props.title.toUpperCase().indexOf("THEMES") == 0) && ins.return.type,
		GuildFolder: ins => ins && ins.return && ins.return.memoizedProps && ins.return.memoizedProps.folderId && ins.return.memoizedProps.guildIds && ins.return.type
	};
	WebModulesData.PatchFinder = {
		Account: "accountinfo",
		App: "app",
		AppSkeleton: "app",
		AppView: "appcontainer",
		AuthWrapper: "loginscreen",
		BannedCard: "guildsettingsbannedcard",
		Category: "categorycontainerdefault",
		ChannelCall: "callcurrentcontainer",
		ChannelMember: "member",
		Channels: "guildchannels",
		ChannelTextAreaForm: "chatform",
		ChannelWindow: "chatcontent",
		DirectMessage: "guildouter",
		Guild: "guildouter",
		GuildFolder: "guildfolderwrapper",
		GuildIcon: "avataricon",
		GuildRoleSettings: "settingswindowcontent",
		Guilds: "guildswrapper",
		GuildSettings: "layer",
		GuildSettingsBans: "guildsettingsbannedcard",
		GuildSettingsEmoji: "guildsettingsemojicard",
		GuildSettingsMembers: "guildsettingsmembercard",
		GuildSidebar: "guildchannels",
		I18nLoaderWrapper: "app",
		InstantInviteModal: "invitemodalwrapper",
		InvitationCard: "invitemodalinviterow",
		InviteCard: "guildsettingsinvitecard",
		MemberCard: "guildsettingsmembercard",
		Messages: "messages",
		MessagesPopout: "messagespopout",
		ModalLayer: "layermodal",
		MutualGuilds: "userprofilebody",
		MutualFriends: "userprofilebody",
		Note: "usernotetextarea",
		PopoutContainer: "popout",
		Popouts: "popouts",
		PrivateChannelCall: "callcurrentcontainer",
		PrivateChannelCallParticipants: "callcurrentcontainer",
		PrivateChannelRecipientsInvitePopout: "searchpopoutdmaddpopout",
		PrivateChannelsList: "dmchannelsscroller",
		QuickSwitchChannelResult: "quickswitchresult",
		QuickSwitchGuildResult: "quickswitchresult",
		QuickSwitchResult: "quickswitchresult",
		Reaction: "messagereactionme",
		Reactor: "messagereactionsmodalreactor",
		RTCConnection: "voicedetails",
		SearchResults: "searchresultswrap",
		TypingUsers: "typing",
		UnreadDMs: "guildsscroller",
		Upload: "uploadmodal",
		UserHook: "auditloguserhook",
		UserPopout: "userpopout",
		UserProfile: "userprofile",
		V2C_ContentColumn: "settingswindowcontentcolumn"
	};
	WebModulesData.CodeFinder = {
		EmojiPicker: ["allowManagedEmojis", "EMOJI_PICKER_TAB_PANEL_ID", "diversitySelector"],
		SearchResultsInner: ["SEARCH_HIDE_BLOCKED_MESSAGES", "totalResults", "SEARCH_PAGE_SIZE"]
	};
	WebModulesData.PropsFinder = {
		Avatar: "AnimatedAvatar",
		MessageHeader: "MessageTimestamp",
		UnavailableGuildsButton: "UnavailableGuildsButton"
	};
	WebModulesData.NonPrototype = BDFDB.ArrayUtils.removeCopies([].concat(WebModulesData.NonRender, Object.keys(WebModulesData.CodeFinder), Object.keys(WebModulesData.PropsFinder), [
		"ChannelTextAreaContainer"
	]));
	
	BDFDB.ModuleUtils.isPatched = function (plugin, module, methodName) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!plugin || !BDFDB.ObjectUtils.is(module) || !module.BDFDBpatch || !methodName) return false;
		const pluginId = (typeof plugin === "string" ? plugin : plugin.name).toLowerCase();
		return pluginId && module[methodName] && module[methodName].__isBDFDBpatched && module.BDFDBpatch[methodName] && BDFDB.ObjectUtils.toArray(module.BDFDBpatch[methodName]).some(patchObj => BDFDB.ObjectUtils.toArray(patchObj).some(priorityObj => Object.keys(priorityObj).includes(pluginId)));
	};
	BDFDB.ModuleUtils.patch = function (plugin, module, methodNames, patchMethods, config = {}) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!plugin || !BDFDB.ObjectUtils.is(module) || !methodNames || !BDFDB.ObjectUtils.is(patchMethods)) return null;
		patchMethods = BDFDB.ObjectUtils.filter(patchMethods, type => WebModulesData.PatchTypes.includes(type), true);
		if (BDFDB.ObjectUtils.isEmpty(patchMethods)) return null;
		const pluginName = typeof plugin === "string" ? plugin : plugin.name;
		const pluginId = pluginName.toLowerCase();
		const patchPriority = BDFDB.ObjectUtils.is(plugin) && !isNaN(plugin.patchPriority) ? (plugin.patchPriority < 0 ? 0 : (plugin.patchPriority > 10 ? 10 : Math.round(plugin.patchPriority))) : 5;
		if (!BDFDB.ObjectUtils.is(module.BDFDBpatch)) module.BDFDBpatch = {};
		methodNames = [methodNames].flat(10).filter(n => n);
		let cancel = _ => {BDFDB.ModuleUtils.unpatch(plugin, module, methodNames);};
		for (let methodName of methodNames) if (module[methodName] == null || typeof module[methodName] == "function") {
			if (!module.BDFDBpatch[methodName] || config.force && (!module[methodName] || !module[methodName].__isBDFDBpatched)) {
				if (!module.BDFDBpatch[methodName]) {
					module.BDFDBpatch[methodName] = {};
					for (let type of WebModulesData.PatchTypes) module.BDFDBpatch[methodName][type] = {};
				}
				if (!module[methodName]) module[methodName] = (_ => {});
				const originalMethod = module[methodName];
				module.BDFDBpatch[methodName].originalMethod = originalMethod;
				module[methodName] = function () {
					let callInstead = false, stopCall = false;
					const data = {
						thisObject: this,
						methodArguments: arguments,
						originalMethod: originalMethod,
						originalMethodName: methodName,
						callOriginalMethod: _ => {if (!stopCall) data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments)},
						callOriginalMethodAfterwards: _ => {callInstead = true;},
						stopOriginalMethodCall: _ => {stopCall = true;}
					};
					if (module.BDFDBpatch && module.BDFDBpatch[methodName]) {
						for (let priority in module.BDFDBpatch[methodName].before) for (let id in BDFDB.ObjectUtils.sort(module.BDFDBpatch[methodName].before[priority])) {
							BDFDB.TimeUtils.suppress(module.BDFDBpatch[methodName].before[priority][id], `"before" callback of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`, module.BDFDBpatch[methodName].before[priority][id].pluginName)(data);
						}
						
						if (!module.BDFDBpatch || !module.BDFDBpatch[methodName]) return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
						let hasInsteadPatches = BDFDB.ObjectUtils.toArray(module.BDFDBpatch[methodName].instead).some(priorityObj => !BDFDB.ObjectUtils.isEmpty(priorityObj));
						if (hasInsteadPatches) for (let priority in module.BDFDBpatch[methodName].instead) for (let id in BDFDB.ObjectUtils.sort(module.BDFDBpatch[methodName].instead[priority])) {
							let tempReturn = BDFDB.TimeUtils.suppress(module.BDFDBpatch[methodName].instead[priority][id], `"instead" callback of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`, module.BDFDBpatch[methodName].instead[priority][id].pluginName)(data);
							if (tempReturn !== undefined) data.returnValue = tempReturn;
						}
						if ((!hasInsteadPatches || callInstead) && !stopCall) BDFDB.TimeUtils.suppress(data.callOriginalMethod, `originalMethod of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`)();
						
						if (!module.BDFDBpatch || !module.BDFDBpatch[methodName]) return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
						for (let priority in module.BDFDBpatch[methodName].after) for (let id in BDFDB.ObjectUtils.sort(module.BDFDBpatch[methodName].after[priority])) {
							let tempReturn = BDFDB.TimeUtils.suppress(module.BDFDBpatch[methodName].after[priority][id], `"after" callback of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`, module.BDFDBpatch[methodName].after[priority][id].pluginName)(data);
							if (tempReturn !== undefined) data.returnValue = tempReturn;
						}
					}
					else BDFDB.TimeUtils.suppress(data.callOriginalMethod, `originalMethod of ${methodName} in ${module.constructor ? module.constructor.displayName || module.constructor.name : "module"}`)();
					callInstead = false, stopCall = false;
					return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
				};
				for (let key of Object.keys(originalMethod)) module[methodName][key] = originalMethod[key];
				if (!module[methodName].__originalFunction) {
					let realOriginalMethod = originalMethod.__originalMethod || originalMethod.__originalFunction || originalMethod;
					if (typeof realOriginalMethod == "function") {
						module[methodName].__originalFunction = realOriginalMethod;
						module[methodName].toString = _ => realOriginalMethod.toString();
					}
				}
				module[methodName].__isBDFDBpatched = true;
			}
			for (let type in patchMethods) if (typeof patchMethods[type] == "function") {
				if (!BDFDB.ObjectUtils.is(module.BDFDBpatch[methodName][type][patchPriority])) module.BDFDBpatch[methodName][type][patchPriority] = {};
				module.BDFDBpatch[methodName][type][patchPriority][pluginId] = (...args) => {
					if (config.once || !plugin.started) cancel();
					return patchMethods[type](...args);
				};
				module.BDFDBpatch[methodName][type][patchPriority][pluginId].pluginName = pluginName;
			}
		}
		if (BDFDB.ObjectUtils.is(plugin) && !config.once && !config.noCache) {
			if (!BDFDB.ArrayUtils.is(plugin.patchCancels)) plugin.patchCancels = [];
			plugin.patchCancels.push(cancel);
		}
		return cancel;
	};
	BDFDB.ModuleUtils.unpatch = function (plugin, module, methodNames) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!module && !methodNames) {
			if (BDFDB.ObjectUtils.is(plugin) && BDFDB.ArrayUtils.is(plugin.patchCancels)) while (plugin.patchCancels.length) (plugin.patchCancels.pop())();
		}
		else {
			if (!BDFDB.ObjectUtils.is(module) || !module.BDFDBpatch) return;
			const pluginId = !plugin ? null : (typeof plugin === "string" ? plugin : plugin.name).toLowerCase();
			if (methodNames) {
				for (let methodName of [methodNames].flat(10).filter(n => n)) if (module[methodName] && module.BDFDBpatch[methodName]) unpatch(methodName, pluginId);
			}
			else for (let patchedMethod of module.BDFDBpatch) unpatch(patchedMethod, pluginId);
		}
		function unpatch (funcName, pluginId) {
			for (let type of WebModulesData.PatchTypes) {
				if (pluginId) for (let priority in module.BDFDBpatch[funcName][type]) {
					delete module.BDFDBpatch[funcName][type][priority][pluginId];
					if (BDFDB.ObjectUtils.isEmpty(module.BDFDBpatch[funcName][type][priority])) delete module.BDFDBpatch[funcName][type][priority];
				}
				else delete module.BDFDBpatch[funcName][type];
			}
			if (BDFDB.ObjectUtils.isEmpty(BDFDB.ObjectUtils.filter(module.BDFDBpatch[funcName], key => WebModulesData.PatchTypes.includes(key) && !BDFDB.ObjectUtils.isEmpty(module.BDFDBpatch[funcName][key]), true))) {
				module[funcName] = module.BDFDBpatch[funcName].originalMethod;
				delete module.BDFDBpatch[funcName];
				if (BDFDB.ObjectUtils.isEmpty(module.BDFDBpatch)) delete module.BDFDBpatch;
			}
		}
	};
	BDFDB.ModuleUtils.forceAllUpdates = function (plugins, selectedTypes) {
		plugins = [plugins].flat(10).map(n => n == BDFDB && InternalBDFDB || n).filter(n => BDFDB.ObjectUtils.is(n.patchedModules));
		if (plugins.length) {
			const app = document.querySelector(BDFDB.dotCN.app);
			const bdSettings = document.querySelector("#bd-settingspane-container > *");
			if (app) {
				selectedTypes = [selectedTypes].flat(10).filter(n => n).map(type => type && WebModulesData.PatchMap[type] ? WebModulesData.PatchMap[type] + " _ _ " + type : type);
				let updateData = {};
				for (let plugin of plugins) {
					updateData[plugin.name] = {
						filteredModules: [],
						specialModules: [],
						specialModuleTypes: [],
						patchTypes: {}
					};
					for (let patchType in plugin.patchedModules) for (let type in plugin.patchedModules[patchType]) {
						let methodNames = [plugin.patchedModules[patchType][type]].flat(10).filter(n => n);
						if (BDFDB.ArrayUtils.includes(methodNames, "componentDidMount", "componentDidUpdate", "render", false) && (!selectedTypes.length || selectedTypes.includes(type))) {
							let unmappedType = type.split(" _ _ ")[1] || type;
							let filter = WebModulesData.SpecialFilter[unmappedType];
							let selector = [WebModulesData.PatchFinder[unmappedType]].flat(10).filter(n => DiscordClasses[n]).map(n => BDFDB.dotCN[n]).join(", ");
							if (selector && typeof filter == "function") {
								for (let ele of document.querySelectorAll(selector)) {
									let constro = filter(BDFDB.ReactUtils.getInstance(ele));
									if (constro) {
										updateData[plugin.name].specialModules.push([type, constro]);
										updateData[plugin.name].specialModuleTypes.push(type);
										break;
									}
								}
							}
							else updateData[plugin.name].filteredModules.push(type);
							let name = type.split(" _ _ ")[0];
							if (!updateData[plugin.name].patchTypes[name]) updateData[plugin.name].patchTypes[name] = [];
							updateData[plugin.name].patchTypes[name].push(patchType);
						}
					}
				}
				let updateDataArray = BDFDB.ObjectUtils.toArray(updateData);
				if (BDFDB.ArrayUtils.sum(updateDataArray.map(n => n.filteredModules.length + n.specialModules.length))) {
					try {
						let filteredModules = BDFDB.ArrayUtils.removeCopies(updateDataArray.map(n => n.filteredModules).flat(10));
						let specialModules = BDFDB.ArrayUtils.removeCopies(updateDataArray.map(n => n.specialModules).flat(10));
						const appInsDown = BDFDB.ReactUtils.findOwner(app, {name:filteredModules, type:specialModules, all:true, group:true, unlimited:true});
						const appInsUp = BDFDB.ReactUtils.findOwner(app, {name:filteredModules, type:specialModules, all:true, group:true, unlimited:true, up:true});
						for (let type in appInsDown) {
							let filteredPlugins = plugins.filter(n => updateData[n.name].filteredModules.includes(type) || updateData[n.name].specialModuleTypes.includes(type)).map(n => ({plugin:n, patchTypes:updateData[n.name].patchTypes}));
							for (let ins of appInsDown[type]) InternalBDFDB.forceInitiateProcess(filteredPlugins, ins, type);
						}
						for (let type in appInsUp) {
							let filteredPlugins = plugins.filter(n => updateData[n.name].filteredModules.includes(type) || updateData[n.name].specialModuleTypes.includes(type)).map(n => ({plugin:n, patchTypes:updateData[n.name].patchTypes}));
							for (let ins of appInsUp[type]) InternalBDFDB.forceInitiateProcess(filteredPlugins, ins, type);
						}
						if (bdSettings) {
							const bdSettingsIns = BDFDB.ReactUtils.findOwner(bdSettings, {name:filteredModules, type:specialModules, all:true, unlimited:true});
							if (bdSettingsIns.length) {
								const bdSettingsWrap = BDFDB.ReactUtils.findOwner(BDFDB.ReactUtils.getInstance(document.querySelector("#bd-settingspane-container > *")), {props:"onChange", up:true});
								if (bdSettingsWrap && bdSettingsWrap.props && typeof bdSettingsWrap.props.onChange == "function") bdSettingsWrap.props.onChange(bdSettingsWrap.props.type);
							}
						}
					}
					catch (err) {BDFDB.LogUtils.error("Could not force update components! " + err, plugins.map(n => n.name).join(", "));}
				}
			}
		}
	};
	InternalBDFDB.forceInitiateProcess = function (pluginDataObjs, instance, type) {
		pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
		if (pluginDataObjs.length && instance && type) {
			let forceRender = false;
			for (let pluginData of pluginDataObjs) {
				let plugin = pluginData.plugin == BDFDB && InternalBDFDB || pluginData.plugin, methodNames = [];
				for (let patchType in plugin.patchedModules) if (plugin.patchedModules[patchType][type]) methodNames.push(plugin.patchedModules[patchType][type]);
				methodNames = BDFDB.ArrayUtils.removeCopies(methodNames).flat(10).filter(n => n);
				if (methodNames.includes("componentDidMount")) InternalBDFDB.initiateProcess(plugin, type, {
					instance: instance,
					methodname: "componentDidMount",
					patchtypes: Object.keys(pluginData.patchTypes)
				});
				if (methodNames.includes("render")) forceRender = true;
				else if (!forceRender && methodNames.includes("componentDidUpdate")) InternalBDFDB.initiateProcess(plugin, type, {
					instance: instance,
					methodname: "componentDidUpdate",
					patchtypes: Object.keys(pluginData.patchTypes)
				});
			}
			if (forceRender) BDFDB.ReactUtils.forceUpdate(instance);
		}
	};
	InternalBDFDB.initiateProcess = function (plugin, type, e) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (BDFDB.ObjectUtils.is(plugin) && !plugin.stopping && e.instance) {
			type = LibraryModules.StringUtils.upperCaseFirstChar(type.split(" _ _ ")[1] || type).replace(/[^A-z0-9]|_/g, "");
			if (typeof plugin[`process${type}`] == "function") {
				if (typeof e.methodname == "string" && (e.methodname.indexOf("componentDid") == 0 || e.methodname.indexOf("componentWill") == 0)) {
					e.node = BDFDB.ReactUtils.findDOMNode(e.instance);
					if (e.node) return plugin[`process${type}`](e);
					else BDFDB.TimeUtils.timeout(_ => {
						e.node = BDFDB.ReactUtils.findDOMNode(e.instance);
						if (e.node) return plugin[`process${type}`](e);
					});
					
				}
				else if (e.returnvalue || e.patchtypes.includes("before")) return plugin[`process${type}`](e);
			}
		}
	};
	if (!BDFDB.InternalData.patchObserverData) BDFDB.InternalData.patchObserverData = {observer:null, data:{}};
	InternalBDFDB.patchPlugin = function (plugin) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.patchedModules)) return;
		BDFDB.ModuleUtils.unpatch(plugin);
		let patchedModules = {};
		for (let patchType in plugin.patchedModules) for (let type in plugin.patchedModules[patchType]) {
			if (!patchedModules[type]) patchedModules[type] = {};
			patchedModules[type][patchType] = plugin.patchedModules[patchType][type];
		}
		for (let type in patchedModules) {
			let pluginData = {plugin: plugin, patchTypes: patchedModules[type]};
			let unmappedType = type.split(" _ _ ")[1] || type;
			let component = WebModulesData.LoadedInComponents[type] && BDFDB.ReactUtils.getValue(InternalComponents, WebModulesData.LoadedInComponents[type]);
			if (component) InternalBDFDB.patch_PatchInstance(pluginData, WebModulesData.NonRender.includes(unmappedType) ? (BDFDB.ModuleUtils.find(m => m == component, false) || {}).exports : component, type);
			else {
				let classNames = [WebModulesData.PatchFinder[unmappedType]].flat(10).filter(n => DiscordClasses[n]);
				let codeFind = WebModulesData.CodeFinder[unmappedType];
				let propertyFind = WebModulesData.PropsFinder[unmappedType];
				let mapped = WebModulesData.PatchMap[type];
				let mappedType = mapped ? mapped + " _ _ " + type : type;
				let name = mappedType.split(" _ _ ")[0];
				if (mapped) {
					for (let patchType in plugin.patchedModules) if (plugin.patchedModules[patchType][type]) {
						plugin.patchedModules[patchType][mappedType] = plugin.patchedModules[patchType][type];
						delete plugin.patchedModules[patchType][type];
					}
				}
				if (classNames.length) InternalBDFDB.patch_CheckForInstance(pluginData, classNames, mappedType, WebModulesData.ForceObserve.includes(unmappedType));
				else if (codeFind) {
					let exports = (BDFDB.ModuleUtils.findByString(codeFind, false) || {}).exports;
					InternalBDFDB.patch_PatchInstance(pluginData, exports && WebModulesData.MemoComponent.includes(unmappedType) ? exports.default : exports, mappedType, true);
				}
				else if (propertyFind) {
					let exports = (BDFDB.ModuleUtils.findByProperties(propertyFind, false) || {}).exports;
					InternalBDFDB.patch_PatchInstance(pluginData, exports && WebModulesData.MemoComponent.includes(unmappedType) ? exports.default : exports, mappedType, true);
				}
				else if (WebModulesData.NonRender.includes(unmappedType)) {
					let exports = (BDFDB.ModuleUtils.findByName(name, false) || {}).exports;
					InternalBDFDB.patch_PatchInstance(pluginData, exports && WebModulesData.MemoComponent.includes(unmappedType) ? exports.default : exports, mappedType, true);
				}
				else InternalBDFDB.patch_PatchInstance(pluginData, BDFDB.ModuleUtils.findByName(name), mappedType);
			}
		}
	};
	InternalBDFDB.patch_PatchInstance = function (pluginDataObjs, instance, type, ignoreCheck) {
		pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
		if (pluginDataObjs.length && instance) {
			let name = type.split(" _ _ ")[0];
			instance = instance._reactInternalFiber && instance._reactInternalFiber.type ? instance._reactInternalFiber.type : instance;
			instance = ignoreCheck || InternalBDFDB.isInstanceCorrect(instance, name) || WebModulesData.LoadedInComponents[type] ? instance : (BDFDB.ReactUtils.findConstructor(instance, name) || BDFDB.ReactUtils.findConstructor(instance, name, {up:true}));
			if (instance) {
				instance = instance._reactInternalFiber && instance._reactInternalFiber.type ? instance._reactInternalFiber.type : instance;
				let toBePatched = WebModulesData.NonPrototype.includes(name) ? instance : instance.prototype;
				for (let pluginData of pluginDataObjs) for (let patchType in pluginData.patchTypes) {
					let patchMethods = {};
					patchMethods[patchType] = e => {
						return InternalBDFDB.initiateProcess(pluginData.plugin, type, {
							instance: window != e.thisObject ? e.thisObject : {props:e.methodArguments[0]},
							returnvalue: e.returnValue,
							methodname: e.originalMethodName,
							patchtypes: [patchType]
						});
					};
					BDFDB.ModuleUtils.patch(pluginData.plugin, toBePatched, pluginData.patchTypes[patchType], patchMethods);
				}
			}
		}
	};
	InternalBDFDB.patch_CheckEle = function (pluginDataObjs, ele, type) {
		pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
		let unmappedType = type.split(" _ _ ")[1] || type;
		let ins = BDFDB.ReactUtils.getInstance(ele);
		let filter = WebModulesData.SpecialFilter[unmappedType];
		if (typeof filter == "function") {
			let component = filter(ins);
			if (component) {
				if (WebModulesData.NonRender.includes(unmappedType)) {
					let exports = (BDFDB.ModuleUtils.find(m => m == component, false) || {}).exports;
					InternalBDFDB.patch_PatchInstance(pluginDataObjs, exports && WebModulesData.MemoComponent.includes(unmappedType) ? exports.default : exports, type, true);
				}
				else InternalBDFDB.patch_PatchInstance(pluginDataObjs, component, type, true);
				BDFDB.ModuleUtils.forceAllUpdates(pluginDataObjs.map(n => n.plugin), type);
				return true;
			}
		}
		else if (InternalBDFDB.patch_IsCorrectInstance(ins, type)) {
			InternalBDFDB.patch_PatchInstance(pluginDataObjs, ins, type);
			BDFDB.ModuleUtils.forceAllUpdates(pluginDataObjs.map(n => n.plugin), type);
			return true;
		}
		return false;
	};
	InternalBDFDB.patch_CheckForInstance = function (pluginData, classNames, type, forceObserve) {
		const app = document.querySelector(BDFDB.dotCN.app), bdSettings = document.querySelector("#bd-settingspane-container " + BDFDB.dotCN.scrollerwrap);
		let instanceFound = false;
		if (!forceObserve) {
			if (app) {
				let appIns = BDFDB.ReactUtils.findConstructor(app, type, {unlimited:true}) || BDFDB.ReactUtils.findConstructor(app, type, {unlimited:true, up:true});
				if (appIns && (instanceFound = true)) InternalBDFDB.patch_PatchInstance(pluginData, appIns, type);
			}
			if (!instanceFound && bdSettings) {
				let bdSettingsIns = BDFDB.ReactUtils.findConstructor(bdSettings, type, {unlimited:true});
				if (bdSettingsIns && (instanceFound = true)) InternalBDFDB.patch_PatchInstance(pluginData, bdSettingsIns, type);
			}
		}
		if (!instanceFound) {
			let elementFound = false, classes = classNames.map(n => BDFDB.disCN[n]), selector = classNames.map(n => BDFDB.dotCN[n]).join(", ");
			for (let ele of document.querySelectorAll(selector)) {
				elementFound = InternalBDFDB.patch_CheckEle(pluginData, ele, type);
				if (elementFound) break;
			}
			if (!elementFound) {
				if (!BDFDB.InternalData.patchObserverData.observer) {
					let appmount = document.querySelector(BDFDB.dotCN.appmount);
					if (appmount) {
						BDFDB.InternalData.patchObserverData.observer = new MutationObserver(cs => {cs.forEach(c => {c.addedNodes.forEach(n => {
							if (!n || !n.tagName) return;
							for (let type in BDFDB.InternalData.patchObserverData.data) if (!BDFDB.InternalData.patchObserverData.data[type].found) {
								let ele = null;
								if ((ele = BDFDB.DOMUtils.containsClass(n, ...BDFDB.InternalData.patchObserverData.data[type].classes) ? n : n.querySelector(BDFDB.InternalData.patchObserverData.data[type].selector)) != null) {
									BDFDB.InternalData.patchObserverData.data[type].found = InternalBDFDB.patch_CheckEle(BDFDB.InternalData.patchObserverData.data[type].plugins, ele, type);
									if (BDFDB.InternalData.patchObserverData.data[type].found) {
										delete BDFDB.InternalData.patchObserverData.data[type];
										if (BDFDB.ObjectUtils.isEmpty(BDFDB.InternalData.patchObserverData.data)) {
											BDFDB.InternalData.patchObserverData.observer.disconnect();
											BDFDB.InternalData.patchObserverData.observer = null;
										}
									}
								}
							}
						});});});
						BDFDB.InternalData.patchObserverData.observer.observe(appmount, {childList:true, subtree:true});
					}
				}
				if (!BDFDB.InternalData.patchObserverData.data[type]) BDFDB.InternalData.patchObserverData.data[type] = {selector, classes, found:false, plugins:[]};
				BDFDB.InternalData.patchObserverData.data[type].plugins.push(pluginData);
			}
		}
	};
	InternalBDFDB.patch_IsCorrectInstance = function (instance, name) {
		if (!instance) return false;
		instance = instance._reactInternalFiber && instance._reactInternalFiber.type ? instance._reactInternalFiber.type : instance;
		instance = InternalBDFDB.isInstanceCorrect(instance, name) ? instance : (BDFDB.ReactUtils.findConstructor(instance, name) || BDFDB.ReactUtils.findConstructor(instance, name, {up:true}));
		return !!instance;
	};

	InternalBDFDB.isInstanceCorrect = function (instance, name) {
		return instance && ((instance.type && (instance.type.render && instance.type.render.displayName === name || instance.type.displayName === name || instance.type.name === name || instance.type === name)) || instance.render && (instance.render.displayName === name || instance.render.name === name) || instance.displayName == name || instance.name === name);
	};

	BDFDB.DiscordConstants = BDFDB.ModuleUtils.findByProperties("Permissions", "ActivityTypes");
	
	var DiscordObjects = {};
	DiscordObjects.Channel = BDFDB.ModuleUtils.findByPrototypes("getRecipientId", "isManaged", "getGuildId");
	DiscordObjects.Guild = BDFDB.ModuleUtils.findByPrototypes("getIconURL", "getMaxEmojiSlots", "getRole");
	DiscordObjects.Invite = BDFDB.ModuleUtils.findByPrototypes("getExpiresAt", "isExpired");
	DiscordObjects.Message = BDFDB.ModuleUtils.findByPrototypes("getReaction", "getAuthorName", "getChannelId");
	DiscordObjects.Messages = BDFDB.ModuleUtils.findByPrototypes("jumpToMessage", "hasAfterCached", "forEach");
	DiscordObjects.Timestamp = BDFDB.ModuleUtils.findByPrototypes("add", "dayOfYear", "hasAlignedHourOffset");
	DiscordObjects.User = BDFDB.ModuleUtils.findByPrototypes("hasFlag", "isLocalBot", "isClaimed");
	BDFDB.DiscordObjects = Object.assign({}, DiscordObjects);
	
	var LibraryRequires = {};
	for (let name of ["child_process", "electron", "fs", "path", "process", "request"]) {
		try {LibraryRequires[name] = require(name);} catch (err) {}
	}
	BDFDB.LibraryRequires = Object.assign({}, LibraryRequires);
	
	var LibraryModules = {};
	LibraryModules.AckUtils = BDFDB.ModuleUtils.findByProperties("localAck", "bulkAck");
	LibraryModules.ActivityUtils = BDFDB.ModuleUtils.findByProperties("sendActivityInvite", "updateActivity");
	LibraryModules.APIUtils = BDFDB.ModuleUtils.findByProperties("getAPIBaseURL");
	LibraryModules.AnalyticsUtils = BDFDB.ModuleUtils.findByProperties("isThrottled", "track");
	LibraryModules.AnimationUtils = BDFDB.ModuleUtils.findByProperties("spring", "decay");
	LibraryModules.ArrayUtils = BDFDB.ModuleUtils.findByProperties("isArrayLike", "zipObject");
	LibraryModules.AssetUtils = BDFDB.ModuleUtils.findByProperties("getAssetImage", "getAssetIds");
	LibraryModules.BadgeUtils = BDFDB.ModuleUtils.findByProperties("getBadgeCountString", "getBadgeWidthForValue");
	LibraryModules.CallUtils = BDFDB.ModuleUtils.findByProperties("getCalls", "isCallActive");
	LibraryModules.CategoryCollapseStore = BDFDB.ModuleUtils.findByProperties("getCollapsedCategories", "isCollapsed");
	LibraryModules.CategoryCollapseUtils = BDFDB.ModuleUtils.findByProperties("categoryCollapse", "categoryCollapseAll");
	LibraryModules.ChannelStore = BDFDB.ModuleUtils.findByProperties("getChannel", "getChannels");
	LibraryModules.ColorUtils = BDFDB.ModuleUtils.findByProperties("hex2int", "hex2rgb");
	LibraryModules.ContextMenuUtils = BDFDB.ModuleUtils.findByProperties("closeContextMenu", "openContextMenu");
	LibraryModules.CopyLinkUtils = BDFDB.ModuleUtils.findByProperties("SUPPORTS_COPY", "copy");
	LibraryModules.CurrentUserStore = BDFDB.ModuleUtils.findByProperties("getCurrentUser");
	LibraryModules.CurrentVoiceUtils = BDFDB.ModuleUtils.findByProperties("getAveragePing", "isConnected");
	LibraryModules.DirectMessageStore = BDFDB.ModuleUtils.findByProperties("getPrivateChannelIds", "getPrivateChannelTimestamps");
	LibraryModules.DirectMessageUnreadStore = BDFDB.ModuleUtils.findByProperties("getUnreadPrivateChannelIds");
	LibraryModules.DispatchApiUtils = BDFDB.ModuleUtils.findByProperties("dirtyDispatch", "isDispatching");
	LibraryModules.DispatchUtils = BDFDB.ModuleUtils.findByProperties("ComponentDispatch");
	LibraryModules.DirectMessageUtils = BDFDB.ModuleUtils.findByProperties("addRecipient", "openPrivateChannel");
	LibraryModules.EmojiUtils = BDFDB.ModuleUtils.findByProperties("translateInlineEmojiToSurrogates", "translateSurrogatesToInlineEmoji");
	LibraryModules.EmojiStateUtils = BDFDB.ModuleUtils.findByProperties("getURL", "isEmojiDisabled");
	LibraryModules.FriendUtils = BDFDB.ModuleUtils.findByProperties("getFriendIDs", "getRelationships");
	LibraryModules.FolderStore = BDFDB.ModuleUtils.findByProperties("getGuildFolderById", "getFlattenedGuilds");
	LibraryModules.FolderUtils = BDFDB.ModuleUtils.findByProperties("isFolderExpanded", "getExpandedFolders");
	LibraryModules.GuildBoostUtils = BDFDB.ModuleUtils.findByProperties("getTierName", "getUserLevel");
	LibraryModules.GuildChannelStore = BDFDB.ModuleUtils.findByProperties("getChannels", "getDefaultChannel");
	LibraryModules.GuildEmojiStore = BDFDB.ModuleUtils.findByProperties("getGuildEmoji", "getDisambiguatedEmojiContext");
	LibraryModules.GuildNotificationsUtils = BDFDB.ModuleUtils.findByProperties("updateChannelOverrideSettings", "updateGuildNotificationSettings");
	LibraryModules.GuildSettingsSectionUtils = BDFDB.ModuleUtils.findByProperties("getGuildSettingsSections");
	LibraryModules.GuildSettingsUtils = BDFDB.ModuleUtils.findByProperties("open", "updateGuild");
	LibraryModules.GuildStore = BDFDB.ModuleUtils.findByProperties("getGuild", "getGuilds");
	LibraryModules.GuildUnavailableStore = BDFDB.ModuleUtils.findByProperties("isUnavailable", "totalUnavailableGuilds");
	LibraryModules.GuildUtils = BDFDB.ModuleUtils.findByProperties("transitionToGuildSync");
	LibraryModules.GuildWelcomeStore = BDFDB.ModuleUtils.findByProperties("hasSeen", "get");
	LibraryModules.GuildWelcomeUtils = BDFDB.ModuleUtils.findByProperties("welcomeScreenViewed", "resetWelcomeScreen");
	LibraryModules.HistoryUtils = BDFDB.ModuleUtils.findByProperties("transitionTo", "replaceWith", "getHistory");;
	LibraryModules.IconUtils = BDFDB.ModuleUtils.findByProperties("getGuildIconURL", "getGuildBannerURL");
	LibraryModules.InviteUtils = BDFDB.ModuleUtils.findByProperties("acceptInvite", "createInvite");
	LibraryModules.KeyCodeUtils = Object.assign({}, BDFDB.ModuleUtils.findByProperties("toCombo", "keyToCode"));
	LibraryModules.KeyCodeUtils.getString = function (keyarray) {
		return LibraryModules.KeyCodeUtils.toString([keyarray].flat(10).filter(n => n).map(keycode => [BDFDB.DiscordConstants.KeyboardDeviceTypes.KEYBOARD_KEY, keycode, BDFDB.DiscordConstants.KeyboardEnvs.BROWSER]), true);
	};
	LibraryModules.KeyEvents = BDFDB.ModuleUtils.findByProperties("aliases", "code", "codes");
	LibraryModules.LanguageStore = BDFDB.ModuleUtils.findByProperties("getLanguages", "Messages");
	LibraryModules.LastChannelStore = BDFDB.ModuleUtils.findByProperties("getLastSelectedChannelId");
	LibraryModules.LastGuildStore = BDFDB.ModuleUtils.findByProperties("getLastSelectedGuildId");
	LibraryModules.LoginUtils = BDFDB.ModuleUtils.findByProperties("login", "logout");
	LibraryModules.MemberCountUtils = BDFDB.ModuleUtils.findByProperties("getMemberCount", "getMemberCounts");
	LibraryModules.MemberStore = BDFDB.ModuleUtils.findByProperties("getMember", "getMembers");
	LibraryModules.MentionUtils = BDFDB.ModuleUtils.findByProperties("isRawMessageMentioned", "isMentioned");
	LibraryModules.MessageManageUtils = BDFDB.ModuleUtils.findByProperties("copyLink", "quoteMessage");
	LibraryModules.MessagePinUtils = BDFDB.ModuleUtils.findByProperties("pinMessage", "unpinMessage");
	LibraryModules.MessageStore = BDFDB.ModuleUtils.findByProperties("getMessage", "getMessages");
	LibraryModules.MessageUtils = BDFDB.ModuleUtils.findByProperties("receiveMessage", "editMessage");
	LibraryModules.ModalUtils = BDFDB.ModuleUtils.findByProperties("openModal", "hasModalOpen");
	LibraryModules.MutedUtils = BDFDB.ModuleUtils.findByProperties("isGuildOrCategoryOrChannelMuted");
	LibraryModules.NoteStore = BDFDB.ModuleUtils.findByProperties("getNote");
	LibraryModules.NotificationSettingsStore = BDFDB.ModuleUtils.findByProperties("getDesktopType", "getTTSType");
	LibraryModules.NotificationSettingsUtils = BDFDB.ModuleUtils.findByProperties("setDesktopType", "setTTSType");
	LibraryModules.NotificationUtils = BDFDB.ModuleUtils.findByProperties("makeTextChatNotification", "shouldNotify");
	LibraryModules.PlatformUtils = BDFDB.ModuleUtils.findByProperties("isWindows", "isLinux");
	LibraryModules.PermissionUtils = BDFDB.ModuleUtils.findByProperties("getChannelPermissions", "canUser");
	LibraryModules.PermissionRoleUtils = BDFDB.ModuleUtils.findByProperties("getHighestRole", "can");
	LibraryModules.QueryUtils = BDFDB.ModuleUtils.findByProperties("AutocompleterQuerySymbols", "AutocompleterResultTypes");
	LibraryModules.QuoteUtils = BDFDB.ModuleUtils.findByProperties("canQuote", "createQuotedText");
	LibraryModules.ReactionEmojiUtils = BDFDB.ModuleUtils.findByProperties("getReactionEmojiName", "getReactionEmojiName");
	LibraryModules.ReactionUtils = BDFDB.ModuleUtils.findByProperties("addReaction", "removeReaction");
	LibraryModules.RecentMentionUtils = BDFDB.ModuleUtils.findByProperties("deleteRecentMention", "fetchRecentMentions");
	LibraryModules.SearchPageUtils = BDFDB.ModuleUtils.findByProperties("searchNextPage", "searchPreviousPage");
	LibraryModules.SelectChannelUtils = BDFDB.ModuleUtils.findByProperties("selectChannel", "selectPrivateChannel");
	LibraryModules.SettingsUtils = BDFDB.ModuleUtils.findByProperties("updateRemoteSettings", "updateLocalSettings");
	LibraryModules.SlateUtils = BDFDB.ModuleUtils.find(m => typeof m.serialize == "function" && typeof m.deserialize == "function" && typeof m.deserialize == "function" && typeof m.getFlag != "function");
	LibraryModules.SlateSelectionUtils = BDFDB.ModuleUtils.findByProperties("serialize", "serializeSelection");
	LibraryModules.SlowmodeUtils = BDFDB.ModuleUtils.findByProperties("getSlowmodeCooldownGuess");
	LibraryModules.SoundStateUtils = BDFDB.ModuleUtils.findByProperties("isSoundDisabled", "getDisabledSounds");
	LibraryModules.SoundUtils = BDFDB.ModuleUtils.findByProperties("playSound", "createSound");
	LibraryModules.SpellCheckUtils = BDFDB.ModuleUtils.findByProperties("learnWord", "toggleSpellcheck");
	LibraryModules.SpotifyTrackUtils = BDFDB.ModuleUtils.findByProperties("hasConnectedAccount", "getLastPlayedTrackId");
	LibraryModules.SpotifyUtils = BDFDB.ModuleUtils.findByProperties("setActiveDevice", "pause");
	LibraryModules.StateStoreUtils = BDFDB.ModuleUtils.findByProperties("useStateFromStores", "useStateFromStoresArray");
	LibraryModules.StatusMetaUtils = BDFDB.ModuleUtils.findByProperties("getApplicationActivity", "getStatus");
	LibraryModules.StoreChangeUtils = BDFDB.ModuleUtils.findByProperties("get", "set", "clear", "remove");
	LibraryModules.StreamerModeStore = BDFDB.ModuleUtils.findByProperties("disableSounds", "hidePersonalInformation");
	LibraryModules.StreamUtils = BDFDB.ModuleUtils.findByProperties("getActiveStreamForUser", "getAllApplicationStreams");
	LibraryModules.StringUtils = BDFDB.ModuleUtils.findByProperties("cssValueToNumber", "upperCaseFirstChar");
	LibraryModules.UnreadGuildUtils = BDFDB.ModuleUtils.findByProperties("hasUnread", "getUnreadGuilds");
	LibraryModules.UnreadChannelUtils = BDFDB.ModuleUtils.findByProperties("getUnreadCount", "getOldestUnreadMessageId");
	LibraryModules.UploadUtils = BDFDB.ModuleUtils.findByProperties("upload", "instantBatchUpload");
	LibraryModules.UserFetchUtils = BDFDB.ModuleUtils.findByProperties("fetchCurrentUser", "getUser");
	LibraryModules.UserNameUtils = BDFDB.ModuleUtils.findByProperties("getName", "getNickname");
	LibraryModules.UserProfileUtils = BDFDB.ModuleUtils.findByProperties("open", "fetchProfile");
	LibraryModules.UserSettingsUtils = BDFDB.ModuleUtils.findByProperties("open", "updateAccount");
	LibraryModules.UserStore = BDFDB.ModuleUtils.findByProperties("getUser", "getUsers");
	LibraryModules.Utilities = BDFDB.ModuleUtils.findByProperties("flatMap", "cloneDeep");
	LibraryModules.VoiceUtils = BDFDB.ModuleUtils.findByProperties("getAllVoiceStates", "getVoiceStatesForChannel");
	LibraryModules.ZoomUtils = BDFDB.ModuleUtils.findByProperties("setZoom", "setFontSize");
	BDFDB.LibraryModules = Object.assign({}, LibraryModules);

	LibraryModules.React = BDFDB.ModuleUtils.findByProperties("createElement", "cloneElement");
	LibraryModules.ReactDOM = BDFDB.ModuleUtils.findByProperties("render", "findDOMNode");
	
	BDFDB.ReactUtils = Object.assign({}, LibraryModules.React, LibraryModules.ReactDOM);
	BDFDB.ReactUtils.childrenToArray = function (parent) {
		if (parent && parent.props && parent.props.children && !BDFDB.ArrayUtils.is(parent.props.children)) {
			var child = parent.props.children;
			parent.props.children = [];
			parent.props.children.push(child);
		}
		return parent.props.children;
	}
	BDFDB.ReactUtils.createElement = function (component, props = {}, errorWrap = false) {
		if (component && component.defaultProps) for (let key in component.defaultProps) if (props[key] == null) props[key] = component.defaultProps[key];
		try {
			let child = LibraryModules.React.createElement(component || "div", props) || null;
			if (errorWrap) return LibraryModules.React.createElement(InternalComponents.ErrorBoundary, {}, child) || null;
			else return child;
		}
		catch (err) {BDFDB.LogUtils.error("Could not create react element! " + err);}
		return null;
	};
	BDFDB.ReactUtils.objectToReact = function (obj) {
		if (!obj) return null;
		else if (typeof obj == "string") return obj;
		else if (BDFDB.ObjectUtils.is(obj)) return BDFDB.ReactUtils.createElement(obj.type || obj.props && obj.props.href && "a" || "div", !obj.props ?  {} : Object.assign({}, obj.props, {
			children: obj.props.children ? BDFDB.ReactUtils.objectToReact(obj.props.children) : null
		}));
		else if (BDFDB.ArrayUtils.is(obj)) return obj.map(n => BDFDB.ReactUtils.objectToReact(n));
		else return null;
	};
	BDFDB.ReactUtils.elementToReact = function (node, ref) {
		if (BDFDB.ReactUtils.isValidElement(node)) return node;
		else if (!Node.prototype.isPrototypeOf(node)) return null;
		else if (node.nodeType == Node.TEXT_NODE) return node.nodeValue;
		let attributes = {}, importantStyles = [];
		if (typeof ref == "function") attributes.ref = ref;
		for (let attr of node.attributes) attributes[attr.name] = attr.value;
		if (node.attributes.style) attributes.style = BDFDB.ObjectUtils.filter(node.style, n => node.style[n] && isNaN(parseInt(n)), true);
		attributes.children = [];
		if (node.style && node.style.cssText) for (let propStr of node.style.cssText.split(";")) if (propStr.endsWith("!important")) {
			let key = propStr.split(":")[0];
			let camelprop = key.replace(/-([a-z]?)/g, (m, g) => g.toUpperCase());
			if (attributes.style[camelprop] != null) importantStyles.push(key);
		}
		for (let child of node.childNodes) attributes.children.push(BDFDB.ReactUtils.elementToReact(child));
		attributes.className = BDFDB.DOMUtils.formatClassName(attributes.className, attributes.class);
		delete attributes.class;
		let reactEle = BDFDB.ReactUtils.createElement(node.tagName, attributes);
		BDFDB.ReactUtils.forceStyle(reactEle, importantStyles);
		return reactEle;
	};
	BDFDB.ReactUtils.forceStyle = function (reactEle, styles) {
		if (!BDFDB.ReactUtils.isValidElement(reactEle) || !BDFDB.ObjectUtils.is(reactEle.props.style) || !BDFDB.ArrayUtils.is(styles) || !styles.length) return null;
		let ref = reactEle.ref;
		reactEle.ref = instance => {
			if (typeof ref == "function") ref(instance);
			let node = BDFDB.ReactUtils.findDOMNode(instance);
			if (Node.prototype.isPrototypeOf(node)) for (let key of styles) {
				let propValue = reactEle.props.style[key.replace(/-([a-z]?)/g, (m, g) => g.toUpperCase())];
				if (propValue != null) node.style.setProperty(key, propValue, "important");
			}
		};
		return reactEle;
	};
	BDFDB.ReactUtils.findChild = function (nodeOrInstance, config) {
		if (!nodeOrInstance || !BDFDB.ObjectUtils.is(config) || !config.name && !config.key && !config.props && !config.filter) return config.all ? [] : null;
		let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
		if (!BDFDB.ObjectUtils.is(instance) && !BDFDB.ArrayUtils.is(instance)) return null;
		config.name = config.name && [config.name].flat().filter(n => n);
		config.key = config.key && [config.key].flat().filter(n => n);
		config.props = config.props && [config.props].flat().filter(n => n);
		config.filter = typeof config.filter == "function" && config.filter;
		let depth = -1;
		let start = performance.now();
		let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
		let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
		
		let foundChildren = [];
		let singleChild = getChild(instance);
		if (config.all) {
			for (let i in foundChildren) delete foundChildren[i].BDFDBreactSearch;
			return foundChildren;
		}
		else return singleChild;
		
		function getChild (children) {
			let result = null;
			if (!children || depth >= maxDepth || performance.now() - start >= maxTime) return result;
			if (!BDFDB.ArrayUtils.is(children)) {
				if (check(children)) {
					if (config.all === undefined || !config.all) result = children;
					else if (config.all) {
						if (!children.BDFDBreactSearch) {
							children.BDFDBreactSearch = true;
							foundChildren.push(children);
						}
					}
				}
				else if (children.props && children.props.children) {
					depth++;
					result = getChild(children.props.children);
					depth--;
				}
			}
			else {
				for (let child of children) if (child) {
					if (BDFDB.ArrayUtils.is(child)) result = getChild(child);
					else if (check(child)) {
						if (config.all === undefined || !config.all) result = child;
						else if (config.all) {
							if (!child.BDFDBreactSearch) {
								child.BDFDBreactSearch = true;
								foundChildren.push(child);
							}
						}
					}
					else if (child.props && child.props.children) {
						depth++;
						result = getChild(child.props.children);
						depth--;
					}
					if (result) break;
				}
			}
			return result;
		}
		function check (instance) {
			if (!instance) return false;
			let props = instance.stateNode ? instance.stateNode.props : instance.props;
			return instance.type && config.name && config.name.some(name => InternalBDFDB.isInstanceCorrect(instance, name)) || config.key && config.key.some(key => instance.key == key) || props && config.props && config.props[config.someProps ? "some" : "every"](prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => propCheck(props, prop[0], checkValue)) : propCheck(props, prop[0], prop[1])) : props[prop] !== undefined) || config.filter && config.filter(instance);
		}
		function propCheck (props, key, value) {
			return key != null && props[key] != null && value != null && (key == "className" ? (" " + props[key] + " ").indexOf(" " + value + " ") > -1 : BDFDB.equals(props[key], value));
		}
	};
	BDFDB.ReactUtils.setChild = function (parent, stringOrChild) {
		if (!BDFDB.ReactUtils.isValidElement(parent) || (!BDFDB.ReactUtils.isValidElement(stringOrChild) && typeof stringOrChild != "string" && !BDFDB.ArrayUtils.is(stringOrChild))) return;
		let set = false;
		checkParent(parent);
		function checkParent(child) {
			if (set) return;
			if (!BDFDB.ArrayUtils.is(child)) checkChild(child);
			else for (let subChild of child) checkChild(subChild);
		}
		function checkChild(child) {
			if (!BDFDB.ReactUtils.isValidElement(child)) return;
			if (BDFDB.ReactUtils.isValidElement(child.props.children)) checkParent(child.props.children);
			else if (BDFDB.ArrayUtils.is(child.props.children)) {
				if (child.props.children.every(c => !c || typeof c == "string")) {
					set = true;
					child.props.children = [stringOrChild].flat(10);
				}
				else checkParent(child.props.children);
			}
			else {
				set = true;
				child.props.children = stringOrChild;
			}
		}
	};
	BDFDB.ReactUtils.findConstructor = function (nodeOrInstance, types, config = {}) {
		if (!BDFDB.ObjectUtils.is(config)) return null;
		if (!nodeOrInstance || !types) return config.all ? (config.group ? {} : []) : null;
		let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
		if (!BDFDB.ObjectUtils.is(instance)) return config.all ? (config.group ? {} : []) : null;
		types = types && [types].flat(10).filter(n => typeof n == "string");
		if (!types.length) return config.all ? (config.group ? {} : []) : null;;
		let depth = -1;
		let start = performance.now();
		let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
		let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
		let whitelist = config.up ? {return:true, sibling:true, default:true, _reactInternalFiber:true} : {child:true, sibling:true, default:true, _reactInternalFiber:true};
		
		let foundConstructors = config.group ? {} : [];
		let singleConstructor = getConstructor(instance);
		if (config.all) {
			for (let i in foundConstructors) {
				if (config.group) for (let j in foundConstructors[i]) delete foundConstructors[i][j].BDFDBreactSearch;
				else delete foundConstructors[i].BDFDBreactSearch;
			}
			return foundConstructors;
		}
		else return singleConstructor;

		function getConstructor (instance) {
			depth++;
			let result = undefined;
			if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
				if (instance.type && types.some(name => InternalBDFDB.isInstanceCorrect(instance, name.split(" _ _ ")[0]))) {
					if (config.all === undefined || !config.all) result = instance.type;
					else if (config.all) {
						if (!instance.type.BDFDBreactSearch) {
							instance.type.BDFDBreactSearch = true;
							if (config.group) {
								if (instance.type && (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name)) {
									let group = config.name.find(name => (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type) == name.split(" _ _ ")[0]) || "Default";
									if (!BDFDB.ArrayUtils.is(foundConstructors[group])) foundConstructors[group] = [];
									foundConstructors[group].push(instance.stateNode);
								}
							}
							else foundConstructors.push(instance.type);
						}
					}
				}
				if (result === undefined) {
					let keys = Object.getOwnPropertyNames(instance);
					for (let i = 0; result === undefined && i < keys.length; i++) {
						let key = keys[i];
						if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] === "function")) result = getConstructor(instance[key]);
					}
				}
			}
			depth--;
			return result;
		}
	};
	BDFDB.ReactUtils.findDOMNode = function (instance) {
		if (Node.prototype.isPrototypeOf(instance)) return instance;
		if (!instance || !instance.updater || typeof instance.updater.isMounted !== "function" || !instance.updater.isMounted(instance)) return null;
		let node = LibraryModules.ReactDOM.findDOMNode(instance) || BDFDB.ReactUtils.getValue(instance, "child.stateNode");
		return Node.prototype.isPrototypeOf(node) ? node : null;
	};
	BDFDB.ReactUtils.findOwner = function (nodeOrInstance, config) {
		if (!BDFDB.ObjectUtils.is(config)) return null;
		if (!nodeOrInstance || !config.name && !config.type && !config.key && !config.props) return config.all ? (config.group ? {} : []) : null;
		let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
		if (!BDFDB.ObjectUtils.is(instance)) return config.all ? (config.group ? {} : []) : null;
		config.name = config.name && [config.name].flat().filter(n => n);
		config.type = config.type && [config.type].flat().filter(n => n);
		config.key = config.key && [config.key].flat().filter(n => n);
		config.props = config.props && [config.props].flat().filter(n => n);
		let depth = -1;
		let start = performance.now();
		let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
		let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
		let whitelist = config.up ? {return:true, sibling:true, _reactInternalFiber:true} : {child:true, sibling:true, _reactInternalFiber:true};
		
		let foundInstances = config.group ? {} : [];
		let singleInstance = getOwner(instance);
		if (config.all) {
			for (let i in foundInstances) {
				if (config.group) for (let j in foundInstances[i]) delete foundInstances[i][j].BDFDBreactSearch;
				else delete foundInstances[i].BDFDBreactSearch;
			}
			return foundInstances;
		}
		else return singleInstance;

		function getOwner (instance) {
			depth++;
			let result = undefined;
			if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
				let props = instance.stateNode ? instance.stateNode.props : instance.props;
				if (instance.stateNode && !Node.prototype.isPrototypeOf(instance.stateNode) && (instance.type && config.name && config.name.some(name => InternalBDFDB.isInstanceCorrect(instance, name.split(" _ _ ")[0])) || instance.type && config.type && config.type.some(type => BDFDB.ArrayUtils.is(type) ? instance.type === type[1] : instance.type === type) || instance.key && config.key && config.key.some(key => instance.key == key) || props && config.props && config.props.every(prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => BDFDB.equals(props[prop[0]], checkValue)) : BDFDB.equals(props[prop[0]], prop[1])) : props[prop] !== undefined))) {
					if (config.all === undefined || !config.all) result = instance.stateNode;
					else if (config.all) {
						if (!instance.stateNode.BDFDBreactSearch) {
							instance.stateNode.BDFDBreactSearch = true;
							if (config.group) {
								if (config.name && instance.type && (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type)) {
									let group = config.name.find(name => (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type) == name.split(" _ _ ")[0]) || "Default";
									if (!BDFDB.ArrayUtils.is(foundInstances[group])) foundInstances[group] = [];
									foundInstances[group].push(instance.stateNode);
								}
								else if (config.type && instance.type) {
									let group = [config.type.find(t => BDFDB.ArrayUtils.is(t) && instance.type === t[1])].flat(10)[0] || "Default";
									if (!BDFDB.ArrayUtils.is(foundInstances[group])) foundInstances[group] = [];
									foundInstances[group].push(instance.stateNode);
								}
							}
							else foundInstances.push(instance.stateNode);
						}
					}
				}
				if (result === undefined) {
					let keys = Object.getOwnPropertyNames(instance);
					for (let i = 0; result === undefined && i < keys.length; i++) {
						let key = keys[i];
						if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] === "function")) result = getOwner(instance[key]);
					}
				}
			}
			depth--;
			return result;
		}
	};
	BDFDB.ReactUtils.findParent = function (nodeOrInstance, config) {
		if (!nodeOrInstance || !BDFDB.ObjectUtils.is(config) || !config.name && !config.key && !config.props && !config.filter) return [null, -1];
		let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
		if (!BDFDB.ObjectUtils.is(instance) && !BDFDB.ArrayUtils.is(instance)) return [null, -1];
		config.name = config.name && [config.name].flat().filter(n => n);
		config.key = config.key && [config.key].flat().filter(n => n);
		config.props = config.props && [config.props].flat().filter(n => n);
		config.filter = typeof config.filter == "function" && config.filter;
		let parent = firstArray = instance;
		while (!BDFDB.ArrayUtils.is(firstArray) && firstArray.props && firstArray.props.children) firstArray = firstArray.props.children;
		if (!BDFDB.ArrayUtils.is(firstArray)) {
			if (parent && parent.props) {
				parent.props.children = [parent.props.children];
				firstArray = parent.props.children;
			}
			else firstArray = [];
		}
		return getParent(instance);
		function getParent (children) {
			let result = [firstArray, -1];
			if (!children) return result;
			if (!BDFDB.ArrayUtils.is(children)) {
				if (check(children)) result = found(children);
				else if (children.props && children.props.children) {
					parent = children;
					result = getParent(children.props.children);
				}
			}
			else {
				for (let i = 0; result[1] == -1 && i < children.length; i++) if (children[i]) {
					if (BDFDB.ArrayUtils.is(children[i])) {
						parent = children;
						result = getParent(children[i]);
					}
					else if (check(children[i])) {
						parent = children;
						result = found(children[i]);
					}
					else if (children[i].props && children[i].props.children) {
						parent = children[i];
						result = getParent(children[i].props.children);
					}
				}
			}
			return result;
		}
		function found (child) {
			if (BDFDB.ArrayUtils.is(parent)) return [parent, parent.indexOf(child)];
			else {
				parent.props.children = [];
				parent.props.children.push(child);
				return [parent.props.children, 0];
			}
		}
		function check (instance) {
			if (!instance) return false;
			let props = instance.stateNode ? instance.stateNode.props : instance.props;
			return instance.type && config.name && config.name.some(name => InternalBDFDB.isInstanceCorrect(instance, name)) || config.key && config.key.some(key => instance.key == key) || props && config.props && config.props[config.someProps ? "some" : "every"](prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => propCheck(props, prop[0], checkValue)) : propCheck(props, prop[0], prop[1])) : props[prop] !== undefined) || config.filter && config.filter(instance);
		}
		function propCheck (props, key, value) {
			return key != null && props[key] != null && value != null && (key == "className" ? (" " + props[key] + " ").indexOf(" " + value + " ") > -1 : BDFDB.equals(props[key], value));
		}
	};
	BDFDB.ReactUtils.findProps = function (nodeOrInstance, config) {
		if (!BDFDB.ObjectUtils.is(config)) return null;
		if (!nodeOrInstance || !config.name && !config.key) return null;
		let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
		if (!BDFDB.ObjectUtils.is(instance)) return null;
		config.name = config.name && [config.name].flat().filter(n => n);
		config.key = config.key && [config.key].flat().filter(n => n);
		let depth = -1;
		let start = performance.now();
		let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
		let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
		let whitelist = config.up ? {return:true, sibling:true, _reactInternalFiber:true} : {child:true, sibling:true, _reactInternalFiber:true};
		return findProps(instance);

		function findProps (instance) {
			depth++;
			let result = undefined;
			if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
				if (instance.memoizedProps && (instance.type && config.name && config.name.some(name => InternalBDFDB.isInstanceCorrect(instance, name.split(" _ _ ")[0])) || config.key && config.key.some(key => instance.key == key))) result = instance.memoizedProps;
				if (result === undefined) {
					let keys = Object.getOwnPropertyNames(instance);
					for (let i = 0; result === undefined && i < keys.length; i++) {
						let key = keys[i];
						if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] === "function")) result = findProps(instance[key]);
					}
				}
			}
			depth--;
			return result;
		}
	};
	BDFDB.ReactUtils.findValue = function (nodeOrInstance, searchKey, config = {}) {
		if (!BDFDB.ObjectUtils.is(config)) return null;
		if (!nodeOrInstance || typeof searchKey != "string") return config.all ? [] : null;
		let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
		if (!BDFDB.ObjectUtils.is(instance)) return config.all ? [] : null;
		instance = instance._reactInternalFiber || instance;
		let depth = -1;
		let start = performance.now();
		let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
		let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
		let whitelist = {
			props: true,
			state: true,
			stateNode: true,
			updater: true,
			prototype: true,
			type: true,
			children: config.up ? false : true,
			memoizedProps: true,
			memoizedState: true,
			child: config.up ? false : true,
			return: config.up ? true : false,
			sibling: config.up ? false : true
		};
		let blacklist = {
			contextSection: true
		};
		if (BDFDB.ObjectUtils.is(config.whitelist)) Object.assign(whitelist, config.whiteList);
		if (BDFDB.ObjectUtils.is(config.blacklist)) Object.assign(blacklist, config.blacklist);
		let foundKeys = [];
		let singleKey = getKey(instance);
		if (config.all) return foundKeys;
		else return singleKey;
		function getKey(instance) {
			depth++;
			let result = undefined;
			if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
				let keys = Object.getOwnPropertyNames(instance);
				for (let i = 0; result === undefined && i < keys.length; i++) {
					let key = keys[i];
					if (key && !blacklist[key]) {
						let value = instance[key];
						if (searchKey === key && (config.value === undefined || BDFDB.equals(config.value, value))) {
							if (config.all === undefined || !config.all) result = value;
							else if (config.all) {
								if (config.noCopies === undefined || !config.noCopies) foundKeys.push(value);
								else if (config.noCopies) {
									let copy = false;
									for (let foundKey of foundKeys) if (BDFDB.equals(value, foundKey)) {
										copy = true;
										break;
									}
									if (!copy) foundKeys.push(value);
								}
							}
						}
						else if ((typeof value === "object" || typeof value === "function") && (whitelist[key] || key[0] == "." || !isNaN(key[0]))) result = getKey(value);
					}
				}
			}
			depth--;
			return result;
		}
	};
	BDFDB.ReactUtils.forceUpdate = function (...instances) {
		for (let ins of instances.flat(10).filter(n => n)) if (ins.updater && typeof ins.updater.isMounted == "function" && ins.updater.isMounted(ins)) ins.forceUpdate();
	};
	BDFDB.ReactUtils.getInstance = function (node) {
		if (!BDFDB.ObjectUtils.is(node)) return null;
		return node[Object.keys(node).find(key => key.startsWith("__reactInternalInstance"))];
	};
	BDFDB.ReactUtils.getValue = function (nodeOrInstance, valuepath) {
		if (!nodeOrInstance || !valuepath) return null;
		let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
		if (!BDFDB.ObjectUtils.is(instance)) return null;
		let found = instance, values = valuepath.split(".").filter(n => n);
		for (value of values) {
			if (!found) return null;
			found = found[value];
		}
		return found;
	};
	BDFDB.ReactUtils.render = function (component, node) {
		if (!BDFDB.ReactUtils.isValidElement(component) || !Node.prototype.isPrototypeOf(node)) return;
		try {
			LibraryModules.ReactDOM.render(component, node);
			let observer = new MutationObserver(changes => changes.forEach(change => {
				let nodes = Array.from(change.removedNodes);
				if (nodes.indexOf(node) > -1 || nodes.some(n => n.contains(node))) {
					observer.disconnect();
					BDFDB.ReactUtils.unmountComponentAtNode(node);
				}
			}));
			observer.observe(document.body, {subtree:true, childList:true});
		}
		catch (err) {BDFDB.LogUtils.error("Could not render react element! " + err);}
	};
	InternalBDFDB.setDefaultProps = function (component, defaultProps) {
		if (BDFDB.ObjectUtils.is(component)) component.defaultProps = Object.assign({}, component.defaultProps, defaultProps);
	};
	InternalBDFDB.loadPatchedComp = function (path) {
		let comp = BDFDB.ReactUtils.getValue(window.BDFDB, `LibraryComponents.${path}`);
		if (comp && comp.prototype && comp.prototype.BDFDBpatch) return comp;
	};

	BDFDB.sameProto = function (a, b) {
		if (a != null && typeof a == "object") return a.constructor && a.constructor.prototype && typeof a.constructor.prototype.isPrototypeOf == "function" && a.constructor.prototype.isPrototypeOf(b);
		else return typeof a == typeof b;
	};
	BDFDB.equals = function (mainA, mainB, sorted) {
		var i = -1;
		if (sorted === undefined || typeof sorted !== "boolean") sorted = false;
		return equal(mainA, mainB);
		function equal(a, b) {
			i++;
			var result = true;
			if (i > 1000) result = null;
			else {
				if (typeof a !== typeof b) result = false;
				else if (typeof a === "function") result = a.toString() == b.toString();
				else if (typeof a === "undefined") result = true;
				else if (typeof a === "symbol") result = true;
				else if (typeof a === "boolean") result = a == b;
				else if (typeof a === "string") result = a == b;
				else if (typeof a === "number") {
					if (isNaN(a) || isNaN(b)) result = isNaN(a) == isNaN(b);
					else result = a == b;
				}
				else if (!a && !b) result = true;
				else if (!a || !b) result = false;
				else if (typeof a === "object") {
					var keysA = Object.getOwnPropertyNames(a);
					var keysB = Object.getOwnPropertyNames(b);
					if (keysA.length !== keysB.length) result = false;
					else for (let j = 0; result === true && j < keysA.length; j++) {
						if (sorted) result = equal(a[keysA[j]], b[keysB[j]]);
						else result = equal(a[keysA[j]], b[keysA[j]]);
					}
				}
			}
			i--;
			return result;
		}
	};

	let MessageRerenderTimeout;
	BDFDB.MessageUtils = {};
	BDFDB.MessageUtils.rerenderAll = function () {
		BDFDB.TimeUtils.clear(MessageRerenderTimeout);
		MessageRerenderTimeout = BDFDB.TimeUtils.timeout(_ => {
			let MessagesIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.app), {name:"Messages", unlimited:true});
			let MessagesPrototype = BDFDB.ReactUtils.getValue(MessagesIns, "_reactInternalFiber.type.prototype");
			if (MessagesIns && MessagesPrototype) {
				BDFDB.ModuleUtils.patch(BDFDB, MessagesPrototype, "render", {after: e => {
					let [children, index] = BDFDB.ReactUtils.findParent(e.returnValue, {props: ["message", "channel"]});
					if (index > -1) for (let ele of children) if (ele.props.message) ele.props.message = new BDFDB.DiscordObjects.Message(ele.props.message);
				}}, {once: true});
				BDFDB.ReactUtils.forceUpdate(MessagesIns);
			}
		}, 1000);
	};
		
	BDFDB.UserUtils = {};
	BDFDB.UserUtils.is = function (user) {
		return user && user instanceof BDFDB.DiscordObjects.User;
	};
	var myDataUser = LibraryModules.CurrentUserStore && LibraryModules.CurrentUserStore.getCurrentUser();
	BDFDB.UserUtils.me = new Proxy(myDataUser || {}, {
		get: function (list, item) {
			return (myDataUser = LibraryModules.CurrentUserStore.getCurrentUser()) && myDataUser[item];
		}
	});
	BDFDB.UserUtils.getStatus = function (id = BDFDB.UserUtils.me.id) {
		id = typeof id == "number" ? id.toFixed() : id;
		let activity = BDFDB.UserUtils.getActivitiy(id);
		return activity && activity.type == BDFDB.DiscordConstants.ActivityTypes.STREAMING ? "streaming" : LibraryModules.StatusMetaUtils.getStatus(id);
	};
	BDFDB.UserUtils.getStatusColor = function (status) {
		status = typeof status == "string" ? status.toLowerCase() : null;
		switch (status) {
			case "online": return BDFDB.DiscordConstants.Colors.STATUS_GREEN;
			case "mobile": return BDFDB.DiscordConstants.Colors.STATUS_GREEN;
			case "idle": return BDFDB.DiscordConstants.Colors.STATUS_YELLOW;
			case "dnd": return BDFDB.DiscordConstants.Colors.STATUS_RED;
			case "playing": return BDFDB.DiscordConstants.Colors.BRAND;
			case "listening": return BDFDB.DiscordConstants.Colors.SPOTIFY;
			case "streaming": return BDFDB.DiscordConstants.Colors.TWITCH;
			default: return BDFDB.DiscordConstants.Colors.STATUS_GREY;
		}
	};
	BDFDB.UserUtils.getActivitiy = function (id = BDFDB.UserUtils.me.id) {
		for (let activity of LibraryModules.StatusMetaUtils.getActivities(id)) if (activity.type != BDFDB.DiscordConstants.ActivityTypes.CUSTOM_STATUS) return activity;
		return null;
	};
	BDFDB.UserUtils.getAvatar = function (id = BDFDB.UserUtils.me.id) {
		let user = LibraryModules.UserStore.getUser(typeof id == "number" ? id.toFixed() : id);
		if (!user) return window.location.origin + "/assets/322c936a8c8be1b803cd94861bdfa868.png";
		else return ((user.avatar ? "" : window.location.origin) + LibraryModules.IconUtils.getUserAvatarURL(user)).split("?")[0];
	};
	BDFDB.UserUtils.can = function (permission, id = BDFDB.UserUtils.me.id, channelId = LibraryModules.LastChannelStore.getChannelId()) {
		if (!BDFDB.DiscordConstants.Permissions[permission]) BDFDB.LogUtils.warn(permission + " not found in Permissions");
		else {
			let channel = LibraryModules.ChannelStore.getChannel(channelId);
			if (channel) return LibraryModules.PermissionUtils.canUser(id, BDFDB.DiscordConstants.Permissions[permission], channel);
		}
		return false;
	};
	BDFDB.UserUtils.openMenu = function (id, guildId, e = BDFDB.InternalData.mousePosition) {
		if (!id || !guildId) return;
		let user = LibraryModules.UserStore.getUser(id);
		if (user) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
			return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("GuildChannelUserContextMenu", false) || {exports:{}}).exports.default, Object.assign({}, e, {
				user: user,
				guildId: guildId
			}));
		});
	};

	let GuildsRerenderTimeout;
	BDFDB.GuildUtils = {};
	BDFDB.GuildUtils.is = function (guild) {
		if (!BDFDB.ObjectUtils.is(guild)) return false;
		let keys = Object.keys(guild);
		return guild instanceof BDFDB.DiscordObjects.Guild || Object.keys(new BDFDB.DiscordObjects.Guild({})).every(key => keys.indexOf(key) > -1);
	};
	BDFDB.GuildUtils.getIcon = function (id) {
		let guild = LibraryModules.GuildStore.getGuild(typeof id == "number" ? id.toFixed() : id);
		if (!guild || !guild.icon) return null;
		return LibraryModules.IconUtils.getGuildIconURL(guild).split("?")[0];
	};
	BDFDB.GuildUtils.getBanner = function (id) {
		let guild = LibraryModules.GuildStore.getGuild(typeof id == "number" ? id.toFixed() : id);
		if (!guild || !guild.banner) return null;
		return LibraryModules.IconUtils.getGuildBannerURL(guild).split("?")[0];
	};
	BDFDB.GuildUtils.getFolder = function (id) {
		return BDFDB.LibraryModules.FolderStore.guildFolders.filter(n => n.folderId).find(n => n.guildIds.includes(id));
	};
	BDFDB.GuildUtils.getId = function (div) {
		if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
		let guilddiv = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, div);
		if (!guilddiv) return;
		let iconWrap = guilddiv.querySelector(BDFDB.dotCN.guildiconwrapper);
		let id = iconWrap && iconWrap.href ? iconWrap.href.split("/").slice(-2)[0] : null;
		return id && !isNaN(parseInt(id)) ? id.toString() : null;
	};
	BDFDB.GuildUtils.getData = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
		id = typeof id == "number" ? id.toFixed() : id;
		for (let info of BDFDB.GuildUtils.getAll()) if (info && info.id == id) return info;
		return null;
	};
	BDFDB.GuildUtils.getAll = function () {
		let found = [], objs = [];
		for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guilds), {name:["Guild","GuildIcon"], all:true, unlimited:true})) {
			if (ins.props && ins.props.guild) objs.push(Object.assign(new ins.props.guild.constructor(ins.props.guild), {div:ins.handleContextMenu && BDFDB.ReactUtils.findDOMNode(ins), instance:ins}));
		}
		for (let id of BDFDB.LibraryModules.FolderStore.getFlattenedGuildIds()) {
			let foundobj = null;
			for (let obj of objs) if (obj.id == id) {
				foundobj = obj
				break;
			}
			if (foundobj) found.push(foundobj);
			else {
				let guild = BDFDB.LibraryModules.GuildStore.getGuild(id);
				if (guild) found.push(Object.assign(new guild.constructor(guild), {div:null, instance:null}))
			}
		}
		return found;
	};
	BDFDB.GuildUtils.getUnread = function (servers) {
		let found = [];
		for (let eleOrInfoOrId of servers === undefined || !BDFDB.ArrayUtils.is(servers) ? BDFDB.GuildUtils.getAll() : servers) {
			if (!eleOrInfoOrId) return null;
			let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
			id = typeof id == "number" ? id.toFixed() : id;
			if (id && (LibraryModules.UnreadGuildUtils.hasUnread(id) || LibraryModules.UnreadGuildUtils.getMentionCount(id) > 0)) found.push(eleOrInfoOrId);
		}
		return found;
	};
	BDFDB.GuildUtils.getPinged = function (servers) {
		let found = [];
		for (let eleOrInfoOrId of servers === undefined || !BDFDB.ArrayUtils.is(servers) ? BDFDB.GuildUtils.getAll() : servers) {
			if (!eleOrInfoOrId) return null;
			let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
			id = typeof id == "number" ? id.toFixed() : id;
			if (id && LibraryModules.UnreadGuildUtils.getMentionCount(id) > 0) found.push(eleOrInfoOrId);
		}
		return found;
	};
	BDFDB.GuildUtils.getMuted = function (servers) {
		let found = [];
		for (let eleOrInfoOrId of servers === undefined || !BDFDB.ArrayUtils.is(servers) ? BDFDB.GuildUtils.getAll() : servers) {
			if (!eleOrInfoOrId) return null;
			let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
			id = typeof id == "number" ? id.toFixed() : id;
			if (id && LibraryModules.MutedUtils.isGuildOrCategoryOrChannelMuted(id)) found.push(eleOrInfoOrId);
		}
		return found;
	};
	BDFDB.GuildUtils.getSelected = function () {
		let info = LibraryModules.GuildStore.getGuild(LibraryModules.LastGuildStore.getGuildId());
		if (info) return BDFDB.GuildUtils.getData(info.id) || Object.assign(new info.constructor(info), {div:null, instance:null});
		else return null;
	};
	BDFDB.GuildUtils.openMenu = function (eleOrInfoOrId, e = BDFDB.InternalData.mousePosition) {
		if (!eleOrInfoOrId) return;
		let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
		let guild = LibraryModules.GuildStore.getGuild(id);
		if (guild) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
			return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("GuildContextMenu", false) || {exports:{}}).exports.default, Object.assign({}, e, {
				guild: guild
			}));
		});
	};
	BDFDB.GuildUtils.markAsRead = function (guilds) {
		if (!guilds) return;
		let unreadChannels = [];
		for (let guild of BDFDB.ArrayUtils.is(guilds) ? guilds : (typeof guilds == "string" || typeof guilds == "number" ? Array.of(guilds) : Array.from(guilds))) {
			let id = Node.prototype.isPrototypeOf(guild) ? BDFDB.GuildUtils.getId(guild) : (guild && typeof guild == "object" ? guild.id : guild);
			let channels = id && LibraryModules.GuildChannelStore.getChannels(id);
			if (channels) for (let type in channels) if (BDFDB.ArrayUtils.is(channels[type])) for (let channelObj of channels[type]) unreadChannels.push(channelObj.channel.id);
		}
		if (unreadChannels.length) BDFDB.ChannelUtils.markAsRead(unreadChannels);
	};
	BDFDB.GuildUtils.rerenderAll = function () {
		BDFDB.TimeUtils.clear(GuildsRerenderTimeout);
		GuildsRerenderTimeout = BDFDB.TimeUtils.timeout(_ => {
			let GuildsIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.app), {name:"Guilds", unlimited:true});
			let GuildsPrototype = BDFDB.ReactUtils.getValue(GuildsIns, "_reactInternalFiber.type.prototype");
			if (GuildsIns && GuildsPrototype) {
				BDFDB.ModuleUtils.patch(BDFDB, GuildsPrototype, "render", {after: e => {
					let [children, index] = BDFDB.ReactUtils.findParent(e.returnValue, {name: "ConnectedUnreadDMs"});
					if (index > -1) children.splice(index + 1, 0, BDFDB.ReactUtils.createElement("div", {}));
					BDFDB.ReactUtils.forceUpdate(GuildsIns);
				}}, {once: true});
				BDFDB.ReactUtils.forceUpdate(GuildsIns);
			}
		}, 1000);
	};

	BDFDB.FolderUtils = {};
	BDFDB.FolderUtils.getId = function (div) {
		if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
		div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildfolderwrapper, div);
		if (!div) return;
		return BDFDB.ReactUtils.findValue(div, "folderId", {up:true});
	};
	BDFDB.FolderUtils.getDefaultName = function (folderId) {
		let folder = BDFDB.LibraryModules.FolderStore.getGuildFolderById(folderId);
		if (!folder) return "";
		let rest = 2 * BDFDB.DiscordConstants.MAX_GUILD_FOLDER_NAME_LENGTH;
		let names = [], allNames = folder.guildIds.map(guildId => (BDFDB.LibraryModules.GuildStore.getGuild(guildId) || {}).name).filter(n => n);
		for (let name of allNames) if (name.length < rest || names.length === 0) {
			names.push(name);
			rest -= name.length;
		}
		return names.join(", ") + (names.length < allNames.length ? ", ..." : "");
	};
	BDFDB.FolderUtils.getDiv = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let info = BDFDB.FolderUtils.getData(eleOrInfoOrId);
		return info ? info.div : null;
	};
	BDFDB.FolderUtils.getData = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.FolderUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
		id = typeof id == "number" ? id.toFixed() : id;
		for (let info of BDFDB.FolderUtils.getAll()) if (info && info.folderId == id) return info;
		return null;
	};
	BDFDB.FolderUtils.getAll = function () {
		let found = [];
		for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guildswrapper), {name:"GuildFolder", all:true, unlimited:true})) {
			if (ins.props && ins.props.folderId) found.push(Object.assign({}, ins.props, {div:BDFDB.ReactUtils.findDOMNode(ins), instance:ins}));
		}
		return found;
	};

	BDFDB.ChannelUtils = {};
	BDFDB.ChannelUtils.is = function (channel) {
		if (!BDFDB.ObjectUtils.is(channel)) return false;
		let keys = Object.keys(channel);
		return channel instanceof BDFDB.DiscordObjects.Channel || Object.keys(new BDFDB.DiscordObjects.Channel({})).every(key => keys.indexOf(key) > -1);
	};
	BDFDB.ChannelUtils.isTextChannel = function (channelOrId) {
		let channel = typeof channelOrId == "string" ? LibraryModules.ChannelStore.getChannel(channelOrId) : channelOrId;
		return BDFDB.ObjectUtils.is(channel) && (channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_TEXT || channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_STORE || channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_ANNOUNCEMENT);
	};
	BDFDB.ChannelUtils.getId = function (div) {
		if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
		div = BDFDB.DOMUtils.getParent(BDFDB.dotCNC.categorycontainerdefault + BDFDB.dotCNC.channelcontainerdefault + BDFDB.dotCN.dmchannel, div);
		if (!div) return;
		let info = BDFDB.ReactUtils.findValue(div, "channel");
		return info ? info.id.toString() : null;
	};
	BDFDB.ChannelUtils.getDiv = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let info = BDFDB.ChannelUtils.getData(eleOrInfoOrId);
		return info ? info.div : null;
	};
	BDFDB.ChannelUtils.getData = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.ChannelUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
		id = typeof id == "number" ? id.toFixed() : id;
		for (let info of BDFDB.ChannelUtils.getAll()) if (info && info.id == id) return info;
		return null;
	};
	BDFDB.ChannelUtils.getName = function (id, addPrefix) {
		let channel = BDFDB.LibraryModules.ChannelStore.getChannel(id);
		if (!channel) return "";
		switch (channel.type) {
			case BDFDB.DiscordConstants.ChannelTypes.DM:
				let user = channel.recipients.map(BDFDB.LibraryModules.UserStore.getUser).filter(n => n)[0];
				return (addPrefix && "@" || "") + (user && user.toString() || "");
			case BDFDB.DiscordConstants.ChannelTypes.GROUP_DM:
				if (channel.name) return channel.name;
				let users = channel.recipients.map(BDFDB.LibraryModules.UserStore.getUser).filter(n => n);
				return users.length > 0 ? users.map(user => user.toString).join(", ") : BDFDB.LanguageUtils.LanguageStrings.UNNAMED;
			case BDFDB.DiscordConstants.ChannelTypes.GUILD_ANNOUNCEMENT:
			case BDFDB.DiscordConstants.ChannelTypes.GUILD_TEXT:
				return (addPrefix && "#" || "") + channel.name;
			default:
				return channel.name
		}
	};
	BDFDB.ChannelUtils.getAll = function () {
		let found = [];
		for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.channels), {name: ["ChannelCategoryItem", "ChannelItem", "PrivateChannel"], all:true, unlimited:true})) if (ins.props && !ins.props.ispin && ins.props.channel && ins._reactInternalFiber.return) {
			let div = BDFDB.ReactUtils.findDOMNode(ins);
			div = div && BDFDB.DOMUtils.containsClass(div.parentElement, BDFDB.disCN.categorycontainerdefault, BDFDB.disCN.channelcontainerdefault, false) ? div.parentElement : div;
			found.push(Object.assign(new ins.props.channel.constructor(ins.props.channel), {div, instance:ins}));
		}
		return found;
	};
	BDFDB.ChannelUtils.getSelected = function () {
		let info = LibraryModules.ChannelStore.getChannel(LibraryModules.LastChannelStore.getChannelId());
		if (info) return BDFDB.ChannelUtils.getData(info.id) || Object.assign(new info.constructor(info), {div:null, instance:null});
		else return null;
	};
	BDFDB.ChannelUtils.markAsRead = function (channels) {
		if (!channels) return;
		let unreadChannels = [];
		for (let channel of channels = BDFDB.ArrayUtils.is(channels) ? channels : (typeof channels == "string" || typeof channels == "number" ? Array.of(channels) : Array.from(channels))) {
			let id = Node.prototype.isPrototypeOf(channel) ? BDFDB.ChannelUtils.getId(channel) : (channel && typeof channel == "object" ? channel.id : channel);
			if (id && BDFDB.ChannelUtils.isTextChannel(id)) unreadChannels.push({
				channelId: id,
				messageId: LibraryModules.UnreadChannelUtils.lastMessageId(id)
			});
		}
		if (unreadChannels.length) LibraryModules.AckUtils.bulkAck(unreadChannels);
	};
	
	BDFDB.DMUtils = {};
	BDFDB.DMUtils.isDMChannel = function (channelOrId) {
		let channel = typeof channelOrId == "string" ? LibraryModules.ChannelStore.getChannel(channelOrId) : channelOrId;
		return BDFDB.ObjectUtils.is(channel) && (channel.type == BDFDB.DiscordConstants.ChannelTypes.DM || channel.type == BDFDB.DiscordConstants.ChannelTypes.GROUP_DM);
	};
	BDFDB.DMUtils.getIcon = function (id) {
		let channel = LibraryModules.ChannelStore.getChannel(id = typeof id == "number" ? id.toFixed() : id);
		if (!channel) return null;
		if (!channel.icon) return channel.type == 1 ? BDFDB.UserUtils.getAvatar(channel.recipients[0]) : (channel.type == 3 ? window.location.origin + LibraryModules.IconUtils.getChannelIconURL(channel).split("?")[0] : null);
		return LibraryModules.IconUtils.getChannelIconURL(channel).split("?")[0];
	};
	BDFDB.DMUtils.getId = function (div) {
		if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
		let dmdiv = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, div);
		if (!dmdiv) return;
		let iconWrap = dmdiv.querySelector(BDFDB.dotCN.guildiconwrapper);
		let id = iconWrap && iconWrap.href ? iconWrap.href.split("/").slice(-1)[0] : null;
		return id && !isNaN(parseInt(id)) ? id.toString() : null;
	};
	BDFDB.DMUtils.getDiv = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		if (Node.prototype.isPrototypeOf(eleOrInfoOrId)) {
			var div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, eleOrInfoOrId);
			return div ? div.parentElement : div;
		}
		else {
			let id = typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId;
			if (id) {
				var div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, document.querySelector(`${BDFDB.dotCNS.guilds + BDFDB.dotCN.dmpill + " + * " + BDFDB.dotCN.guildiconwrapper}[href*="/channels/@me/${id}"]`));
				return div && BDFDB? div.parentElement : div;
			}
		}
		return null;
	};
	BDFDB.DMUtils.getData = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.BDFDB.DMUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
		id = typeof id == "number" ? id.toFixed() : id;
		for (let info of BDFDB.DMUtils.getAll()) if (info && info.id == id) return info;
		return null;
	};
	BDFDB.DMUtils.getAll = function () {
		let found = [];
		for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guilds), {name:"DirectMessage", all:true, unlimited:true})) {
			if (ins.props && ins.props.channel) found.push(Object.assign(new ins.props.channel.constructor(ins.props.channel), {div:BDFDB.ReactUtils.findDOMNode(ins), instance:ins}));
		}
		return found;
	};
	BDFDB.DMUtils.openMenu = function (eleOrInfoOrId, e = BDFDB.InternalData.mousePosition) {
		if (!eleOrInfoOrId) return;
		let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.ChannelUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
		let channel = LibraryModules.ChannelStore.getChannel(id);
		if (channel) {
			if (channel.isMultiUserDM()) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
				return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("GroupDMContextMenu", false) || {exports:{}}).exports.default, Object.assign({}, e, {
					channel: channel,
					selected: channel.id == LibraryModules.LastChannelStore.getChannelId()
				}));
			});
			else LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
				return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("DMUserContextMenu", false) || {exports:{}}).exports.default, Object.assign({}, e, {
					user: LibraryModules.UserStore.getUser(channel.recipients[0]),
					channel: channel,
					selected: channel.id == LibraryModules.LastChannelStore.getChannelId()
				}));
			});
		}
	};
	BDFDB.DMUtils.markAsRead = function (dms) {
		if (!dms) return;
		let unreadChannels = [];
		for (let dm of dms = BDFDB.ArrayUtils.is(dms) ? dms : (typeof dms == "string" || typeof dms == "number" ? Array.of(dms) : Array.from(dms))) {
			let id = Node.prototype.isPrototypeOf(dm) ? BDFDB.BDFDB.DMUtils.getId(dm) : (dm && typeof dm == "object" ? dm.id : dm);
			if (id) unreadChannels.push(id);
		}
		for (let i in unreadChannels) BDFDB.TimeUtils.timeout(_ => {LibraryModules.AckUtils.ack(unreadChannels[i]);}, i * 1000);
	};

	BDFDB.DataUtils = {};
	BDFDB.DataUtils.cached = window.BDFDB && window.BDFDB.DataUtils && window.BDFDB.DataUtils.cached || {};
	BDFDB.DataUtils.save = function (data, plugin, key, id) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		let pluginName = typeof plugin === "string" ? plugin : plugin.name;
		let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), pluginName + ".config.json");
		
		let config = BDFDB.DataUtils.cached[pluginName] !== undefined ? BDFDB.DataUtils.cached[pluginName] : (InternalBDFDB.readConfig(configPath) || {});
		
		if (key === undefined) config = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
		else {
			if (id === undefined) config[key] = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
			else {
				if (!BDFDB.ObjectUtils.is(config[key])) config[key] = {};
				config[key][id] = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
			}
		}
		
		let configIsObject = BDFDB.ObjectUtils.is(config);
		if (key !== undefined && configIsObject && BDFDB.ObjectUtils.is(config[key]) && BDFDB.ObjectUtils.isEmpty(config[key])) delete config[key];
		if (BDFDB.ObjectUtils.isEmpty(config)) {
			delete BDFDB.DataUtils.cached[pluginName];
			if (LibraryRequires.fs.existsSync(configPath)) LibraryRequires.fs.unlinkSync(configPath);
		}
		else {
			if (configIsObject) config = BDFDB.ObjectUtils.sort(config);
			BDFDB.DataUtils.cached[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
			InternalBDFDB.writeConfig(configPath, config);
		}
	};

	BDFDB.DataUtils.load = function (plugin, key, id) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		let pluginName = typeof plugin === "string" ? plugin : plugin.name;
		let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), pluginName + ".config.json");
		
		let config = BDFDB.DataUtils.cached[pluginName] !== undefined ? BDFDB.DataUtils.cached[pluginName] : (InternalBDFDB.readConfig(configPath) || {});
		let configIsObject = BDFDB.ObjectUtils.is(config);
		BDFDB.DataUtils.cached[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
		
		if (key === undefined) return config;
		else {
			let keydata = configIsObject ? (BDFDB.ObjectUtils.is(config[key]) || config[key] == undefined ? BDFDB.ObjectUtils.deepAssign({}, config[key]) : config[key]) : null;
			if (id === undefined) return keydata;
			else return !BDFDB.ObjectUtils.is(keydata) || keydata[id] === undefined ? null : keydata[id];
		}
	};
	BDFDB.DataUtils.remove = function (plugin, key, id) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		let pluginName = typeof plugin === "string" ? plugin : plugin.name;
		let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), pluginName + ".config.json");
		
		let config = BDFDB.DataUtils.cached[pluginName] !== undefined ? BDFDB.DataUtils.cached[pluginName] : (InternalBDFDB.readConfig(configPath) || {});
		let configIsObject = BDFDB.ObjectUtils.is(config);
		
		if (key === undefined || !configIsObject) config = {};
		else {
			if (id === undefined) delete config[key];
			else if (BDFDB.ObjectUtils.is(config[key])) delete config[key][id];
		}
		
		if (BDFDB.ObjectUtils.is(config[key]) && BDFDB.ObjectUtils.isEmpty(config[key])) delete config[key];
		if (BDFDB.ObjectUtils.isEmpty(config)) {
			delete BDFDB.DataUtils.cached[pluginName];
			if (LibraryRequires.fs.existsSync(configPath)) LibraryRequires.fs.unlinkSync(configPath);
		}
		else {
			if (configIsObject) config = BDFDB.ObjectUtils.sort(config);
			BDFDB.DataUtils.cached[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
			InternalBDFDB.writeConfig(configPath, config);
		}
	};
	BDFDB.DataUtils.get = function (plugin, key, id) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		plugin = typeof plugin == "string" ? BDFDB.BDUtils.getPlugin(plugin) : plugin;
		if (!BDFDB.ObjectUtils.is(plugin)) return id === undefined ? {} : null;
		let defaults = plugin.defaults;
		if (!BDFDB.ObjectUtils.is(defaults) || !defaults[key]) return id === undefined ? {} : null;
		let oldC = BDFDB.DataUtils.load(plugin, key), newC = {}, update = false;
		for (let k in defaults[key]) {
			let isObj = BDFDB.ObjectUtils.is(defaults[key][k].value);
			if (oldC[k] == null || isObj && (!BDFDB.ObjectUtils.is(oldC[k]) || Object.keys(defaults[key][k].value).some(n => defaults[key][k].value[n] != null && !BDFDB.sameProto(defaults[key][k].value[n], oldC[k][n])))) {
				newC[k] = isObj ? BDFDB.ObjectUtils.deepAssign({}, defaults[key][k].value) : defaults[key][k].value;
				update = true;
			}
			else newC[k] = oldC[k];
		}
		if (update) BDFDB.DataUtils.save(newC, plugin, key);
		
		if (id === undefined) return newC;
		else return newC[id] === undefined ? null : newC[id];
	};
	InternalBDFDB.writeConfig = function (path, config) {
		try {LibraryRequires.fs.writeFileSync(path, JSON.stringify(config, null, "	"));}
		catch (err) {}
	};
	InternalBDFDB.readConfig = function (path) {
		try {return JSON.parse(LibraryRequires.fs.readFileSync(path));}
		catch (err) {return {};}
	};
	
	BDFDB.ColorUtils = {};
	BDFDB.ColorUtils.convert = function (color, conv, type) {
		if (BDFDB.ObjectUtils.is(color)) {
			var newColor = {};
			for (let pos in color) newColor[pos] = BDFDB.ColorUtils.convert(color[pos], conv, type);
			return newColor;
		}
		else {
			conv = conv === undefined || !conv ? conv = "RGBCOMP" : conv.toUpperCase();
			type = type === undefined || !type || !["RGB", "RGBA", "RGBCOMP", "HSL", "HSLA", "HSLCOMP", "HEX", "HEXA", "INT"].includes(type.toUpperCase()) ? BDFDB.ColorUtils.getType(color) : type.toUpperCase();
			if (conv == "RGBCOMP") {
				switch (type) {
					case "RGBCOMP":
						if (color.length == 3) return processRGB(color);
						else if (color.length == 4) {
							let a = processA(color.pop());
							return processRGB(color).concat(a);
						}
						break;
					case "RGB":
						return processRGB(color.replace(/\s/g, "").slice(4, -1).split(","));
					case "RGBA":
						let comp = color.replace(/\s/g, "").slice(5, -1).split(",");
						let a = processA(comp.pop());
						return processRGB(comp).concat(a);
					case "HSLCOMP":
						if (color.length == 3) return BDFDB.ColorUtils.convert(`hsl(${processHSL(color).join(",")})`, "RGBCOMP");
						else if (color.length == 4) {
							let a = processA(color.pop());
							return BDFDB.ColorUtils.convert(`hsl(${processHSL(color).join(",")})`, "RGBCOMP").concat(a);
						}
						break;
					case "HSL":
						var hslcomp = processHSL(color.replace(/\s/g, "").slice(4, -1).split(","));
						var r, g, b, m, c, x, p, q;
						var h = hslcomp[0] / 360, l = parseInt(hslcomp[1]) / 100, s = parseInt(hslcomp[2]) / 100; m = Math.floor(h * 6); c = h * 6 - m; x = s * (1 - l); p = s * (1 - c * l); q = s * (1 - (1 - c) * l);
						switch (m % 6) {
							case 0: r = s, g = q, b = x; break;
							case 1: r = p, g = s, b = x; break;
							case 2: r = x, g = s, b = q; break;
							case 3: r = x, g = p, b = s; break;
							case 4: r = q, g = x, b = s; break;
							case 5: r = s, g = x, b = p; break;
						}
						return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
					case "HSLA":
						var hslcomp = color.replace(/\s/g, "").slice(5, -1).split(",");
						return BDFDB.ColorUtils.convert(`hsl(${hslcomp.slice(0, 3).join(",")})`, "RGBCOMP").concat(processA(hslcomp.pop()));
					case "HEX":
						var hex = /^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$|^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
						return [parseInt(hex[1] + hex[1] || hex[4], 16).toString(), parseInt(hex[2] + hex[2] || hex[5], 16).toString(), parseInt(hex[3] + hex[3] || hex[6], 16).toString()];
					case "HEXA":
						var hex = /^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$|^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
						return [parseInt(hex[1] + hex[1] || hex[5], 16).toString(), parseInt(hex[2] + hex[2] || hex[6], 16).toString(), parseInt(hex[3] + hex[3] || hex[7], 16).toString(), Math.floor(BDFDB.NumberUtils.mapRange([0, 255], [0, 100], parseInt(hex[4] + hex[4] || hex[8], 16).toString()))/100];
					case "INT":
						color = processINT(color);
						return [(color >> 16 & 255).toString(), (color >> 8 & 255).toString(), (color & 255).toString()];
					default:
						return null;
				}
			}
			else {
				if (conv && type && conv.indexOf("HSL") == 0 && type.indexOf("HSL") == 0) {
					if (type == "HSLCOMP") {
						switch (conv) {
							case "HSLCOMP":
								if (color.length == 3) return processHSL(color);
								else if (color.length == 4) {
									var a = processA(color.pop());
									return processHSL(color).concat(a);
								}
								break;
							case "HSL":
								return `hsl(${processHSL(color.slice(0, 3)).join(",")})`;
							case "HSLA":
								color = color.slice(0, 4);
								var a = color.length == 4 ? processA(color.pop()) : 1;
								return `hsla(${processHSL(color).concat(a).join(",")})`;
						}
					}
					else return BDFDB.ColorUtils.convert(color.replace(/\s/g, "").slice(color.toLowerCase().indexOf("hsla") == 0 ? 5 : 4, -1).split(","), conv, "HSLCOMP");
				}
				else {
					let rgbcomp = type == "RGBCOMP" ? color : BDFDB.ColorUtils.convert(color, "RGBCOMP", type);
					if (rgbcomp) switch (conv) {
						case "RGB":
							return `rgb(${processRGB(rgbcomp.slice(0, 3)).join(",")})`;
						case "RGBA":
							rgbcomp = rgbcomp.slice(0, 4);
							var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : 1;
							return `rgba(${processRGB(rgbcomp).concat(a).join(",")})`;
						case "HSLCOMP":
							var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : null;
							var hslcomp = processHSL(BDFDB.ColorUtils.convert(rgbcomp, "HSL").replace(/\s/g, "").split(","));
							return a != null ? hslcomp.concat(a) : hslcomp;
						case "HSL":
							var r = processC(rgbcomp[0]), g = processC(rgbcomp[1]), b = processC(rgbcomp[2]);
							var max = Math.max(r, g, b), min = Math.min(r, g, b), dif = max - min, h, l = max === 0 ? 0 : dif / max, s = max / 255;
							switch (max) {
								case min: h = 0; break;
								case r: h = g - b + dif * (g < b ? 6 : 0); h /= 6 * dif; break;
								case g: h = b - r + dif * 2; h /= 6 * dif; break;
								case b: h = r - g + dif * 4; h /= 6 * dif; break;
							}
							return `hsl(${processHSL([Math.round(h * 360), l * 100, s * 100]).join(",")})`;
						case "HSLA":
							var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : 1;
							return `hsla(${BDFDB.ColorUtils.convert(rgbcomp, "HSL").slice(4, -1).split(",").concat(a).join(",")})`;
						case "HEX":
							return ("#" + (0x1000000 + (rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16)).toString(16).slice(1)).toUpperCase();
						case "HEXA":
							return ("#" + (0x1000000 + (rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16)).toString(16).slice(1) + (0x100 + Math.round(BDFDB.NumberUtils.mapRange([0, 100], [0, 255], processA(rgbcomp[3]) * 100))).toString(16).slice(1)).toUpperCase();
						case "INT":
							return processINT(rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16);
						default:
							return null;
					}
				}
			}
		}
		return null;
		function processC(c) {if (c == null) {return 255;} else {c = parseInt(c.toString().replace(/[^0-9\-]/g, ""));return isNaN(c) || c > 255 ? 255 : c < 0 ? 0 : c;}};
		function processRGB(comp) {return comp.map(c => {return processC(c);});};
		function processA(a) {if (a == null) {return 1;} else {a = a.toString();a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));return isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;}};
		function processSL(sl) {if (sl == null) {return "100%";} else {sl = parseFloat(sl.toString().replace(/[^0-9\.\-]/g, ""));return (isNaN(sl) || sl > 100 ? 100 : sl < 0 ? 0 : sl) + "%";}};
		function processHSL(comp) {let h = parseFloat(comp.shift().toString().replace(/[^0-9\.\-]/g, ""));h = isNaN(h) || h > 360 ? 360 : h < 0 ? 0 : h;return [h].concat(comp.map(sl => {return processSL(sl);}));};
		function processINT(c) {if (c == null) {return 16777215;} else {c = parseInt(c.toString().replace(/[^0-9]/g, ""));return isNaN(c) || c > 16777215 ? 16777215 : c < 0 ? 0 : c;}};
	};
	BDFDB.ColorUtils.setAlpha = function (color, a, conv) {
		if (BDFDB.ObjectUtils.is(color)) {
			var newcolor = {};
			for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.setAlpha(color[pos], a, conv);
			return newcolor;
		}
		else {
			var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
			if (comp) {
				a = a.toString();
				a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));
				a = isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;
				comp[3] = a;
				conv = (conv || BDFDB.ColorUtils.getType(color)).toUpperCase();
				conv = conv == "RGB" || conv == "HSL" || conv == "HEX" ? conv + "A" : conv;
				return BDFDB.ColorUtils.convert(comp, conv);
			}
		}
		return null;
	};
	BDFDB.ColorUtils.getAlpha = function (color) {
		var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
		if (comp) {
			if (comp.length == 3) return 1;
			else if (comp.length == 4) {
				let a = comp[3].toString();
				a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));
				return isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;
			}
		}
		return null;
	};
	BDFDB.ColorUtils.change = function (color, value, conv) {
		value = parseFloat(value);
		if (color != null && typeof value == "number" && !isNaN(value)) {
			if (BDFDB.ObjectUtils.is(color)) {
				var newcolor = {};
				for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.change(color[pos], value, conv);
				return newcolor;
			}
			else {
				var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
				if (comp) {
					if (parseInt(value) !== value) {
						value = value.toString();
						value = (value.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(value.replace(/[^0-9\.\-]/g, ""));
						value = isNaN(value) ? 0 : value;
						return BDFDB.ColorUtils.convert([Math.round(comp[0] * (1 + value)), Math.round(comp[1] * (1 + value)), Math.round(comp[2] * (1 + value))], conv || BDFDB.ColorUtils.getType(color));
					}
					else return BDFDB.ColorUtils.convert([Math.round(comp[0] + value), Math.round(comp[1] + value), Math.round(comp[2] + value)], conv || BDFDB.ColorUtils.getType(color));
				}
			}
		}
		return null;
	};
	BDFDB.ColorUtils.invert = function (color, conv) {
		if (BDFDB.ObjectUtils.is(color)) {
			var newcolor = {};
			for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.invert(color[pos], conv);
			return newcolor;
		}
		else {
			var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
			if (comp) return BDFDB.ColorUtils.convert([255 - comp[0], 255 - comp[1], 255 - comp[2]], conv || BDFDB.ColorUtils.getType(color));
		}
		return null;
	};
	BDFDB.ColorUtils.compare = function (color1, color2) {
		if (color1 && color2) {
			color1 = BDFDB.ColorUtils.convert(color1, "RGBA");
			color2 = BDFDB.ColorUtils.convert(color2, "RGBA");
			if (color1 && color2) return BDFDB.equals(color1, color2);
		}
		return null;
	};
	BDFDB.ColorUtils.isBright = function (color, compare = 160) {
		color = BDFDB.ColorUtils.convert(color, "RGBCOMP");
		if (!color) return false;
		return parseInt(compare) < Math.sqrt(0.299 * color[0]**2 + 0.587 * color[1]**2 + 0.144 * color[2]**2);
	};
	BDFDB.ColorUtils.getType = function (color) {
		if (color != null) {
			if (typeof color === "object" && (color.length == 3 || color.length == 4)) {
				if (isRGB(color)) return "RGBCOMP";
				else if (isHSL(color)) return "HSLCOMP";
			}
			else if (typeof color === "string") {
				if (/^#[a-f\d]{3}$|^#[a-f\d]{6}$/i.test(color)) return "HEX";
				else if (/^#[a-f\d]{4}$|^#[a-f\d]{8}$/i.test(color)) return "HEXA";
				else {
					color = color.toUpperCase();
					var comp = color.replace(/[^0-9\.\-\,\%]/g, "").split(",");
					if (color.indexOf("RGB(") == 0 && comp.length == 3 && isRGB(comp)) return "RGB";
					else if (color.indexOf("RGBA(") == 0 && comp.length == 4 && isRGB(comp)) return "RGBA";
					else if (color.indexOf("HSL(") == 0 && comp.length == 3 && isHSL(comp)) return "HSL";
					else if (color.indexOf("HSLA(") == 0 && comp.length == 4 && isHSL(comp)) return "HSLA";
				}
			}
			else if (typeof color === "number" && parseInt(color) == color && color > -1 && color < 16777216) return "INT";
		}
		return null;
		function isRGB(comp) {return comp.slice(0, 3).every(rgb => rgb.toString().indexOf("%") == -1 && parseFloat(rgb) == parseInt(rgb));};
		function isHSL(comp) {return comp.slice(1, 3).every(hsl => hsl.toString().indexOf("%") == hsl.length - 1);};
	};
	BDFDB.ColorUtils.createGradient = function (colorobj, direction = "to right") {
		var sortedgradient = {};
		var gradientstring = "linear-gradient(" + direction;
		for (let pos of Object.keys(colorobj).sort()) {
			let color = BDFDB.ColorUtils.convert(colorobj[pos], "RGBA");
			gradientstring += color ? `, ${color} ${pos*100}%` : ''
		}
		return gradientstring += ")";
	};
	BDFDB.ColorUtils.getSwatchColor = function (container, number) {
		if (!Node.prototype.isPrototypeOf(container)) return;
		let swatches = container.querySelector(`${BDFDB.dotCN.colorpickerswatches}[number="${number}"], ${BDFDB.dotCN.colorpickerswatch}[number="${number}"]`);
		if (!swatches) return null;
		return BDFDB.ColorUtils.convert(BDFDB.ReactUtils.findValue(BDFDB.ReactUtils.getInstance(swatches), "selectedColor", {up:true, blacklist:{"props":true}}));
	};

	BDFDB.DOMUtils = {};
	BDFDB.DOMUtils.getSelection = function () {
		let selection = document.getSelection();
		return selection && selection.anchorNode ? selection.getRangeAt(0).toString() : "";
	};
	BDFDB.DOMUtils.addClass = function (eles, ...classes) {
		if (!eles || !classes) return;
		for (let ele of [eles].flat(10).filter(n => n)) {
			if (Node.prototype.isPrototypeOf(ele)) add(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) add(e);
			else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) add(n);
		}
		function add(node) {
			if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.add(c);
		}
	};
	BDFDB.DOMUtils.removeClass = function (eles, ...classes) {
		if (!eles || !classes) return;
		for (let ele of [eles].flat(10).filter(n => n)) {
			if (Node.prototype.isPrototypeOf(ele)) remove(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) remove(e);
			else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) remove(n);
		}
		function remove(node) {
			if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.remove(c);
		}
	};
	BDFDB.DOMUtils.toggleClass = function (eles, ...classes) {
		if (!eles || !classes) return;
		var force = classes.pop();
		if (typeof force != "boolean") {
			classes.push(force);
			force = undefined;
		}
		if (!classes.length) return;
		for (let ele of [eles].flat(10).filter(n => n)) {
			if (!ele) {}
			else if (Node.prototype.isPrototypeOf(ele)) toggle(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) toggle(e);
			else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) toggle(n);
		}
		function toggle(node) {
			if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.toggle(c, force);
		}
	};
	BDFDB.DOMUtils.containsClass = function (eles, ...classes) {
		if (!eles || !classes) return;
		let all = classes.pop();
		if (typeof all != "boolean") {
			classes.push(all);
			all = true;
		}
		if (!classes.length) return;
		let contained = undefined;
		for (let ele of BDFDB.ArrayUtils.is(eles) ? eles : Array.of(eles)) {
			if (!ele) {}
			else if (Node.prototype.isPrototypeOf(ele)) contains(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) contains(e);
			else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) for (let n of document.querySelectorAll(c)) contains(n);
		}
		return contained;
		function contains(node) {
			if (node && node.classList) for (let cla of classes) if (typeof cla == "string") for (let c of cla.split(" ")) if (c) {
				if (contained === undefined) contained = all;
				if (all && !node.classList.contains(c)) contained = false;
				if (!all && node.classList.contains(c)) contained = true;
			}
		}
	};
	BDFDB.DOMUtils.replaceClass = function (eles, oldclass, newclass) {
		if (!eles || typeof oldclass != "string" || typeof newclass != "string") return;
		for (let ele of [eles].flat(10).filter(n => n)) {
			if (Node.prototype.isPrototypeOf(ele)) replace(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) replace(e);
			else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) replace(n);
		}
		function replace(node) {
			if (node && node.tagName && node.className) node.className = node.className.replace(new RegExp(oldclass, "g"), newclass).trim();
		}
	};
	BDFDB.DOMUtils.formatClassName = function (...classes) {
		return BDFDB.ArrayUtils.removeCopies(classes.flat(10).filter(n => n).join(" ").split(" ")).join(" ").trim();
	};
	BDFDB.DOMUtils.removeClassFromDOM = function (...classes) {
		for (let c of classes.flat(10).filter(n => n)) if (typeof c == "string") for (let a of c.split(",")) if (a && (a = a.replace(/\.|\s/g, ""))) BDFDB.DOMUtils.removeClass(document.querySelectorAll("." + a), a);
	};
	BDFDB.DOMUtils.show = function (...eles) {
		BDFDB.DOMUtils.toggle(...eles, true);
	};
	BDFDB.DOMUtils.hide = function (...eles) {
		BDFDB.DOMUtils.toggle(...eles, false);
	};
	BDFDB.DOMUtils.toggle = function (...eles) {
		if (!eles) return;
		let force = eles.pop();
		if (typeof force != "boolean") {
			eles.push(force);
			force = undefined;
		}
		if (!eles.length) return;
		for (let ele of eles.flat(10).filter(n => n)) {
			if (Node.prototype.isPrototypeOf(ele)) toggle(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let node of ele) toggle(node);
			else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) for (let node of document.querySelectorAll(c)) toggle(node);
		}
		function toggle(node) {
			if (!node || !Node.prototype.isPrototypeOf(node)) return;
			let hidden = force === undefined ? !BDFDB.DOMUtils.isHidden(node) : !force;
			if (hidden) {
				let display = node.style.getPropertyValue("display");
				if (display && display != "none") node.BDFDBhideDisplayState = {
					display: display,
					important: (` ${node.style.cssText} `.split(` display: ${display}`)[1] || "").trim().indexOf("!important") == 0
				};
				node.style.setProperty("display", "none", "important");
			}
			else {
				if (node.BDFDBhideDisplayState) {
					node.style.setProperty("display", node.BDFDBhideDisplayState.display, node.BDFDBhideDisplayState.important ? "important" : "");
					delete node.BDFDBhideDisplayState;
				}
				else node.style.removeProperty("display");
			}
		}
	};
	BDFDB.DOMUtils.isHidden = function (node) {
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) return getComputedStyle(node, null).getPropertyValue("display") == "none";
	};
	BDFDB.DOMUtils.remove = function (...eles) {
		for (let ele of eles.flat(10).filter(n => n)) {
			if (Node.prototype.isPrototypeOf(ele)) ele.remove();
			else if (NodeList.prototype.isPrototypeOf(ele)) {
				let nodes = Array.from(ele);
				while (nodes.length) nodes.shift().remove();
			}
			else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) {
				let nodes = Array.from(document.querySelectorAll(c));
				while (nodes.length) nodes.shift().remove();
			}
		}
	};
	BDFDB.DOMUtils.create = function (html) {
		if (typeof html != "string" || !html.trim()) return null;
		let template = document.createElement("template");
		try {template.innerHTML = html.replace(/(?<!pre)>[\t\r\n]+<(?!pre)/g, "><");}
		catch (err) {template.innerHTML = html.replace(/>[\t\r\n]+<(?!pre)/g, "><");}
		if (template.content.childNodes.length == 1) return template.content.firstElementChild;
		else {
			let wrapper = document.createElement("span");
			let nodes = Array.from(template.content.childNodes);
			while (nodes.length) wrapper.appendChild(nodes.shift());
			return wrapper;
		}
	};
	BDFDB.DOMUtils.getParent = function (listOrSelector, node) {
		let parent = null;
		if (Node.prototype.isPrototypeOf(node) && listOrSelector) {
			let list = NodeList.prototype.isPrototypeOf(listOrSelector) ? listOrSelector : typeof listOrSelector == "string" ? document.querySelectorAll(listOrSelector) : null;
			if (list) for (let listNode of list) if (listNode.contains(node)) {
				parent = listNode;
				break;
			}
		}
		return parent;
	};
	BDFDB.DOMUtils.setText = function (node, stringOrNode) {
		if (!node || !Node.prototype.isPrototypeOf(node)) return;
		let textnode = node.nodeType == Node.TEXT_NODE ? node : null;
		if (!textnode) for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE || BDFDB.DOMUtils.containsClass(child, "BDFDB-textnode")) {
			textnode = child;
			break;
		}
		if (textnode) {
			if (Node.prototype.isPrototypeOf(stringOrNode) && stringOrNode.nodeType != Node.TEXT_NODE) {
				BDFDB.DOMUtils.addClass(stringOrNode, "BDFDB-textnode");
				node.replaceChild(stringOrNode, textnode);
			}
			else if (Node.prototype.isPrototypeOf(textnode) && textnode.nodeType != Node.TEXT_NODE) node.replaceChild(document.createTextNode(stringOrNode), textnode);
			else textnode.textContent = stringOrNode;
		}
		else node.appendChild(Node.prototype.isPrototypeOf(stringOrNode) ? stringOrNode : document.createTextNode(stringOrNode));
	};
	BDFDB.DOMUtils.getText = function (node) {
		if (!node || !Node.prototype.isPrototypeOf(node)) return;
		for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE) return child.textContent;
	};
	BDFDB.DOMUtils.getRects = function (node) {
		let rects = {};
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
			let hideNode = node;
			while (hideNode) {
				let hidden = BDFDB.DOMUtils.isHidden(hideNode);
				if (hidden) {
					BDFDB.DOMUtils.toggle(hideNode, true);
					hideNode.BDFDBgetRectsHidden = true;
				}
				hideNode = hideNode.parentElement;
			}
			rects = node.getBoundingClientRect();
			hideNode = node;
			while (hideNode) {
				if (hideNode.BDFDBgetRectsHidden) {
					BDFDB.DOMUtils.toggle(hideNode, false);
					delete hideNode.BDFDBgetRectsHidden;
				}
				hideNode = hideNode.parentElement;
			}
		}
		return rects;
	};
	BDFDB.DOMUtils.getHeight = function (node) {
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
			let rects = BDFDB.DOMUtils.getRects(node);
			let style = getComputedStyle(node);
			return rects.height + parseInt(style.marginTop) + parseInt(style.marginBottom);
		}
		return 0;
	};
	BDFDB.DOMUtils.getInnerHeight = function (node) {
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
			let rects = BDFDB.DOMUtils.getRects(node);
			let style = getComputedStyle(node);
			return rects.height - parseInt(style.paddingTop) - parseInt(style.paddingBottom);
		}
		return 0;
	};
	BDFDB.DOMUtils.getWidth = function (node) {
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
			let rects = BDFDB.DOMUtils.getRects(node);
			let style = getComputedStyle(node);
			return rects.width + parseInt(style.marginLeft) + parseInt(style.marginRight);
		}
		return 0;
	};
	BDFDB.DOMUtils.getInnerWidth = function (node) {
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
			let rects = BDFDB.DOMUtils.getRects(node);
			let style = getComputedStyle(node);
			return rects.width - parseInt(style.paddingLeft) - parseInt(style.paddingRight);
		}
		return 0;
	};
	BDFDB.DOMUtils.appendWebScript = function (url, container) {
		if (!container && !document.head.querySelector("bd-head bd-scripts")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-scripts></bd-scripts></bd-head>`));
		container = container || document.head.querySelector("bd-head bd-scripts") || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.DOMUtils.removeWebScript(url, container);
		let script = document.createElement("script");
		script.src = url;
		container.appendChild(script);
	};
	BDFDB.DOMUtils.removeWebScript = function (url, container) {
		container = container || document.head.querySelector("bd-head bd-scripts") || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.DOMUtils.remove(container.querySelectorAll(`script[src="${url}"]`));
	};
	BDFDB.DOMUtils.appendWebStyle = function (url, container) {
		if (!container && !document.head.querySelector("bd-head bd-styles")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-styles></bd-styles></bd-head>`));
		container = container || document.head.querySelector("bd-head bd-styles") || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.DOMUtils.removeWebStyle(url, container);
		container.appendChild(BDFDB.DOMUtils.create(`<link type="text/css" rel="Stylesheet" href="${url}"></link>`));
	};
	BDFDB.DOMUtils.removeWebStyle = function (url, container) {
		container = container || document.head.querySelector("bd-head bd-styles") || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.DOMUtils.remove(container.querySelectorAll(`link[href="${url}"]`));
	};
	BDFDB.DOMUtils.appendLocalStyle = function (id, css, container) {
		if (!container && !document.head.querySelector("bd-head bd-styles")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-styles></bd-styles></bd-head>`));
		container = container || document.head.querySelector("bd-head bd-styles") || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.DOMUtils.removeLocalStyle(id, container);
		container.appendChild(BDFDB.DOMUtils.create(`<style id="${id}CSS">${css.replace(/\t|\r|\n/g,"")}</style>`));
	};
	BDFDB.DOMUtils.removeLocalStyle = function (id, container) {
		container = container || document.head.querySelector("bd-head bd-styles") || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.DOMUtils.remove(container.querySelectorAll(`style[id="${id}CSS"]`));
	};
	
	BDFDB.ModalUtils = {};
	BDFDB.ModalUtils.open = function (plugin, config) {
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(config)) return;
		let modal, modalInstance, modalProps, cancels = [], closeModal = _ => {
			if (BDFDB.ObjectUtils.is(modalProps) && typeof modalProps.onClose == "function") modalProps.onClose();
		};
		let headerChildren = [], contentChildren = [], footerChildren = [];
		if (typeof config.text == "string") {
			contentChildren.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
				children: config.text
			}));
		}
		if (config.children) {
			let tabBarItems = [];
			for (let child of [config.children].flat(10).filter(n => n)) if (LibraryModules.React.isValidElement(child)) {
				if (child.type == InternalComponents.LibraryComponents.ModalComponents.ModalTabContent) {
					if (!tabBarItems.length) child.props.open = true;
					else delete child.props.open;
					tabBarItems.push({value:child.props.tab});
				}
				contentChildren.push(child);
			}
			if (tabBarItems.length) headerChildren.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
				className: BDFDB.disCN.tabbarcontainer,
				align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
				children: [
					BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TabBar, {
						className: BDFDB.disCN.tabbar,
						itemClassName: BDFDB.disCN.tabbaritem,
						type: InternalComponents.LibraryComponents.TabBar.Types.TOP,
						items: tabBarItems,
						onItemSelect: (value, instance) => {
							let tabContentInstances = BDFDB.ReactUtils.findOwner(modal, {name:"BDFDB_ModalTabContent", all:true, unlimited:true});
							for (let ins of tabContentInstances) {
								if (ins.props.tab == value) ins.props.open = true;
								else delete ins.props.open;
							}
							BDFDB.ReactUtils.forceUpdate(tabContentInstances);
						}
					}),
					config.tabBarChildren
				].flat(10).filter(n => n)
			}));
		}
		if (BDFDB.ArrayUtils.is(config.buttons)) for (let button of config.buttons) {
			let contents = typeof button.contents == "string" && button.contents;
			if (contents) {
				let color = typeof button.color == "string" && InternalComponents.LibraryComponents.Button.Colors[button.color.toUpperCase()];
				let look = typeof button.look == "string" && InternalComponents.LibraryComponents.Button.Looks[button.look.toUpperCase()];
				let click = typeof button.click == "function" ? button.click : (typeof button.onClick == "function" ? button.onClick : _ => {});
				
				if (button.cancel) cancels.push(click);
				
				footerChildren.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Button, BDFDB.ObjectUtils.exclude(Object.assign({}, button, {
					look: look || (color ? InternalComponents.LibraryComponents.Button.Looks.FILLED : InternalComponents.LibraryComponents.Button.Looks.LINK),
					color: color || InternalComponents.LibraryComponents.Button.Colors.PRIMARY,
					onClick: _ => {
						if (button.close) closeModal();
						if (!(button.close && button.cancel)) click(modal, modalInstance);
					},
					children: contents
				}), "click", "close", "cancel", "contents")));
			}
		}
		contentChildren = contentChildren.concat(config.contentChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
		headerChildren = headerChildren.concat(config.headerChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
		footerChildren = footerChildren.concat(config.footerChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
		if (contentChildren.length) {
			if (typeof config.onClose != "function") config.onClose = _ => {};
			if (typeof config.onOpen != "function") config.onOpen = _ => {};
			
			let name = plugin.name || (typeof plugin.getName == "function" ? plugin.getName() : null);
			name = typeof name == "string" ? name : null;
			let oldTransitionState = 0;
			LibraryModules.ModalUtils.openModal(props => {
				modalProps = props;
				return BDFDB.ReactUtils.createElement(class BDFDB_Modal extends LibraryModules.React.Component {
					render () {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalRoot, {
							className: BDFDB.DOMUtils.formatClassName(name && `${name}-modal`, BDFDB.disCN.modalwrapper, config.className),
							size: typeof config.size == "string" && InternalComponents.LibraryComponents.ModalComponents.ModalSize[config.size.toUpperCase()] || InternalComponents.LibraryComponents.ModalComponents.ModalSize.SMALL,
							transitionState: props.transitionState,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalHeader, {
									className: BDFDB.DOMUtils.formatClassName(config.headerClassName, config.shade && BDFDB.disCN.modalheadershade, headerChildren.length && BDFDB.disCN.modalheaderhassibling),
									separator: config.headerSeparator || false,
									children: [
										BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
											children: [
												BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
													tag: InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H4,
													children: config.header
												}),
												BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
													size: InternalComponents.LibraryComponents.TextElement.Sizes.SIZE_12,
													children: typeof config.subheader == "string" || BDFDB.ReactUtils.isValidElement(config.subheader) ? config.subheader : (name || "")
												})
											]
										}),
										BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalCloseButton, {
											onClick: closeModal
										})
									]
								}),
								headerChildren.length ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									grow: 0,
									shrink: 0,
									children: headerChildren
								}) : null,
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalContent, {
									className: config.contentClassName,
									scroller: config.scroller,
									direction: config.direction,
									content: config.content,
									children: contentChildren
								}),
								footerChildren.length ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalFooter, {
									className: config.footerClassName,
									children: footerChildren
								}) : null
							]
						});
					}
					componentDidMount () {
						modalInstance = this;
						modal = BDFDB.ReactUtils.findDOMNode(this);
						modal = modal && modal.parentElement ? modal.parentElement.querySelector(BDFDB.dotCN.modalwrapper) : null;
						if (modal && props.transitionState == 1 && props.transitionState > oldTransitionState) config.onOpen(modal, this);
						oldTransitionState = props.transitionState;
					}
					componentWillUnmount () {
						if (modal && props.transitionState == 3) {
							for (let cancel of cancels) cancel(modal);
							config.onClose(modal, this);
						}
					}
				}, props, true);
			}, {
				onCloseRequest: closeModal
			});
		}
	};
	BDFDB.ModalUtils.confirm = function (plugin, text, callback) {
		if (!BDFDB.ObjectUtils.is(plugin) || typeof text != "string") return;
		BDFDB.ModalUtils.open(plugin, {text, header:"Are you sure?", className:BDFDB.disCN.modalconfirmmodal, scroller:false, buttons:[
			{contents: BDFDB.LanguageUtils.LanguageStrings.OKAY, close:true, color:"RED", click:typeof callback == "function" ? callback : _ => {}},
			{contents: BDFDB.LanguageUtils.LanguageStrings.CANCEL, close:true}
		]});
	};
	
	const RealMenuItems = BDFDB.ModuleUtils.findByProperties("MenuItem", "MenuGroup");
	BDFDB.ContextMenuUtils = {};
	BDFDB.ContextMenuUtils.open = function (plugin, e, children) {
		LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
			return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Menu, {
				navId: "bdfdb-context",
				onClose: BDFDB.LibraryModules.ContextMenuUtils.closeContextMenu,
				children: children
			}, true);
		});
	};
	BDFDB.ContextMenuUtils.close = function (nodeOrInstance) {
		if (!BDFDB.ObjectUtils.is(nodeOrInstance)) return;
		let instance = BDFDB.ReactUtils.findOwner(nodeOrInstance, {props:"closeContextMenu", up:true});
		if (BDFDB.ObjectUtils.is(instance) && instance.props && typeof instance.props.closeContextMenu == "function") instance.props.closeContextMenu();
		else BDFDB.LibraryModules.ContextMenuUtils.closeContextMenu();
	};
	BDFDB.ContextMenuUtils.createItem = function (component, props = {}) {
		if (!component) return null;
		else {
			if (props.persisting || BDFDB.ObjectUtils.is(props.popoutProps) || (typeof props.color == "string" && !BDFDB.DiscordClasses[`menu${props.color.toLowerCase()}`])) component = InternalComponents.MenuItem;
			if (BDFDB.ObjectUtils.toArray(RealMenuItems).some(c => c == component)) return BDFDB.ReactUtils.createElement(component, props);
			else return BDFDB.ReactUtils.createElement(RealMenuItems.MenuItem, {
				id: props.id,
				disabled: props.disabled,
				render: menuItemProps => {
					if (!props.state) props.state = BDFDB.ObjectUtils.extract(props, "checked", "value");
					return BDFDB.ReactUtils.createElement(component, Object.assign(props, menuItemProps, {color: props.color}), true);
				}
			});
		}
	};
	BDFDB.ContextMenuUtils.createItemId = function (...strings) {
		return strings.map(s => typeof s == "number" ? s.toString() : s).filter(s => typeof s == "string").map(s => s.toLowerCase().replace(/\s/, "-")).join("-");
	};
	BDFDB.ContextMenuUtils.findItem = function (returnvalue, config) {
		if (!returnvalue || !BDFDB.ObjectUtils.is(config) || !config.label && !config.id) return [null, -1];
		config.label = config.label && [config.label].flat().filter(n => n);
		config.id = config.id && [config.id].flat().filter(n => n);
		let contextMenu = BDFDB.ReactUtils.findChild(returnvalue, {props: "navId"});
		if (contextMenu) {
			for (let i in contextMenu.props.children) {
				if (contextMenu.props.children[i] && contextMenu.props.children[i].type == RealMenuItems.MenuGroup) {
					if (BDFDB.ArrayUtils.is(contextMenu.props.children[i].props.children)) {
						for (let j in contextMenu.props.children[i].props.children) if (check(contextMenu.props.children[i].props.children[j])) {
							if (config.group) return [contextMenu.props.children, parseInt(i)];
							else return [contextMenu.props.children[i].props.children, parseInt(j)];
						}
					}
					else if (contextMenu.props.children[i] && contextMenu.props.children[i].props) {
						if (check(contextMenu.props.children[i].props.children)) {
							if (config.group) return [contextMenu.props.children, parseInt(i)];
							else {
								contextMenu.props.children[i].props.children = [contextMenu.props.children[i].props.children];
								return [contextMenu.props.children[i].props.children, 0];
							}
						}
						else if (contextMenu.props.children[i].props.children && contextMenu.props.children[i].props.children.props && BDFDB.ArrayUtils.is(contextMenu.props.children[i].props.children.props.children)) {
							for (let j in contextMenu.props.children[i].props.children.props.children) if (check(contextMenu.props.children[i].props.children.props.children[j])) {
								if (config.group) return [contextMenu.props.children, parseInt(i)];
								else return [contextMenu.props.children[i].props.children.props.children, parseInt(j)];
							}
						}
					}
				}
				else if (check(contextMenu.props.children[i])) return [contextMenu.props.children, parseInt(i)];
			}
			return [contextMenu.props.children, -1];
		}
		return [null, -1];
		function check (child) {
			if (!child) return false;
			let props = child.stateNode ? child.stateNode.props : child.props;
			if (!props) return false;
			return config.id && config.id.some(key => props.id == key) || config.label && config.label.some(key => props.label == key);
		}
	};

	BDFDB.TimeUtils = {};
	BDFDB.TimeUtils.interval = function (callback, delay, ...args) {
		if (typeof callback != "function" || typeof delay != "number" || delay < 1) return;
		else {
			let count = 0, interval = setInterval(_ => {BDFDB.TimeUtils.suppress(callback, "Interval")(...[interval, count++, args].flat());}, delay);
			return interval;
		}
	};
	BDFDB.TimeUtils.timeout = function (callback, delay, ...args) {
		if (typeof callback != "function") return;
		else if (typeof delay != "number" || delay < 1) {
			let immediate = setImmediate(_ => {BDFDB.TimeUtils.suppress(callback, "Immediate")(...[immediate, args].flat());});
			return immediate;
		}
		else {
			let timeout = setTimeout(_ => {BDFDB.TimeUtils.suppress(callback, "Timeout")(...[timeout, args].flat());}, delay);
			return timeout;
		}
	};
	BDFDB.TimeUtils.clear = function (...timeObjects) {
		for (let t of timeObjects.flat(10).filter(n => n)) {
			if (typeof t == "number") {
				clearInterval(t);
				clearTimeout(t);
			}
			else if (typeof t == "object") clearImmediate(t);
		}
	};
	BDFDB.TimeUtils.suppress = function (callback, string, name) {return function (...args) {
		try {return callback(...args);}
		catch (err) {BDFDB.LogUtils.error((typeof string == "string" && string || "") + " " + err, name);}
	}};

	BDFDB.StringUtils = {};
	BDFDB.StringUtils.htmlEscape = function (string) {
		let ele = document.createElement("div");
		ele.innerText = string;
		return ele.innerHTML;
	};
	BDFDB.StringUtils.regEscape = function (string) {
		return typeof string == "string" && string.replace(/([\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}])/g, "\\$1");
	};
	BDFDB.StringUtils.insertNRST = function (string) {
		return typeof string == "string" && string.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\s/g, " ");
	};
	BDFDB.StringUtils.highlight = function (string, searchstring, prefix = `<span class="${BDFDB.disCN.highlight}">`, suffix = `</span>`) {
		if (typeof string != "string" || !searchstring || searchstring.length < 1) return string;
		let offset = 0, original = string;
		BDFDB.ArrayUtils.getAllIndexes(string.toUpperCase(), searchstring.toUpperCase()).forEach(index => {
			let d1 = offset * (prefix.length + suffix.length);
			index = index + d1;
			let d2 = index + searchstring.length;
			let d3 = [-1].concat(BDFDB.ArrayUtils.getAllIndexes(string.substring(0, index), "<"));
			let d4 = [-1].concat(BDFDB.ArrayUtils.getAllIndexes(string.substring(0, index), ">"));
			if (d3[d3.length - 1] > d4[d4.length - 1]) return;
			string = string.substring(0, index) + prefix + string.substring(index, d2) + suffix + string.substring(d2);
			offset++;
		});
		return string || original;
	};
	BDFDB.StringUtils.extractSelection = function (original, selection) {
		if (typeof original != "string") return "";
		if (typeof selection != "string") return original;
		let s = [], f = [], wrong = 0, canceled = false, done = false;
		for (let i of BDFDB.ArrayUtils.getAllIndexes(original, selection[0])) if (!done) {
			while (i <= original.length && !done) {
				let subSelection = selection.slice(s.filter(n => n != undefined).length);
				if (!subSelection && s.length - 20 <= selection.length) done = true;
				else for (let j in subSelection) if (!done && !canceled) {
					if (original[i] == subSelection[j]) {
						s[i] = subSelection[j];
						f[i] = subSelection[j];
						wrong = 0;
						if (i == original.length) done = true;
					}
					else {
						s[i] = null;
						f[i] = original[i];
						wrong++;
						if (wrong > 4) {
							s = [], f = [], wrong = 0, canceled = true;
							break;
						}
					}
					break;
				}
				canceled = false;
				i++;
			}
		}
		if (s.filter(n => n).length) {
			let reverseS = [].concat(s).reverse(), i = 0, j = 0;
			for (let k in s) {
				if (s[k] == null) i = parseInt(k) + 1;
				else break;
			}
			for (let k in reverseS) {
				if (reverseS[k] == null) j = parseInt(k) + 1;
				else break;
			}
			return f.slice(i, f.length - j).join("");
		}
		else return original;
	};
	
	BDFDB.SlateUtils = {};
	BDFDB.SlateUtils.isRichValue = function (richValue) {
		return BDFDB.ObjectUtils.is(richValue) && LibraryModules.SlateUtils.deserialize("").constructor.prototype.isPrototypeOf(richValue);
	};
	BDFDB.SlateUtils.copyRichValue = function (string, richValue) {
		let newRichValue = LibraryModules.SlateUtils.deserialize(string);
		if (BDFDB.SlateUtils.isRichValue(richValue) && richValue._map && richValue._map._root && BDFDB.ArrayUtils.is(richValue._map._root.entries)) {
			for (let i in richValue._map._root.entries) if (richValue._map._root.entries[i][0] == "selection") {
				newRichValue._map._root.entries[i] = richValue._map._root.entries[i];
				break;
			}
		}
		return newRichValue;
	};
	BDFDB.SlateUtils.hasOpenPlainTextCodeBlock = function (editor) {
		let richValue = BDFDB.ReactUtils.getValue(editor, "props.richValue");
		if (!BDFDB.SlateUtils.isRichValue(richValue)) return false;
		let codeMatches = BDFDB.LibraryModules.SlateSelectionUtils.serializeSelection(richValue.document, {
			start: {
				key: richValue.document.getFirstText().key,
				offset: 0
			},
			end: richValue.selection.start
		}, "raw").match(/```/g);
		return codeMatches && codeMatches.length && codeMatches.length % 2 != 0;
	};
	BDFDB.SlateUtils.getCurrentWord = function (editor) {
		let richValue = BDFDB.ReactUtils.getValue(editor, "props.richValue");
		if (!BDFDB.SlateUtils.isRichValue(richValue) || !richValue.selection.isCollapsed || BDFDB.SlateUtils.hasOpenPlainTextCodeBlock(editor) || richValue.document.text.trim().length == 0) return {word: null, isAtStart: false};
		if (editor.props.useSlate) {
			if (richValue.document.text.startsWith("/giphy ") || richValue.document.text.startsWith("/tenor ")) {
				let node = richValue.document.getNode(richValue.selection.start.key);
				if (node) return {
					word: node.text.substring(0, richValue.selection.start.offset),
					isAtStart: true
				}
			}
			let node = richValue.document.getNode(richValue.selection.start.key);
			if (node == null) return {
				word: null,
				isAtStart: false
			};
			let word = "", atStart = false;
			let offset = richValue.selection.start.offset;
			let block = richValue.document.getClosestBlock(node.key);
			while (true) {
				if (--offset < 0) {
					if ((node = block.getPreviousNode(node.key) == null)) {
						atStart = true;
						break;
					}
					if (node.object!== "text") break;
					offset = node.text.length - 1;
				}
				if (node.object !== "text") break;
				let prefix = node.text[offset];
				if (/(\t|\s)/.test(prefix)) break;
				word = prefix + word;
			}
			return {
				word: !word ? null : word,
				isAtStart: atStart && block.type == "line" && richValue.document.nodes.get(0) === block
			};
		}
		else {
			let textarea = BDFDB.ReactUtils.findDOMNode(editor.ref.current);
			if (!Node.prototype.isPrototypeOf(textarea) || textarea.tagName != "TEXTAREA" || !textarea.value.length || /\s/.test(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd))) return {
				word: null,
				isAtStart: true
			};
			else {
				if (textarea.selectionEnd == textarea.value.length) {
					let words = textarea.value.split(/\s/).reverse();
					return {
						word: !words[0] ? null : words[0],
						isAtStart: words.length > 1
					};
				}
				else {
					let chars = textarea.value.split(""), word = "", currentWord = "", isCurrentWord = false, isAtStart = true;
					for (let i in chars) {
						if (i == textarea.selectionStart) isCurrentWord = true;
						if (/\s/.test(chars[i])) {
							word = "";
							isAtStart = currentWord.length > 0 && isAtStart || false;
							isCurrentWord = false;
						}
						else {
							word += chars[i];
							if (isCurrentWord) currentWord = word;
						}
					}
					return {
						word: !currentWord ? null : currentWord,
						isAtStart: isAtStart
					};
				}
			}
		}
	};
	
	BDFDB.NumberUtils = {};
	BDFDB.NumberUtils.formatBytes = function (bytes, sigDigits) {
		bytes = parseInt(bytes);
		if (isNaN(bytes) || bytes < 0) return "0 Bytes";
		if (bytes == 1) return "1 Byte";
		let size = Math.floor(Math.log(bytes) / Math.log(1024));
		return parseFloat((bytes / Math.pow(1024, size)).toFixed(sigDigits < 1 ? 0 : sigDigits > 20 ? 20 : sigDigits || 2)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][size];
	};
	BDFDB.NumberUtils.mapRange = function (from, to, value) {
		if (parseFloat(value) < parseFloat(from[0])) return parseFloat(to[0]);
		else if (parseFloat(value) > parseFloat(from[1])) return parseFloat(to[1]);
		else return parseFloat(to[0]) + (parseFloat(value) - parseFloat(from[0])) * (parseFloat(to[1]) - parseFloat(to[0])) / (parseFloat(from[1]) - parseFloat(from[0]));
	};
	BDFDB.NumberUtils.generateId = function (array) {
		array = BDFDB.ArrayUtils.is(array) ? array : [];
		let id = Math.floor(Math.random() * 10000000000000000);
		if (array.includes(id)) return BDFDB.NumberUtils.generateId(array);
		else {
			array.push(id);
			return id;
		}
	};
	BDFDB.NumberUtils.compareVersions = function (newv, oldv) {
		if (!newv || !oldv) return true;
		newv = newv.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
		oldv = oldv.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
		var length = Math.max(newv.length, oldv.length);
		if (!length) return true;
		if (newv.length > oldv.length) {
			var temparray = new Array(newv.length - oldv.length);
			for (let i = 0; i < temparray.length; i++) temparray[i] = 0;
			oldv = temparray.concat(oldv);
		}
		else if (newv.length < oldv.length) {
			var temparray = new Array(oldv.length - newv.length);
			for (let i = 0; i < temparray.length; i++) temparray[i] = 0;
			newv = temparray.concat(newv);
		}
		for (let i = 0; i < length; i++) for (let ioutdated = false, j = 0; j <= i; j++) {
			if (j == i && newv[j] < oldv[j]) return false;
			if (j < i) ioutdated = newv[j] == oldv[j];
			if ((j == 0 || ioutdated) && j == i && newv[j] > oldv[j]) return true;
		}
		return false;
	};
	BDFDB.NumberUtils.getVersionDifference = function (newv, oldv) {
		if (!newv || !oldv) return false;
		newv = newv.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
		oldv = oldv.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
		var length = Math.max(newv.length, oldv.length);
		if (!length) return false;
		if (newv.length > oldv.length) {
			var temparray = new Array(newv.length - oldv.length);
			for (let i = 0; i < temparray.length; i++) temparray[i] = 0;
			oldv = temparray.concat(oldv);
		}
		else if (newv.length < oldv.length) {
			var temparray = new Array(oldv.length - newv.length);
			for (let i = 0; i < temparray.length; i++) temparray[i] = 0;
			newv = temparray.concat(newv);
		}
		var oldvvalue = 0, newvvalue = 0;
		for (let i in oldv.reverse()) oldvvalue += (oldv[i] * (10 ** i));
		for (let i in newv.reverse()) newvvalue += (newv[i] * (10 ** i));
		return (newvvalue - oldvvalue) / (10 ** (length-1));
	};

	BDFDB.DiscordUtils = {};
	BDFDB.DiscordUtils.openLink = function (url, inbuilt, minimized) {
		if (!inbuilt) window.open(url, "_blank");
		else {
			let browserWindow = new LibraryRequires.electron.remote.BrowserWindow({
				frame: true,
				resizeable: true,
				show: true,
				darkTheme: BDFDB.DiscordUtils.getTheme() == BDFDB.disCN.themedark,
				webPreferences: {
					nodeIntegration: false,
					nodeIntegrationInWorker: false
				}
			});
			browserWindow.setMenu(null);
			browserWindow.loadURL(url);
			if (minimized) browserWindow.minimize(null);
		}
	};
	BDFDB.DiscordUtils.getFolder = function () {
		var built = BDFDB.DiscordUtils.getBuilt();
		built = "discord" + (built == "stable" ? "" : built);
		return LibraryRequires.path.resolve(LibraryRequires.electron.remote.app.getPath("appData"), built, BDFDB.DiscordUtils.getVersion());
	};
	BDFDB.DiscordUtils.getBuilt = function () {
		if (BDFDB.DiscordUtils.getBuilt.built) return BDFDB.DiscordUtils.getBuilt.built;
		else {
			var built = null;
			try {built = require(LibraryRequires.electron.remote.app.getAppPath() + "/build_info.json").releaseChannel.toLowerCase();} 
			catch (err) {
				try {built = require(LibraryRequires.electron.remote.app.getAppPath().replace("\app.asar", "") + "/build_info.json").releaseChannel.toLowerCase();} 
				catch (err) {
					var version = BDFDB.DiscordUtils.getVersion();
					if (version) {
						version = version.split(".");
						if (version.length == 3 && !isNaN(version = parseInt(version[2]))) built = version > 300 ? "stable" : da > 200 ? "canary" : "ptb";
						else built = "stable";
					}
					else built = "stable";
				}
			}
			BDFDB.DiscordUtils.getBuilt.built = built;
			return built;
		}
	};
	BDFDB.DiscordUtils.getVersion = function () {
		if (BDFDB.DiscordUtils.getBuilt.version) return BDFDB.DiscordUtils.getBuilt.version;
		else {
			let version = null;
			try {version = LibraryRequires.electron.remote.app.getVersion();}
			catch (err) {version = "";}
			BDFDB.DiscordUtils.getBuilt.version = version;
			return version;
		}
	};
	BDFDB.DiscordUtils.isDevModeEnabled = function () {
		return LibraryModules.StoreChangeUtils.get("UserSettingsStore").developerMode;
	};
	BDFDB.DiscordUtils.getTheme = function () {
		return LibraryModules.StoreChangeUtils.get("UserSettingsStore").theme == "dark" ? BDFDB.disCN.themedark : BDFDB.disCN.themelight;
	};
	BDFDB.DiscordUtils.getMode = function () {
		return LibraryModules.StoreChangeUtils.get("UserSettingsStore").message_display_compact ? "compact" : "cozy";
	};
	BDFDB.DiscordUtils.getZoomFactor = function () {
		let aRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.appmount));
		let widthZoom = Math.round(100 * window.outerWidth / aRects.width);
		let heightZoom = Math.round(100 * window.outerHeight / aRects.height);
		return widthZoom < heightZoom ? widthZoom : heightZoom;
	};
	BDFDB.DiscordUtils.getFontScale = function () {
		return parseInt(document.firstElementChild.style.fontSize.replace("%", ""));
	};
	BDFDB.DiscordUtils.shake = function () {
		BDFDB.ReactUtils.getInstance(document.querySelector(BDFDB.dotCN.appold)).return.stateNode.shake();
	};

	BDFDB.WindowUtils = {};
	BDFDB.WindowUtils.open = function (plugin, url, options = {}) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || !url) return;
		if (!BDFDB.ArrayUtils.is(plugin.browserWindows)) plugin.browserWindows = [];
		let config = Object.assign({
			show: false,
			webPreferences: {
				nodeIntegration: true,
				nodeIntegrationInWorker: true
			}
		}, options);
		let browserWindow = new LibraryRequires.electron.remote.BrowserWindow(BDFDB.ObjectUtils.exclude(config, "showOnReady", "onLoad"));
		
		if (!config.show && config.showOnReady) browserWindow.once("ready-to-show", browserWindow.show);
		if (config.devTools) browserWindow.openDevTools();
		if (typeof config.onLoad == "function") browserWindow.webContents.on("did-finish-load", (...args) => {config.onLoad(...args);});
		if (typeof config.onClose == "function") browserWindow.once("closed", (...args) => {config.onClose(...args);});
		
		if (typeof browserWindow.removeMenu == "function") browserWindow.removeMenu();
		else browserWindow.setMenu(null);
		browserWindow.loadURL(url);
		browserWindow.executeJavaScriptSafe = js => {if (!browserWindow.isDestroyed()) browserWindow.webContents.executeJavaScript(`(_ => {${js}})();`);};
		plugin.browserWindows.push(browserWindow);
		return browserWindow;
	};
	BDFDB.WindowUtils.close = function (browserWindow) {
		if (BDFDB.ObjectUtils.is(browserWindow) && !browserWindow.isDestroyed() && browserWindow.isClosable()) browserWindow.close();
	};
	BDFDB.WindowUtils.closeAll = function (plugin) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (BDFDB.ObjectUtils.is(plugin) && BDFDB.ArrayUtils.is(plugin.browserWindows)) while (plugin.browserWindows.length) BDFDB.WindowUtils.close(plugin.browserWindows.pop());
	};
	BDFDB.WindowUtils.addListener = function (plugin, actions, callback) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || !actions || typeof callback != "function") return;
		BDFDB.WindowUtils.removeListener(plugin, actions);
		for (let action of actions.split(" ")) {
			action = action.split(".");
			let eventName = action.shift();
			if (!eventName) return;
			let namespace = (action.join(".") || "") + plugin.name;
			if (!BDFDB.ArrayUtils.is(plugin.ipcListeners)) plugin.ipcListeners = [];

			plugin.ipcListeners.push({eventName, namespace, callback});
			LibraryRequires.electron.ipcRenderer.on(eventName, callback);
		}
	};
	BDFDB.WindowUtils.removeListener = function (plugin, actions = "") {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.ipcListeners)) return;
		if (actions) {
			for (let action of actions.split(" ")) {
				action = action.split(".");
				let eventName = action.shift();
				let namespace = (action.join(".") || "") + plugin.name;
				for (let listener of plugin.ipcListeners) {
					let removedListeners = [];
					if (listener.eventName == eventName && listener.namespace == namespace) {
						LibraryRequires.electron.ipcRenderer.off(listener.eventName, listener.callback);
						removedListeners.push(listener);
					}
					if (removedListeners.length) plugin.ipcListeners = plugin.ipcListeners.filter(listener => {return removedListeners.indexOf(listener) < 0;});
				}
			}
		}
		else {
			for (let listener of plugin.ipcListeners) LibraryRequires.electron.ipcRenderer.off(listener.eventName, listener.callback);
			plugin.ipcListeners = [];
		}
	};

	BDFDB.BDUtils = {};
	BDFDB.BDUtils.getPluginsFolder = function () {
		if (LibraryRequires.process.env.injDir) return LibraryRequires.path.resolve(LibraryRequires.process.env.injDir, "plugins/");
		else switch (LibraryRequires.process.platform) {
			case "win32":
				return LibraryRequires.path.resolve(LibraryRequires.process.env.appdata, "BetterDiscord/plugins/");
			case "darwin":
				return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, "Library/Preferences/BetterDiscord/plugins/");
			default:
				if (LibraryRequires.process.env.XDG_CONFIG_HOME) return LibraryRequires.path.resolve(LibraryRequires.process.env.XDG_CONFIG_HOME, "BetterDiscord/plugins/");
				else return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, ".config/BetterDiscord/plugins/");
			}
	};
	BDFDB.BDUtils.getThemesFolder = function () {
		if (LibraryRequires.process.env.injDir) return LibraryRequires.path.resolve(LibraryRequires.process.env.injDir, "plugins/");
		else switch (LibraryRequires.process.platform) {
			case "win32": 
				return LibraryRequires.path.resolve(LibraryRequires.process.env.appdata, "BetterDiscord/themes/");
			case "darwin": 
				return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, "Library/Preferences/BetterDiscord/themes/");
			default:
				if (LibraryRequires.process.env.XDG_CONFIG_HOME) return LibraryRequires.path.resolve(LibraryRequires.process.env.XDG_CONFIG_HOME, "BetterDiscord/themes/");
				else return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, ".config/BetterDiscord/themes/");
			}
	};
	BDFDB.BDUtils.isPluginEnabled = function (pluginName) {
		if (!window.BdApi) return null;
		else if (BdApi.Plugins && typeof BdApi.Plugins.isEnabled == "function") return BdApi.Plugins.isEnabled(pluginName);
		else if (typeof BdApi.isPluginEnabled == "function") return BdApi.isPluginEnabled(pluginName);
	};
	BDFDB.BDUtils.enablePlugin = function (pluginName) {
		if (!window.BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.enable == "function") BdApi.Plugins.enable(pluginName);
		else if (window.pluginModule) window.pluginModule.startPlugin(pluginName);
	};
	BDFDB.BDUtils.disablePlugin = function (pluginName) {
		if (!window.BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.disable == "function") BdApi.Plugins.disable(pluginName);
		else if (window.pluginModule) window.pluginModule.stopPlugin(pluginName);
	};
	BDFDB.BDUtils.getPlugin = function (pluginName, hasToBeEnabled = false, overHead = false) {
		if (window.BdApi && !hasToBeEnabled || BDFDB.BDUtils.isPluginEnabled(pluginName)) {	
			if (BdApi.Plugins.get && typeof BdApi.Plugins.get == "function") {
				let plugin = BdApi.Plugins.get(pluginName);
				if (overHead) return plugin ? {filename: LibraryRequires.fs.existsSync(LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), `${pluginName}.plugin.js`)) ? `${pluginName}.plugin.js` : null, id: pluginName, name: pluginName, plugin: plugin} : null;
				else return plugin;
			}
			else if (window.bdplugins) overHead ? window.bdplugins[pluginName] : (window.bdplugins[pluginName] || {}).plugin;
		}
		return null;
	};
	BDFDB.BDUtils.isThemeEnabled = function (themeName) {
		if (!window.BdApi) return null;
		else if (BdApi.Themes && typeof BdApi.Themes.isEnabled == "function") return BdApi.Themes.isEnabled(themeName);
		else if (typeof BdApi.isThemeEnabled == "function") return BdApi.isThemeEnabled(themeName);
	};
	BDFDB.BDUtils.enableTheme = function (themeName) {
		if (!window.BdApi) return;
		else if (BdApi.Themes && typeof BdApi.Themes.enable == "function") BdApi.Themes.enable(themeName);
		else if (window.themeModule) window.themeModule.enableTheme(themeName);
	};
	BDFDB.BDUtils.disableTheme = function (themeName) {
		if (!window.BdApi) return;
		else if (BdApi.Themes && typeof BdApi.Themes.disable == "function") BdApi.Themes.disable(themeName);
		else if (window.themeModule) window.themeModule.disableTheme(themeName);
	};
	BDFDB.BDUtils.getTheme = function (themeName, hasToBeEnabled = false) {
		if (window.BdApi && !hasToBeEnabled || BDFDB.BDUtils.isThemeEnabled(themeName)) {
			if (BdApi.Themes && typeof BdApi.Themes.get == "function") return BdApi.Themes.get(themeName);
			else if (window.bdthemes) window.bdthemes[themeName];
		}
		return null;
	};
	let oldSettings = window.BdApi && !BDFDB.ArrayUtils.is(BdApi.settings);
	BDFDB.BDUtils.settingsIds = oldSettings ? {
		automaticLoading: "fork-ps-5",
		coloredText: "bda-gs-7",
		normalizedClasses: "fork-ps-4",
		showToasts: "fork-ps-2"
	} : {
		automaticLoading: "settings.addons.autoReload",
		coloredText: "settings.appearance.coloredText",
		normalizedClasses: "settings.general.classNormalizer",
		showToasts: "settings.general.showToasts"
	};
	BDFDB.BDUtils.toggleSettings = function (key, state) {
		if (window.BdApi && typeof key == "string") {
			let path = key.split(".");
			let currentState = BDFDB.BDUtils.getSettings(key);
			if (state === true) {
				if (currentState === false) BdApi.enableSetting(...path);
			}
			else if (state === false) {
				if (currentState === true) BdApi.disableSetting(...path);
			}
			else if (currentState === true || currentState === false) BDFDB.BDUtils.toggleSettings(key, !currentState);
		}
	};
	BDFDB.BDUtils.getSettings = function (key) {
		if (!window.BdApi) return {};
		if (typeof key == "string") return BdApi.isSettingEnabled(...key.split("."));
		else return oldSettings ? BDFDB.ReactUtils.getValue(BdApi.getBDData("settings"), `${BDFDB.DiscordUtils.getBuilt()}.settings`) : BdApi.settings.map(n => n.settings.map(m => m.settings.map(l => ({id: [n.id, m.id, l.id].join("."), value:l.value})))).flat(10).reduce((newObj, setting) => (newObj[setting.id] = setting.value, newObj), {});
	};
	
	var DiscordClassModules = {};
	DiscordClassModules.BDFDB = {
		BDFDBundefined: "BDFDB_undefined",
		badge: "badge-7R_W3s",
		badgeAvatar: "avatar-hF52Er",
		bdaRepoEntry: "entry-9JnAPs",
		bdaRepoListHeader: "repoHeader-2KfNvH",
		bdaRepoListWrapper: "repoList-9JnAPs",
		cardInner: "inner-OP_8zd",
		cardWrapper: "card-rT4Wbb",
		charCounter: "counter-uAzbKp",
		changeLogModal: "changeLogModal-ny_dHC",
		collapseContainer: "container-fAVkOf",
		collapseContainerArrow: "arrow-uglXxc",
		collapseContainerCollapsed: "collapsed-2BUBZm",
		collapseContainerHeader: "header-2s6x-5",
		collapseContainerInner: "inner-TkGytd",
		collapseContainerMini: "container-fAVkOf containerMini-_k6Rts",
		collapseContainerTitle: "title-ROsJi-",
		colorPicker: "colorPicker-h5sF8g",
		colorPickerAlpha: "alpha-VcPGeR",
		colorPickerAlphaCheckered: "alpha-checkered",
		colorPickerAlphaCursor: "alpha-cursor",
		colorPickerAlphaHorizontal: "alpha-horizontal",
		colorPickerGradient: "gradient-TJOYTr",
		colorPickerGradientCheckered: "gradient-checkered",
		colorPickerGradientCursor: "gradient-cursor",
		colorPickerGradientCursorEdge: "gradient-cursor-edge",
		colorPickerGradientCursorSelected: "gradient-cursor-selected",
		colorPickerGradientHorizontal: "gradient-horizontal",
		colorPickerGradientButton: "gradientButton-eBBuwD",
		colorPickerGradientButtonEnabled: "enabled-MypHME",
		colorPickerSwatches: "swatches-QxZw_N",
		colorPickerSwatchesDisabled: "disabled-2JgNxl",
		colorPickerSwatchSingle: "single-Fbb1wB",
		colorPickerSwatchSelected: "selected-f5IVXN",
		confirmModal: "confirmModal-t-WDWJ",
		dev: "dev-A7f2Rx",
		favButtonContainer: "favbutton-8Fzu45",
		guild: "guild-r3yAE_",
		guildLowerLeftBadge: "lowerLeftBadge-zr4T_9",
		guildUpperLeftBadge: "upperLeftBadge-e35IpL",
		hasBadge: "hasBadge-4rT8_u",
		hotkeyResetButton: "resetButton-hI9Ax7",
		hotkeyWrapper: "recorder-can0vx",
		inputNumberButton: "button-J9muv5",
		inputNumberButtonDown: "down-cOY7Qp button-J9muv5",
		inputNumberButtonUp: "up-mUs_72 button-J9muv5",
		inputNumberButtons: "buttons-our3p-",
		inputNumberWrapper: "numberInputWrapper-j4svZS",
		inputNumberWrapperDefault: "numberInputWrapperDefault-gRxcuK numberInputWrapper-j4svZS",
		inputNumberWrapperMini: "numberInputWrapperMini-wtUU31 numberInputWrapper-j4svZS",
		listRow: "listRow-7SfZww",
		loadingIcon: "loadingIcon-cOYMPl",
		loadingIconWrapper: "loadingIconWrapper-PsVJ9m",
		overflowEllipsis: "ellipsis-qlo9sA",
		paginationList: "list-PIKebU",
		paginationListAlphabet: "alphabet-2ANo0x",
		paginationListAlphabetChar: "alphabetChar-bq-8Go",
		paginationListAlphabetCharDisabled: "disabled-XmhCq2",
		paginationListContent: "listContent-aG3Fq8",
		paginationListMini: "mini-GMiniS",
		paginationListPagination: "pagination-ko4zZk",
		popoutWrapper: "popout-xwjvsX",
		quickSelectWrapper: "quickSelectWrapper-UCfTKz",
		menuColorCustom: "colorCustom-44asd2",
		menuItemHint: "hint-BK71lM",
		modalHeaderShade: "shade-h6F4sT",
		modalHeaderHasSibling: "hasSiblings-fRyjyl",
		modalNoScroller: "noScroller-YgPpF3",
		modalSidebar: "sidebar-_0OpfR",
		modalTabContent: "tabContent-nZ-1U5",
		modalTabContentOpen: "open-yICTYu",
		modalSubInner: "inner-t84Frz",
		modalWrapper: "modal-6GHvdM",
		noticeWrapper: "noticeWrapper-8z511t",
		searchBarWrapper: "searchBarWrapper-1GpKvB",
		selectWrapper: "selectWrapper-yPjeij",
		settingsGuild: "guild-J3Egt5",
		settingsGuildDisabled: "disabled-b2o83O",
		settingsPanel: "settingsPanel-w2ySNR",
		settingsPanelHeader: "settingsHeader-7g994w",
		settingsPanelHeaderButton: "button-ff4a_z",
		settingsPanelHeaderControls: "controls-g2WW5_",
		settingsPanelInner: "settingsInner-zw1xAY",
		settingsPanelList: "settingsList-eZjkXj",
		settingsPanelTitle: "title-GTF_8J",
		settingsTableCard: "settingsTableCard-628t52",
		settingsTableCardConfigs: "settingsTableCardConfigs-w5X9-Z",
		settingsTableCardLabel: "settingsTableCardLabel-MElgIg",
		settingsTableHeaders: "settingsTableHeaders-WKzw9_",
		settingsTableHeaderVertical: "headerVertical-4MNxqk",
		settingsTableList: "settingsTableList-f6sW2y",
		sidebar: "sidebar-frSZx3",
		sidebarContent: "content-1SbgDG",
		sidebarList: "list-VCoBc2",
		sliderBubble: "bubble-3we2di",
		supporter: "supporter-Z3FfwL",
		supporterCustom: "customSupporter-thxL4U",
		svgIcon: "icon-GhnIRB",
		svgIconWrapper: "iconWrapper-g20jFn",
		tabBarContainerBottom: "bottom-b8sdfs",
		table: "table-moqjM0",
		tableBodyCell: "bodyCell-dQam9V",
		tableHeader: "header-g67q9_",
		tableHeaderCell: "headerCell-T6Fo3K",
		tableHeaderCellSorted: "headerCellSorted-FMjMWK",
		tableHeaderSortIcon: "sortIcon-WZjMja",
		tableRow: "row-_9Ehcp",
		tableStickyHeader: "stickyHeader-JabwjW header-g67q9_",
		textScroller: "textScroller-dc9_kz",
		themedPopout: "themedPopout-1TrfdI",
		tooltipCustom: "tooltipCustom-hH39_Z",
		userInfoDate: "date-YN6TCS"
	};
	DiscordClassModules.BDrepo = {
		bdAddonCard: "bd-addon-card",
		bdButton: "bd-button",
		bdaAuthor: "bd-author author bda-author",
		bdaControls: "bd-controls bd-addon-controls bda-controls",
		bdaControlsButton: "bd-addon-button",
		bdaDescription: "bd-description bd-addon-description bda-description",
		bdaDescriptionWrap: "bd-description-wrap bda-description-wrap",
		bdaFooter: "bd-footer bd-card-footer bda-footer",
		bdaHeader: "bd-addon-header bda-header",
		bdaHeaderTitle: "bd-title bd-card-title bda-header-title",
		bdaLink: "bd-link bda-link",
		bdaLinks: "bd-links bd-addon-links bda-links",
		bdaName: "bd-name name bda-name",
		bdaSettingsButton: "bd-button bd-button-addon-settings bd-settings-button bda-settings-button",
		bdaSlist: "bda-slist bd-addon-list",
		bdaVersion: "bd-version version bda-version",
		bdGuild: "bd-guild",
		bdGuildAnimatable: "bd-animatable",
		bdGuildAudio: "bd-audio",
		bdGuildSelected: "bd-selected",
		bdGuildSeparator: "bd-guild-separator",
		bdGuildUnread: "bd-unread",
		bdGuildVideo: "bd-video",
		bdIcon: "bd-icon",
		bdPillSelected: "bd-selected",
		bdPillUnread: "bd-unread",
		bdPfbtn: "bd-pfbtn",
		bdSwitch: "bd-switch",
		bdSwitchChecked: "bd-switch-checked",
		bdSwitchInner: "bd-checkbox",
		bdUpdatebtn: "bd-updatebtn",
		settings: "plugin-settings",
		settingsOpen: "settings-open",
		settingsClosed: "settings-closed",
		switch: "ui-switch",
		switchCheckbox: "ui-switch-checkbox",
		switchChecked: "checked",
		switchItem: "ui-switch-item",
		switchWrapper: "ui-switch-wrapper"
	};
	DiscordClassModules.BadgesEverywhere = {
		badge: "badge-7CsdQq",
		badges: "badges-XRnWAp",
		badgesChat: "badgesChat-f_cbR8",
		badgesInner: "inner-dA0J42",
		badgesList: "badgesList-Aw_p52",
		badgesPopout: "badgesPopout-srZ8EX",
		badgesSettings: "badgesSettings-ychoGn",
		indicator: "indicator-cY1-b4",
		indicatorInner: "indicatorInner-08W8Jl",
		mini: "mini-g-JPgX",
		size17: "size17-2GsONg",
		size21: "size21-Y634b3",
		size22: "size22-AJj9xV",
		size24: "size24-NlR6be"
	};
	DiscordClassModules.BetterNsfwTag = {
		nsfwTag: "nsfwTag-666omg"
	};
	DiscordClassModules.ChatFilter = {
		blocked: "blocked-jUhayi",
		blockedStamp: "blockedStamp-ijVeNn",
		censored: "censored-UYfeYg",
		censoredStamp: "censoredStamp-fb2cYb"
	};
	DiscordClassModules.CharCounter = {
		charCounter: "charCounter-7fw40k",
		chatCounter: "chatCounter-XOMPsh",
		counterAdded: "charCounterAdded-zz9O4t",
		editCounter: "editCounter-pNT1Xe",
		nickCounter: "nickCounter-tJrO_4",
		popoutNoteCounter: "popoutNoteCounter-62U4Rh",
		profileNoteCounter: "profileNoteCounter-p0fWA_",
		uploadCounter: "uploadCounter-iEGQQk"
	};
	DiscordClassModules.CreationDate = {
		date: "creationDate-CJwdKT"
	};
	DiscordClassModules.DisplayLargeMessages = {
		injectButton: "injectButton-8eKqGu"
	};
	DiscordClassModules.DisplayServersAsChannels = {
		badge: "badge-fxFrUP",
		name: "name-z5133D",
		styled: "styledGuildsAsChannels-DNHtg_"
	};
	DiscordClassModules.EmojiStatistics = {
		statisticsButton: "statisticsButton-nW2KoM",
		amountCell: "amountCell-g_W6Rx",
		iconCell: "iconCell--wniOu",
		nameCell: "nameCell-xyXENZ"
	};
	DiscordClassModules.FriendNotifications = {
		friendsOnline: "friendsOnline-2JkivW"
	};
	DiscordClassModules.GoogleTranslateOption = {
		reverseButton: "reverseButton-5S47qV",
		translateButton: "translateButton-DhP9x8",
		translated: "translated-5YO8i3",
		translating: "translating-Yi-YxC"
	};
	DiscordClassModules.ImageGallery = {
		details: "details-9dkFPc",
		detailsLabel: "label-mrlccN",
		detailsWrapper: "detailsWrapper-TE1mu5",
		gallery: "gallery-JViwKR",
		icon: "icon-QY6cR4",
		next: "next-SHEZrz",
		previous: "previous-xsNq6B",
		sibling: "sibling-6vI7Pu"
	};
	DiscordClassModules.ImageZoom = {
		backdrop: "lenseBackdrop-yEm7Om",
		lense: "zoomLense-uOK8xV",
		modal: "imageModal-8J0ttB",
		operations: "operations-3V47CY"
	};
	DiscordClassModules.JoinedAtDate = {
		date: "joinedAtDate-IawR02"
	};
	DiscordClassModules.LastMessageDate = {
		date: "lastMessageDate-ocEw13"
	};
	DiscordClassModules.OldTitleBar = {
		oldTitleBarEnabled: "oldTitleBarEnabled-D8ppJQ",
		settingsToolbar: "settingsToolbar-wu4yfQ",
		toolbar: "toolbar-hRzFw-"
	};
	DiscordClassModules.PinDMs = {
		dragPreview: "dragPreview-nXiByA",
		dmChannelPinned: "pinned-0lM4wD",
		dmChannelPlaceholder: "placeholder-7bhR5s",
		pinnedChannelsHeaderAmount: "headerAmount-_-7GrS",
		pinnedChannelsHeaderArrow: "pinnedChannelsHeaderArrow-44rrTz",
		pinnedChannelsHeaderCollapsed: "collapsed-3w_-ff",
		pinnedChannelsHeaderColored: "colored-oIzG5s",
		pinnedChannelsHeaderContainer: "pinnedChannelsHeaderContainer-89Gjv4",
		recentPinned: "pinned-jHvFrr",
		recentPlaceholder: "placeholder-Uff-gH",
		unpinButton: "unpinButton-z3-UVO",
		unpinIcon: "unpinIcon-79ZnEr"
	};
	DiscordClassModules.ReadAllNotificationsButton	= {
		button: "button-Jt-tIg",
		frame: "frame-oXWS21",
		innerFrame: "innerFrame-8Hg64E"
	};
	DiscordClassModules.ServerFolders = {
		dragPreview: "dragPreview-nXiByA",
		guildPlaceholder: "placeholder-7bhR5s",
		folderContent: "content-Pph8t6",
		folderContentClosed: "closed-j55_T-",
		folderContentIsOpen: "folderContentIsOpen-zz6FgW",
		iconSwatch: "iconSwatch-_78Ghj",
		iconSwatchInner: "iconInner-aOY-qk",
		iconSwatchPreview: "preview-Bbg_24",
		iconSwatchSelected: "selected-P5oePO"
	};
	DiscordClassModules.ShowImageDetails = {
		details: "details-1t6Zms",
		detailsAdded: "detailsAdded-SAy48f"
	};
	DiscordClassModules.SpellCheck = {
		error: "error-k9z2IV",
		overlay: "spellCheckOverlay-cNSap5"
	};
	DiscordClassModules.SpotifyControls = {
		bar: "bar-g2ZMIm",
		barGabber: "grabber-7sd5f5",
		barFill: "barFill-Dhkah7",
		barText: "barText-lmqc5O",
		buttonActive: "active-6TsW-_",
		container: "container-6sXIoE",
		containerInner: "inner-WRV6k5",
		containerMaximized: "maximized-vv2Wr0",
		containerWithTimeline: "withTimeline-824fT_",
		cover: "cover-SwJ-ck",
		coverMaximizer: "maximizer-RVu85p",
		coverWrapper: "coverWrapper-YAplwJ",
		details: "details-ntX2k5",
		interpret: "interpret-F93iqP",
		song: "song-tIdBpF",
		timeline: "timeline-UWmgAx",
		volumeSlider: "volumeSlider-sR5g00"
	};
	DiscordClassModules.TimedLightDarkMode = {
		dateGrabber: "dateGrabber-QrRkIX",
		timerGrabber: "timerGrabber-zpRAIk",
		timerSettings: "timerSettings-wkvEfF"
	};
	DiscordClassModules.TopRolesEverywhere = {
		badgeStyle: "badgeStyle-tFiEQ8",
		chatTag: "chatTag-Y-5TDc",
		memberTag: "memberTag-QVWzGc",
		roleStyle: "roleStyle-jQ7KI2",
		tag: "tag-wWVHyf"
	};
	DiscordClassModules.NotFound = {
		_: "",
		badgeWrapper: "wrapper-232cHJ",
		channelPanelTitle: "title-eS5yk3",
		emoji: "emoji",
		guildChannels: "container-PNkimc",
		highlight: "highlight",
		hoverCardButton: "button-2CgfFz",
		loginScreen: "wrapper-3Q5DdO",
		messagesWelcomeButton: "button-2OOM0p",
		mention: "mention",
		mentionInteractive: "interactive",
		mentionWrapper: "wrapper-3WhCwL",
		nameContainerNameContainer: "container-2ax-kl",
		hueCursor: "hue-cursor",
		hueHorizontal: "hue-horizontal",
		hueVertical: "hue-vertical",
		saturationBlack: "saturation-black",
		saturationColor: "saturation-color",
		saturationCursor: "saturation-cursor",
		saturationWhite: "saturation-white",
		splashBackground: "splashBackground-1FRCko",
		stopAnimations: "stop-animations",
		subtext: "subtext-3CDbHg",
		themeDark: "theme-dark",
		themeLight: "theme-light",
		themeUndefined: "theme-undefined",
		voiceDraggable: "draggable-1KoBzC"
	};
	
	/* LOADED ON RUNTIME, BAD DISCORD */
	DiscordClassModules.ColorPicker = {
		colorPickerCustom: "colorPickerCustom-2CWBn2",
		colorPickerDropper: "colorPickerDropper-3c2mIf",
		colorPickerDropperFg: "colorPickerDropperFg-3jYKWI",
		colorPickerRow: "colorPickerRow-1LgLnl",
		colorPickerSwatch: "colorPickerSwatch-5GX3Ve",
		custom: "custom-2SJn4n",
		customColorPickerInput: "customColorPickerInput-14pB0r",
		default: "default-cS_caM",
		disabled: "disabled-1C4eHl",
		input: "input-GfazGc",
		noColor: "noColor-1pdBDm"
	};
	DiscordClassModules.ColorPickerInner = {
		hue: "hue-13HAGb",
		saturation: "saturation-1FDvtn",
		wrapper: "wrapper-2AQieU"
	};

	DiscordClassModules.AccountDetails = BDFDB.ModuleUtils.findByProperties("usernameContainer", "container");
	DiscordClassModules.AccountDetailsButtons = BDFDB.ModuleUtils.findByProperties("button", "enabled", "disabled");
	DiscordClassModules.Anchor = BDFDB.ModuleUtils.findByProperties("anchor", "anchorUnderlineOnHover");
	DiscordClassModules.AnimationContainer = BDFDB.ModuleUtils.findByProperties("animatorLeft", "didRender");
	DiscordClassModules.AppBase = BDFDB.ModuleUtils.findByProperties("container", "base");
	DiscordClassModules.AppInner = BDFDB.ModuleUtils.findByProperties("app", "layers");
	DiscordClassModules.AppMount = BDFDB.ModuleUtils.findByProperties("appMount");
	DiscordClassModules.ApplicationStore = BDFDB.ModuleUtils.findByProperties("applicationStore", "navigation");
	DiscordClassModules.AppOuter = BDFDB.ModuleUtils.find(m => typeof m.app == "string" && Object.keys(m).length == 1);
	DiscordClassModules.AuditLog = BDFDB.ModuleUtils.findByProperties("auditLog");
	DiscordClassModules.AuthBox = BDFDB.ModuleUtils.findByProperties("authBox");
	DiscordClassModules.Autocomplete = BDFDB.ModuleUtils.findByProperties("autocomplete", "autocompleteRow");
	DiscordClassModules.Avatar = BDFDB.ModuleUtils.findByProperties("avatar", "mask", "wrapper");
	DiscordClassModules.AvatarIcon = BDFDB.ModuleUtils.findByProperties("iconActiveLarge", "iconActiveMedium");
	DiscordClassModules.Backdrop = BDFDB.ModuleUtils.findByProperties("backdrop", "backdropWithLayer");
	DiscordClassModules.Badge = BDFDB.ModuleUtils.findByProperties("numberBadge", "textBadge", "iconBadge");
	DiscordClassModules.BotTag = BDFDB.ModuleUtils.findByProperties("botTag", "botTagInvert");
	DiscordClassModules.Button = BDFDB.ModuleUtils.findByProperties("colorBlack", "button");
	DiscordClassModules.CallCurrent = BDFDB.ModuleUtils.findByProperties("wrapper", "fullScreen");
	DiscordClassModules.CallDetails = BDFDB.ModuleUtils.findByProperties("container", "hotspot");
	DiscordClassModules.CallIncoming = BDFDB.ModuleUtils.findByProperties("wrapper", "mainChannelInfo");
	DiscordClassModules.Card = BDFDB.ModuleUtils.findByProperties("card", "cardBrand");
	DiscordClassModules.CardStatus = BDFDB.ModuleUtils.findByProperties("reset", "error", "card");
	DiscordClassModules.Category = BDFDB.ModuleUtils.findByProperties("wrapper", "children", "muted");
	DiscordClassModules.CategoryContainer = BDFDB.ModuleUtils.findByProperties("addButtonIcon", "containerDefault");
	DiscordClassModules.ChangeLog = BDFDB.ModuleUtils.findByProperties("added", "fixed", "improved", "progress");
	DiscordClassModules.Channel = BDFDB.ModuleUtils.findByProperties("wrapper", "content", "modeSelected");
	DiscordClassModules.ChannelContainer = BDFDB.ModuleUtils.findByProperties("actionIcon", "containerDefault");
	DiscordClassModules.ChannelLimit = BDFDB.ModuleUtils.findByProperties("users", "total", "wrapper");
	DiscordClassModules.ChannelTextArea = BDFDB.ModuleUtils.findByProperties("textArea", "buttons");
	DiscordClassModules.ChannelTextAreaAttachButton = BDFDB.ModuleUtils.findByProperties("attachButton", "attachWrapper");
	DiscordClassModules.ChannelTextAreaButton = BDFDB.ModuleUtils.findByProperties("buttonWrapper", "active");
	DiscordClassModules.ChannelTextAreaCharCounter = BDFDB.ModuleUtils.findByProperties("characterCount", "error");
	DiscordClassModules.ChannelTextAreaSlate = BDFDB.ModuleUtils.findByProperties("slateContainer", "placeholder");
	DiscordClassModules.ChatWindow = BDFDB.ModuleUtils.findByProperties("chat", "channelTextArea");
	DiscordClassModules.Checkbox = BDFDB.ModuleUtils.findByProperties("checkboxWrapper", "round");
	DiscordClassModules.CtaVerification = BDFDB.ModuleUtils.findByProperties("attendeeCTA", "verificationNotice");
	DiscordClassModules.Cursor = BDFDB.ModuleUtils.findByProperties("cursorDefault", "userSelectNone");
	DiscordClassModules.CustomStatusIcon = BDFDB.ModuleUtils.findByProperties("textRuler", "emoji", "icon");
	DiscordClassModules.DmAddPopout = BDFDB.ModuleUtils.findByProperties("popout", "searchBarComponent");
	DiscordClassModules.DmAddPopoutItems = BDFDB.ModuleUtils.findByProperties("friendSelected", "friendWrapper");
	DiscordClassModules.DownloadLink = BDFDB.ModuleUtils.findByProperties("downloadLink");
	DiscordClassModules.Embed = BDFDB.ModuleUtils.findByProperties("embed", "embedAuthorIcon");
	DiscordClassModules.EmbedActions = BDFDB.ModuleUtils.findByProperties("iconPlay", "iconWrapperActive");
	DiscordClassModules.Emoji = BDFDB.ModuleUtils.find(m => typeof m.emoji == "string" && Object.keys(m).length == 1);
	DiscordClassModules.EmojiButton = BDFDB.ModuleUtils.findByProperties("emojiButton", "sprite");
	DiscordClassModules.EmojiInput = BDFDB.ModuleUtils.findByProperties("inputContainer", "emojiButton");
	DiscordClassModules.EmojiPicker = BDFDB.ModuleUtils.findByProperties("emojiPicker", "inspector");
	DiscordClassModules.EmojiPickerDiversitySelector = BDFDB.ModuleUtils.findByProperties("diversityEmojiItemImage", "diversitySelectorPopout");
	DiscordClassModules.EmojiPickerItem = BDFDB.ModuleUtils.findByProperties("emojiSpriteImage");
	DiscordClassModules.EmojiPickerInspector = BDFDB.ModuleUtils.findByProperties("inspector", "glyphEmoji");
	DiscordClassModules.ExpressionPicker = BDFDB.ModuleUtils.findByProperties("contentWrapper", "navButton", "navList");
	DiscordClassModules.File = BDFDB.ModuleUtils.findByProperties("downloadButton", "fileNameLink");
	DiscordClassModules.Flex = BDFDB.ModuleUtils.findByProperties("alignBaseline", "alignCenter");
	DiscordClassModules.FlexChild = BDFDB.ModuleUtils.findByProperties("flexChild", "flex");
	DiscordClassModules.FlowerStar = BDFDB.ModuleUtils.findByProperties("flowerStarContainer", "flowerStar");
	DiscordClassModules.Focusable = BDFDB.ModuleUtils.findByProperties("focusable");
	DiscordClassModules.FormText = BDFDB.ModuleUtils.findByProperties("description", "modeDefault");
	DiscordClassModules.Game = BDFDB.ModuleUtils.findByProperties("game", "gameName");
	DiscordClassModules.GameIcon = BDFDB.ModuleUtils.findByProperties("gameIcon", "small", "xsmall");
	DiscordClassModules.GameLibraryTable = BDFDB.ModuleUtils.findByProperties("stickyHeader", "emptyStateText");
	DiscordClassModules.GifFavoriteButton = BDFDB.ModuleUtils.findByProperties("gifFavoriteButton", "showPulse");
	DiscordClassModules.GoLiveDetails = BDFDB.ModuleUtils.findByProperties("panel", "gameWrapper");
	DiscordClassModules.Guild = BDFDB.ModuleUtils.findByProperties("wrapper", "lowerBadge", "svg");
	DiscordClassModules.GuildChannels = BDFDB.ModuleUtils.findByProperties("positionedContainer", "unreadBar");
	DiscordClassModules.GuildDiscovery = BDFDB.ModuleUtils.findByProperties("pageWrapper", "guildList");
	DiscordClassModules.GuildDm = BDFDB.ModuleUtils.find(m => typeof m.pill == "string" && Object.keys(m).length == 1);
	DiscordClassModules.GuildEdges = BDFDB.ModuleUtils.findByProperties("wrapper", "edge", "autoPointerEvents");
	DiscordClassModules.GuildFolder = BDFDB.ModuleUtils.findByProperties("folder", "expandedFolderIconWrapper");
	DiscordClassModules.GuildHeader = BDFDB.ModuleUtils.findByProperties("header", "name", "bannerImage");
	DiscordClassModules.GuildHeaderButton = BDFDB.ModuleUtils.findByProperties("button", "open");
	DiscordClassModules.GuildIcon = BDFDB.ModuleUtils.findByProperties("acronym", "selected", "wrapper");
	DiscordClassModules.GuildInvite = BDFDB.ModuleUtils.findByProperties("wrapper", "guildIconJoined");
	DiscordClassModules.GuildSettingsBanned = BDFDB.ModuleUtils.findByProperties("bannedUser", "bannedUserAvatar");
	DiscordClassModules.GuildSettingsEmoji = BDFDB.ModuleUtils.findByProperties("emojiRow", "emojiAliasPlaceholder");
	DiscordClassModules.GuildSettingsInvite = BDFDB.ModuleUtils.findByProperties("countdownColumn", "inviteSettingsInviteRow");
	DiscordClassModules.GuildSettingsMember = BDFDB.ModuleUtils.findByProperties("member", "membersFilterPopout");
	DiscordClassModules.GuildSettingsRoles = BDFDB.ModuleUtils.findByProperties("buttonWrapper", "addRoleIcon");
	DiscordClassModules.GuildServer = BDFDB.ModuleUtils.findByProperties("blobContainer", "pill");
	DiscordClassModules.GuildsItems = BDFDB.ModuleUtils.findByProperties("guildSeparator", "guildsError");
	DiscordClassModules.GuildsWrapper = BDFDB.ModuleUtils.findByProperties("scroller", "unreadMentionsBar", "wrapper");
	DiscordClassModules.HeaderBar = BDFDB.ModuleUtils.findByProperties("container", "children", "toolbar");
	DiscordClassModules.HeaderBarExtras = BDFDB.ModuleUtils.findByProperties("headerBarLoggedOut", "search");
	DiscordClassModules.HeaderBarSearch = BDFDB.ModuleUtils.findByProperties("search", "searchBar", "open");
	DiscordClassModules.HeaderBarTopic = BDFDB.ModuleUtils.findByProperties("topic", "expandable", "content");
	DiscordClassModules.HomeIcon = BDFDB.ModuleUtils.findByProperties("homeIcon");
	DiscordClassModules.HotKeyRecorder = BDFDB.ModuleUtils.findByProperties("editIcon", "recording");
	DiscordClassModules.HoverCard = BDFDB.ModuleUtils.findByProperties("card", "active");
	DiscordClassModules.IconDirection = BDFDB.ModuleUtils.findByProperties("directionDown", "directionUp");
	DiscordClassModules.ImageWrapper = BDFDB.ModuleUtils.findByProperties("clickable", "imageWrapperBackground");
	DiscordClassModules.InviteModal = BDFDB.ModuleUtils.findByProperties("inviteRow", "modal");
	DiscordClassModules.Item = BDFDB.ModuleUtils.findByProperties("item", "side", "header");
	DiscordClassModules.ItemRole = BDFDB.ModuleUtils.findByProperties("role", "dragged");
	DiscordClassModules.ItemLayerContainer = BDFDB.ModuleUtils.findByProperties("layer", "layerContainer");
	DiscordClassModules.Input = BDFDB.ModuleUtils.findByProperties("inputMini", "inputDefault");
	DiscordClassModules.LayerModal = BDFDB.ModuleUtils.findByProperties("root", "small", "medium");
	DiscordClassModules.Layers = BDFDB.ModuleUtils.findByProperties("layer", "layers");
	DiscordClassModules.LiveTag = BDFDB.ModuleUtils.findByProperties("liveLarge", "live");
	DiscordClassModules.LoadingScreen = BDFDB.ModuleUtils.findByProperties("container", "problemsText", "problems");
	DiscordClassModules.Margins = BDFDB.ModuleUtils.findByProperties("marginBottom4", "marginCenterHorz");
	DiscordClassModules.Menu = BDFDB.ModuleUtils.findByProperties("menu", "styleFlexible", "item");
	DiscordClassModules.MenuCaret = BDFDB.ModuleUtils.findByProperties("arrow", "open");
	DiscordClassModules.MenuReactButton = BDFDB.ModuleUtils.findByProperties("wrapper", "icon", "focused");
	DiscordClassModules.MenuSlider = BDFDB.ModuleUtils.findByProperties("slider", "sliderContainer");
	DiscordClassModules.Member = BDFDB.ModuleUtils.findByProperties("member", "ownerIcon");
	DiscordClassModules.MembersWrap = BDFDB.ModuleUtils.findByProperties("membersWrap", "membersGroup");
	DiscordClassModules.Message = BDFDB.ModuleUtils.findByProperties("message", "mentioned");
	DiscordClassModules.MessageAccessory = BDFDB.ModuleUtils.findByProperties("embedWrapper", "gifFavoriteButton");
	DiscordClassModules.MessageBlocked = BDFDB.ModuleUtils.findByProperties("blockedMessageText", "expanded");
	DiscordClassModules.MessageBody = BDFDB.ModuleUtils.findByProperties("markupRtl", "edited");
	DiscordClassModules.MessageDivider = BDFDB.ModuleUtils.findByProperties("isUnread", "divider");
	DiscordClassModules.MessageElements = BDFDB.ModuleUtils.findByProperties("messageGroupBlockedBtn", "dividerRed");
	DiscordClassModules.MessageFile = BDFDB.ModuleUtils.findByProperties("cancelButton", "filenameLinkWrapper");
	DiscordClassModules.MessageLocalBot = BDFDB.ModuleUtils.find(m => typeof m.localBotMessage == "string" && Object.keys(m).length == 1);
	DiscordClassModules.MessageMarkup = BDFDB.ModuleUtils.findByProperties("markup");
	DiscordClassModules.MessageOperations = BDFDB.ModuleUtils.find(m => typeof m.operations == "string" && Object.keys(m).length == 1);
	DiscordClassModules.MessageReactions = BDFDB.ModuleUtils.findByProperties("reactions", "reactionMe");
	DiscordClassModules.MessageReactionsModal = BDFDB.ModuleUtils.findByProperties("reactor", "reactionSelected");
	DiscordClassModules.MessageSystem = BDFDB.ModuleUtils.findByProperties("container", "actionAnchor");
	DiscordClassModules.MessageToolbar = BDFDB.ModuleUtils.findByProperties("container", "icon", "isHeader");
	DiscordClassModules.MessageToolbarItems = BDFDB.ModuleUtils.findByProperties("wrapper", "button", "separator");
	DiscordClassModules.MessagesPopout = BDFDB.ModuleUtils.findByProperties("messagesPopoutWrap", "jumpButton");
	DiscordClassModules.MessagesPopoutButtons = BDFDB.ModuleUtils.findByProperties("secondary", "tertiary", "button");
	DiscordClassModules.MessagesPopoutTabBar = BDFDB.ModuleUtils.findByProperties("header", "tabBar", "active");
	DiscordClassModules.MessagesWelcome = BDFDB.ModuleUtils.findByProperties("emptyChannelIcon", "description", "header");
	DiscordClassModules.MessagesWrap = BDFDB.ModuleUtils.findByProperties("messagesWrapper", "messageGroupBlocked");
	DiscordClassModules.Modal = BDFDB.ModuleUtils.findByProperties("modal", "sizeLarge");
	DiscordClassModules.ModalDivider = BDFDB.ModuleUtils.find(m => typeof m.divider == "string" && Object.keys(m).length == 1);
	DiscordClassModules.ModalItems = BDFDB.ModuleUtils.findByProperties("guildName", "checkboxContainer");
	DiscordClassModules.ModalMiniContent = BDFDB.ModuleUtils.find(m => typeof m.modal == "string" && typeof m.content == "string" && Object.keys(m).length == 2);
	DiscordClassModules.ModalWrap = BDFDB.ModuleUtils.find(m => typeof m.modal == "string" && typeof m.inner == "string" && Object.keys(m).length == 2);
	DiscordClassModules.NameContainer = BDFDB.ModuleUtils.findByProperties("nameAndDecorators", "name");
	DiscordClassModules.NameTag = BDFDB.ModuleUtils.findByProperties("bot", "nameTag");
	DiscordClassModules.NitroStore = BDFDB.ModuleUtils.findByProperties("applicationStore", "marketingHeader");
	DiscordClassModules.NoteTextarea = BDFDB.ModuleUtils.find(m => typeof m.textarea == "string" && Object.keys(m).length == 1);
	DiscordClassModules.Notice = BDFDB.ModuleUtils.findByProperties("notice", "noticeFacebook");
	DiscordClassModules.Peoples = BDFDB.ModuleUtils.findByProperties("peopleColumn", "tabBar");
	DiscordClassModules.PictureInPicture = BDFDB.ModuleUtils.findByProperties("pictureInPicture", "pictureInPictureWindow");
	DiscordClassModules.PillWrapper = BDFDB.ModuleUtils.find(m => typeof m.item == "string" && typeof m.wrapper == "string" && Object.keys(m).length == 2);
	DiscordClassModules.PrivateChannel = BDFDB.ModuleUtils.findByProperties("channel", "closeButton");
	DiscordClassModules.PrivateChannelList = BDFDB.ModuleUtils.findByProperties("privateChannels", "searchBar");
	DiscordClassModules.PrivateChannelListScroller = BDFDB.ModuleUtils.findByProperties("scroller", "empty");
	DiscordClassModules.Popout = BDFDB.ModuleUtils.findByProperties("popout", "arrowAlignmentTop");
	DiscordClassModules.PopoutActivity = BDFDB.ModuleUtils.findByProperties("ellipsis", "activityActivityFeed");
	DiscordClassModules.QuickMessage = BDFDB.ModuleUtils.find(m => typeof m.input == "string" && Object.keys(m).length == 1);
	DiscordClassModules.QuickSelect = BDFDB.ModuleUtils.findByProperties("quickSelectArrow", "selected");
	DiscordClassModules.QuickSwitch = BDFDB.ModuleUtils.findByProperties("resultFocused", "guildIconContainer");
	DiscordClassModules.QuickSwitchWrap = BDFDB.ModuleUtils.findByProperties("container", "miscContainer");
	DiscordClassModules.Reactions = BDFDB.ModuleUtils.findByProperties("reactionBtn", "reaction");
	DiscordClassModules.RecentMentions = BDFDB.ModuleUtils.findByProperties("recentMentionsPopout");
	DiscordClassModules.RecentMentionsHeader = BDFDB.ModuleUtils.findByProperties("channelName", "channelHeader", "dmIcon");
	DiscordClassModules.Role = BDFDB.ModuleUtils.findByProperties("roleCircle", "roleName", "roleRemoveIcon");
	DiscordClassModules.Scrollbar = BDFDB.ModuleUtils.findByProperties("scrollbar", "scrollbarGhost");
	DiscordClassModules.Scroller = BDFDB.ModuleUtils.findByProperties("scrollerBase", "none", "fade");
	DiscordClassModules.ScrollerOld = BDFDB.ModuleUtils.findByProperties("scrollerThemed", "scroller");
	DiscordClassModules.SearchBar = BDFDB.ModuleUtils.findByProperties("clear", "container", "pointer");
	DiscordClassModules.SearchPopout = BDFDB.ModuleUtils.findByProperties("datePicker", "searchResultChannelIconBackground");
	DiscordClassModules.SearchPopoutWrap = BDFDB.ModuleUtils.findByProperties("container", "queryContainer");
	DiscordClassModules.SearchResults = BDFDB.ModuleUtils.findByProperties("noResults", "searchResultsWrap");
	DiscordClassModules.SearchResultsElements = BDFDB.ModuleUtils.findByProperties("resultsBlocked", "channelSeparator");
	DiscordClassModules.SearchResultsPagination = BDFDB.ModuleUtils.findByProperties("paginationButton", "pagination");
	DiscordClassModules.SearchResultsMessage = BDFDB.ModuleUtils.findByProperties("after", "messageGroupCozy");
	DiscordClassModules.Select = BDFDB.ModuleUtils.findByProperties("select", "error", "errorMessage");
	DiscordClassModules.SettingsCloseButton = BDFDB.ModuleUtils.findByProperties("closeButton", "keybind");
	DiscordClassModules.SettingsItems = BDFDB.ModuleUtils.findByProperties("dividerMini", "note");
	DiscordClassModules.SettingsTable = BDFDB.ModuleUtils.findByProperties("headerOption", "headerName");
	DiscordClassModules.SettingsWindow = BDFDB.ModuleUtils.findByProperties("contentRegion", "standardSidebarView");
	DiscordClassModules.SettingsWindowScroller = BDFDB.ModuleUtils.findByProperties("sidebarScrollable", "content", "scroller");
	DiscordClassModules.Slider = BDFDB.ModuleUtils.findByProperties("slider", "grabber");
	DiscordClassModules.Spoiler = BDFDB.ModuleUtils.findByProperties("spoilerContainer", "hidden");
	DiscordClassModules.SpoilerEmbed = BDFDB.ModuleUtils.findByProperties("hiddenSpoilers", "spoiler");
	DiscordClassModules.Switch = BDFDB.ModuleUtils.findByProperties("switchDisabled", "valueChecked");
	DiscordClassModules.Table = BDFDB.ModuleUtils.findByProperties("stickyHeader", "sortIcon");
	DiscordClassModules.Text = BDFDB.ModuleUtils.findByProperties("defaultColor", "defaultMarginh1");
	DiscordClassModules.TextColor = BDFDB.ModuleUtils.findByProperties("colorStandard", "colorMuted", "colorError");
	DiscordClassModules.TextColor2 = BDFDB.ModuleUtils.findByProperties("muted", "wrapper", "base");
	DiscordClassModules.TextSize = BDFDB.ModuleUtils.findByProperties("size10", "size14", "size20");
	DiscordClassModules.TextStyle = BDFDB.ModuleUtils.findByProperties("strikethrough", "underline", "bold");
	DiscordClassModules.Tip = BDFDB.ModuleUtils.findByProperties("pro", "inline");
	DiscordClassModules.Title = BDFDB.ModuleUtils.findByProperties("title", "size18");
	DiscordClassModules.TitleBar = BDFDB.ModuleUtils.findByProperties("titleBar", "wordmark");
	DiscordClassModules.Tooltip = BDFDB.ModuleUtils.findByProperties("tooltip", "tooltipTop");
	DiscordClassModules.TooltipGuild = BDFDB.ModuleUtils.findByProperties("rowIcon", "rowGuildName");
	DiscordClassModules.Typing = BDFDB.ModuleUtils.findByProperties("cooldownWrapper", "typing");
	DiscordClassModules.UnreadBar = BDFDB.ModuleUtils.findByProperties("active", "bar", "unread");
	DiscordClassModules.UploadModal = BDFDB.ModuleUtils.findByProperties("uploadModal", "bgScale");
	DiscordClassModules.UserInfo = BDFDB.ModuleUtils.findByProperties("userInfo", "discordTag");
	DiscordClassModules.UserPopout = BDFDB.ModuleUtils.findByProperties("userPopout", "headerPlaying");
	DiscordClassModules.UserProfile = BDFDB.ModuleUtils.findByProperties("topSectionNormal", "tabBarContainer");
	DiscordClassModules.Video = BDFDB.ModuleUtils.findByProperties("video", "fullScreen");
	DiscordClassModules.VoiceChannel = BDFDB.ModuleUtils.findByProperties("avatarSpeaking", "voiceUser");
	DiscordClassModules.VoiceChannelList = BDFDB.ModuleUtils.findByProperties("list", "collapsed");
	DiscordClassModules.VoiceDetails = BDFDB.ModuleUtils.findByProperties("container", "customStatusContainer");
	DiscordClassModules.VoiceDetailsPing = BDFDB.ModuleUtils.findByProperties("rtcConnectionQualityBad", "rtcConnectionQualityFine");
	DiscordClassModules.WebhookCard = BDFDB.ModuleUtils.findByProperties("pulseBorder", "copyButton");
	BDFDB.DiscordClassModules = Object.assign({}, DiscordClassModules);
	
	var DiscordClasses = {
		_bdguild: ["BDrepo", "bdGuild"],
		_bdguildanimatable: ["BDrepo", "bdGuildAnimatable"],
		_bdguildaudio: ["BDrepo", "bdGuildAudio"],
		_bdguildselected: ["BDrepo", "bdGuildSelected"],
		_bdguildseparator: ["BDrepo", "bdGuildSeparator"],
		_bdguildunread: ["BDrepo", "bdGuildUnread"],
		_bdguildvideo: ["BDrepo", "bdGuildVideo"],
		_bdpillselected: ["BDrepo", "bdPillSelected"],
		_bdpillunread: ["BDrepo", "bdPillUnread"],
		_betternsfwtagtag: ["BetterNsfwTag", "nsfwTag"],
		_badgeseverywherebadge: ["BadgesEverywhere", "badge"],
		_badgeseverywherebadges: ["BadgesEverywhere", "badges"],
		_badgeseverywherebadgeschat: ["BadgesEverywhere", "badgesChat"],
		_badgeseverywherebadgesinner: ["BadgesEverywhere", "badgesInner"],
		_badgeseverywherebadgeslist: ["BadgesEverywhere", "badgesList"],
		_badgeseverywherebadgespopout: ["BadgesEverywhere", "badgesPopout"],
		_badgeseverywherebadgessettings: ["BadgesEverywhere", "badgesSettings"],
		_badgeseverywhereindicator: ["BadgesEverywhere", "indicator"],
		_badgeseverywhereindicatorinner: ["BadgesEverywhere", "indicatorInner"],
		_badgeseverywheremini: ["BadgesEverywhere", "mini"],
		_badgeseverywheresize17: ["BadgesEverywhere", "size17"],
		_badgeseverywheresize21: ["BadgesEverywhere", "size21"],
		_badgeseverywheresize22: ["BadgesEverywhere", "size22"],
		_badgeseverywheresize24: ["BadgesEverywhere", "size24"],
		_chatfilterblocked: ["ChatFilter", "blocked"],
		_chatfilterblockedstamp: ["ChatFilter", "blockedStamp"],
		_chatfiltercensored: ["ChatFilter", "censored"],
		_chatfiltercensoredstamp: ["ChatFilter", "censoredStamp"],
		_charcountercounter: ["CharCounter", "charCounter"],
		_charcounterchatcounter: ["CharCounter", "chatCounter"],
		_charcountercounteradded: ["CharCounter", "counterAdded"],
		_charcountereditcounter: ["CharCounter", "editCounter"],
		_charcounternickcounter: ["CharCounter", "nickCounter"],
		_charcounterpopoutnotecounter: ["CharCounter", "popoutNoteCounter"],
		_charcounterprofilenotecounter: ["CharCounter", "profileNoteCounter"],
		_charcounteruploadcounter: ["CharCounter", "uploadCounter"],
		_creationdatedate: ["CreationDate", "date"],
		_displaylargemessagesinjectbutton: ["DisplayLargeMessages", "injectButton"],
		_displayserversaschannelsbadge: ["DisplayServersAsChannels", "badge"],
		_displayserversaschannelsname: ["DisplayServersAsChannels", "name"],
		_displayserversaschannelsstyled: ["DisplayServersAsChannels", "styled"],
		_emojistatisticsstatisticsbutton: ["EmojiStatistics", "statisticsButton"],
		_emojistatisticsamountcell: ["EmojiStatistics", "amountCell"],
		_emojistatisticsiconcell: ["EmojiStatistics", "iconCell"],
		_emojistatisticsnamecell: ["EmojiStatistics", "nameCell"],
		_friendnotificationsfriendsonline: ["FriendNotifications", "friendsOnline"],
		_imagegallerydetails: ["ImageGallery", "details"],
		_imagegallerydetailslabel: ["ImageGallery", "detailsLabel"],
		_imagegallerydetailswrapper: ["ImageGallery", "detailsWrapper"],
		_imagegallerygallery: ["ImageGallery", "gallery"],
		_imagegalleryicon: ["ImageGallery", "icon"],
		_imagegallerynext: ["ImageGallery", "next"],
		_imagegalleryprevious: ["ImageGallery", "previous"],
		_imagegallerysibling: ["ImageGallery", "sibling"],
		_imagezoombackdrop: ["ImageZoom", "backdrop"],
		_imagezoomimagemodal: ["ImageZoom", "modal"],
		_imagezoomlense: ["ImageZoom", "lense"],
		_imagezoomoperations: ["ImageZoom", "operations"],
		_joinedatdatedate: ["JoinedAtDate", "date"],
		_lastmessagedatedate: ["LastMessageDate", "date"],
		_googletranslateoptionreversebutton: ["GoogleTranslateOption", "reverseButton"],
		_googletranslateoptiontranslatebutton: ["GoogleTranslateOption", "translateButton"],
		_googletranslateoptiontranslated: ["GoogleTranslateOption", "translated"],
		_googletranslateoptiontranslating: ["GoogleTranslateOption", "translating"],
		_oldtitlebarenabled: ["OldTitleBar", "oldTitleBarEnabled"],
		_oldtitlebarsettingstoolbar: ["OldTitleBar", "settingsToolbar"],
		_oldtitlebartoolbar: ["OldTitleBar", "toolbar"],
		_pindmsdragpreview: ["PinDMs", "dragPreview"],
		_pindmsdmchannelpinned: ["PinDMs", "dmChannelPinned"],
		_pindmsdmchannelplaceholder: ["PinDMs", "dmChannelPlaceholder"],
		_pindmspinnedchannelsheaderamount: ["PinDMs", "pinnedChannelsHeaderAmount"],
		_pindmspinnedchannelsheaderarrow: ["PinDMs", "pinnedChannelsHeaderArrow"],
		_pindmspinnedchannelsheadercollapsed: ["PinDMs", "pinnedChannelsHeaderCollapsed"],
		_pindmspinnedchannelsheadercolored: ["PinDMs", "pinnedChannelsHeaderColored"],
		_pindmspinnedchannelsheadercontainer: ["PinDMs", "pinnedChannelsHeaderContainer"],
		_pindmsrecentpinned: ["PinDMs", "recentPinned"],
		_pindmsrecentplaceholder: ["PinDMs", "recentPlaceholder"],
		_pindmsunpinbutton: ["PinDMs", "unpinButton"],
		_pindmsunpinicon: ["PinDMs", "unpinIcon"],
		_readallnotificationsbuttonbutton: ["ReadAllNotificationsButton", "button"],
		_readallnotificationsbuttonframe: ["ReadAllNotificationsButton", "frame"],
		_readallnotificationsbuttoninner: ["ReadAllNotificationsButton", "innerFrame"],
		_serverfoldersdragpreview: ["ServerFolders", "dragPreview"],
		_serverfoldersfoldercontent: ["ServerFolders", "folderContent"],
		_serverfoldersfoldercontentclosed: ["ServerFolders", "folderContentClosed"],
		_serverfoldersfoldercontentisopen: ["ServerFolders", "folderContentIsOpen"],
		_serverfoldersguildplaceholder: ["ServerFolders", "guildPlaceholder"],
		_serverfoldersiconswatch: ["ServerFolders", "iconSwatch"],
		_serverfoldersiconswatchinner: ["ServerFolders", "iconSwatchInner"],
		_serverfoldersiconswatchpreview: ["ServerFolders", "iconSwatchPreview"],
		_serverfoldersiconswatchselected: ["ServerFolders", "iconSwatchSelected"],
		_showimagedetailsdetails: ["ShowImageDetails", "details"],
		_spellcheckerror: ["SpellCheck", "error"],
		_spellcheckoverlay: ["SpellCheck", "overlay"],
		_spotifycontrolsbar: ["SpotifyControls", "bar"],
		_spotifycontrolsbarfill: ["SpotifyControls", "barFill"],
		_spotifycontrolsbargrabber: ["SpotifyControls", "barGabber"],
		_spotifycontrolsbartext: ["SpotifyControls", "barText"],
		_spotifycontrolsbuttonactive: ["SpotifyControls", "buttonActive"],
		_spotifycontrolscontainer: ["SpotifyControls", "container"],
		_spotifycontrolscontainerinner: ["SpotifyControls", "containerInner"],
		_spotifycontrolscontainermaximized: ["SpotifyControls", "containerMaximized"],
		_spotifycontrolscontainerwithtimeline: ["SpotifyControls", "containerWithTimeline"],
		_spotifycontrolscover: ["SpotifyControls", "cover"],
		_spotifycontrolscovermaximizer: ["SpotifyControls", "coverMaximizer"],
		_spotifycontrolscoverwrapper: ["SpotifyControls", "coverWrapper"],
		_spotifycontrolsdetails: ["SpotifyControls", "details"],
		_spotifycontrolsinterpret: ["SpotifyControls", "interpret"],
		_spotifycontrolssong: ["SpotifyControls", "song"],
		_spotifycontrolstimeline: ["SpotifyControls", "timeline"],
		_spotifycontrolsvolumeslider: ["SpotifyControls", "volumeSlider"],
		_timedlightdarkmodedategrabber: ["TimedLightDarkMode", "dateGrabber"],
		_timedlightdarkmodetimergrabber: ["TimedLightDarkMode", "timerGrabber"],
		_timedlightdarkmodetimersettings: ["TimedLightDarkMode", "timerSettings"],
		_toproleseverywherebadgestyle: ["TopRolesEverywhere", "badgeStyle"],
		_toproleseverywherechattag: ["TopRolesEverywhere", "chatTag"],
		_toproleseverywheremembertag: ["TopRolesEverywhere", "memberTag"],
		_toproleseverywhererolestyle: ["TopRolesEverywhere", "roleStyle"],
		_toproleseverywheretag: ["TopRolesEverywhere", "tag"],
		_repoauthor: ["BDrepo", "bdaAuthor"],
		_repobutton: ["BDrepo", "bdButton"],
		_repocard: ["BDrepo", "bdAddonCard"],
		_repocheckbox: ["BDrepo", "switchCheckbox"],
		_repocheckboxchecked: ["BDrepo", "switchChecked"],
		_repocheckboxinner: ["BDrepo", "switch"],
		_repocheckboxitem: ["BDrepo", "switchItem"],
		_repocheckboxwrap: ["BDrepo", "switchWrapper"],
		_repocontrols: ["BDrepo", "bdaControls"],
		_repocontrolsbutton: ["BDrepo", "bdaControlsButton"],
		_repodescription: ["BDrepo", "bdaDescription"],
		_repodescriptionwrap: ["BDrepo", "bdaDescriptionWrap"],
		_repoentry: ["BDFDB", "bdaRepoEntry"],
		_repofolderbutton: ["BDrepo", "bdPfbtn"],
		_repofooter: ["BDrepo", "bdaFooter"],
		_repoheader: ["BDrepo", "bdaHeader"],
		_repoheadertitle: ["BDrepo", "bdaHeaderTitle"],
		_repoicon: ["BDrepo", "bdIcon"],
		_repolist: ["BDrepo", "bdaSlist"],
		_repolistheader: ["BDFDB", "bdaRepoListHeader"],
		_repolistwrapper: ["BDFDB", "bdaRepoListWrapper"],
		_repolink: ["BDrepo", "bdaLink"],
		_repolinks: ["BDrepo", "bdaLinks"],
		_reponame: ["BDrepo", "bdaName"],
		_reposettings: ["BDrepo", "settings"],
		_reposettingsbutton: ["BDrepo", "bdaSettingsButton"],
		_reposettingsopen: ["BDrepo", "settingsOpen"],
		_reposettingsclosed: ["BDrepo", "settingsClosed"],
		_reposwitch: ["BDrepo", "bdSwitch"],
		_reposwitchchecked: ["BDrepo", "bdSwitchChecked"],
		_reposwitchinner: ["BDrepo", "bdSwitchInner"],
		_repoupdatebutton: ["BDrepo", "bdUpdatebtn"],
		_repoversion: ["BDrepo", "bdaVersion"],
		accountinfo: ["AccountDetails", "container"],
		accountinfoavatar: ["AccountDetails", "avatar"],
		accountinfoavatarwrapper: ["AccountDetails", "avatarWrapper"],
		accountinfobutton: ["AccountDetailsButtons", "button"],
		accountinfobuttondisabled: ["AccountDetailsButtons", "disabled"],
		accountinfobuttonenabled: ["AccountDetailsButtons", "enabled"],
		accountinfodetails: ["AccountDetails", "usernameContainer"],
		accountinfonametag: ["AccountDetails", "nameTag"],
		alignbaseline: ["Flex", "alignBaseline"],
		aligncenter: ["Flex", "alignCenter"],
		alignend: ["Flex", "alignEnd"],
		alignstart: ["Flex", "alignStart"],
		alignstretch: ["Flex", "alignStretch"],
		anchor: ["Anchor", "anchor"],
		anchorunderlineonhover: ["Anchor", "anchorUnderlineOnHover"],
		animationcontainerbottom: ["AnimationContainer", "animatorBottom"],
		animationcontainerleft: ["AnimationContainer", "animatorLeft"],
		animationcontainerright: ["AnimationContainer", "animatorRight"],
		animationcontainertop: ["AnimationContainer", "animatorTop"],
		animationcontainerrender: ["AnimationContainer", "didRender"],
		animationcontainerscale: ["AnimationContainer", "scale"],
		animationcontainertranslate: ["AnimationContainer", "translate"],
		app: ["AppOuter", "app"],
		appcontainer: ["AppBase", "container"],
		appmount: ["AppMount", "appMount"],
		applayers: ["AppInner", "layers"],
		applicationstore: ["ApplicationStore", "applicationStore"],
		appold: ["AppInner", "app"],
		auditlog: ["AuditLog", "auditLog"],
		auditlogoverflowellipsis: ["AuditLog", "overflowEllipsis"],
		auditloguserhook: ["AuditLog", "userHook"],
		authbox: ["AuthBox", "authBox"],
		autocomplete: ["Autocomplete", "autocomplete"],
		autocompletecontent: ["Autocomplete", "content"],
		autocompletecontenttitle: ["Autocomplete", "contentTitle"],
		autocompletedescription: ["Autocomplete", "description"],
		autocompletedescriptiondiscriminator: ["Autocomplete", "descriptionDiscriminator"],
		autocompletedescriptionusername: ["Autocomplete", "descriptionUsername"],
		autocompleteicon: ["Autocomplete", "icon"],
		autocompleteiconforeground: ["Autocomplete", "iconForeground"],
		autocompleteinner: ["Autocomplete", "autocompleteInner"],
		autocompleterow: ["Autocomplete", "autocompleteRow"],
		autocompleterowhorizontal: ["Autocomplete", "autocompleteRowHorizontal"],
		autocompleterowvertical: ["Autocomplete", "autocompleteRowVertical"],
		autocompleteselectable: ["Autocomplete", "selectable"],
		autocompleteselected: ["Autocomplete", "selectorSelected"],
		autocompleteselector: ["Autocomplete", "selector"],
		avatar: ["Avatar", "avatar"],
		avatarcursordefault: ["Avatar", "cursorDefault"],
		avataricon: ["AvatarIcon", "icon"],
		avatariconactivelarge: ["AvatarIcon", "iconActiveLarge"],
		avatariconactivemedium: ["AvatarIcon", "iconActiveMedium"],
		avatariconactivemini: ["AvatarIcon", "iconActiveMini"],
		avatariconactivesmall: ["AvatarIcon", "iconActiveSmall"],
		avatariconactivexlarge: ["AvatarIcon", "iconActiveXLarge"],
		avatariconinactive: ["AvatarIcon", "iconInactive"],
		avatariconsizelarge: ["AvatarIcon", "iconSizeLarge"],
		avatariconsizemedium: ["AvatarIcon", "iconSizeMedium"],
		avatariconsizemini: ["AvatarIcon", "iconSizeMini"],
		avatariconsizesmol: ["AvatarIcon", "iconSizeSmol"],
		avatariconsizesmall: ["AvatarIcon", "iconSizeSmall"],
		avatariconsizexlarge: ["AvatarIcon", "iconSizeXLarge"],
		avatarmask: ["Avatar", "mask"],
		avatarnoicon: ["AvatarIcon", "noIcon"],
		avatarpointer: ["Avatar", "pointer"],
		avatarpointerevents: ["Avatar", "pointerEvents"],
		avatarwrapper: ["Avatar", "wrapper"],
		backdrop: ["Backdrop", "backdrop"],
		backdropwithlayer: ["Backdrop", "backdropWithLayer"],
		badgebase: ["Badge", "base"],
		badgeicon: ["Badge", "icon"],
		badgeiconbadge: ["Badge", "iconBadge"],
		badgenumberbadge: ["Badge", "numberBadge"],
		badgetextbadge: ["Badge", "textBadge"],
		badgewrapper: ["NotFound", "badgeWrapper"],
		bdfdbbadge: ["BDFDB", "badge"],
		bdfdbbadgeavatar: ["BDFDB", "badgeAvatar"],
		bdfdbdev: ["BDFDB", "dev"],
		bdfdbhasbadge: ["BDFDB", "hasBadge"],
		bdfdbsupporter: ["BDFDB", "supporter"],
		bdfdbsupportercustom: ["BDFDB", "supporterCustom"],
		bold: ["TextStyle", "bold"],
		bottag: ["BotTag", "botTag"],
		bottaginvert: ["BotTag", "botTagInvert"],
		bottagmember: ["Member", "botTag"],
		bottagnametag: ["NameTag", "bot"],
		bottagpx: ["BotTag", "px"],
		bottagregular: ["BotTag", "botTagRegular"],
		bottagrem: ["BotTag", "rem"],
		bottagtext: ["BotTag", "botText"],
		bottagverified: ["BotTag", "botTagVerified"],
		button: ["Button", "button"],
		buttoncolorblack: ["Button", "colorBlack"],
		buttoncolorbrand: ["Button", "colorBrand"],
		buttoncolorgreen: ["Button", "colorGreen"],
		buttoncolorgrey: ["Button", "colorGrey"],
		buttoncolorlink: ["Button", "colorLink"],
		buttoncolorprimary: ["Button", "colorPrimary"],
		buttoncolorred: ["Button", "colorRed"],
		buttoncolortransparent: ["Button", "colorTransparent"],
		buttoncolorwhite: ["Button", "colorWhite"],
		buttoncoloryellow: ["Button", "colorYellow"],
		buttoncontents: ["Button", "contents"],
		buttondisabledoverlay: ["Button", "disabledButtonOverlay"],
		buttondisabledwrapper: ["Button", "disabledButtonWrapper"],
		buttonfullwidth: ["Button", "fullWidth"],
		buttongrow: ["Button", "grow"],
		buttonhashover: ["Button", "hasHover"],
		buttonhoverblack: ["Button", "hoverBlack"],
		buttonhoverbrand: ["Button", "hoverBrand"],
		buttonhovergreen: ["Button", "hoverGreen"],
		buttonhovergrey: ["Button", "hoverGrey"],
		buttonhoverlink: ["Button", "hoverLink"],
		buttonhoverprimary: ["Button", "hoverPrimary"],
		buttonhoverred: ["Button", "hoverRed"],
		buttonhovertransparent: ["Button", "hoverTransparent"],
		buttonhoverwhite: ["Button", "hoverWhite"],
		buttonhoveryellow: ["Button", "hoverYellow"],
		buttonlookblank: ["Button", "lookBlank"],
		buttonlookfilled: ["Button", "lookFilled"],
		buttonlookghost: ["Button", "lookGhost"],
		buttonlookinverted: ["Button", "lookInverted"],
		buttonlooklink: ["Button", "lookLink"],
		buttonlookoutlined: ["Button", "lookOutlined"],
		buttonsizeicon: ["Button", "sizeIcon"],
		buttonsizelarge: ["Button", "sizeLarge"],
		buttonsizemax: ["Button", "sizeMax"],
		buttonsizemedium: ["Button", "sizeMedium"],
		buttonsizemin: ["Button", "sizeMin"],
		buttonsizesmall: ["Button", "sizeSmall"],
		buttonsizexlarge: ["Button", "sizeXlarge"],
		buttonspinner: ["Button", "spinner"],
		buttonspinneritem: ["Button", "spinnerItem"],
		buttonsubmitting: ["Button", "submitting"],
		callcurrentcontainer: ["CallCurrent", "wrapper"],
		callcurrentdetails: ["CallDetails", "container"],
		callcurrentvideo: ["Video", "video"],
		callincomingicon: ["CallIncoming", "icon"],
		callincomingroot: ["CallIncoming", "root"],
		callincomingtitle: ["CallIncoming", "title"],
		callincomingwrapper: ["CallIncoming", "wrapper"],
		card: ["Card", "card"],
		cardbrand: ["Card", "cardBrand"],
		cardbrandoutline: ["Card", "cardBrandOutline"],
		carddanger: ["Card", "cardDanger"],
		carddangeroutline: ["Card", "cardDangerOutline"],
		carderror: ["CardStatus", "error"],
		cardprimary: ["Card", "cardPrimary"],
		cardprimaryeditable: ["Card", "cardPrimaryEditable"],
		cardprimaryoutline: ["Card", "cardPrimaryOutline"],
		cardprimaryoutlineeditable: ["Card", "cardPrimaryOutlineEditable"],
		cardreset: ["CardStatus", "reset"],
		cardsuccess: ["Card", "cardSuccess"],
		cardsuccessoutline: ["Card", "cardSuccessOutline"],
		cardwarning: ["Card", "cardWarning"],
		cardwarningoutline: ["Card", "cardWarningOutline"],
		categoryaddbutton: ["CategoryContainer", "addButton"],
		categoryaddbuttonicon: ["CategoryContainer", "addButtonIcon"],
		categorychildren: ["Category", "children"],
		categoryclickable: ["Category", "clickable"],
		categorycollapsed: ["Category", "collapsed"],
		categorycontainerdefault: ["CategoryContainer", "containerDefault"],
		categoryforcevisible: ["CategoryContainer", "forceVisible"],
		categoryicon: ["Category", "icon"],
		categoryiconvisibility: ["CategoryContainer", "iconVisibility"],
		categorymuted: ["Category", "muted"],
		categoryname: ["Category", "name"],
		categorywrapper: ["Category", "wrapper"],
		changelogadded: ["ChangeLog", "added"],
		changelogcontainer: ["ChangeLog", "container"],
		changelogfixed: ["ChangeLog", "fixed"],
		changelogimproved: ["ChangeLog", "improved"],
		changelogprogress: ["ChangeLog", "progress"],
		changelogtitle: ["ChangeLog", "title"],
		channelactionicon: ["ChannelContainer", "actionIcon"],
		channelchildicon: ["ChannelContainer", "iconItem"],
		channelchildiconbase: ["ChannelContainer", "iconBase"],
		channelchildren: ["Channel", "children"],
		channelcontainerdefault: ["ChannelContainer", "containerDefault"],
		channelcontent: ["Channel", "content"],
		channeldisabled: ["ChannelContainer", "disabled"],
		channelheaderchannelname: ["ChatWindow", "channelName"],
		channelheaderchildren: ["HeaderBar", "children"],
		channelheaderdivider: ["HeaderBar", "divider"],
		channelheaderheaderbar: ["HeaderBar", "container"],
		channelheaderheaderbarthemed: ["HeaderBar", "themed"],
		channelheaderheaderbartitle: ["HeaderBar", "title"],
		channelheadericon: ["HeaderBar", "icon"],
		channelheadericonbadge: ["HeaderBar", "iconBadge"],
		channelheadericonclickable: ["HeaderBar", "clickable"],
		channelheadericonselected: ["HeaderBar", "selected"],
		channelheadericonwrapper: ["HeaderBar", "iconWrapper"],
		channelheadertitle: ["ChatWindow", "title"],
		channelheadertitlewrapper: ["ChatWindow", "titleWrapper"],
		channelheadersearch: ["HeaderBarExtras", "search"],
		channelheadersearchbar: ["HeaderBarSearch", "searchBar"],
		channelheadersearchicon: ["HeaderBarSearch", "icon"],
		channelheadersearchinner: ["HeaderBarSearch", "search"],
		channelheadertoolbar: ["HeaderBar", "toolbar"],
		channelheadertoolbar2: ["HeaderBarExtras", "toolbar"],
		channelheadertopic: ["HeaderBarTopic", "topic"],
		channelheadertopicexpandable: ["HeaderBarTopic", "expandable"],
		channelicon: ["Channel", "icon"],
		channeliconvisibility: ["ChannelContainer", "iconVisibility"],
		channelmentionsbadge: ["ChannelContainer", "mentionsBadge"],
		channelmodeconnected: ["Channel", "modeConnected"],
		channelmodelocked: ["Channel", "modeLocked"],
		channelmodemuted: ["Channel", "modeMuted"],
		channelmodeselected: ["Channel", "modeSelected"],
		channelmodeunread: ["Channel", "modeUnread"],
		channelname: ["Channel", "name"],
		channelpanel: ["AppBase", "activityPanel"],
		channelpaneltitle: ["NotFound", "channelPanelTitle"],
		channelpanels: ["AppBase", "panels"],
		channels: ["AppBase", "sidebar"],
		channelselected: ["ChannelContainer", "selected"],
		channelsscroller: ["GuildChannels", "scroller"],
		channelsunreadbar: ["GuildChannels", "unreadBar"],
		channelsunreadbarcontainer: ["GuildChannels", "positionedContainer"],
		channelsunreadbarbottom: ["GuildChannels", "unreadBottom"],
		channelsunreadbarunread: ["GuildChannels", "unread"],
		channelsunreadbartop: ["GuildChannels", "unreadTop"],
		channelunread: ["Channel", "unread"],
		channeluserlimit: ["ChannelLimit", "wrapper"],
		channeluserlimitcontainer: ["ChannelContainer", "userLimit"],
		channeluserlimittotal: ["ChannelLimit", "total"],
		channeluserlimitusers: ["ChannelLimit", "users"],
		channelwrapper: ["Channel", "wrapper"],
		charcounter: ["BDFDB", "charCounter"],
		chat: ["ChatWindow", "chat"],
		chatbase: ["AppBase", "base"],
		chatcontent: ["ChatWindow", "chatContent"],
		chatform: ["ChatWindow", "form"],
		chatinner: ["ChatWindow", "content"],
		chatspacer: ["AppBase", "content"],
		checkbox: ["Checkbox", "checkbox"],
		checkboxchecked: ["Checkbox", "checked"],
		checkboxcontainer: ["ModalItems", "checkboxContainer"],
		checkboxinput: ["Checkbox", "input"],
		checkboxinputdefault: ["Checkbox", "inputDefault"],
		checkboxinputdisabled: ["Checkbox", "inputDisabled"],
		checkboxround: ["Checkbox", "round"],
		checkboxwrapper: ["Checkbox", "checkboxWrapper"],
		checkboxwrapperdisabled: ["Checkbox", "checkboxWrapperDisabled"],
		collapsecontainer: ["BDFDB", "collapseContainer"],
		collapsecontainerarrow: ["BDFDB", "collapseContainerArrow"],
		collapsecontainercollapsed: ["BDFDB", "collapseContainerCollapsed"],
		collapsecontainerheader: ["BDFDB", "collapseContainerHeader"],
		collapsecontainerinner: ["BDFDB", "collapseContainerInner"],
		collapsecontainermini: ["BDFDB", "collapseContainerMini"],
		collapsecontainertitle: ["BDFDB", "collapseContainerTitle"],
		colorbase: ["TextColor2", "base"],
		colorbrand: ["TextColor", "colorBrand"],
		colorerror: ["TextColor", "colorError"],
		colormuted: ["TextColor", "colorMuted"],
		colorgreen: ["TextColor", "colorStatusGreen"],
		colorpicker: ["ColorPicker", "colorPickerCustom"],
		colorpickeralpha: ["BDFDB", "colorPickerAlpha"],
		colorpickeralphacheckered: ["BDFDB", "colorPickerAlphaCheckered"],
		colorpickeralphacursor: ["BDFDB", "colorPickerAlphaCursor"],
		colorpickeralphahorizontal: ["BDFDB", "colorPickerAlphaHorizontal"],
		colorpickergradient: ["BDFDB", "colorPickerGradient"],
		colorpickergradientbutton: ["BDFDB", "colorPickerGradientButton"],
		colorpickergradientbuttonenabled: ["BDFDB", "colorPickerGradientButtonEnabled"],
		colorpickergradientcheckered: ["BDFDB", "colorPickerGradientCheckered"],
		colorpickergradientcursor: ["BDFDB", "colorPickerGradientCursor"],
		colorpickergradientcursoredge: ["BDFDB", "colorPickerGradientCursorE
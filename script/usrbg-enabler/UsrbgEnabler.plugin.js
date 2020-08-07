//META{"name":"Usrbg Enabler","authorId":"97051685918109696","source":"https://github.com/EpicSkullYT/Naidrus-USRBG-Database/blob/master/script/usrbg-enabler/UsrbgEnabler.plugin.js"}*//

var OwnerTag = (_ => {
	const userTypes = {
		NONE: 0,
		ADMIN: 1,
		OWNER: 2
	};
	
	var settings = {}, inputs = {};
	
	return class OwnerTag {
		getName () {return "Usrbg Enabler";}

		getVersion () {return "1.0.0";}

		getAuthor () {return "Naidru The Fennec Fox#3580";}

		getDescription () {return "Modified DevilBro's OwnerTag plugin to make it so you can use the Usrbg css script without needing any DevilBro Plugins.";}

		constructor () {
			this.changelog = {
				"added":[["Initial Release!"]]
			};

		// Legacy
		load () {}

		start () {
			if (!window.BDFDB) window.BDFDB = {myPlugins:{}};
			if (window.BDFDB && window.BDFDB.myPlugins && typeof window.BDFDB.myPlugins == "object") window.BDFDB.myPlugins[this.getName()] = this;
			let libraryScript = document.querySelector("head script#BDFDBLibraryScript");
			if (!libraryScript || (performance.now() - libraryScript.getAttribute("date")) > 600000) {
				if (libraryScript) libraryScript.remove();
				libraryScript = document.createElement("script");
				libraryScript.setAttribute("id", "BDFDBLibraryScript");
				libraryScript.setAttribute("type", "text/javascript");
				libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.min.js");
				libraryScript.setAttribute("date", performance.now());
				libraryScript.addEventListener("load", _ => {this.initialize();});
				document.head.appendChild(libraryScript);
			}
			else if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) this.initialize();
			this.startTimeout = setTimeout(_ => {
				try {return this.initialize();}
				catch (err) {console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not initiate plugin! " + err);}
			}, 30000);
		}

		initialize () {
			if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
				if (this.started) return;
				BDFDB.PluginUtils.init(this);

				this.forceUpdateAll();
			}
			else console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not load BD functions!");
		}

		stop () {
			if (window.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
				this.stopping = true;

				this.forceUpdateAll();

				BDFDB.PluginUtils.clear(this);
			}
		}


		// Begin of own functions

		onSettingsClosed () {
			if (this.SettingsUpdated) {
				delete this.SettingsUpdated;
				this.forceUpdateAll();
			}
		}

		processMemberListItem (e) {
			let userType = this.getUserType(e.instance.props.user);
			if (userType && settings.addInMemberList) {
				this.injectOwnerTag(BDFDB.ReactUtils.getValue(e.returnvalue, "props.decorators.props.children"), e.instance.props.user, userType, 1, {
					tagClass: BDFDB.disCN.bottagmember
				});
			}
		}

		processMessageHeader (e) {
			if (e.instance.props.message && settings.addInChatWindow) {
				let userType = this.getUserType(e.instance.props.message.author);
				if (userType) {
					let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue.props.children.slice(1), {name: "Popout", props: [["className", BDFDB.disCN.messageusername]]});
					if (index > -1) this.injectOwnerTag(children, e.instance.props.message.author, userType, e.instance.props.compact ? 0 : 2, {
						tagClass: e.instance.props.compact ? BDFDB.disCN.messagebottagcompact : BDFDB.disCN.messagebottagcozy,
						useRem: true
					});
				}
			}
		}

		processNameTag (e) {
			if (e.instance.props.user && e.instance.props.className) {
				let userType = this.getUserType(e.instance.props.user);
				if (userType) {
					let inject = false, tagClass = "";
					switch (e.instance.props.className) {
						case BDFDB.disCN.userpopoutheadertagnonickname:
							inject = settings.addInUserPopout;
							tagClass = BDFDB.disCN.bottagnametag;
							break;
						case BDFDB.disCN.userprofilenametag:
							inject = settings.addInUserProfile;
							tagClass = BDFDB.disCNS.userprofilebottag + BDFDB.disCN.bottagnametag;
							break;
					}
					if (inject) this.injectOwnerTag(e.returnvalue.props.children, e.instance.props.user, userType, 2, {
						tagClass: tagClass,
						useRem: e.instance.props.useRemSizes,
						inverted: e.instance.props.invertBotTagColor
					});
				}
			}
		}

		processUserPopout (e) {
			if (e.instance.props.user && settings.addInUserPopout) {
				let userType = this.getUserType(e.instance.props.user);
				if (userType) {
					let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {props: [["className", BDFDB.disCN.userpopoutheadertagwithnickname]]});
					if (index > -1) this.injectOwnerTag(children, e.instance.props.user, userType, 2, {
						tagClass: BDFDB.disCNS.userpopoutheaderbottagwithnickname + BDFDB.disCN.bottagnametag
					});
				}
			}
		}

		injectOwnerTag (children, user, userType, insertIndex, config = {}) {
			if (!BDFDB.ArrayUtils.is(children) || !user) return;
			if (settings.useCrown || settings.hideNativeCrown) {
				let [_, index] = BDFDB.ReactUtils.findParent(children, {props: [["text",[BDFDB.LanguageUtils.LanguageStrings.GROUP_OWNER, BDFDB.LanguageUtils.LanguageStrings.GUILD_OWNER]]]});
				if (index > -1) children[index] = null;
			}
			let channel = BDFDB.LibraryModules.ChannelStore.getChannel(BDFDB.LibraryModules.LastChannelStore.getChannelId());
			let member = settings.useRoleColor ? (BDFDB.LibraryModules.MemberStore.getMember(channel.guild_id, user.id) || {}) : {};
			let isOwner = userType == userTypes.OWNER;
			let tag = null;
			if (settings.useCrown) {
				let label = isOwner ? (channel.type == BDFDB.DiscordConstants.ChannelTypes.GROUP_DM ? BDFDB.LanguageUtils.LanguageStrings.GROUP_OWNER : BDFDB.LanguageUtils.LanguageStrings.GUILD_OWNER) : BDFDB.LanguageUtils.LanguageStrings.ADMINISTRATOR;
				tag = BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
					text: label,
					children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
						className: BDFDB.disCNS.memberownericon + (isOwner ? "owner-crown" : "admin-crown"),
						name: BDFDB.LibraryComponents.SvgIcon.Names.CROWN,
						"aria-label": label
					})
				});
			}
			else {
				let tagColor = BDFDB.ColorUtils.convert(member.colorString, "RGBA");
				let isBright = BDFDB.ColorUtils.isBright(tagColor);
				tagColor = isBright ? (settings.useBlackFont ? tagColor : BDFDB.ColorUtils.change(tagColor, -0.3)) : tagColor;
				tag = BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.BotTag, {
					className: config.tagClass,
					useRemSizes: config.useRem,
					invertColor: config.inverted,
					style: {
						backgroundColor: config.inverted ? (isBright && settings.useBlackFont ? "black" : null) : tagColor,
						color: !config.inverted ? (isBright && settings.useBlackFont ? "black" : null) : tagColor
					},
					tag: inputs[isOwner ? "ownTagName" : "ownAdminTagName"]
				});
			}
			children.splice(insertIndex, 0, tag);
		}
		
		getUserType (user) {
			if (!user) return userTypes.NONE;
			let channel = BDFDB.LibraryModules.ChannelStore.getChannel(BDFDB.LibraryModules.LastChannelStore.getChannelId());
			if (!channel) return userTypes.NONE;
			let guild = BDFDB.LibraryModules.GuildStore.getGuild(channel.guild_id);
			let isOwner = channel.ownerId == user.id || guild && guild.ownerId == user.id;
			if (!(isOwner || (settings.addForAdmins && BDFDB.UserUtils.can("ADMINISTRATOR", user.id) && !(settings.ignoreBotAdmins && user.bot)))) return userTypes.NONE;
			return isOwner ? userTypes.OWNER : userTypes.ADMIN;
		}
	
		forceUpdateAll () {
			settings = BDFDB.DataUtils.get(this, "settings");
			inputs = BDFDB.DataUtils.get(this, "inputs");
			
			BDFDB.ModuleUtils.forceAllUpdates(this);
			BDFDB.MessageUtils.rerenderAll();
		}
	}
})();
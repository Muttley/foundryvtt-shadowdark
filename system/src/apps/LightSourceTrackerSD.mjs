import RealTimeSD from "./RealTimeSD.mjs";

export default class LightSourceTrackerSD extends Application {

	DEFAULT_UPDATE_INTERVAL =
		shadowdark.defaults.LIGHT_TRACKER_UPDATE_INTERVAL_SECS;

	constructor(object, options) {
		super(object, options);

		this.monitoredLightSources = [];

		this.lastUpdate = null;
		this.updatingLightSources = false;

		this.housekeepingInterval = 1000; // 1 sec
		this.housekeepingIntervalId = null;

		this.dirty = true;

		this.performingTick = false;
		this.realTime = new RealTimeSD();

		this.showUserWarning = false;
		this.showAllPlayerActors = true;
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "light-tracker"],
			height: "auto",
			resizable: false,
			width: "auto",
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/light-tracker.hbs";
	}

	/** @inheritdoc */
	get title() {
		return game.i18n.localize("SHADOWDARK.app.light_tracker.title");
	}

	activateListeners(html) {
		html.find(".character-portrait").click(
			async event => {
				event.preventDefault();

				const actorId = $(event.currentTarget).data("actor-id");

				const actor = game.actors.get(actorId);

				if (actor.sheet.rendered) {
					actor.sheet.close();
				}
				else {
					actor.sheet.render(true);
				}
			}
		);

		html.find(".disable-all-lights").click(
			async event => {
				event.preventDefault();

				shadowdark.log("Turning out all the lights");

				if (this.monitoredLightSources.length <= 0) return;

				for (const actorData of this.monitoredLightSources) {
					if (actorData.lightSources.length <= 0) continue;

					const actor = game.actors.get(actorData._id);

					await actor.turnLightOff();

					for (const itemData of actorData.lightSources) {
						shadowdark.log(`Turning off ${actor.name}'s ${itemData.name} light source`);

						if (itemData.type === "Effect") {
							await actor.deleteEmbeddedDocuments("Item", [itemData._id]);
						}
						else {
							await actor.updateEmbeddedDocuments("Item", [{
								"_id": itemData._id,
								"system.light.active": false,
							}]);
						}
					}
				}

				const cardData = {
					img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
					actor: this,
					message: game.i18n.localize("SHADOWDARK.chat.light_source.source.all"),
				};

				let template = "systems/shadowdark/templates/chat/lightsource-toggle-gm.hbs";

				const content = await renderTemplate(template, cardData);

				await ChatMessage.create({
					content,
					rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
				});

				this.dirty = true;
				this._updateLightSources();
			}
		);

		html.find(".disable-light").click(
			async event => {
				event.preventDefault();
				const itemId = $(event.currentTarget).data("item-id");
				const actorId = $(event.currentTarget).data("actor-id");

				const actor = game.actors.get(actorId);
				const item = actor.getEmbeddedDocument("Item", itemId);

				shadowdark.log(`Turning off ${actor.name}'s ${item.name} light source`);

				await actor.yourLightWentOut(itemId);

				if (item.type === "Effect") {
					await actor.deleteEmbeddedDocuments("Item", [itemId]);
				}
				else {
					const active = !item.system.light.active;

					const dataUpdate = {
						"_id": itemId,
						"system.light.active": active,
					};

					await actor.updateEmbeddedDocuments("Item", [dataUpdate]);
				}


				this.dirty = true;
				this._updateLightSources();
			}
		);

		html.find(".toggle-show-all").click(
			async event => {
				event.preventDefault();
				this.showAllPlayerActors = !this.showAllPlayerActors;
				this.render(false);
			}
		);
	}

	/**
	 * Drops a lightsource on a scene by creating an actor and a token. It deletes the item
	 * from the source actor, but retains the information. It also flags the lightsource tracker
	 * to start tracking it.
	 *
	 * @param {object} item - Lightsource Item to be dropped on scene
	 * @param {object} itemOwner - The owner of the lightsource item to be dropped
	 * @param {object} actorData - Uncreated Actor data
	 * @param {object} dropData - Information the carries the coordinates of the drop
	 */
	async dropLightSourceOnScene(item, itemOwner, actorData, dropData, speaker = false) {
		// Create a new actor
		const lightActor = await Actor.create(actorData);

		// Create a copy of the item
		lightActor.createEmbeddedDocuments("Item", [item]);

		// Remove light from items parents
		game.actors.get(itemOwner._id).toggleLight(false, "");

		// Send message that the torch was dropped
		game.actors.get(itemOwner._id).sheet._sendToggledLightSourceToChat(
			false,
			item,
			{
				speaker: speaker ?? ChatMessage.getSpeaker(),
				picked_up: false,
				template: "systems/shadowdark/templates/chat/lightsource-drop.hbs",
			}
		);

		// Remove item from the items parents
		game.actors.get(itemOwner._id).items.get(item._id).delete();

		// Create token
		canvas.tokens._onDropActorData({}, {
			type: "Actor",
			uuid: lightActor.uuid,
			x: dropData.x,
			y: dropData.y,
		});

		// Flag the housekeeper to get to work
		this.dirty = true;
	}

	/** @override */
	async getData(options) {

		for (const actorData of this.monitoredLightSources) {
			actorData.showOnTracker = this.showAllPlayerActors || actorData.lightSources.length > 0;
		}

		const context = {
			isRealtimeEnabled: this.realTime.isEnabled(),
			monitoredLightSources: this.monitoredLightSources,
			paused: this._isPaused(),
			showAllPlayerActors: this.showAllPlayerActors,
			showUserWarning: this.showUserWarning,
		};

		return context;
	}

	/**
	 * Transfers a token/actor that has been dropped for light to a held object again.
	 * Triggers through socket so it doesn't matter if the user has permission or not.
	 *
	 * @param {ActorSD} character - Assigned actor
	 * @param {ActorSD} lightActor - Actor associated with dropped lightsource
	 * @param {Token} lightToken - Token associated with dropped lightsource
	 * @param {object} speaker - Speaker data
	 */
	async pickupLightSourceFromScene(actorData, lightActor, lightToken, speaker = false) {
		if (!actorData) return false;

		const actor = game.actors.get(actorData._id);

		const lightActorId = lightActor._id;
		const lightTokenId = lightToken._id;

		// Create the items onto the assigned character
		const [item] = await actor.createEmbeddedDocuments(
			"Item",
			game.actors.get(lightActorId).items.contents
		);

		if (item.isActiveLight()) {
			item.actor.turnLightOn(item._id);
		}

		// Delete the actor
		game.actors.get(lightActorId).delete();

		// Delete the token
		canvas.scene.tokens.get(lightTokenId).delete();

		const cardData = {
			active: item.isActiveLight(),
			name: item.name,
			timeRemaining: Math.floor(item.system.light.remainingSecs / 60),
			longevity: item.system.light.longevityMins,
			actor,
			item,
			picked_up: true,
		};

		let template = "systems/shadowdark/templates/chat/lightsource-drop.hbs";

		const content = await renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			speaker: speaker ?? ChatMessage.getSpeaker(),
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});

		// Flag the housekeeper to get to work
		this.dirty = true;
	}

	async render(force, options) {
		// Don't allow non-GM users to view the UI
		if (!game.user.isGM) return;

		super.render(force, options);
	}

	async start() {
		// Make sure we're actualled enable and are supposed to be running.
		if (this._isDisabled()) {
			shadowdark.log("Light Tracker is disabled in settings");
			return;
		}

		// we only run the timer on the GM instance
		if (!game.user.isGM) return;

		// Now we can actually start properly
		shadowdark.log("Light Tracker starting");

		// Start the realtime clock (if enabled).
		this.realTime.start();

		// First get a list of all active light sources in the world
		await this._gatherLightSources();

		// Setup the housekeeping interval which will check for changes
		// to lightsources
		this.housekeepingIntervalId = setInterval(
			this._updateLightSources.bind(this),
			this.housekeepingInterval
		);

		if (game.settings.get("shadowdark", "trackLightSourcesOpen")) {
			this.render(true);
		}
	}

	async toggleInterface(force=false) {
		if (!force && !game.user.isGM) {
			ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.general.gm_required")
			);
			return;
		}

		if (this.rendered) {
			this.close();
		}
		else {
			this.render(true);
		}
	}

	async toggleLightSource(actor, item) {
		if (this._isDisabled()) return;

		if (!game.user.isGM) {
			game.socket.emit(
				"system.shadowdark",
				{
					type: "toggleLightSource",
					data: {
						actor,
						item,
					},
				}
			);
			return;
		}

		const status = item.system.light.active ? "on" : "off";

		shadowdark.log(`Turning ${status} ${actor.name}'s ${item.name} light source`);

		this._onToggleLightSource();
	}

	async _deleteActorHook(actor, options, userId) {
		if (!(this._isEnabled() && game.user.isGM)) return;

		if (actor.hasActiveLightSources()) this.dirty = true;
	}

	async _deleteItemHook(item, options, userId) {
		if (!(this._isEnabled() && game.user.isGM)) return;

		if (item.isActiveLight()) this.dirty = true;
	}

	async _gatherLightSources() {
		if (this.performingTick) return;
		if (this.updatingLightSources) return;
		if (!this.dirty) return;

		this.updatingLightSources = true;
		this.dirty = false;

		shadowdark.log("Checking for new/changed light sources");

		this.monitoredLightSources = [];

		const workingLightSources = [];

		let usersWithoutCharacters = 0;
		try {
			const playerActors = game.actors.filter(
				actor => actor.type === "Player" && actor.hasPlayerOwner
			);

			const onlineUsers = game.users.filter(
				user => !user.isGM && user.active
			);

			for (const actor of playerActors) {

				let hasActiveOwner = false;
				for (const user of onlineUsers) {
					if (actor.ownership[user._id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
						|| actor.ownership.default === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
					) {
						hasActiveOwner = true;
						break;
					}
				}

				if (!(hasActiveOwner || this._monitorInactiveUsers())) continue;

				const actorData = actor.toObject(false);
				actorData.lightSources = [];

				const activeLightSources = await actor.getActiveLightSources();

				for (const item of activeLightSources) {
					actorData.lightSources.push(
						item.toObject(false)
					);
				}

				workingLightSources.push(actorData);
			}

			// Gather scene Light actors that have been dropped onto the scene
			if (canvas.scene) {
				for (const token of canvas.scene.tokens) {
					if (!token.actor || token.actor.type !== "Light") continue;

					const actorData = token.actor.toObject(false);
					actorData.lightSources = actorData.lightSources ?? [];

					const activeLightSources = await token.actor.getActiveLightSources();

					for (const item of activeLightSources) {
						actorData.lightSources.push(item.toObject(false));
					}

					if (!workingLightSources.some(a => a._id === actorData._id)) {
						workingLightSources.push(actorData);
					}
				}
			}

			this.showUserWarning = usersWithoutCharacters > 0 ? true : false;

			this.monitoredLightSources = workingLightSources.sort((a, b) => {
				if (a.name < b.name) {
					return -1;
				}
				if (a.name > b.name) {
					return 1;
				}
				return 0;
			});
		}
		catch(error) {
			console.error(error);
		}
		finally {
			this.updatingLightSources = false;
		}
	}

	_isDisabled() {
		return !this._isEnabled();
	}

	_isEnabled() {
		return game.settings.get("shadowdark", "trackLightSources");
	}

	_isPaused() {
		return this.realTime.isPaused();
	}

	async _makeDirty() {
		if (this._isEnabled() && game.user.isGM) this.dirty = true;
	}

	_monitorInactiveUsers() {
		return game.settings.get("shadowdark", "trackInactiveUserLightSources");
	}

	async _onToggleLightSource() {
		if (!(this._isEnabled() && game.user.isGM)) return;
		this.dirty = true;
	}

	async onUpdateWorldTime(worldTime, worldDelta) {
		if (!(this._isEnabled() && shadowdark.utils.isPrimaryGM())) return;
		if (this.updatingLightSources) return;

		const updateSecs = game.settings.get(
			"shadowdark", "trackLightSourcesInterval"
		) || this.DEFAULT_UPDATE_INTERVAL;

		// Set this on first update as we can't access the value during
		// construction
		if (!this.lastUpdate) this.lastUpdate = worldTime;

		// If time moves forward, check if enough time has passed to update the
		// light timers. Updating too often results in inventory rerendering. If
		// the time moved backwards, always update.
		const delta = worldTime - this.lastUpdate;
		if (worldDelta > 0 && delta < updateSecs) {
			return;
		}

		this.lastUpdate = worldTime;

		shadowdark.log("Updating light sources");

		try {
			this.performingTick = true;

			for (const actorData of this.monitoredLightSources) {
				const numLightSources = actorData.lightSources.length;

				shadowdark.log(`Updating ${numLightSources} light sources for ${actorData.name}`);

				for (const itemData of actorData.lightSources) {
					const actor = await game.actors.get(actorData._id);

					const light = itemData.system.light;

					if (itemData.type === "Effect") {
						const item = actor.getEmbeddedDocument("Item", itemData._id);

						if (item) {
							const duration = item.remainingDuration;
							light.remainingSecs = duration?.remaining ?? 0;
						}
						else {
							light.remainingSecs = 0;
							this.dirty = true;
						}
					}
					else {
						const longevitySecs = light.longevityMins * 60;
						light.remainingSecs = Math.max(
							0,
							Math.min(longevitySecs, light.remainingSecs - delta)
						);
					}

					if (light.remainingSecs <= 0) {
						shadowdark.log(`Light source ${itemData.name} owned by ${actorData.name} has expired`);

						if (actor.type !== "Light") {
							await actor.yourLightExpired(itemData._id);

							await actor.deleteEmbeddedDocuments("Item", [itemData._id]);
						}
						else {
							// For light actors, we want to remove the token AND the actor
							await actor.yourLightExpired(itemData._id);
							await canvas.scene.tokens
								.filter(t => t.actor._id === actor._id)
								.forEach(t => t.delete());
							await actor.delete();
						}

						this.dirty = true;
					}
					else {
						shadowdark.log(`Light source ${itemData.name} owned by ${actorData.name} has ${Math.ceil(light.remainingSecs)} seconds remaining`);

						const item = await actor.getEmbeddedDocument(
							"Item", itemData._id
						);

						item.update({
							"system.light.remainingSecs": light.remainingSecs,
						});
					}
				}
			}

			this.render(false);
		}
		catch(error) {
			shadowdark.log(`An error ocurred updating light sources: ${error}`);
			console.error(error);
		}
		finally {
			this.performingTick = false;
		}

		shadowdark.log("Finished updating light sources");
	}

	async _pauseGameHook() {
		this.render(false);
	}

	async _settingsChanged() {
		if (!game.user.isGM) return;

		if (this.realTime.isEnabled()) {
			this.realTime.start();
		}
		else {
			this.realTime.stop();
		}

		if (this._isEnabled()) {
			this.dirty = true;
			await this._updateLightSources();
			this.render(true);
		}
		else {
			this.close();
			this.monitoredLightSources = {};
		}
		this.render(false);
	}

	async _updateLightSources() {
		if (!(this._isEnabled() && game.user.isGM)) return;
		if (!this.dirty) return;
		if (this.performingTick) return;

		await this._gatherLightSources();

		this.render(false);
	}
}

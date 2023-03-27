const DEFAULT_UPDATE_INTERVAL_MINS = 60 * 1000;

export default class LightSourceTrackerSD extends Application {

	constructor(object, options) {
		super(object, options);

		this.monitoredLightSources = [];
		this.updateInterval = DEFAULT_UPDATE_INTERVAL_MINS;
		this.updateIntervalId = null;

		this.lastUpdate = Date.now();
		this.updatingLightSources = false;

		this.housekeepingInterval = 1000;
		this.housekeepingIntervalId = null;

		this.dirty = true;

		this.performingTick = false;

		this.pauseWithGame = true;
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
		html.find(".disable-all-lights").click(
			async event => {
				event.preventDefault();

				if (this.monitoredLightSources.length <= 0) return;

				for (const actorData of this.monitoredLightSources) {
					if (actorData.lightSources.length <= 0) continue;

					const actor = game.actors.get(actorData._id);

					for (const itemData of actorData.lightSources) {
						actor.updateEmbeddedDocuments("Item", [{
							_id: itemData._id,
							"system.light.active": false,
						}]);

						actor.turnLightOff();
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
			}
		);

		html.find(".disable-light").click(
			event => {
				event.preventDefault();
				const itemId = $(event.currentTarget).data("item-id");
				const actorId = $(event.currentTarget).data("actor-id");

				const actor = game.actors.get(actorId);
				const item = actor.getEmbeddedDocument("Item", itemId);

				const active = !item.system.light.active;

				const dataUpdate = {
					_id: itemId,
					"system.light.active": active,
				};

				actor.updateEmbeddedDocuments("Item", [dataUpdate]);

				actor.yourLightWentOut(itemId);

				this.dirty = true;
			}
		);
	}

	/** @override */
	async getData(options) {
		const context = {
			monitoredLightSources: this.monitoredLightSources,
			paused: this._isPaused(),
		};

		return context;
	}

	async render(force, options) {
		// Don't allow non-GM users to view the UI
		if (!game.user.isGM) return;

		super.render(force, options);
	}

	async start() {
		this.pauseWithGame = game.settings.get(
			"shadowdark", "pauseLightTrackingWithGame"
		);

		// Make sure we're actualled enable and are supposed to be running.
		//
		if (this._isDisabled()) {
			console.log(`${this._logHeader()} Disabled in Settings`);
			return;
		}

		// we only run the timer on the GM instance
		if (!game.user.isGM) return;

		// Now we can actually start properly
		//
		console.log(`${this._logHeader()} Starting`);

		// First get a list of all active light sources in the world
		//
		await this._gatherLightSources();

		// Setup the housekeeping interval which will check for changes
		// to lightsources
		//
		this.housekeepingIntervalId = setInterval(
			this._updateLightSources.bind(this),
			this.housekeepingInterval
		);

		// Now set up the timer interval used to update all light sources
		//
		const updateMins = game.settings.get(
			"shadowdark", "trackLightSourcesInterval"
		);

		this.updateInterval = updateMins * 60 * 1000 || DEFAULT_UPDATE_INTERVAL_MS;
		this.updateIntervalId = setInterval(
			this._performTick.bind(this),
			this.updateInterval
		);

		console.log(`${this._logHeader()} Updating every ${updateMins} minutes.`);

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

		this._onToggleLightSource();
	}

	async _deleteActorHook(actor, options, userId) {
		if (!(this._isEnabled() && game.user.isGM)) return;

		console.log("_deleteActorHook");

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

		this.dirty = false;
		this.updatingLightSources = true;

		console.log(`${this._logHeader()} Checking for new/changed light sources`);

		this.monitoredLightSources = [];

		const workingLightSources = [];

		try {
			for (const user of game.users) {
				if (user.isGM) continue;

				if (!(user.active || this._monitorInactiveUsers())) continue;

				const actor = user.character;
				if (!actor) continue; // User may not have an Actor yet

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
		return game.paused && this.pauseWithGame;
	}

	_logHeader() {
		return `LightSourceTrackerSD | ${new Date().toISOString()} |`;
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

	async _pauseGameHook() {
		this.render(false);
	}

	async _performTick() {
		console.log(`${this._logHeader()} Performing Tick.`);

		if (!(this._isEnabled() && game.user.isGM)) return;

		if (this._isPaused()) return;

		if (this.updatingLightSources) return; // Updating light sources

		this.performingTick = true;

		const now = Date.now();
		const elapsed = (now - this.lastUpdate) / 1000;

		this.lastUpdate = now;

		try {
			for (const actorData of this.monitoredLightSources) {
				console.log(`${this._logHeader()} Updating Light Sources for ${actorData.name}`);

				for (const itemData of actorData.lightSources) {
					const actor = await game.actors.get(actorData._id);

					const light = itemData.system.light;

					light.remainingSecs -= elapsed;

					if (light.remainingSecs <= 0) {
						console.log(`${this._logHeader()} Light Source '${itemData.name}' has expired.`);

						await actor.yourLightExpired(itemData._id);

						await actor.deleteEmbeddedDocuments("Item", [itemData._id]);
					}
					else {
						console.log(`${this._logHeader()} Light Source '${itemData.name}' has ${light.remainingSecs}s remaining`);

						const item = await actor.getEmbeddedDocument(
							"Item", itemData._id
						);

						await item.update({
							"system.light.remainingSecs": light.remainingSecs,
						});
					}
				}
			}

			this.render(false);
		}
		catch(error) {
			console.log(`${this._logHeader()} An error ocurred: ${error}`);
			console.error(error);
		}

		this.performingTick = false;
	}

	async _settingsChanged() {
		if (!game.user.isGM) return;

		this.pauseWithGame = game.settings.get(
			"shadowdark", "pauseLightTrackingWithGame"
		);

		if (this._isEnabled()) {
			this._gatherLightSources();
			this.render();
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

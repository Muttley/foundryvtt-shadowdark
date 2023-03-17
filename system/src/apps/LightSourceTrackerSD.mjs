const DEFAULT_UPDATE_INTERVAL_MS = 60 * 1000; // 10 seconds in milliseconds

export default class LightSourceTrackerSD extends Application {

	constructor(object, options) {
		super(object, options);

		this.monitoredLightSources = {};
		this.updateInterval = DEFAULT_UPDATE_INTERVAL_MS;
		this.updateIntervalId = null;
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

	/** @override */
	async getData(options) {
		const context = {
			monitoredLightSources: this.monitoredLightSources,
		};

		return context;
	}

	async render(force, options) {
		if (!game.user.isGM) return;

		super.render(force, options);
	}

	async start() {
		// Make sure we're actualled enable and are supposed to be running.
		//
		if (this._isDisabled()) {
			console.log("Shadowdark RPG::LightSourceTrackerSD | Disabled in Settings");
			return;
		}

		// we only run the timer on the GM instance
		if (!game.user.isGM) return;

		// Now we can actually start properly
		//
		console.log("Shadowdark RPG::LightSourceTrackerSD | Starting");

		// First get a list of all active light sources in the world
		//
		await this._gatherLightSources();

		// Now set up the timer interval used to update all light sources
		//
		const updateSecs = game.settings.get(
			"shadowdark", "trackLightSourcesInterval"
		);

		this.updateInterval = updateSecs * 1000 || DEFAULT_UPDATE_INTERVAL_MS;
		this.updateIntervalId = setInterval(
			this._performTick.bind(this),
			this.updateInterval
		);

		console.log(`Shadowdark RPG::LightSourceTrackerSD | Updating every ${updateSecs} secs.`);

		if (game.settings.get("shadowdark", "trackLightSourcesOpen")) {
			this.render(true);
		}
	}

	async toggleInterface() {
		if (!game.user.isGM) {
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

		this._onToggleLightSource(actor, item);
	}

	async _gatherLightSources() {
		this.monitoredLightSources = {};
		for (const user of game.users) {
			if (user.isGM) continue;
			if (!user.active) continue;

			const actor = user.character;
			if (!actor) continue;

			const activeLightSources = await actor.getActiveLightSources();
			this.monitoredLightSources[actor.id] = {
				actorId: actor.id,
				actorName: actor.name,
				lightSources: {},
			};

			for (const lightSource of activeLightSources) {
				const newLightSource = {
					itemId: lightSource.id,
					name: lightSource.name,
					light: lightSource.system.light,
				};

				this.monitoredLightSources[actor.id]
					.lightSources[lightSource.id] = newLightSource;
			}
		}
	}

	_isDisabled() {
		return !this._isEnabled();
	}

	_isEnabled() {
		return game.settings.get("shadowdark", "trackLightSources");
	}

	async _onDeleteItem(document, options, userId) {
		if (!(this._isEnabled() && game.user.isGM)) return;

		await this._gatherLightSources();
		this.render(false);
	}

	async _onToggleLightSource(actor, item) {
		if (!(this._isEnabled() && game.user.isGM)) return;

		if (item.system.light.active) {
			const lightSource = {
				itemId: item._id,
				name: item.name,
				light: item.system.light,
			};

			if (!this.monitoredLightSources[actor._id]) {
				this.monitoredLightSources[actor._id] = {
					actorId: actor._id,
					actorName: actor.name,
					lightSources: {},
				};
			}

			this.monitoredLightSources[actor._id]
				.lightSources[item._id] = lightSource;
		}
		else {
			delete this.monitoredLightSources[actor._id]?.lightSources[item._id];
		}

		this.render(false);
	}

	async _onTrackerEnabledToggle(enabled) {
		console.log(`Tracker Enabled: ${enabled}`);

		if (!(this._isEnabled() && game.user.isGM)) return;
		// TODO If enabled, populate lightSources setting with currently active
		// light sources.

		// TODO If disabled, remove all light sources from lightSources setting
	}

	async _onUserConnected(user, connected) {
		console.log(`Shadowdark RPG::LightSourceTrackerSD | ${user.name}, connected: ${connected}`);
		await this._gatherLightSources();
		this.render(false);
	}

	async _performTick() {
		console.log("Shadowdark RPG::LightSourceTrackerSD | Performing Tick.");
		for (const actorId in this.monitoredLightSources) {
			const actor = this.monitoredLightSources[actorId];
			console.log(`Updating Light Sources for ${actor.actorName}`);

			for (const lightId in actor.lightSources) {
				const item = actor.lightSources[lightId];
				item.light.remainingSecs -= (this.updateInterval / 1000);
				if (item.light.remainingSecs <= 0) {
					// TODO delete the light
				}

				const dataUpdate = {
					_id: lightId,
					"system.light.remainingSecs": item.light.remainingSecs,
				};

				await game.actors.get(actorId).updateEmbeddedDocuments("Item", [dataUpdate]);
				this.render(false);
			}
		}
	}

}

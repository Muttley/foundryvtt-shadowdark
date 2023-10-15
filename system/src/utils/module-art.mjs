export class ModuleArt {
	constructor() {
		/**
		 * The stored map of actor UUIDs to their art information.
		 * @type {Map<string, ModuleArtInfo>}
		 */
		Object.defineProperty(this, "map", {value: new Map(), writable: false});
	}

	/* -------------------------------------------- */

	/**
	 * Set to true to temporarily prevent actors from loading module art.
	 * @type {boolean}
	 */
	suppressArt = false;

	static getModuleArtPath(module) {
		const flags = module.flags?.[module.id];
		const artPath = flags?.["shadowdark-art"];
		if (!artPath || !module.active) return null;
		return artPath;
	}

	/**
	 * Register any art mapping information included in active modules.
	 * @returns {Promise<void>}
	 */
	async registerModuleArt() {
		this.map.clear();

		for (const module of game.modules) {
			const artPath = this.constructor.getModuleArtPath(module);

			if (!artPath) continue;

			try {
				const mapping = await foundry.utils.fetchJsonWithTimeout(artPath);
				await this.parseArtMapping(module.id, mapping);
			}
			catch(e) {
				console.error(e);
			}
		}
	}

	async parseArtMapping(moduleId, mapping) {
		let settings = game.settings.get(
			"shadowdark", "moduleArtConfiguration"
		)?.[moduleId];

		settings ??= {portraits: true, tokens: true};

		for (let [packName, actors] of Object.entries(mapping)) {
			packName = packName === "shadowdark.monster"
				? "shadowdark.monsters"
				: packName;

			const pack = game.packs.get(packName);

			if (!pack) continue;

			for (let [actorId, info] of Object.entries(actors)) {
				const entry = pack.index.get(actorId);

				if (!entry || !(settings.portraits || settings.tokens)) continue;

				if (settings.portraits) {
					entry.img = info.actor;
				}
				else {
					delete info.actor;
				}

				if (!settings.tokens) delete info.token;

				const uuid = `Compendium.${packName}.${actorId}`;

				info = foundry.utils.mergeObject(
					this.map.get(uuid) ?? {}, info, {inplace: false}
				);

				this.map.set(`Compendium.${packName}.${actorId}`, info);
			}
		}
	}
}

export class ModuleArtConfig extends FormApplication {

	/** @inheritdoc */
	constructor(object={}, options={}) {
		object = foundry.utils.mergeObject(
			game.settings.get("shadowdark", "moduleArtConfiguration"),
			object,
			{inplace: false}
		);
		super(object, options);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("SHADOWDARK.settings.module_art.label"),
			id: "module-art-config",
			template: "systems/shadowdark/templates/apps/module-art-config.hbs",
			popOut: true,
			width: 600,
			height: "auto",
		});
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	getData(options={}) {
		const context = super.getData(options);

		context.config = [];

		for (const module of game.modules) {
			if (!ModuleArt.getModuleArtPath(module)) continue;
			const settings = this.object[module.id] ?? {portraits: true, tokens: true};
			context.config.push({label: module.title, id: module.id, ...settings});
		}

		context.config.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

		context.config.unshift({
			label: game.system.title,
			id: game.system.id,
			...this.object.shadowdark,
		});

		return context;
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _updateObject(event, formData) {
		await game.settings.set(
			"shadowdark", "moduleArtConfiguration",
			foundry.utils.expandObject(formData)
		);
		return SettingsConfig.reloadConfirm({world: true});
	}
}

export default class ItemSD extends foundry.documents.Item {

	static migrateData(data) {
		// migrate legacy Scolls and Wands
		if (["Scroll", "Wand"].includes(data.type) && data.system?.spellName) {
			foundry.utils.setProperty(data, "flags.shadowdark.legacyData", foundry.utils.deepClone(data.system));
		}
		return super.migrateData(data);
	}

	get typeSlug() {
		return this.type.slugify();
	}

	get usesAmmunition() {
		return (game.settings.get("shadowdark", "autoConsumeAmmunition")
			&& this.isOwned
			&& this.actor.type === "Player"
			&& this.type === "Weapon"
			&& this.system.ammoClass !== ""
		);
	}

	/* Set the start time and initiative roll of newly created effect */
	/** @override */
	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		const updateData = {};

		const replaceImage = data.img === undefined || data.img === "icons/svg/item-bag.svg";
		const defaultImage = CONFIG.SHADOWDARK.DEFAULTS.ITEM_IMAGES[this.type];

		// Only change the image if it is the default Foundry item icon
		if (defaultImage && replaceImage) {
			updateData.img = defaultImage;
		}

		// Store the creation time & initiative on the effect
		if (data.type === "Effect") {
			const combatTime = (game.combat)
				? `${game.combat.round}.${game.combat.turn}`
				: null;

			updateData["flags.shadowdark.start"] = {
				value: game.time.worldTime,
				combatTime,
			};
		}

		if (!foundry.utils.isEmpty(updateData)) {
			this.updateSource(updateData);
		}
	}


	availableAmmunition() {
		if (this.usesAmmunition) {
			return this.actor.ammunitionItems(this.system.ammoClass);
		}
	}


	lightRemainingString() {
		if (this.type !== "Basic" && !this.system.light.isSource) return;

		if (this.system.light.remainingSecs < 60) {
			this.lightSourceTimeRemaining = game.i18n.localize(
				"SHADOWDARK.inventory.item.light_seconds_remaining"
			);
		}
		else {
			const timeRemaining = Math.ceil(
				this.system.light.remainingSecs / 60
			);

			this.lightSourceTimeRemaining = game.i18n.format(
				"SHADOWDARK.inventory.item.light_remaining",
				{ timeRemaining }
			);
		}
	}


	async reduceAmmunition(amount) {
		const newAmount = Math.max(0, this.system.quantity - amount);
		await this.update({"system.quantity": newAmount});
	}


	setLightRemaining(remainingSeconds) {
		this.update({"system.light.remainingSecs": remainingSeconds});
	}


	isActiveLight() {
		return this.isLight() && this.system.light.active;
	}

	isLight() {
		return ["Basic", "Effect"].includes(this.type) && this.system.light.isSource;
	}

	isSpell() {
		return ["Scroll", "Spell", "Wand"].includes(this.type);
	}

	npcAttackRangesDisplay() {
		let ranges = [];

		if (this.type === "NPC Attack" || this.type === "NPC Special Attack") {
			for (const key of this.system.ranges) {
				ranges.push(
					CONFIG.SHADOWDARK.RANGES[key]
				);
			}
		}

		return ranges.join(", ");
	}


	async getPropertyItems() {
		const propertyItems = [];

		for (const uuid of this.system.properties ?? []) {
			propertyItems.push(await fromUuid(uuid));
		}

		return propertyItems;
	}


	/**
	 * Returns the total duration depending on the type
	 * of effect that is configured.
	 * @return {number|Infinity}
	 */
	get totalDuration() {
		const { duration } = this.system;
		if (["unlimited", "focus", "permanent"].includes(duration.type)) {
			return Infinity;
		}
		else if (["instant"].includes(duration.type)) {
			return 0;
		}
		else {
			return duration.value
				* (CONFIG.SHADOWDARK.DURATION_UNITS[duration.type] ?? 0);
		}
	}


	/**
	 * Calculates the remaining duration, if the Effect is expired, and
	 * the progress of the effect (current vs total time).
	 * Returns false for non-Effect items
	 * @returns {false|{expired: boolean, remaining: Int, progress: Int}}
	 */
	get remainingDuration() {
		if (this.type !== "Effect") return false;

		// Handle rounds-effects
		if (this.system.duration.type === "rounds") {
			// If there is combat, check if it was added during combat, otherwise
			// consider it expired
			if (game.combat) {
				const startCombatTime = this.getFlag("shadowdark", "start")?.combatTime ?? null;
				if (!startCombatTime) return { expired: true, remaining: 0, progress: 100 };

				const round = startCombatTime.split(".")[0];
				const turn = startCombatTime.split(".")[1];

				// If it is a new round or the same turn the effect
				// was initiated, calculate duration
				if (
					round !== game.combat.round
					|| turn !== game.combat.turn
				) {
					const duration = parseInt(this.system.duration.value, 10);
					const remaining = parseInt(round, 10) + duration - game.combat.round;
					const progress = (100 - Math.floor(100 * remaining / duration));
					return {
						expired: remaining <= 0,
						remaining,
						progress,
					};
				}
				else {
					return false;
				}
			}
			// If added outside combat, expire the effect
			else {
				return { expired: true, remaining: 0, progress: 100 };
			}
		}

		// Handle timing effects
		const duration = this.totalDuration;

		if (duration === Infinity) {
			return { expired: false, remaining: Infinity, progress: 0 };
		}
		else if (!duration) {
			return { expired: true, remaining: 0, progress: 0 };
		}
		else {
			const start = this.getFlag("shadowdark", "start")?.value ?? 0;
			const remaining = start + duration - game.time.worldTime;
			const progress = (100 - Math.floor(100 * remaining / duration));
			const result = { expired: remaining <= 0, remaining, progress };
			return result;
		}
	}
}

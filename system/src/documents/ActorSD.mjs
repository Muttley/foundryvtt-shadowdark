export default class ActorSD extends foundry.documents.Actor {

	_animateHpChange(delta) {
		if (!game.settings.get("shadowdark", "animateHpChange")) return;
		try {
			const isDamage = delta < 0;
			const color = isDamage
				? CONFIG.SHADOWDARK.TOKEN_HP_COLORS.damage
				: CONFIG.SHADOWDARK.TOKEN_HP_COLORS.healing;

			const tokens = this.isToken ? [this.token] : this.getActiveTokens(true, true);
			for (const tokenDoc of tokens) {
				// Suppress further effects if the token is marked as defeated in combat tracker
				if (tokenDoc.hasStatusEffect(CONFIG.specialStatusEffects.DEFEATED)) continue;

				// Flash dynamic ring if enabled
				if (tokenDoc.ring.enabled) {
					const anim = isDamage ? {
						duration: 500,
						easing: tokenDoc.object.ring.constructor.easeTwoPeaks,
					} : {};
					tokenDoc.object.ring.flashColor(Color.from(color), anim);
				}

				// Create scrolling combat text for HP delta
				const hpPercent = Math.clamp(
					Math.abs(delta) / (this.system.attributes.hp.max || 1),
					0,
					1
				);
				canvas.interface.createScrollingText(tokenDoc.object.center, delta.signedString(), {
					anchor: CONST.TEXT_ANCHOR_POINTS.TOP,
					fontSize: 16 + (32 * hpPercent),
					fill: color,
					stroke: 0x000000,
					strokeThickness: 4,
					jitter: 0.25,
				});
			}
		}
		catch(error) {
			console.error("Dynamic Token Ring Error:", error);
		}
	}

	async _onUpdate(data, options, userId) {
		super._onUpdate(data, options, userId);

		// If _preUpdate captured a previous HP value, animate the change
		const prev = options?.shadowdark?.prevHpValue;
		if (prev !== undefined && this.system.attributes?.hp?.value) {
			const delta = this.system.attributes.hp.value - prev;
			if (delta !== 0) this._animateHpChange(delta);
		}
	}

	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// Some sensible token defaults for Actors
		const prototypeToken = {
			actorLink: false,
			sight: {
				enabled: false,
			},
		};

		if (data.type === "Player") {
			prototypeToken.sight.enabled = true;
			prototypeToken.actorLink = true;
		}

		const update = {prototypeToken};

		if (!data.img) {
			const image = CONFIG.SHADOWDARK.DEFAULTS.ACTOR_IMAGES[data.type];

			if (image) {
				update.img = image;
				update.prototypeToken.texture = {
					src: image,
				};
			}
		}

		this.updateSource(update);
	}

	async _preUpdate(data, options, userId) {
		await super._preUpdate(data, options, userId);

		// for HP changes, store a transient value to the update options for use in _onUpdate
		const hpValuePath = "system.attributes.hp.value";
		if (foundry.utils.hasProperty(data, hpValuePath)) {
			(options.shadowdark ??= {}).prevHpValue = this.system.attributes.hp.value;
		}
	}


	ammunitionItems(key) {
		return this.system.getPhysicalItems().filter(i => {
			if (key) {
				return i.system.isAmmunition
					&& i.system.quantity > 0
					&& i.name.slugify() === key;
			}
			else {
				return i.system.isAmmunition && i.system.quantity > 0;
			}
		});
	}

	/**
	 * Applies the given number to the Actor or Token's HP value.
	 * The multiplier is a convenience feature to apply healing
	 *  or true multiples of a damage value.
	 *  * 1 => damage as rolled
	 *  * 0.5 => half damage (resistance)
	 *  * -1 => healing
	 *
	 * @param {number} damageAmount
	 * @param {number} multiplier
	 */
	async applyDamage(damageAmount, multiplier=1) {
		const maxHpValue = this.system.attributes.hp.max;
		const currentHpValue = this.system.attributes.hp.value;
		const amountToApply = Math.floor(parseInt(damageAmount) * multiplier);

		// Ensures that we don't go above Max or below Zero
		const newHpValue = Math.clamp(currentHpValue - amountToApply, 0, maxHpValue);

		this.update({
			"system.attributes.hp.value": newHpValue,
		});

		if (newHpValue === 0 && multiplier === 1) this._setDefeated();
	}

	async changeLightSettings(lightData) {
		const token = this.getCanvasToken();
		if (token) await token.document.update({light: lightData});

		// Update the prototype as well
		await Actor.updateDocuments([{
			"_id": this._id,
			"prototypeToken.light": lightData,
		}]);
	}


	async getActiveLightSources() {
		const items = this.items.filter(
			item => item.isActiveLight()
		).sort((a, b) => {
			const a_name = a.name.toLowerCase();
			const b_name = b.name.toLowerCase();
			if (a_name < b_name) {
				return -1;
			}
			if (a_name > b_name) {
				return 1;
			}
			return 0;
		});

		return items;
	}

	/**
	 * Returns any tokens linked to this actor on the currently viewed scene
	 * @returns {Token}
	 */
	getCanvasToken() {
		const ownedTokens = canvas.tokens.ownedTokens;
		return ownedTokens.find(
			token => token.document.actorId === this._id
		);
	}

	/**
	 * Foundry standard method providing actor data for rolls.
	 * Returns this.system unless modified by the objects data model.
	 * @returns {rollData}
	 */
	getRollData() {
		const rollData = {...this.system};
		if (this.system._modifyRollData instanceof Function) {
			this.system._modifyRollData(rollData);
		}
		return rollData;
	}

	async hasActiveLightSources() {
		return this.getActiveLightSources.length > 0;
	}

	async hasNoActiveLightSources() {
		return this.getActiveLightSources.length <= 0;
	}

	/**
	 * // Check that the Actor is claimed by a User
	 * @returns {boolean}
	 */
	async isClaimedByUser() {
		return game.users.find(user => user.character?.id === this.id)
			? true
			: false;
	}

	/** @inheritDoc */
	prepareData() {
		super.prepareData();
		if (this.type === "Player") {
			if (canvas.ready && game.user.character === this) {
				game.shadowdark.effectPanel.refresh();
			}
		}
	}

	async _setDefeated() {
		// If this actor is in a combat tracker, then set them as defeated and
		// add the "dead" effect icon to the token in the scene
		//
		for (const combat of game.combats) {
			for (const combatant of combat.combatants) {

				// Make sure we"re matching on the correct id depending on whether we"re
				// a linked actor, or just a token
				//
				const matchFound = this.isToken
					? combatant.tokenId === this.token.id
					: combatant.actorId === this.id;

				if (!matchFound) continue;

				combatant.update({defeated: true});

				const token = combatant.token;

				if (!token) return;

				const actor = token.actor;

				if (!actor) return;

				const statusEffectOptions = { active: true, overlay: true };

				let newStatusEffects = [];
				if (actor.type === "Player") {
					newStatusEffects.push("prone", "unconscious");
				}
				else {
					newStatusEffects.push("dead");
				}

				for (const effect of newStatusEffects) {
					actor.toggleStatusEffect(effect, statusEffectOptions);
				}
			}
		}
	}

	async toggleLight(active, itemId) {
		if (active) {
			await this.turnLightOn(itemId);
		}
		else {
			await this.turnLightOff();
		}
	}


	async turnLightOff() {
		const noLight = {
			dim: 0,
			bright: 0,
		};

		await this.changeLightSettings(noLight);
	}


	async turnLightOn(itemId) {
		const item = this.items.get(itemId);
		const light = item.system.light;
		const lightData = {
			alpha: 0.2,
			angle: 360,
			animation: {
				intensity: 1,
				reverse: false,
				speed: 1,
				type: light.animation || null,
			},
			attenuation: 0.5,
			bright: light.bright,
			color: light.color || null,
			coloration: 1,
			contrast: 0,
			darkness: {
				max: 1,
				min: 0,
			},
			dim: light.dim,
			luminosity: 0.5,
			saturation: 0,
			shadows: 0,
		};

		await this.changeLightSettings(lightData);
	}

	async yourLightExpired(itemId) {
		this.turnLightOff(itemId);

		const item = this.items.get(itemId);

		const cardData = {
			img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
			actor: this,
			message: game.i18n.format(
				"SHADOWDARK.chat.light_source.expired",
				{
					name: this.name,
					lightSource: item.name,
				}
			),
		};

		let template = "systems/shadowdark/templates/chat/lightsource-toggle-gm.hbs";

		const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}


	async yourLightWentOut(itemId) {
		this.toggleLight(false, itemId);

		const item = this.items.get(itemId);

		const cardData = {
			img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
			actor: this,
			message: game.i18n.format(
				"SHADOWDARK.chat.light_source.went_out",
				{
					name: this.name,
					lightSource: item.name,
				}
			),
		};

		let template = "systems/shadowdark/templates/chat/lightsource-toggle-gm.hbs";

		const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}

	buildOptionsForSkipPrompt(event, options = {}) {
		options = foundry.utils.mergeObject(options, {
			skipPrompt: event.shiftKey || event.altKey || event.ctrlKey || event.metaKey
				? true : false,
			adv: 0,
		});

		if (event.altKey) {
			options.adv = 1;
		}
		else if (event.ctrlKey || event.metaKey) {
			options.adv = -1;
		}

		return options;
	}
}

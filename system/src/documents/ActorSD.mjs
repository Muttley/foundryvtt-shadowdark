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
		return this.items.filter(i => {
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
	async applyDamage(damageAmount, multiplier) {
		const maxHpValue = this.system.attributes.hp.max;
		const currentHpValue = this.system.attributes.hp.value;
		const amountToApply = Math.floor(parseInt(damageAmount) * multiplier);

		// Ensures that we don't go above Max or below Zero
		const newHpValue = Math.clamped(currentHpValue - amountToApply, 0, maxHpValue);

		this.update({
			"system.attributes.hp.value": newHpValue,
		});
	}


	async canUseMagicItems() {
		const characterClass = await this.system.getClass();

		const spellcastingClass =
			characterClass?.system?.spellcasting?.ability ?? "";

		return characterClass && spellcastingClass !== ""
			? true
			: false;
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

		// Get the mappings
		const lightSources = await foundry.utils.fetchJsonWithTimeout(
			"systems/shadowdark/assets/mappings/map-light-sources.json"
		);

		const lightData = lightSources[
			item.system.light.template
		].light;

		await this.changeLightSettings(lightData);
	}


	async useAbility(itemId, options={}) {
		const item = this.items.get(itemId);

		if (item.type === "NPC Feature") return item.displayCard();

		// does ability use on a roll check?
		let success = true;
		let rolled = false;
		if (item.system.ability) {
			rolled = true;
			options = foundry.utils.mergeObject({target: item.system.dc}, options);
			const result = await this.rollAbility(
				item.system.ability,
				options
			);

			// Abort if prompt is closed
			if (!result) return;

			success = result?.rolls?.main?.success ?? false;

			if (!success && item.system.loseOnFailure) {
				item.update({"system.lost": true});
			}
		}

		// If the ability has limited uses, deduct
		if (item.system.limitedUses) {
			if (item.system.uses.available <= 0) {
				return ui.notifications.error(
					game.i18n.format("SHADOWDARK.error.class_ability.no-uses-remaining"),
					{permanent: false}
				);
			}
			else {
				const newUsesAvailable = item.system.uses.available - 1;

				item.update({
					"system.uses.available": Math.max(0, newUsesAvailable),
				});
			}
		}

		const abilityDescription = await TextEditor.enrichHTML(
			item.system.description,
			{
				secrets: this.isOwner,
				async: true,
				relativeTo: this,
			}
		);

		return shadowdark.chat.renderUseAbilityMessage(this.actor, {
			flavor: game.i18n.localize("SHADOWDARK.chat.use_ability.title"),
			templateData: {
				abilityDescription,
				actor: this,
				item: item,
				rolled,
				success,
			},
		});
	}


	async usePotion(itemId) {
		const item = this.items.get(itemId);

		renderTemplate(
			"systems/shadowdark/templates/dialog/confirm-use-potion.hbs",
			{name: item.name}
		).then(html => {
			new Dialog({
				title: "Confirm Use",
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							const potionDescription = await item.getEnrichedDescription();

							const cardData = {
								actor: this,
								item: item,
								message: game.i18n.format(
									"SHADOWDARK.chat.potion_used",
									{
										name: this.name,
										potionName: item.name,
									}
								),
								potionDescription,
							};

							let template = "systems/shadowdark/templates/chat/potion-used.hbs";

							const content = await renderTemplate(template, cardData);

							await ChatMessage.create({
								content,
								rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
							});

							await this.deleteEmbeddedDocuments(
								"Item",
								[itemId]
							);
						},
					},
					Cancel: {
						icon: "<i class=\"fa fa-times\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					},
				},
				default: "Yes",
			}).render(true);
		});
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

		const content = await renderTemplate(template, cardData);

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

		const content = await renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}

}

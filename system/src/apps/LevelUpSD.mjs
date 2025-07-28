export default class LevelUpSD extends FormApplication {

	constructor(uid) {
	    super();
		this.firstrun = true;
		this.data = {};
		this.data.rolls = {
			hp: 0,
			hpEdit: false,
			talent: false,
			boon: false,
		};
		this.data.actor = game.actors.get(uid);
		this.data.talents = [];
		this.data.spells = {};
		this.data.talentsRolled = false;
		this.data.talentsChosen = false;

		for (let i = 1; i <= 5; i++) {
			this.data.spells[i] = {
				name: "Tier ".concat(i),
				max: 0,
				objects: [],
			};
		}
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "level-up"],
			height: "auto",
			width: 300,
			resizable: false,
			closeOnSubmit: true,
			submitOnChange: false,
			dragDrop: [{dropSelector: ".items"}],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/level-up.hbs";
	}

	/** @inheritdoc */
	get title() {
	    const title = game.i18n.localize("SHADOWDARK.apps.level-up.title");
		return `${title}`;
	}

	/** @inheritdoc */
	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-action='roll-hp']").click(
			event => this._onRollHP(event)
		);

		html.find("[data-action='re-roll-hp']").click(
			event => this._onReRollHP(event)
		);

		html.find("[data-action='view-boon-table']").click(
			event => this._viewBoonTable(event)
		);

		html.find("[data-action='view-talent-table']").click(
			event => this._viewTalentTable(event)
		);

		html.find("[data-action='open-spellbook']").click(
			event => this._openSpellBook(event)
		);

		html.find("[data-action='delete-talent']").click(
			event => this._onDeleteTalent(event)
		);

		html.find("[data-action='delete-spell']").click(
			event => this._onDeleteSpell(event)
		);

		html.find("[data-action='roll-boon']").click(
			event => this._onRollBoon(event)
		);

		html.find("[data-action='roll-talent']").click(
			event => this._onRollTalent(event)
		);

		html.find("[data-action='finalize-level-up']").click(
			event => this._onLevelUp(event)
		);
	}

	/** @inheritdoc */
	_canDragDrop() {
		return true;
	}

	/** @override */
	async getData(options) {
		if (this.firstrun) {
			this.firstrun = false;
			this.data.class = await fromUuid(this.data.actor.system.class);
			this.data.talentTable = await fromUuid(this.data.class.system.classTalentTable);
			this.data.currentLevel = this.data.actor.system.level.value;
			this.data.targetLevel =  this.data.currentLevel + 1;
			this.data.talentGained = (this.data.targetLevel % 2 !== 0);
			this.data.totalSpellsToChoose = 0;

			this.data.patron = await fromUuid(this.data.actor.system.patron);

			this.data.boonTable = this.data.patron
				? await fromUuid(this.data.patron.system.boonTable)
				: undefined;

			this.data.startingBoons = 0;
			const classData = this.data.class.system;
			this.data.canRollBoons = classData.patron.required;

			const needsStartingBoons = classData.patron.required
				&& classData.patron.startingBoons > 0;

			if (this.data.targetLevel === 1 && needsStartingBoons) {
				this.data.startingBoons = classData.patron.startingBoons;
			}

			if (await this.data.actor.isSpellCaster()) {
				this.data.spellcastingClass =
					this.data.class.system.spellcasting.class === ""
						? this.data.actor.system.class
						: this.data.class.system.spellcasting.class;

				// calculate the spells gained for the target level from the spells known table
				if (this.data.class.system.spellcasting.spellsknown) {
					// setup known spells for this level
					let currentSpells = {1: null, 2: null, 3: null, 4: null, 5: null};
					let targetSpells = {1: null, 2: null, 3: null, 4: null, 5: null};

					if (1 <= this.data.currentLevel && this.data.currentLevel <= 10) {
						currentSpells =
						this.data.class.system.spellcasting.spellsknown[this.data.currentLevel];
					}
					if (1 <= this.data.targetLevel && this.data.targetLevel <= 10) {
						targetSpells =
						this.data.class.system.spellcasting.spellsknown[this.data.targetLevel];
					}

					Object.keys(targetSpells).forEach(k => {
						this.data.spells[k].max = targetSpells[k] - currentSpells[k];
						this.data.totalSpellsToChoose += this.data.spells[k].max;
					});
				}
				else {
					ui.notifications.warn("Class missing Spells Known Table");
				}

			}
		}
		this.data.talentsRolled = this.data.rolls.talent || this.data.rolls.boon;
		this.data.talentsChosen = this.data.talents.length > 0;

		return this.data;
	}

	/** @override */
	async _onDrop(event) {
		// get item that was dropped based on event
		const eventData = TextEditor.getDragEventData(event);
		const itemObj = await fromUuid(eventData.uuid);

		if (itemObj && eventData.type === "Item") {
			switch (itemObj.type) {
				case "Talent":
				 	this._onDropTalent(itemObj);
					break;
				case "Spell":
					this._onDropSpell(itemObj);
					break;
				default:
					break;
			}
		}
	}

	async _viewBoonTable() {
		this.data.boonTable.sheet.render(true);
	}

	async _viewTalentTable() {
		this.data.talentTable.sheet.render(true);
	}

	async _openSpellBook() {
		this.data.actor.openSpellBook();
	}

	async _onRollHP({isReroll = false}) {
		const data = {
			rollType: "hp",
			actor: this.data.actor,
		};
		let options = {};

		options.title = isReroll
			? game.i18n.localize("SHADOWDARK.dialog.hp_re_roll.title")
			: game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");

		options.flavor = options.title;
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-hp.hbs";
		options.skipPrompt = true;

		let parts = [this.data.class.system.hitPoints];
		let advantage = 0;
		if (data.actor?.hasAdvantage(data)) advantage = 1;

		const result = await CONFIG.DiceSD.Roll(parts, data, false, advantage, options);

		this.data.rolls.hp = result.rolls.main.roll.total;
		ui.sidebar.activateTab("chat");
		this.render();
	}

	async _onReRollHP() {
		Dialog.confirm({
			title: "Re-Roll HP",
			content: "Are you sure you want to re-roll hit points?",
			yes: () => this._onRollHP({isReroll: true}),
			no: () => null,
			defaultYes: false,
		  });
	}

	async _onRollBoon() {
		if (!this.data.boonTable) {
			return ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.apps.level-up.errors.missing_boon_table")
			);
		}

		await this.data.boonTable.draw();
		ui.sidebar.activateTab("chat");

		if (this.data.targetLevel > 1) {
			this.data.rolls.talent = true;
		}
		this.data.rolls.boon = true;

		this.render();
	}

	async _onRollTalent() {
		await this.data.talentTable.draw();
		ui.sidebar.activateTab("chat");

		// Humans get extra talent at level 1 with the ambitious talent
		if (this.data.targetLevel === 1) {
			let ambitious = this.data.actor.items.find(x => x.name === "Ambitious");
			if (ambitious) {
				ChatMessage.create({
					flavor: "Ambitious",
					content: `${ambitious.system.description}`,
				});
				await this.data.talentTable.draw();
			}
		}

		if (this.data.targetLevel > 1) {
			this.data.rolls.boon = true;
		}
		this.data.rolls.talent = true;

		this.render();
	}

	async _onDropTalent(talentItem) {
		if (this.data.talentGained) {

			// checks for effects on talent and prompts if needed
			let talentObj = await shadowdark.effects.createItemWithEffect(talentItem);
			talentObj.system.level = this.data.targetLevel;
			talentObj.uuid = talentItem.uuid;
			this.data.talents.push(talentObj);
			this.render();
		}
	}

	_onDeleteTalent(event) {
		this.data.talents.splice($(event.currentTarget).data("index"), 1);
		this.render();
	}

	_onDropSpell(spellObj) {
		let spellTier = spellObj.system.tier;
		// Check to see if the spell is out of bounds
		if (1 > spellTier > 5) {
			ui.notifictions.error("Spell tier out of range");
			return;
		}
		// add spell if there is room in that tier
		if (this.data.spells[spellTier].objects.length < this.data.spells[spellTier].max) {
			this.data.spells[spellTier].objects.push(spellObj);
		}
		this.render();
	}

	_onDeleteSpell(event) {
		// get tier and index from passed event and remove that spell from array
		let tier = $(event.currentTarget).data("tier");
		let index = $(event.currentTarget).data("index");
		this.data.spells[tier].objects.splice(index, 1);
		this.render();
	}

	_onLevelUp() {

		let spellsSelected = true;
		for (let i = 1; i <= 5; i++) {
			if (this.data.spells[i].max > this.data.spells[i].objects.length) {
				spellsSelected = false;
			}
		}

		// Are all selections complete?
		switch (false) {
			case (this.data.rolls.hp > 0):
			case !(this.data.talentGained && this.data.talents.length < 1):
			case spellsSelected:
				Dialog.confirm({
					title: game.i18n.localize("SHADOWDARK.apps.level-up.missing_selections"),
					content: game.i18n.localize("SHADOWDARK.apps.level-up.prompt"),
					yes: () => this._finalizeLevelUp(),
					no: () => null,
					defaultYes: false,
				});
				break;
			default:
				this._finalizeLevelUp();
		}
	}

	async _finalizeLevelUp() {
		// update actor XP and level
		let newXP = 0;

		// carry over XP for all levels except level 0
		if (this.data.currentLevel > 0) {
			newXP = this.data.actor.system.level.xp - (this.data.actor.system.level.value * 10);
		}

		// Add items first as they may include HP / Con bonuses
		let allItems = [
			...this.data.talents,
		];

		// load all spells into allItems
		for (let i = 1; i <= 5; i++) {
			allItems = [
				...allItems,
				...this.data.spells[i].objects,
			];
		}

		// Names for audit log
		const itemNames = [];
		allItems.forEach(x => itemNames.push(x.name));

		// add talents and spells to actor
		await this.data.actor.createEmbeddedDocuments("Item", allItems);

		// calculate new HP base
		let newBaseHP = this.data.actor.system.attributes.hp.base + this.data.rolls.hp;
		let newValueHP = this.data.actor.system.attributes.hp.value + this.data.rolls.hp;
		let newMaxHP = newBaseHP + this.data.actor.system.attributes.hp.bonus;

		if (this.data.targetLevel === 1) {
			let hpConMod = this.data.actor.system.abilities.con.mod;
			// apply conmod to a set minimum 1 HP
			if ((this.data.rolls.hp + hpConMod) > 1) {
				newBaseHP = this.data.rolls.hp + hpConMod;

			}
			else {
				newBaseHP = 1;
			}
			newValueHP = newBaseHP + this.data.actor.system.attributes.hp.bonus;
			newMaxHP = newValueHP;
		}

		// load audit log, check for valid data, add new entry
		/*
		let auditLog = this.data.actor.system?.auditlog ?? {};
		if (auditLog.constructor !== Object) auditLog = {};

		auditLog[this.data.targetLevel] = {
			baseHP: newBaseHP,
			itemsGained: itemNames,
		};
		*/

		// update values on actor
		await this.data.actor.update({
			"system.attributes.hp.base": newBaseHP,
			"system.attributes.hp.max": newMaxHP,
			"system.attributes.hp.value": newValueHP,
			"system.level.value": this.data.targetLevel,
			"system.level.xp": newXP,
		});

		this.close();
	}
}

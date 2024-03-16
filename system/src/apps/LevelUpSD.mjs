export default class LevelUpSD extends FormApplication {

	constructor(uid) {
	    super();
		this.firstrun = true;
		this.data = {};
		this.data.rolls = {
			hp: 0,
			talent: false,
		};
		this.data.actor = game.actors.get(uid);
		this.data.talents = [];
		this.data.spells = {};

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
		return mergeObject(super.defaultOptions, {
			width: 275,
			resizable: false,
			closeOnSubmit: true,
			submitOnChange: false,
			dragDrop: [{dragSelector: ".item[draggable=true]"}],
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

		html.find("[data-action='roll-talent']").click(
			event => this._onRollTalent(event)
		);

		html.find("[data-action='finalize-level-up']").click(
			event => this._onFinalizeLevelUp(event)
		);
	}

	/** @override */
	async getData(options) {
		if (this.firstrun) {
			this.firstrun = false;
			this.data.class = await fromUuid(this.data.actor.system.class);
			this.data.talentTable = await fromUuid(this.data.class.system.classTalentTable);
			this.data.currentLevel = this.data.actor.system.level.value;
			this.data.targetLevel =  this.data.currentLevel +1;
			this.data.talentGained = (this.data.targetLevel % 2 !== 0);
			this.data.isSpellCaster = (this.data.class.system.spellcasting.class !== "__not_spellcaster__");
			if (this.data.isSpellCaster) {
				this.spellbook = new shadowdark.apps.SpellBookSD(this.data.class.uuid);

				// calculate the spells gained for the target level from the spells known table
				if (this.data.class.system.spellcasting.spellsknown) {
					// setup known spells for this level
					let currentSpells = {1: null, 2: null, 3: null, 4: null, 5: null};
					let targetSpells = {1: null, 2: null, 3: null, 4: null, 5: null};

					if (this.data.currentLevel >= 1) {
						currentSpells =
						this.data.class.system.spellcasting.spellsknown[this.data.currentLevel];
					}
					if (this.data.targetLevel <= 10) {
						targetSpells =
						this.data.class.system.spellcasting.spellsknown[this.data.targetLevel];
					}

					Object.keys(targetSpells).forEach(k => {
						this.data.spells[k].max = targetSpells[k] - currentSpells[k];
					});
				}
				else {
					ui.notifications.warn("Class missing Spells Known Table");
				}

			}
			console.log(this.data);
		}
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
		return super._onDrop();
	}

	async _viewTalentTable() {
		this.data.talentTable.sheet.render(true);
	}

	async _openSpellBook() {
		this.spellbook.render(true);
	}

	async _onRollHP() {
		this.data.actor.rollHP();
		ui.sidebar.activateTab("chat");
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

		this.data.rolls.talent = true;
		this.render();
	}

	_onDropTalent(talentObj) {
		talentObj.update({"system.level": this.data.targetLevel});
		this.data.talents.push(talentObj);
		this.render();
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

	async _onFinalizeLevelUp() {
		// update actor XP and level
		let newXP = 0;

		// carry over XP for all levels except level 0
		if (this.data.currentLevel > 0) {
			newXP = this.data.actor.system.level.xp - (this.data.actor.system.level.value * 10);
		}

		this.data.actor.update({
			"system.level.value": this.data.targetLevel,
			"system.level.xp": newXP,
		});

		const allItems = [
			...this.data.talents,
			...this.data.spells[1].objects, // avert your eyes to this
			...this.data.spells[2].objects,
			...this.data.spells[3].objects,
			...this.data.spells[4].objects,
			...this.data.spells[5].objects,
		];

		this.data.actor.createEmbeddedDocuments("Item", allItems);

		this.data.actor.sheet.render(true);
		this.close();

	}
}

import { ActorBaseSD } from "./_ActorBaseSD.mjs";
import * as actorFields from "./_fields/actorFields.mjs";

const TextEditor = foundry.applications.ux.TextEditor.implementation;

const fields = foundry.data.fields;

export default class NpcSD extends ActorBaseSD {
	static defineSchema() {
		const schema = {
			...actorFields.alignment(),
			...actorFields.level(),
			darkAdapted: new fields.BooleanField({initial: false}),
			move: new fields.StringField({
				initial: "near",
				choices: Object.keys(CONFIG.SHADOWDARK.NPC_MOVES),
			}),
			moveNote: new fields.StringField(),
			spellcasting: new fields.SchemaField({
				ability: new fields.StringField(),
				bonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				attacks: new fields.NumberField({ integer: true, initial: 0, min: 0}),
			}),
		};

		// add simplified NPC abilities
		schema.abilities = new fields.SchemaField(
			CONFIG.SHADOWDARK.ABILITY_KEYS.reduce((obj, key) => {
				obj[key] = new fields.SchemaField({
					mod: new fields.NumberField({integer: true, initial: 0}),
				});
				return obj;
			}, {})
		);

		return Object.assign(super.defineSchema(), schema);
	}

	static migrateData(data) {
		foundry.abstract.Document._addDataFieldMigration(data, "spellcastingAbility", "spellcasting.ability");
		foundry.abstract.Document._addDataFieldMigration(data, "spellcastingBonus", "spellcasting.bonus");
		foundry.abstract.Document._addDataFieldMigration(data, "spellcastingAttackNum", "spellcasting.attacks");
		return super.migrateData(data);
	}

	rollConfigGenerators = {
		check: this._generateStatCheckConfig.bind(this),
		spell: this._generateSpellConfig.bind(this),
		attack: this._generateAttackConfig.bind(this),
	};

	/* ----------------------- */
	/* Getters       */
	/* ----------------------- */

	get isNPC() {
		return true;
	}

	get isMonster() {
		return true;
	}

	/* ----------------------- */
	/* Public Functions        */
	/* ----------------------- */

	async buildNpcAttackDisplays(itemId) {
		const item = this.parent.getEmbeddedDocument("Item", itemId);

		const attackOptions = {
			attackType: item.system.attackType,
			attackName: item.name,
			// numAttacks: item.system.attack.num,
			attackBonus: parseInt(item.system.bonuses?.attackBonus, 10),
			baseDamage: item.system.damage.value,
			bonusDamage: parseInt(item.system.bonuses?.damageBonus, 10),
			itemId,
			special: item.system.damage.special,
			ranges: item.system.ranges.map(s => game.i18n.localize(
				CONFIG.SHADOWDARK.RANGES[s])).join("/"),
		};

		attackOptions.numAttacks = await TextEditor.enrichHTML(
			item.system.attack.num,
			{
				async: true,
			}
		);

		return await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/_partials/npc-attack.hbs",
			attackOptions
		);
	}

	async buildNpcSpecialDisplays(itemId) {
		const item = this.parent.getEmbeddedDocument("Item", itemId);

		const description = await TextEditor.enrichHTML(
			jQuery(item.system.description).text(),
			{
				async: true,
			}
		);

		const attackOptions = {
			attackName: item.name,
			// numAttacks: item.system.attack.num,
			attackBonus: item.system.bonuses?.attackBonus,
			itemId,
			ranges: item.system.ranges.map(s => game.i18n.localize(
				CONFIG.SHADOWDARK.RANGES[s])).join("/"),
			description,
		};

		attackOptions.numAttacks = await TextEditor.enrichHTML(
			item.system.attack.num,
			{
				async: true,
			}
		);

		return await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/_partials/npc-special-attack.hbs",
			attackOptions
		);
	}

	async _generateSpellConfig(config) {
		const spell = await fromUuid(config.cast?.spellUuid ?? config.itemUuid);
		if (!spell) return;
		config.type = "spell";
		config.cast ??= {};
		config.cast.spellUuid ??= spell.uuid;
		config.cast.focus ??= false;
		config.cast.range ??= spell.system.range;
		config.cast.duration ??= spell.system?.duration;

		config.descriptions ??= [];
		config.descriptions.push(spell.system?.description);

		config.mainRoll ??= {};
		config.mainRoll.type = "spell";
		config.mainRoll.base ??= "d20";
		config.mainRoll.label ??= "Spell Roll";
		config.mainRoll.dc ??= spell.system?.dc;

		const spellRollKey = this._getActiveEffectKeys(
			"system.roll.spell.bonus",
			this.spellcasting.bonus,
			spell,
			config
		);

		config.mainRoll.bonus ??= shadowdark.dice.formatBonus(spellRollKey.value);
		config.mainRoll.formula ??= `${config.mainRoll.base}${config.mainRoll.bonus}`;
		config.mainRoll.tooltips = spellRollKey.tooltips;
	}

	async castSpell(spellUuid, config={}) {

		const spell = await fromUuid(spellUuid);
		if (!spell) {
			ui.notifications.warn(
				"Error: Item no longer exists or is not a spell",
				{ permanent: false }
			);
			return;
		}

		config.actorId = this.parent.id;
		config.itemUuid = spellUuid;
		config.cast ??= {};
		config.cast.spellUuid = spellUuid;

		shadowdark.dice.setRollTarget(config);

		await this.rollConfigGenerators.spell?.(config);

		if (!await shadowdark.dice.rollDialog(config)) return false;

		// Call player cast spell hooks and cancel if any return false
		if (!await Hooks.call("SD-NPC-Spell-Cast", config)) return false;

		const roll = shadowdark.dice.rollFromConfig(config);

		return roll.success;
	}

	async rollAttack(attackId, config={}) {
		config.actorId = this.parent.id;
		const attack = this.parent.items.get(attackId);
		if (!attack) {
			console.error("invalid attack ID");
			return;
		}
		config.itemUuid = attack.uuid;

		shadowdark.dice.setRollTarget(config);

		// generates attack data
		await this.rollConfigGenerators.attack?.(config);

		// show roll prompt and cancelled if closed
		if (!await shadowdark.dice.rollDialog(config)) return false;

		// re-generates attack data
		await this.rollConfigGenerators.attack?.(config);

		// Call NPC attack hooks
		if (!await Hooks.call("SD-NPC-Attack", config)) return false;

		// Prompt, evaluate and roll the attack
		await shadowdark.dice.rollFromConfig(config);
	}

	async rollHP() {

		const conBonus = shadowdark.dice.formatBonus(this.abilities.con.mod);
		const level = this.level.value ?? 1;
		const formula = level ? `${level}d8${conBonus}` : `1${conBonus}`;

		const config = {
			actorId: this.parent.id,
			title: game.i18n.localize("SHADOWDARK.dialog.hp_roll.title"),
			mainRoll: {formula},
			rollMode: CONST.DICE_ROLL_MODES.PRIVATE,
		};

		const result = await shadowdark.dice.rollFromConfig(config);
		if (result) {
			const newHp = Number(result.total);
			await this.parent.update({
				"system.attributes.hp.max": newHp,
				"system.attributes.hp.value": newHp,
			});
		}
	}

	/* ----------------------- */
	/* Private Functions       */
	/* ----------------------- */

	async _generateAttackConfig(config={}) {
		const attack = await fromUuid(config.itemUuid);
		if (!attack) return;
		config.type = "attack";

		config.mainRoll ??= {};
		config.mainRoll.base ??= "d20";
		const atkBonus = shadowdark.dice.formatBonus(attack.system.bonuses.attackBonus);
		config.mainRoll.formula ??= `${config.mainRoll.base}${atkBonus}`;
		config.mainRoll.advantage ??= 0;
		config.mainRoll.label ??= game.i18n.localize("SHADOWDARK.roll.attack");

		config.descriptions ??= [];
		config.descriptions.push(attack.system?.description);

		config.attack ??= {};
		config.attack.range ??= attack.system.ranges[0];
		config.attack.type ??= (config.attack.range === "close")? "melee" : "ranged";

		config.damageRoll ??= {};
		config.damageRoll.label ??= game.i18n.localize("SHADOWDARK.roll.damage");
		config.damageRoll.base ??= attack.system.damage.value;
		const dmgBonus = shadowdark.dice.formatBonus(attack.system.bonuses.damageBonus);
		config.damageRoll.formula ??= `${config.damageRoll.base}${dmgBonus}`;
		// TODO apply AE roll keys
	}

}

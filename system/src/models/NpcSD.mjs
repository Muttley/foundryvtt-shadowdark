import { ActorBaseSD } from "./_ActorBaseSD.mjs";
import * as actorFields from "./_fields/actorFields.mjs";

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

		return await renderTemplate(
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

		return await renderTemplate(
			"systems/shadowdark/templates/_partials/npc-special-attack.hbs",
			attackOptions
		);
	}

	_generateSpellConfig(spell, config) {
		config.cast ??= {};
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

		shadowdark.dice.setRollTarget(config);

		this._generateSpellConfig(spell, config);

		if (!await shadowdark.dice.rollDialog(config)) return false;

		// Call player cast spell hooks and cancel if any return false
		if (!await Hooks.call("SD-NPC-Spell-Cast", config)) return false;

		const roll = shadowdark.dice.rollFromConfig(config);

		return roll.success;
	}

	async rollAttack(attackId, config={}) {
		config.type = "npc-attack";
		config.actorId = this.parent.id;
		const attack = this.parent.items.get(attackId);
		if (!attack) {
			console.error("invalid attack ID");
			return;
		}
		config.item = attack;

		shadowdark.dice.setRollTarget(config);

		// generates attack data
		this._generateAttackConfig(attack, config);

		// show roll prompt and cancelled if closed
		if (!await shadowdark.dice.rollDialog(config)) return false;

		// re-generates attack data
		this._generateAttackConfig(attack, config);

		// Call NPC attack hooks
		if (!await Hooks.call("SD-Player-Attack", config)) return false;

		// Prompt, evaluate and roll the attack
		await shadowdark.dice.rollFromConfig(config);
	}

	async rollHP() {

		const conBonus = shadowdark.dice.formatBonus(this.abilities.con.mod);
		const level = this.level.value ?? 1;
		const formula = `${level}d8${conBonus}`;

		const config = {
			actorId: this.parent.id,
			title: game.i18n.localize("SHADOWDARK.dialog.hp_roll.title"),
			roll: {formula},
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

	async _generateAttackConfig(attack, config={}) {

		config.mainRoll ??= {};
		config.mainRoll.base ??= "d20";
		const atkBonus = shadowdark.dice.formatBonus(attack.system.bonuses.attackBonus);
		config.mainRoll.formula ??= `${config.mainRoll.base}${atkBonus}`;
		config.mainRoll.advantage ??= 0;
		config.mainRoll.label ??= "Attack"; // TODO localize

		config.descriptions ??= [];
		config.descriptions.push(attack.system?.description);

		config.attack ??= {};
		config.attack.range ??= attack.system.ranges[0];
		config.attack.type ??= (config.attack.range === "close")? "melee" : "ranged";

		config.damageRoll ??= {};
		config.damageRoll.label ??= "Damage"; // TODO localize
		config.damageRoll.base ??= attack.system.damage.value;
		const dmgBonus = shadowdark.dice.formatBonus(attack.system.bonuses.damageBonus);
		config.damageRoll.formula ??= `${config.damageRoll.base}${dmgBonus}`;
		// TODO apply AE roll keys
	}

}

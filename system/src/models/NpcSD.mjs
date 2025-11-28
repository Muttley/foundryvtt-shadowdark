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
			spellcastingAbility: new fields.StringField(),
			spellcastingBonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
			spellcastingAttackNum: new fields.NumberField({ integer: true, initial: 0, min: 0}),
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

	async _generateAttackConfig(attack, config={}) {

		config.mainRoll ??= {};
		config.mainRoll.base ??= "d20";
		const atkBonus = shadowdark.dice.formatBonus(attack.system.bonuses.attackBonus);
		config.mainRoll.formula ??= `${config.mainRoll.base}${atkBonus}`;
		config.mainRoll.advantage ??= 0;
		config.mainRoll.label ??= "Attack"; // TODO localize

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

}

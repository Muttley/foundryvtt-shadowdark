import { ActorBaseSD } from "./_ActorBaseSD.mjs";

const fields = foundry.data.fields;

export default class NpcSD extends ActorBaseSD {
	static defineSchema() {
		const schema = super.defineSchema();

		schema.attributes = new fields.SchemaField({
			ac: new fields.SchemaField({
				value: new fields.NumberField({integer: true, initial: 10, min: 0}),
			}),
			hp: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				max: new fields.NumberField({ integer: true, initial: 0, min: 0}),
			}),
		});
		schema.darkAdapted = new fields.BooleanField({initial: false});
		schema.move = new fields.StringField({
			initial: "near",
			choices: Object.keys(CONFIG.SHADOWDARK.NPC_MOVES),
		});
		schema.moveNote = new fields.StringField();
		schema.spellcastingAbility = new fields.StringField();
		schema.spellcastingBonus = new fields.NumberField({ integer: true, initial: 0, min: 0});
		schema.spellcastingAttackNum = new fields.NumberField({ integer: true, initial: 0, min: 0});

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

	async generateAttackData(attack, data={}) {

		data.check ??= {};
		data.check.base ??= "d20";
		const atkBonus = attack.system.bonuses.attackBonus
			?`${attack.system.bonuses.attackBonus > 0 ? "+" : ""}${attack.system.bonuses.attackBonus}`
			: "";
		data.check.formula ??= `${data.check.base} ${atkBonus}`;
		data.check.advantage ??= 0;
		data.check.label ??= "Attack"; // TODO localize

		data.attack ??= {};
		data.attack.range ??= attack.system.ranges[0];
		data.attack.type ??= (data.attack.range === "close")? "melee" : "ranged";

		data.damage ??= {};
		data.damage.label ??= "Damage"; // TODO localize
		data.damage.base ??= attack.system.damage.value;
		const dmgBonus = attack.system.bonuses.damageBonus
			?`${attack.system.bonuses.damageBonus > 0 ? "+" : ""}${attack.system.bonuses.damageBonus}`
			: "";
		data.damage.formula ??= `${data.damage.base} ${dmgBonus}`;
	}

	async rollAttack(attackId, data={}) {
		data.type = "npc-attack";
		data.actor = this.parent;
		const attack = this.parent.items.get(attackId);
		if (!attack) {
			console.error("invalid attack ID");
			return;
		}
		data.item = attack;

		shadowdark.dice.setRollTarget(data);

		// generates attack data
		this.generateAttackData(attack, data);

		// show roll prompt and cancelled if closed
		if (!await shadowdark.dice.rollDialog(data)) return false;

		// re-generates attack data
		this.generateAttackData(attack, data);

		// Call NPC attack hooks
		if (!await Hooks.call("SD-Player-Attack", data)) return false;

		// Prompt, evaluate and roll the attack
		await shadowdark.dice.resolveRolls(data);
	}

	async rollHP(options={}) {
		// TODO refactor this
		const data = {
			rollType: "hp",
			actor: this,
			conBonus: this.system.abilities.con.mod,
		};

		const parts = [`max(1, ${this.system.level.value}d8 + @conBonus)`];

		options.fastForward = true;
		options.chatMessage = true;

		options.title = game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";
		options.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;

		const result = await shadowdark.dice.rollDialog(parts, data, options);

		const newHp = Number(result.rolls.main.roll._total);
		await this.update({
			"system.attributes.hp.max": newHp,
			"system.attributes.hp.value": newHp,
		});
	}

}

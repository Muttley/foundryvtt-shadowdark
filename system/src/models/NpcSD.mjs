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

	async _generateAttackConfig(attack, config={}) {

		config.check ??= {};
		config.check.base ??= "d20";
		const atkBonus = attack.system.bonuses.attackBonus
			?`${attack.system.bonuses.attackBonus > 0 ? "+" : ""}${attack.system.bonuses.attackBonus}`
			: "";
		config.check.formula ??= `${config.check.base} ${atkBonus}`;
		config.check.advantage ??= 0;
		config.check.label ??= "Attack"; // TODO localize

		config.attack ??= {};
		config.attack.range ??= attack.system.ranges[0];
		config.attack.type ??= (config.attack.range === "close")? "melee" : "ranged";

		config.damage ??= {};
		config.damage.label ??= "Damage"; // TODO localize
		config.damage.base ??= attack.system.damage.value;
		const dmgBonus = attack.system.bonuses.damageBonus
			?`${attack.system.bonuses.damageBonus > 0 ? "+" : ""}${attack.system.bonuses.damageBonus}`
			: "";
		config.damage.formula ??= `${config.damage.base} ${dmgBonus}`;
	}

	async rollAttack(attackId, config={}) {
		config.type = "npc-attack";
		config.actor = this.parent;
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
		await shadowdark.dice.resolveRolls(config);
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

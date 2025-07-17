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
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";
		options.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;

		const result = await CONFIG.DiceSD.RollDialog(parts, data, options);

		const newHp = Number(result.rolls.main.roll._total);
		await this.update({
			"system.attributes.hp.max": newHp,
			"system.attributes.hp.value": newHp,
		});
	}

}

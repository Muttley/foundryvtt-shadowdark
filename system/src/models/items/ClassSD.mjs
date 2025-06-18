import * as itemfields from "../_fields/itemFields.mjs";
import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

function spellsknown() {
	const spellsknown = {};
	for (let i = 1; i <= 10; i++) {
		const spellsAtLevel = {};
		for (let j = 1; j <= 5; j++) {
			spellsAtLevel[j] = new fields.NumberField({ integer: true, initial: 0, min: 0 });
		}
		spellsknown[i] = new fields.SchemaField(spellsAtLevel);
	}
	return new fields.SchemaField(spellsknown);
}

export default class ClassSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.languageChoices(),
			alignment: new fields.StringField({
				initial: "neutral",
				choices: Object.keys(CONFIG.SHADOWDARK.ALIGNMENTS),
			}),
			allArmor: new fields.BooleanField({initial: false}),
			allMeleeWeapons: new fields.BooleanField({initial: false}),
			allRangedWeapons: new fields.BooleanField({initial: false}),
			allWeapons: new fields.BooleanField({initial: false}),
			armor: new fields.ArrayField(new fields.DocumentUUIDField()),
			classAbilities: new fields.ArrayField(new fields.DocumentUUIDField()),
			classAbilityChoices: new fields.ArrayField(new fields.DocumentUUIDField()),
			classAbilityChoiceCount: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
			classTalentTable: new fields.DocumentUUIDField(),
			hitPoints: new fields.StringField({initial: "d6"}),
			patron: new fields.SchemaField({
				required: new fields.BooleanField({initial: false}),
				startingBoons: new fields.NumberField({ integer: true, initial: 0}),
			}),
			spellcasting: new fields.SchemaField({
				ability: new fields.StringField({
					initial: "",
					choices: CONFIG.SHADOWDARK.ABILITY_KEYS,
					blank: true,
				}),
				baseDifficulty: new fields.NumberField({ integer: true, initial: 10, min: 0 }),
				class: new fields.StringField({
					initial: "__not_spellcaster__",
					blank: true,
				}),
				spellsknown: spellsknown(),
			}),
			talents: new fields.ArrayField(new fields.DocumentUUIDField()),
			talentChoices: new fields.ArrayField(new fields.DocumentUUIDField()),
			talentChoiceCount: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
			titles: new fields.ArrayField(
				new fields.SchemaField({
					chaotic: new fields.StringField(),
					from: new fields.NumberField({ integer: true, min: 0 }),
					lawful: new fields.StringField(),
					neutral: new fields.StringField(),
					to: new fields.NumberField({ integer: true, min: 0 }),
				})
			),
			weapons: new fields.ArrayField(new fields.DocumentUUIDField()),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}

/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for the Shadowdarkling Importer app
 */
import { cleanUpActorsByKey } from "../../testing/testUtils.mjs";
import ShadowdarklingImporterSD from "../ShadowdarklingImporterSD.mjs";

export const key = "shadowdark.apps.shadowdarkling-importer";
export const options = {
	displayName: "Shadowdark: Apps: Shadowdarkling Importer",
	preSelected: true,
};

const _jsonTestActor = () => {
	return {
		name: `Test Actor ${key}`,
		stats: {
			STR: 3,
			DEX: 4,
			CON: 5,
			INT: 6,
			WIS: 7,
			CHA: 8,
		},
		alignment: "Chaotic",
		class: "Level 0",
		maxHitPoints: 9,
		background: "Sailor",
		gold: 10,
		silver: 11,
		copper: 12,
		deity: "Memnon",
		languages: "Common, Celestial",
		level: 1,
		gearSlotsTotal: 13,
		gear: [],
		bonuses: [],
	};
};

const _getActor = async () => game.actors.find(a => a.name === `Test Actor ${key}`);

const _deleteTestActor = () => cleanUpActorsByKey(key);

export default ({ describe, it, after, afterEach, expect }) => {
	after(async () => _deleteTestActor());

	const app = new ShadowdarklingImporterSD();

	describe("base actor", () => {
		after(async () => _deleteTestActor());
		const json = _jsonTestActor();

		it("can create an actor", async () => {
			const noActor = await _getActor();
			expect(noActor).is.undefined;

			const actor = await app._importActor(json);
			expect(actor).is.not.undefined;
			expect(actor.type).equal("Player");
		});

		it("actor has the correct name", async () => {
			const actor = await _getActor();
			expect(actor).is.not.undefined;

			expect(actor.name).equal(json.name);
		});

		it("actor has the correct ability scores", async () => {
			const actor = await _getActor();
			expect(actor.system.abilities.str.base).equal(json.stats.STR);
			expect(actor.system.abilities.dex.base).equal(json.stats.DEX);
			expect(actor.system.abilities.con.base).equal(json.stats.CON);
			expect(actor.system.abilities.int.base).equal(json.stats.INT);
			expect(actor.system.abilities.wis.base).equal(json.stats.WIS);
			expect(actor.system.abilities.cha.base).equal(json.stats.CHA);
		});

		it("actor has the correct alignment", async () => {
			const actor = await _getActor();
			expect(actor.system.alignment).equal(json.alignment.toLowerCase());
		});

		it("actor has the correct ancestry", async () => {
			const actor = await _getActor();
			expect(actor.system.ancestry).equal("");
		});

		it("actor has the correct background", async () => {
			const actor = await _getActor();
			const background = await fromUuid(actor.system.background) ?? {};
			expect(background.name).equal(json.background);
		});

		it("actor has the correct class", async () => {
			const actor = await _getActor();
			const actorClass = await fromUuid(actor.system.class) ?? {};
			expect(actorClass.name).equal(json.class);
		});

		it("actor has the correct coins", async () => {
			const actor = await _getActor();
			expect(actor.system.coins.gp).equal(json.gold);
			expect(actor.system.coins.sp).equal(json.silver);
			expect(actor.system.coins.cp).equal(json.copper);
		});

		it("actor has the correct deity", async () => {
			const actor = await _getActor();
			const deity = await fromUuid(actor.system.deity) ?? {};
			expect(deity.name).equal(json.deity);
		});

		it("actor has the correct hp", async () => {
			const actor = await _getActor();
			expect(actor.system.attributes.hp.value).equal(json.maxHitPoints);
			expect(actor.system.attributes.hp.base).equal(json.maxHitPoints);
			expect(actor.system.attributes.hp.max).equal(json.maxHitPoints);
		});

		it("actor has the correct level", async () => {
			const actor = await _getActor();
			expect(actor.system.level.value).equal(json.level);
			expect(actor.system.level.xp).equal(0);
		});

		it("actor has the correct gearslots", async () => {
			const actor = await _getActor();
			expect(actor.system.slots).equal(json.gearSlotsTotal);
		});
	});

	describe("ancestries", () => {
		after(async () => _deleteTestActor());

		describe("elf", () => {
			const elf_talents = [
				{
					sourceType: "Ancestry",
					sourceName: "Elf",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "FarSight",
					bonusName: "AttackBonus",
					bonusTo: "RangedWeapons",
					bonusAmount: 1,
				},
				{
					sourceType: "Ancestry",
					sourceName: "Elf",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "FarSight",
					bonusName: "Plus1ToCastingSpells",
					bonusTo: "Wizard",
					bonusAmount: 1,
				},
			];

			it("elf with ranged weapon farsight", async () => {
				const json = _jsonTestActor();
				json.ancestry = "Elf";
				json.bonuses.push(elf_talents[0]);
				const actor = await app._importActor(json);
				const talent = actor.items.find(o => o.name.includes("Farsight"));

				const ancestry = await fromUuid(actor.system.ancestry);
				expect(ancestry.name).equal("Elf");

				expect(talent).is.not.undefined;
				expect(talent.name).equal("Farsight (Ranged)");
			});

			it("elf with spellcasting farsight", async () => {
				const json = _jsonTestActor();
				json.ancestry = "Elf";
				json.bonuses.push(elf_talents[1]);
				const actor = await app._importActor(json);
				const talent = actor.items.find(o => o.name.includes("Farsight"));

				const ancestry = await fromUuid(actor.system.ancestry);
				expect(ancestry.name).equal("Elf");

				expect(talent).is.not.undefined;
				expect(talent.name).equal("Farsight (Spell)");
			});
		});

		describe("half-orc", async () => {
			it("half-orc has mighty talent", async () => {
				const json = _jsonTestActor();
				json.ancestry = "Half-Orc";
				const actor = await app._importActor(json);
				const talent = actor.items.find(o => o.name.includes("Mighty"));

				const ancestry = await fromUuid(actor.system.ancestry);
				expect(ancestry.name).equal("Half-Orc");
				expect(talent).is.not.undefined;
			});
		});

		describe("halfling", async () => {
			it("halfling has stealthy talent", async () => {
				const json = _jsonTestActor();
				json.ancestry = "Halfling";
				const actor = await app._importActor(json);
				const talent = actor.items.find(o => o.name.includes("Stealthy"));

				const ancestry = await fromUuid(actor.system.ancestry);
				expect(ancestry.name).equal("Halfling");
				expect(talent).is.not.undefined;
			});
		});

		describe("dwarf", async () => {
			it("dwarf has stout talent", async () => {
				const json = _jsonTestActor();
				json.ancestry = "Dwarf";
				const actor = await app._importActor(json);
				const talent = actor.items.find(o => o.name.includes("Stout"));

				const ancestry = await fromUuid(actor.system.ancestry);
				expect(ancestry.name).equal("Dwarf");
				expect(talent).is.not.undefined;
			});
		});

		describe("human", () => {
			it("human has no ancestry talent", async () => {
				const json = _jsonTestActor();
				json.ancestry = "Human";
				const actor = await app._importActor(json);
				const talent = actor.items.find(o => o.name.includes("Ambitious"));

				const ancestry = await fromUuid(actor.system.ancestry);
				expect(ancestry.name).equal("Human");
				expect(talent).is.not.undefined;
			});
		});

		describe("goblin", () => {
			it("goblin has stout talent", async () => {
				const json = _jsonTestActor();
				json.ancestry = "Goblin";
				const actor = await app._importActor(json);
				const talent = actor.items.find(o => o.name.includes("Keen Senses"));

				const ancestry = await fromUuid(actor.system.ancestry);
				expect(ancestry.name).equal("Goblin");
				expect(talent).is.not.undefined;
			});
		});

		describe("kobold", () => {
			const kobold_talents = [
				{
					sourceType: "Ancestry",
					sourceName: "Kobold",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Knack",
					bonusName: "LuckTokenAtStartOfSession",
					bonusTo: "LuckTokenAtStartOfSession",
					bonusAmount: 1,
				},
				{
					sourceType: "Ancestry",
					sourceName: "Kobold",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Knack",
					bonusName: "Plus1ToCastingSpells",
					bonusTo: "Spellcasting",
					bonusAmount: 1,
				},
			];

			it("kobold has knack (luck) talent", async () => {
				const json = _jsonTestActor();
				json.ancestry = "Kobold";
				json.bonuses.push(kobold_talents[0]);
				const actor = await app._importActor(json);
				const talent = actor.items.find(o => o.name.includes("Knack (Luck)"));

				const ancestry = await fromUuid(actor.system.ancestry);
				expect(ancestry.name).equal("Kobold");

				expect(talent).is.not.undefined;
			});

			it("kobold has knack (spellcasting) talent", async () => {
				const json = _jsonTestActor();
				json.ancestry = "Kobold";
				json.bonuses.push(kobold_talents[1]);
				const actor = await app._importActor(json);
				const talent = actor.items.find(o => o.name.includes("Knack (Spellcasting)"));

				const ancestry = await fromUuid(actor.system.ancestry);
				expect(ancestry.name).equal("Kobold");

				expect(talent).is.not.undefined;
			});
		});
	});


	describe("class talents", () => {
		afterEach(async () => _deleteTestActor());

		describe("ability score improvement talents", () => {
			const json = _jsonTestActor();
			json.class = "Wizard";
			const talents = [
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus-1",
					bonusName: "StatBonus",
					bonusTo: "STR:+1",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus-2",
					bonusName: "StatBonus",
					bonusTo: "DEX:+1",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus-1",
					bonusName: "StatBonus",
					bonusTo: "CON:+1",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus-2",
					bonusName: "StatBonus",
					bonusTo: "INT:+1",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus-2",
					bonusName: "StatBonus",
					bonusTo: "WIS:+1",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus-2",
					bonusName: "StatBonus",
					bonusTo: "CHA:+1",
				},
				{
					sourceType: "Class",
					sourceName: "Priest",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus",
					bonusName: "StatBonus",
					bonusTo: "STR:+2",
				},
				{
					sourceType: "Ancestry",
					sourceName: "Human Ambition",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus",
					bonusName: "StatBonus",
					bonusTo: "DEX:+2",
				},
				{
					sourceType: "Ancestry",
					sourceName: "Human Ambition",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus",
					bonusName: "StatBonus",
					bonusTo: "CON:+2",
				},
				{
					sourceType: "Ancestry",
					sourceName: "Human Ambition",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus",
					bonusName: "StatBonus",
					bonusTo: "WIS:+2",
				},
				{
					sourceType: "Ancestry",
					sourceName: "Human Ambition",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "PlusTwoIntOrPlusOneWizCasting",
					bonusName: "StatBonus",
					bonusTo: "INT:+2",
				},
				{
					sourceType: "Class",
					sourceName: "Thief",
					sourceCategory: "Talent",
					gainedAtLevel: 1,
					name: "StatBonus",
					bonusName: "StatBonus",
					bonusTo: "CHA:+2",
				},
			];

			it("sanity check", async () => {
				const actor = await app._importActor(json);
				expect(actor.system.abilities.str.base).equal(3);
				expect(actor.system.abilities.dex.base).equal(4);
				expect(actor.system.abilities.con.base).equal(5);
				expect(actor.system.abilities.int.base).equal(6);
				expect(actor.system.abilities.wis.base).equal(7);
				expect(actor.system.abilities.cha.base).equal(8);
			});

			talents.forEach(t => {
				it(`${t.bonusTo} talent gives correct bonus`, async () => {
					const bonusAbility = t.bonusTo.split(":")[0].toLowerCase();

					json.bonuses = [t];
					const actor = await app._importActor(json);

					// #422 Check other stats remain as before bonus

					for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
						const originalValue = Number(json.stats[ability.toUpperCase()]);

						if (ability === bonusAbility) {
							expect(actor.system.abilities[ability].bonus).equal(
								parseInt(t.bonusTo.split("+")[1], 10)
							);

							expect(
								actor.system.abilities[ability].base
								+ actor.system.abilities[ability].bonus
							).equal(originalValue);

							expect(actor.system.abilities[ability].base).equal(
								originalValue - parseInt(t.bonusTo.split("+")[1], 10)
							);
						}
						else {
							expect(actor.system.abilities[ability].bonus).equal(0);
							expect(actor.system.abilities[ability].base).equal(originalValue);
						}
					}

					await actor.delete();
				});
			});
		});

		describe("bard", () => {
			const json = _jsonTestActor();
			json.class = "Bard";

			describe("built-in talents", async () => {
				const builtins = [
					"Bardic Arts",
					"Magical Dabbler",
					"Perform",
					"Prolific",
				];

				builtins.forEach(builtin => {
					it(builtin, async () => {
						const actor = await app._importActor(json);

						const actorClass = await fromUuid(actor.system.class);
						expect(actorClass.name).equal(json.class);

						const talent = actor.items.find(o => o.name.includes(builtin));
						expect(talent).is.not.undefined;
					});
				});
			});
		});

		describe("fighter", () => {
			const json = _jsonTestActor();
			json.class = "Fighter";

			describe("built-in talents", async () => {
				it("grit (strength)", async () => {
					json.bonuses = [
						{
							sourceType: "Class",
							sourceName: "Fighter",
							sourceCategory: "Ability",
							gainedAtLevel: 1,
							name: "Grit",
							bonusName: "Strength",
							bonusTo: "AdvantageOnStatChecks",
						},
					];
					const actor = await app._importActor(json);
					const actorClass = await fromUuid(actor.system.class);
					expect(actorClass.name).equal(json.class);

					const talent = actor.items.find(o => o.name.includes("Grit (Strength)"));
					expect(talent).is.not.undefined;
				});

				it("grit (dexterity)", async () => {
					json.bonuses = [
						{
							sourceType: "Class",
							sourceName: "Fighter",
							sourceCategory: "Ability",
							gainedAtLevel: 1,
							name: "Grit",
							bonusName: "Dexterity",
							bonusTo: "AdvantageOnStatChecks",
						},
					];
					const actor = await app._importActor(json);
					const actorClass = await fromUuid(actor.system.class);
					expect(actorClass.name).equal(json.class);

					const talent = actor.items.find(o => o.name.includes("Grit (Dexterity)"));
					expect(talent).is.not.undefined;
				});

				it("weapon mastery", async () => {
					// TODO: Weapon mastery for all types of weapons
					json.bonuses = [
						{
							sourceType: "Class",
							sourceName: "Fighter",
							sourceCategory: "Ability",
							gainedAtLevel: 1,
							name: "WeaponMastery",
							bonusName: "Plus1AttackAndDamagePlusHalfLevel",
							bonusTo: "Bastard sword",
						},
					];
					const actor = await app._importActor(json);
					const actorClass = await fromUuid(actor.system.class);
					expect(actorClass.name).equal(json.class);

					const talent = actor.items.find(o => o.name.includes("Weapon Mastery (Bastard Sword)"));
					expect(talent).is.not.undefined;
					expect(talent.effects.contents[0].changes[0].value).equal("bastard-sword");
				});
			});

			describe("level talents", () => {
				it("armor mastery", async () => {
					json.bonuses = [
						{
							sourceType: "Class",
							sourceName: "Fighter",
							sourceCategory: "Talent",
							gainedAtLevel: 1,
							name: "ArmorMastery",
							bonusName: "ArmorMastery",
							bonusTo: "Leather armor",
						},
					];
					const actor = await app._importActor(json);
					const actorClass = await fromUuid(actor.system.class);
					expect(actorClass.name).equal(json.class);

					const talent = actor.items.find(o => o.name.includes("Armor Mastery (Leather Armor)"));
					expect(talent).is.not.undefined;
				});

				it("+1 to melee and ranged attacks", async () => {
					json.bonuses = [
						{
							sourceType: "Class",
							sourceName: "Fighter",
							sourceCategory: "Talent",
							gainedAtLevel: 1,
							name: "Plus1ToHit",
							bonusName: "Plus1ToHit",
							bonusTo: "Melee and ranged attacks",
						},
					];
					const actor = await app._importActor(json);
					const actorClass = await fromUuid(actor.system.class);
					expect(actorClass.name).equal(json.class);

					const talent = actor.items.find(o => o.name.includes("+1 to Melee and Ranged Attacks"));
					expect(talent).is.not.undefined;
				});
			});
		});

		describe("thief", () => {
			const json = _jsonTestActor();
			json.class = "Thief";

			it("backstab", async () => {
				json.bonuses = [];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("Backstab"));
				expect(talent).is.not.undefined;
			});

			it("initiative advantage", async () => {
				json.bonuses = [
					{
						sourceType: "Ancestry",
						sourceName: "Human Ambition",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "AdvOnInitiative",
						bonusTo: "",
						bonusName: "AdvOnInitiative",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("Initiative Advantage"));
				expect(talent).is.not.undefined;
			});

			it("+1 to melee and ranged attacks", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Thief",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "Plus1ToHit",
						bonusName: "Plus1ToHit",
						bonusTo: "Melee and ranged attacks",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("+1 to Melee and Ranged Attacks"));
				expect(talent).is.not.undefined;
			});

			it("initiative advantage", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Thief",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "BackstabIncrease",
						bonusTo: "",
						bonusName: "BackstabIncrease",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("Backstab +1 Damage Dice"));
				expect(talent).is.not.undefined;
			});
		});

		describe("priest", () => {
			const json = _jsonTestActor();
			json.class = "Priest";

			it("plus 1 to spellcasting checks", async () => {
				json.bonuses = [
					{
						sourceType: "Ancestry",
						sourceName: "Human Ambition",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "Plus1ToCastingSpells",
						bonusTo: "Priest",
						bonusName: "Plus1ToCastingSpells",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("+1 on Spellcasting Checks"));
				expect(talent).is.not.undefined;
			});

			it("advantage on spell casting for one spell", async () => {
				json.bonuses = [
					{
						sourceType: "Ancestry",
						sourceName: "Human Ambition",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "AdvOnCastOneSpell",
						bonusTo: "AdvOnCastOneSpell",
						bonusName: "Light",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("Spellcasting Advantage"));
				expect(talent).is.not.undefined;
				expect(actor.system.bonuses.advantage.includes("light")).is.true;
			});

			it("plus 1 to melee attack", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Priest",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "Plus1ToHit",
						bonusName: "Plus1ToHit",
						bonusTo: "+1 to melee attacks",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("+1 to Melee Attacks"));
				expect(talent).is.not.undefined;
			});

			it("plus 1 to melee attack", async () => {
				json.bonuses = [
					{
						sourceType: "Ancestry",
						sourceName: "Human Ambition",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "Plus1ToHit",
						bonusName: "Plus1ToHit",
						bonusTo: "+1 to ranged attacks",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("+1 to Ranged Attacks"));
				expect(talent).is.not.undefined;
			});
		});

		describe("wizard", () => {
			const json = _jsonTestActor();
			json.class = "Wizard";

			it("plus 1 to spellcasting checks", async () => {
				json.bonuses = [
					{
						sourceType: "Ancestry",
						sourceName: "Human Ambition",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "PlusTwoIntOrPlusOneWizCasting",
						bonusName: "Plus1ToCastingSpells",
						bonusTo: "Wizard",
						bonusAmount: 1,
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("+1 on Spellcasting Checks"));
				expect(talent).is.not.undefined;
			});

			it("pick extra spell", async () => {
				json.bonuses = [
					{
						sourceType: "Ancestry",
						sourceName: "Human Ambition",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "LearnExtraSpell",
						bonusTo: "PickExtraSpell",
						bonusName: "Detect Magic",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const spell = actor.items.find(o => o.name.includes("Detect Magic"));
				expect(spell).is.not.undefined;
			});

			it("advantage on one spell", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Wizard",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "AdvOnCastOneSpell",
						bonusTo: "AdvOnCastOneSpell",
						bonusName: "Alarm",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name === "Spellcasting Advantage (Alarm)");
				expect(talent).is.not.undefined;
				expect(actor.system.bonuses.advantage.includes("alarm")).is.true;
			});

			it("create random magic item", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Wizard",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "MakeRandomMagicItem",
						bonusTo: "",
						bonusName: "MakeRandomMagicItem",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name === "Make a Random Magic Item");
				expect(talent).is.not.undefined;
			});
		});
	});

	describe("ranger", () => {
		const json = _jsonTestActor();
		json.class = "Ranger";

		describe("built-in talents", () => {
			it("Wayfinder", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Ranger",
						sourceCategory: "Ability",
						gainedAtLevel: 1,
						name: "Grit",
						bonusName: "Strength",
						bonusTo: "AdvantageOnStatChecks",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("Wayfinder"));
				expect(talent).is.not.undefined;
			});

			it("Herbalism", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Ranger",
						sourceCategory: "Ability",
						gainedAtLevel: 1,
						name: "Grit",
						bonusName: "Strength",
						bonusTo: "AdvantageOnStatChecks",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("Herbalism"));
				expect(talent).is.not.undefined;
			});
		});

		describe("level talents", () => {
			it("Set Weapon Type Damage", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Ranger",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "SetWeaponTypeDamage",
						bonusName: "SetWeaponTypeDamage",
						bonusTo: "Longbow:12",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("Increased Weapon Damage Die (Longbow)"));
				expect(talent).is.not.undefined;
			});

			it("+1 to Melee Attacks and Damage", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Ranger",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "Plus1ToHitAndDamage",
						bonusName: "Plus1ToHitAndDamage",
						bonusTo: "Melee attacks",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("+1 to Melee Attacks and Damage"));
				expect(talent).is.not.undefined;
			});

			it("+1 to Ranged Attacks and Damage", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Ranger",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "Plus1ToHitAndDamage",
						bonusName: "Plus1ToHitAndDamage",
						bonusTo: "Ranged attacks",
					},
				];
				const actor = await app._importActor(json);
				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("+1 to Ranged Attacks and Damage"));
				expect(talent).is.not.undefined;
			});

			it("Reduce Herbalism DC", async () => {
				json.bonuses = [
					{
						sourceType: "Class",
						sourceName: "Ranger",
						sourceCategory: "Talent",
						gainedAtLevel: 1,
						name: "ReduceHerbalismDC",
						bonusName: "",
						bonusTo: "ReduceHerbalismDC",
					},
				];
				const actor = await app._importActor(json);

				const actorClass = await fromUuid(actor.system.class);
				expect(actorClass.name).equal(json.class);

				const talent = actor.items.find(o => o.name.includes("Herbalism Check Advantage"));
				expect(talent).is.not.undefined;
			});
		});
	});

	describe("gear", () => {
		const json = _jsonTestActor();

		describe("weapons", () => {
			const weapons = [
				{
					instanceId: "lfxz4h50",
					gearId: "w2",
					name: "Club",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 15,
					currency: "cp",
				},
				{
					instanceId: "lfxz4hml",
					gearId: "w3",
					name: "Crossbow",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 8,
					currency: "gp",
				},
				{
					instanceId: "lfxz4hxo",
					gearId: "w4",
					name: "Dagger",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 1,
					currency: "gp",
				},
				{
					instanceId: "lfxz7erw",
					gearId: "w5",
					name: "Greataxe",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 2,
					cost: 10,
					currency: "gp",
				},
				{
					instanceId: "lfxz7ia3",
					gearId: "w6",
					name: "Greatsword",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 2,
					cost: 12,
					currency: "gp",
				},
				{
					instanceId: "lfxz4ms0",
					gearId: "w7",
					name: "Javelin",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 10,
					currency: "sp",
				},
				{
					instanceId: "lfxz8b6y",
					gearId: "w8",
					name: "Longbow",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 8,
					currency: "gp",
				},
				{
					instanceId: "lfxz4ia7",
					gearId: "w9",
					name: "Longsword",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 9,
					currency: "gp",
				},
				{
					instanceId: "lfxz4itb",
					gearId: "w10",
					name: "Mace",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "gp",
				},
				{
					instanceId: "lfxz8ely",
					gearId: "w11",
					name: "Shortbow",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 6,
					currency: "gp",
				},
				{
					instanceId: "lfxz8h3x",
					gearId: "w12",
					name: "Shortsword",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 7,
					currency: "gp",
				},
				{
					instanceId: "lfxz7wn6",
					gearId: "w13",
					name: "Spear",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "sp",
				},
				{
					instanceId: "lfxz4j72",
					gearId: "w14",
					name: "Staff",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "sp",
				},
				{
					instanceId: "lfxz8q7y",
					gearId: "w15",
					name: "Warhammer",
					type: "weapon",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 10,
					currency: "gp",
				},
			];

			it("higher quantity creates more items", async () => {
				json.gear = [
					{
						instanceId: "lfxz8q7y",
						gearId: "w15",
						name: "Warhammer",
						type: "weapon",
						quantity: 2,
						totalUnits: 2,
						slots: 2,
						cost: 10,
						currency: "gp",
					},
				];
				const actor = await app._importActor(json);
				expect(actor.items.contents.length).equal(2);
				expect(actor.items.contents[0].name).equal("Warhammer");
				expect(actor.items.contents[1].name).equal("Warhammer");
				await actor.delete();
			});

			weapons.forEach(weapon => {
				it(`${weapon.name} is successfully added`, async () => {
					json.gear = [weapon];
					const actor = await app._importActor(json);
					expect(actor.items.contents.length).equal(1);
					expect(actor.items.contents[0].name).equal(weapon.name);
					await actor.delete();
				});
			});
		});

		describe("armor", () => {
			const armor = [
				{
					instanceId: "lfxz8v38",
					gearId: "a1",
					name: "Leather armor",
					type: "armor",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 10,
					currency: "gp",
				},
				{
					instanceId: "lfxz97da",
					gearId: "a4",
					name: "Shield",
					type: "armor",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 10,
					currency: "gp",
				},
			];

			armor.forEach(a => {
				it(`${a.name} is successfully added`, async () => {
					json.gear = [a];
					const actor = await app._importActor(json);
					expect(actor.items.contents.length).equal(1);
					expect(actor.items.contents[0].name.toLowerCase()).equal(a.name.toLowerCase());
					await actor.delete();
				});
			});
		});

		describe("basic gear", () => {
			const basic = [
				{
					instanceId: "lfxz9nb2",
					gearId: "s1",
					name: "Arrows",
					type: "sundry",
					quantity: 1,
					totalUnits: 20,
					slots: 1,
					cost: 1,
					currency: "gp",
				},
				{
					instanceId: "lfxz9nok",
					gearId: "s2",
					name: "Backpack",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 0,
					cost: 2,
					currency: "gp",
				},
				{
					instanceId: "lfxz9o27",
					gearId: "s3",
					name: "Caltrops (one bag)",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "sp",
				},
				{
					instanceId: "lfxz9odt",
					gearId: "s5",
					name: "Crossbow bolts",
					type: "sundry",
					quantity: 1,
					totalUnits: 20,
					slots: 1,
					cost: 1,
					currency: "gp",
				},
				{
					instanceId: "lfxz9os4",
					gearId: "s6",
					name: "Crowbar",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "sp",
				},
				{
					instanceId: "lfxz9p54",
					gearId: "s7",
					name: "Flask or bottle",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 3,
					currency: "sp",
				},
				{
					instanceId: "lfxz9pod",
					gearId: "s8",
					name: "Flint and steel",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "sp",
				},
				{
					instanceId: "lfxz9q2n",
					gearId: "s9",
					name: "Grappling hook",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 1,
					currency: "gp",
				},
				{
					instanceId: "lfxz9qox",
					gearId: "s10",
					name: "Iron spikes",
					type: "sundry",
					quantity: 1,
					totalUnits: 10,
					slots: 1,
					cost: 1,
					currency: "gp",
				},
				{
					instanceId: "lfxz9rji",
					gearId: "s11",
					name: "Lantern",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "gp",
				},
				{
					instanceId: "lfxza5io",
					gearId: "s12",
					name: "Mirror",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 10,
					currency: "gp",
				},
				{
					instanceId: "lfxz9tet",
					gearId: "s13",
					name: "Oil, flask",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "sp",
				},
				{
					instanceId: "lfxz9tti",
					gearId: "s14",
					name: "Pole",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "sp",
				},
				{
					instanceId: "lfxz9u7z",
					gearId: "s15",
					name: "Rations",
					type: "sundry",
					quantity: 1,
					totalUnits: 3,
					slots: 1,
					cost: 5,
					currency: "sp",
				},
				{
					instanceId: "lfxz9ujz",
					gearId: "s16",
					name: "Rope, 60'",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 1,
					currency: "gp",
				},
				{
					instanceId: "lfxz9uwk",
					gearId: "s17",
					name: "Torch",
					type: "sundry",
					quantity: 1,
					totalUnits: 1,
					slots: 1,
					cost: 5,
					currency: "sp",
				},
			];

			basic.forEach(item => {
				it(`${item.name} is successfully added`, async () => {
					json.gear = [item];
					const actor = await app._importActor(json);
					expect(actor.items.contents.length).equal(1);
					const name = (item.name.includes("Caltrops"))
						? "Caltrops"
						: (item.name.includes("Flask"))
							? "Flask"
							: item.name;
					expect(actor.items.contents[0].name.toLowerCase()).equal(
						name.toLowerCase());
					expect(actor.items.contents[0].system.cost[item.currency]).equal(item.cost);
					await actor.delete();
				});
			});
		});
	});

	describe("spells", () => {
		const json = _jsonTestActor();

		describe("wizard", () => {
			json.class = "Wizard";
			const wizard_spells = [
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 1",
					bonusTo: "Tier:1, Spell:1",
					bonusName: "Alarm",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 2",
					bonusTo: "Tier:1, Spell:2",
					bonusName: "Burning Hands",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 3",
					bonusTo: "Tier:1, Spell:3",
					bonusName: "Charm Person",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 3",
					bonusTo: "Tier:1, Spell:3",
					bonusName: "Detect Magic",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 1",
					bonusTo: "Tier:1, Spell:1",
					bonusName: "Feather Fall",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 2",
					bonusTo: "Tier:1, Spell:2",
					bonusName: "Floating Disk",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 3",
					bonusTo: "Tier:1, Spell:3",
					bonusName: "Hold Portal",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 3",
					bonusTo: "Tier:1, Spell:3",
					bonusName: "Light",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 1",
					bonusTo: "Tier:1, Spell:1",
					bonusName: "Mage Armor",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 2",
					bonusTo: "Tier:1, Spell:2",
					bonusName: "Magic Missile",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 3",
					bonusTo: "Tier:1, Spell:3",
					bonusName: "Protection from Evil",
				},
				{
					sourceType: "Class",
					sourceName: "Wizard",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Wizard, Tier 1, Spell 1",
					bonusTo: "Tier:1, Spell:1",
					bonusName: "Sleep",
				},
			];

			wizard_spells.forEach(spell => {
				it(`${spell.name} is successfully added`, async () => {
					json.bonuses = [spell];
					const actor = await app._importActor(json);
					expect(actor.items.contents.length).equal(1);
					expect(actor.items.contents[0].name.toLowerCase()).equal(
						spell.bonusName.toLowerCase());
					await actor.delete();
				});
			});
		});

		describe("priest", () => {
			json.class = "Priest";
			const priest_spells = [
				{
					sourceType: "Class",
					sourceName: "Priest",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Priest, Tier 1, Spell 1",
					bonusTo: "Tier:1, Spell:1",
					bonusName: "Cure Wounds",
				},
				{
					sourceType: "Class",
					sourceName: "Priest",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Priest, Tier 1, Spell 2",
					bonusTo: "Tier:1, Spell:2",
					bonusName: "Holy Weapon",
				},
				{
					sourceType: "Class",
					sourceName: "Priest",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Priest, Tier 1, Spell 1",
					bonusTo: "Tier:1, Spell:1",
					bonusName: "Light",
				},
				{
					sourceType: "Class",
					sourceName: "Priest",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Priest, Tier 1, Spell 2",
					bonusTo: "Tier:1, Spell:2",
					bonusName: "Protection from Evil",
				},
				{
					sourceType: "Class",
					sourceName: "Priest",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Priest, Tier 1, Spell 1",
					bonusTo: "Tier:1, Spell:1",
					bonusName: "Protection from Evil",
				},
				{
					sourceType: "Class",
					sourceName: "Priest",
					sourceCategory: "Ability",
					gainedAtLevel: 1,
					name: "Spell: Priest, Tier 1, Spell 2",
					bonusTo: "Tier:1, Spell:2",
					bonusName: "Shield of Faith",
				},
			];

			priest_spells.forEach(spell => {
				it(`${spell.name} is successfully added`, async () => {
					json.bonuses = [spell];
					const actor = await app._importActor(json);
					expect(actor.items.contents.length).equal(1);
					expect(actor.items.contents[0].name.toLowerCase()).equal(
						spell.bonusName.toLowerCase());
					await actor.delete();
				});
			});
		});
	});
};

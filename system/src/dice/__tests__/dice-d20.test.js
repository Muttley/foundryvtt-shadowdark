/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for Dice, D20 rolls
 */
import { cleanUpActorsByKey, cleanUpItemsByKey, createMockActorByKey, createMockItemByKey, waitForInput } from "../../testing/testUtils.mjs";
import D20RollSD from "../D20RollSD.mjs";

export const key = "shadowdark.dice.d20";
export const options = {
	displayName: "ShadowDark: Dice: D20",
};

const mockRollResult = (faces, result) => {
	return {
		data: {},
		options: {},
		terms: [
			{
				faces: faces,
				results: [
					{
						result: result,
						active: true,
					},
				],
				total: result,
			},
		],
		formula: `1d${faces}`,
		total: result,
	};
};

export default ({ describe, it, after, before, expect }) => {
	/* -------------------------------------------- */
	/*  Roll Analysis                               */
	/* -------------------------------------------- */
	describe("_digestCritical(roll)", () => {
		it("providing a non-d20 roll returns null", () => {
			const roll = mockRollResult(10, 1);
			expect(D20RollSD._digestCritical(roll)).is.null;
		});
		it("providing a d20 with 20 as total result returns 'success'", () => {
			const roll = mockRollResult(20, 20);
			expect(D20RollSD._digestCritical(roll)).equal("success");
		});
		it("providing a d20 with 1 as total result returns 'failure'", () => {
			const roll = mockRollResult(20, 1);
			expect(D20RollSD._digestCritical(roll)).equal("failure");
		});
		it("providing any other d20 result returns 'null", () => {
			const roll = mockRollResult(20, 10);
			expect(D20RollSD._digestCritical(roll)).is.null;
		});
	});

	/* -------------------------------------------- */
	/*  Getters from parents                        */
	/* -------------------------------------------- */
	// @todo
	describe("_getTalentAdvantage(actor)", () => {
		// Mock actor

		// Mock talents (Stout [dwarf], spell advantage [priest & wizard])
		// Mock initiative (thief)
		// Mock spell (priest & wizard + Magic Missle)
	});

	/* -------------------------------------------- */
	/*  Form & Dialog Digestion                     */
	/* -------------------------------------------- */
	describe("_getRollModeFromForm($form)", () => {
		// Mock actor
		// Mock click on ability score roll
		// Select other roll mode
		// Verify the function gets it correctly
	});

	// @todo
	describe("_checkBonusesFromForm(rollParts, data, $form)", () => {
		// Mock actor
		// Mock item
		// Mock roll item
		//   Mock changing ability bonus
		//   Mock changing talent bonus
		//   Mock changing item bonus
	});

	/* -------------------------------------------- */
	/*  Dice Rolling                                */
	/* -------------------------------------------- */

	describe("_rollDice(parts, data={})", () => {
		describe("rolling just a dice", () => {
			it("specifying dice without numDice works", async () => {
				const parts = ["d20"];

				const results = await D20RollSD._rollDice(parts);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(1);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.critical).is.not.undefined;
			});

			it("specifying dice with numDice works", async () => {
				const parts = ["1d20"];

				const results = await D20RollSD._rollDice(parts);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(1);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.critical).is.not.undefined;
			});

			it("specifying dice with non-one numDice works", async () => {
				const parts = ["3d20"];

				const results = await D20RollSD._rollDice(parts);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(3);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.critical).is.not.undefined;
			});
		});

		describe("rolling with bonuses", () => {
			const die = "1d20";

			it("@abilityBonus without data.abilityBonus adds no extra", async () => {
				const parts = [die, "@abilityBonus"];
				const data = {};

				const results = await D20RollSD._rollDice(parts, data);
				expect(results.roll.formula).equal("1d20");
			});

			it("@abilityBonus with data.abilityBonus adds no extra", async () => {
				const parts = [die, "@abilityBonus"];
				const data = {
					abilityBonus: 12,
				};

				const results = await D20RollSD._rollDice(parts, data);
				expect(results.roll.formula).equal("1d20 + 12");
			});

			it("@itemBonus without data.itemBonus adds no extra", async () => {
				const parts = [die, "@itemBonus"];
				const data = {
					abilityBonus: 12,
				};

				const results = await D20RollSD._rollDice(parts, data);
				expect(results.roll.formula).equal("1d20");
			});

			it("@itemBonus with data.itemBonus adds no extra", async () => {
				const parts = [die, "@itemBonus"];
				const data = {
					abilityBonus: 12,
					itemBonus: 19,
				};

				const results = await D20RollSD._rollDice(parts, data);
				expect(results.roll.formula).equal("1d20 + 19");
			});

			it("@talentBonus without data.talentBonus adds no extra", async () => {
				const parts = [die, "@talentBonus"];
				const data = {};

				const results = await D20RollSD._rollDice(parts, data);
				expect(results.roll.formula).equal("1d20");
			});

			it("@talentBonus with data.talentBonus adds no extra", async () => {
				const parts = [die, "@talentBonus"];
				const data = {
					talentBonus: 8,
				};

				const results = await D20RollSD._rollDice(parts, data);
				expect(results.roll.formula).equal("1d20 + 8");
			});

			it("@talentBonus with data.talentBonus adds no extra", async () => {
				const parts = [die, "@talentBonus", "@itemBonus"];
				const data = {
					talentBonus: 8,
					itemBonus: 12,
				};

				const results = await D20RollSD._rollDice(parts, data);
				expect(results.roll.formula).equal("1d20 + 8 + 12");
			});

			it("@customBonus without data.customBonus adds no extra", async () => {
				const parts = [die, "@customBonus"];
				const data = {};

				const results = await D20RollSD._rollDice(parts, data);
				expect(results.roll.formula).equal("1d20");
			});

			it("@customBonus with data.customBonus adds no extra", async () => {
				const parts = [die, "@customBonus"];
				const data = {
					customBonus: 8,
				};

				const results = await D20RollSD._rollDice(parts, data);
				expect(results.roll.formula).equal("1d20 + 8");
			});
		});
	});

	describe("_partsAdvantage(rollParts, adv)", () => {
		it("skipping `adv` gives normal roll", () => {
			let parts = ["1d8", "@bonuses"];
			parts = D20RollSD._partsAdvantage(parts);
			expect(parts[0]).equal("1d8");
		});

		it("supplying number for advantage works", () => {
			let parts = ["1d8", "@bonuses"];
			parts = D20RollSD._partsAdvantage(parts, 1);
			expect(parts[0]).equal("2d8kh");
		});

		it("supplying number for disadvantage works", () => {
			let parts = ["1d8", "@bonuses"];
			parts = D20RollSD._partsAdvantage(parts, -1);
			expect(parts[0]).equal("2d8kl");
		});
	});

	/* -------------------------------------------- */
	/*  Specific Dice Rolling                       */
	/* -------------------------------------------- */

	// @todo: Write tests with updated code
	describe("rollD20(parts, adv, $form, data, options={})", () => {
		const responseData = {
			renderedHTML: "",
			roll: "",
			critical: null,
		};

		const data = {
			actor: {
				system: {
					abilities: {
						cha: {
							value: 10,
						},
						con: {
							value: 10,
						},
						dex: {
							value: 10,
						},
						int: {
							value: 10,
						},
						str: {
							value: 10,
						},
						wis: {
							value: 10,
						},
					},
					attributes: {
						hp: {
							max: 0,
							value: 0,
						},
						ac: {
							value: 10,
						},
					},
					luck: true,
					bonuses: {
						advantage: ["hp", "meleeAttack"],
						weaponMastery: ["whip", "bastardSword"],
						meleeAttackBonus: 4,
						meleeDamageBonus: 1,
						rangedAttackBonus: 1,
						rangedDamageBonus: 2,
						spellcastingCheckBonus: 5,
					},
				},
			},
			item: {
				system: {
					attackBonus: 3,
					damage: {
						bonus: 0,
						numDice: 1,
						oneHanded: "d8",
						twoHanded: "d10",
					},
					tier: 0, // spells
					properties: [
						"finesse",
						"twoHanded",
						"versatile",
					],
					weaponMastery: false,
				},
			},
		};

		const parts = ["@abilityBonus", "@itemBonus", "@talentBonus"];

		it("returns the correct object structure", async () => {
			// Mock clicking
			const responseData = await D20RollSD.RollD20(parts, {}, "");
			console.log(responseData);
			expect(Object.keys(responseData).length).equal(3);
			expect(responseData.renderedHTML).is.not.undefined;
			expect(responseData.roll).is.not.undefined;
			expect(responseData.critical).is.not.undefined;
		});

		it("supplying dice without amount before", async () => {
			const parts = D20RollSD._rollDice("d8", ["@bonus"], {});
			expect(parts).contain("1d8");
			expect(parts).contain("@bonus");
		});

		it("supplying dice with amount before", async () => {
			const parts = D20RollSD._rollDice("3d8", ["@bonus"], {});
			expect(parts).contain("3d8");
		});
	});

	// @todo: Write tests
	describe("_rollD20()", () => {});

	// @todo: Refactor, dice rolling to another module?
	describe("_rollWeapon()", () => {
		let item;

		before(async () => {
			item = await createMockItemByKey(key, "Weapon");
			await item.update({
				"system.properties": ["versatile"],
				"system.damage": { oneHanded: "d8", twoHanded: "d10", numDice: 1},
			});
		});

		after(() => {
			cleanUpItemsByKey(key);
		});

		it("normal attack rolls the dice", async () => {
			let data = {
				item,
				rolls: {
					rollD20Result: {
						critical: null,
					},
				},
			};
			data = await D20RollSD._rollWeapon(data);
			expect(data.rolls.rollPrimaryDamage.terms[0].faces).equal(8);
			expect(data.rolls.rollPrimaryDamage.terms[0].number).equal(1);
			expect(data.rolls.rollSecondaryDamage.terms[0].faces).equal(10);
			expect(data.rolls.rollSecondaryDamage.terms[0].number).equal(1);
		});

		it("critical success doubles the dice", async () => {
			let data = {
				item,
				rolls: {
					rollD20Result: {
						critical: "success",
					},
				},
			};
			data = await D20RollSD._rollWeapon(data);
			expect(data.rolls.rollPrimaryDamage.terms[0].faces).equal(8);
			expect(data.rolls.rollPrimaryDamage.terms[0].number).equal(2);
			expect(data.rolls.rollSecondaryDamage.terms[0].faces).equal(10);
			expect(data.rolls.rollSecondaryDamage.terms[0].number).equal(2);
		});

		it("critical failure rolls no dice", async () => {
			let data = {
				item,
				rolls: {
					rollD20Result: {
						critical: "failure",
					},
				},
			};
			data = await D20RollSD._rollWeapon(data);
			expect(data.rolls.rollPrimaryDamage).is.undefined;
			expect(data.rolls.rollSecondaryDamage).is.undefined;
		});
	});

	/* -------------------------------------------- */
	/*  Integrations                                */
	/* -------------------------------------------- */
	describe("_rollDiceSoNice()", () => {
		// Skipping integration testing with Dice So Nice.
	});


	/* -------------------------------------------- */
	/*  E2E testing                                 */
	/* -------------------------------------------- */
	describe("d20Roll({})", () => {
		describe("providing @abilityBonus in parts adds ability bonuses", () => {});
		describe("providing @abilityBonus in parts but not abilityBonus doesn't adds ability bonuses", () => {});
		describe("providing no @abilityBonus in parts but abilityBonus doesn't adds ability bonuses", () => {});

		describe("providing @itemBonus in parts adds item bonuses", () => {});
		describe("providing @itemBonus in parts but not itemBonus doesn't adds ability bonuses", () => {});
		describe("providing no @itemBonus in parts but itemBonus doesn't adds ability bonuses", () => {});

		describe("providing @talentBnous in parts adds talent bonuses", () => {});
		describe("providing @talentBnous in parts but not talentBnous doesn't adds ability bonuses", () => {});
		describe("providing no @talentBnous in parts but talentBnous doesn't adds ability bonuses", () => {});

		describe("not changing chatMessage do generate a chatmessage", () => {});
		describe("setting chatMessage to true do generate a chatmessage", () => {});
		describe("setting chatMessage to false doesn't generate a chatmessage", () => {});

		describe("holding ctrl skips roll dialogs and rolls normal", () => {});
		describe("holding meta skips roll dialogs and rolls normal", () => {});
		describe("holding shift skips roll dialogs and rolls with advantage", () => {});
		describe("holding alt skips roll dialogs and rolls with disadvantage", () => {});
	});
};

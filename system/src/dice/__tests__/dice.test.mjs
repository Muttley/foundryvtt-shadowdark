/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for Dice
 */
import RollSD from "../RollSD.mjs";

export const key = "shadowdark.dice";
export const options = {
	displayName: "Shadowdark: Dice",
	preSelected: true,
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

const mockData = () => {
	return {
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
				level: {
					value: 5,
				},
				luck: true,
				bonuses: {
					advantage: ["hp", "meleeAttack"],
					weaponMastery: ["whip", "bastard-sword"],
					meleeAttackBonus: 4,
					meleeDamageBonus: 1,
					rangedAttackBonus: 1,
					rangedDamageBonus: 2,
					spellcastingCheckBonus: 5,
					backstabDie: 3,
					critical: {
						successThreshold: 20,
						failureThreshold: 3,
					},
				},
			},
		},
		item: {
			isTwoHanded: () => {
				return false;
			},
			isVersatile: () => {
				return true;
			},
			system: {
				damage: {
					numDice: 1,
					oneHanded: "d8",
					twoHanded: "d10",
				},
				bonuses: {
					attackBonus: 3,
					damageBonus: 0,
					critical: {
						multiplier: 2,
					},
				},
				tier: 0, // spells
				properties: [
					"finesse",
					"twoHanded",
					"versatile",
				],
				weaponMastery: false,
				baseWeapon: "",
			},
		},
	};
};

export default ({ describe, it, expect }) => {
	describe("Roll(parts, data, $form, adv=0, options={})", () => {
		// Skipping as this is more E2E with form parsing et.c.
	});

	describe("RollD20(parts, data, $form, adv=0, options={})", () => {
		// Skipping as this is more E2E with form parsing et.c.
	});

	/* -------------------------------------------- */
	/*  Roll Analysis                               */
	/* -------------------------------------------- */
	describe("_isD20(parts)", () => {
		it("non-d20 returns false", () => {
			expect(RollSD._isD20(["1d8"])).is.false;
			expect(RollSD._isD20(["string"])).is.false;
			expect(RollSD._isD20([1])).is.false;
		});

		it("d20 returns true", () => {
			expect(RollSD._isD20(["1d20"])).is.true;
			expect(RollSD._isD20(["d20"])).is.true;
			expect(RollSD._isD20(["3d20"])).is.true;
		});
	});

	describe("_digestCritical(roll, options={})", () => {
		it("providing a non-d20 roll returns null", () => {
			const roll = mockRollResult(10, 1);
			expect(RollSD._digestCritical(roll)).is.null;
		});
		it("providing a d20 with 20 as total result returns 'success'", () => {
			const roll = mockRollResult(20, 20);
			expect(RollSD._digestCritical(roll)).equal("success");
		});
		it("providing a d20 with 1 as total result returns 'failure'", () => {
			const roll = mockRollResult(20, 1);
			expect(RollSD._digestCritical(roll)).equal("failure");
		});
		it("providing any other d20 result returns 'null", () => {
			const roll = mockRollResult(20, 10);
			expect(RollSD._digestCritical(roll)).is.null;
		});

		describe("options with critical threshold values", () => {
			it("increased lower threshold results in failure", () => {
				const options = { critical: { failureThreshold: 3 } };
				expect(RollSD._digestCritical(mockRollResult(20, 4), options)).is.null;
				expect(RollSD._digestCritical(mockRollResult(20, 3), options)).equal("failure");
				expect(RollSD._digestCritical(mockRollResult(20, 2), options)).equal("failure");
				expect(RollSD._digestCritical(mockRollResult(20, 1), options)).equal("failure");
			});

			it("decreased higher threshold results in success", () => {
				const options = { critical: { successThreshold: 18 } };
				expect(RollSD._digestCritical(mockRollResult(20, 17), options)).is.null;
				expect(RollSD._digestCritical(mockRollResult(20, 18), options)).equal("success");
				expect(RollSD._digestCritical(mockRollResult(20, 19), options)).equal("success");
				expect(RollSD._digestCritical(mockRollResult(20, 20), options)).equal("success");
			});

			it("both threhshold modified", () => {
				const options = { critical: { successThreshold: 18, failureThreshold: 3 } };
				expect(RollSD._digestCritical(mockRollResult(20, 1), options)).equal("failure");
				expect(RollSD._digestCritical(mockRollResult(20, 2), options)).equal("failure");
				expect(RollSD._digestCritical(mockRollResult(20, 3), options)).equal("failure");
				expect(RollSD._digestCritical(mockRollResult(20, 4), options)).is.null;
				expect(RollSD._digestCritical(mockRollResult(20, 17), options)).is.null;
				expect(RollSD._digestCritical(mockRollResult(20, 18), options)).equal("success");
				expect(RollSD._digestCritical(mockRollResult(20, 19), options)).equal("success");
				expect(RollSD._digestCritical(mockRollResult(20, 20), options)).equal("success");
			});
		});
	});

	describe("_digestParts(parts, data)", () => {
		it("return empty array if all parts but no bonuses applied", () => {
			const parts = ["@abilityBonus", "@talentBonus", "@itemBonus"];
			const data = {};
			const response = RollSD._digestParts(parts, data);
			expect(response.length).equal(0);
		});

		it("return empty array if no parts but bonuses applied", () => {
			const parts = [];
			const data = { abilityBonus: 1, itemBonus: 2, talentBonus: 3 };
			const response = RollSD._digestParts(parts, data);
			expect(response.length).equal(0);
		});

		it("return empty array if all parts but and zero bonus", () => {
			const parts = ["@abilityBonus", "@talentBonus", "@itemBonus"];
			const data = { abilityBonus: 0 };
			const response = RollSD._digestParts(parts, data);
			expect(response.length).equal(0);
		});

		it("all bonuses, one parts", () => {
			const parts = ["@itemBonus"];
			const data = { abilityBonus: 1, itemBonus: 2, talentBonus: 3 };
			const response = RollSD._digestParts(parts, data);
			expect(response.length).equal(1);
			expect(response[0]).equal("@itemBonus");
		});

		it("all parts, one bonus", () => {
			const parts = ["@abilityBonus", "@itemBonus", "@talentBonus"];
			const data = { itemBonus: 2 };
			const response = RollSD._digestParts(parts, data);
			expect(response.length).equal(1);
			expect(response[0]).equal("@itemBonus");
		});

		it("all parts, two bonus", () => {
			const parts = ["@abilityBonus", "@itemBonus", "@talentBonus"];
			const data = { abilityBonus: 1, talentBonus: 3};
			const response = RollSD._digestParts(parts, data);
			expect(response.length).equal(2);
			expect(response).contain("@abilityBonus");
			expect(response).contain("@talentBonus");
		});
	});

	describe("_partsAdvantage(rollParts, adv)", () => {
		it("skipping `adv` gives normal roll", () => {
			let parts = ["1d8", "@bonuses"];
			parts = RollSD._partsAdvantage(parts);
			expect(parts[0]).equal("1d8");
		});

		it("supplying number for advantage works", () => {
			let parts = ["1d8", "@bonuses"];
			parts = RollSD._partsAdvantage(parts, 1);
			expect(parts[0]).equal("2d8kh");
		});

		it("supplying number for disadvantage works", () => {
			let parts = ["1d8", "@bonuses"];
			parts = RollSD._partsAdvantage(parts, -1);
			expect(parts[0]).equal("2d8kl");
		});

		it("non single-die with advantage returns parts as is", () => {
			let parts = ["2d8", "@bonuses"];
			parts = RollSD._partsAdvantage(parts, -1);
			expect(parts[0]).equal("2d8");
		});
	});

	/* -------------------------------------------- */
	/*  Dice Rolling                                */
	/* -------------------------------------------- */

	describe("_roll(parts, data={})", () => {
		describe("rolling just a dice", () => {
			it("specifying dice without numDice works", async () => {
				const parts = ["d20"];

				const results = await RollSD._roll(parts);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(1);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.critical).is.not.undefined;
			});

			it("specifying dice with numDice works", async () => {
				const parts = ["1d20"];

				const results = await RollSD._roll(parts);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(1);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.critical).is.not.undefined;
			});

			it("specifying dice with non-one numDice works", async () => {
				const parts = ["3d20"];

				const results = await RollSD._roll(parts);
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

				const results = await RollSD._roll(parts, data);
				expect(results.roll.formula).equal("1d20");
			});

			it("@abilityBonus with data.abilityBonus adds no extra", async () => {
				const parts = [die, "@abilityBonus"];
				const data = {
					abilityBonus: 12,
				};

				const results = await RollSD._roll(parts, data);
				expect(results.roll.formula).equal("1d20 + 12");
			});

			it("@itemBonus without data.itemBonus adds no extra", async () => {
				const parts = [die, "@itemBonus"];
				const data = {
					abilityBonus: 12,
				};

				const results = await RollSD._roll(parts, data);
				expect(results.roll.formula).equal("1d20");
			});

			it("@itemBonus with data.itemBonus adds no extra", async () => {
				const parts = [die, "@itemBonus"];
				const data = {
					abilityBonus: 12,
					itemBonus: 19,
				};

				const results = await RollSD._roll(parts, data);
				expect(results.roll.formula).equal("1d20 + 19");
			});

			it("@talentBonus without data.talentBonus adds no extra", async () => {
				const parts = [die, "@talentBonus"];
				const data = {};

				const results = await RollSD._roll(parts, data);
				expect(results.roll.formula).equal("1d20");
			});

			it("@talentBonus with data.talentBonus adds no extra", async () => {
				const parts = [die, "@talentBonus"];
				const data = {
					talentBonus: 8,
				};

				const results = await RollSD._roll(parts, data);
				expect(results.roll.formula).equal("1d20 + 8");
			});

			it("@talentBonus with data.talentBonus adds no extra", async () => {
				const parts = [die, "@talentBonus", "@itemBonus"];
				const data = {
					talentBonus: 8,
					itemBonus: 12,
				};

				const results = await RollSD._roll(parts, data);
				expect(results.roll.formula).equal("1d20 + 8 + 12");
			});

			it("@customBonus without data.customBonus adds no extra", async () => {
				const parts = [die, "@customBonus"];
				const data = {};

				const results = await RollSD._roll(parts, data);
				expect(results.roll.formula).equal("1d20");
			});

			it("@customBonus with data.customBonus adds no extra", async () => {
				const parts = [die, "@customBonus"];
				const data = {
					customBonus: 8,
				};

				const results = await RollSD._roll(parts, data);
				expect(results.roll.formula).equal("1d20 + 8");
			});
		});
	});

	describe("_rollAdvantage(parts, adv=0 data={})", () => {
		describe("rolling just a dice", () => {
			it("by default rolls without any advantage for missing numDice", async () => {
				const parts = ["d20"];

				const results = await RollSD._rollAdvantage(parts);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(1);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.roll._formula).equal("1d20");
				expect(results.critical).is.not.undefined;
			});

			it("by default rolls without any advantage", async () => {
				const parts = ["1d20"];

				const results = await RollSD._rollAdvantage(parts);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(1);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.roll._formula).equal("1d20");
				expect(results.critical).is.not.undefined;
			});

			it("adv=1 gives an advantage roll for d20", async () => {
				const parts = ["1d20"];

				const results = await RollSD._rollAdvantage(parts, {}, 1);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(2);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.roll._formula).equal("2d20kh");
				expect(results.critical).is.not.undefined;
			});

			it("adv=1 gives an advantage roll for non-d20", async () => {
				const parts = ["1d10"];

				const results = await RollSD._rollAdvantage(parts, {}, 1);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(2);
				expect(results.roll.terms[0].faces).equal(10);
				expect(results.roll._formula).equal("2d10kh");
				expect(results.critical).is.not.undefined;
			});

			it("adv=-1 gives an disadvantage roll for d20", async () => {
				const parts = ["1d20"];

				const results = await RollSD._rollAdvantage(parts, {}, -1);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(2);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.roll._formula).equal("2d20kl");
				expect(results.critical).is.not.undefined;
			});

			it("adv=-1 gives an disadvantage roll for non-d20", async () => {
				const parts = ["1d10"];

				const results = await RollSD._rollAdvantage(parts, {}, -1);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(2);
				expect(results.roll.terms[0].faces).equal(10);
				expect(results.roll._formula).equal("2d10kl");
				expect(results.critical).is.not.undefined;
			});

			it("adv=0 gives a normal roll for d20", async () => {
				const parts = ["1d20"];

				const results = await RollSD._rollAdvantage(parts, {}, 0);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(1);
				expect(results.roll.terms[0].faces).equal(20);
				expect(results.roll._formula).equal("1d20");
				expect(results.critical).is.not.undefined;
			});

			it("adv=1 gives a normal roll for non-d20", async () => {
				const parts = ["1d10"];

				const results = await RollSD._rollAdvantage(parts, {}, 0);
				expect(results.renderedHTML).is.not.undefined;
				expect(results.roll).is.not.undefined;
				expect(results.roll.terms[0].number).equal(1);
				expect(results.roll.terms[0].faces).equal(10);
				expect(results.roll._formula).equal("1d10");
				expect(results.critical).is.not.undefined;
			});
		});
	});

	/* -------------------------------------------- */
	/*  Specific Dice Rolling                       */
	/* -------------------------------------------- */
	describe("_rollD20(parts, data, adv)", () => {
		it("rolling just a d20", async () => {
			const response = await RollSD._rollD20();
			expect(response.renderedHTML).is.not.undefined;
			expect(response.roll).is.not.undefined;
			expect(response.roll.formula).equal("1d20");
			expect(response.roll.terms.length).equal(1);
			expect(response.roll.terms[0].number).equal(1);
			expect(response.roll.terms[0].faces).equal(20);
			expect(response.critical).is.not.undefined;
		});

		it("rolling just a d20 with advantage", async () => {
			const response = await RollSD._rollD20([], {}, 1);
			expect(response.renderedHTML).is.not.undefined;
			expect(response.roll).is.not.undefined;
			expect(response.roll.formula).equal("2d20kh");
			expect(response.roll.terms.length).equal(1);
			expect(response.roll.terms[0].number).equal(2);
			expect(response.roll.terms[0].faces).equal(20);
			expect(response.critical).is.not.undefined;
		});

		it("rolling just a d20 with disadvantage", async () => {
			const response = await RollSD._rollD20([], {}, -1);
			expect(response.renderedHTML).is.not.undefined;
			expect(response.roll).is.not.undefined;
			expect(response.roll.formula).equal("2d20kl");
			expect(response.roll.terms.length).equal(1);
			expect(response.roll.terms[0].number).equal(2);
			expect(response.roll.terms[0].faces).equal(20);
			expect(response.critical).is.not.undefined;
		});

		it("rolling with parts", async () => {
			const response = await RollSD._rollD20(
				["@abilityBonus"],
				{ abilityBonus: 13 }
			);
			expect(response.renderedHTML).is.not.undefined;
			expect(response.roll).is.not.undefined;
			expect(response.roll.formula).equal("1d20 + 13");
			expect(response.roll.terms.length).equal(3);
			expect(response.roll.terms[0].number).equal(1);
			expect(response.roll.terms[0].faces).equal(20);
			expect(response.critical).is.not.undefined;
		});

		it("rolling with parts but missing bonus", async () => {
			const response = await RollSD._rollD20(
				["@abilityBonus"]
			);
			expect(response.renderedHTML).is.not.undefined;
			expect(response.roll).is.not.undefined;
			expect(response.roll.formula).equal("1d20");
			expect(response.roll.terms.length).equal(1);
			expect(response.roll.terms[0].number).equal(1);
			expect(response.roll.terms[0].faces).equal(20);
			expect(response.critical).is.not.undefined;
		});

		it("rolling with multiple parts but missing bonus", async () => {
			const parts = ["@abilityBonus", "@itemBonus", "@talentBonus"];
			const response = await RollSD._rollD20(parts);
			expect(response.renderedHTML).is.not.undefined;
			expect(response.roll).is.not.undefined;
			expect(response.roll.formula).equal("1d20");
			expect(response.roll.terms.length).equal(1);
			expect(response.roll.terms[0].number).equal(1);
			expect(response.roll.terms[0].faces).equal(20);
			expect(response.critical).is.not.undefined;
		});

		it("rolling with multiple parts and bonuses", async () => {
			const parts = ["@abilityBonus", "@itemBonus", "@talentBonus"];
			const response = await RollSD._rollD20(
				parts,
				{ abilityBonus: 1, itemBonus: 2, talentBonus: 3}
			);
			expect(response.renderedHTML).is.not.undefined;
			expect(response.roll).is.not.undefined;
			expect(response.roll.formula).equal("1d20 + 1 + 2 + 3");
			expect(response.roll.terms.length).equal(7);
			expect(response.roll.terms[0].number).equal(1);
			expect(response.roll.terms[0].faces).equal(20);
			expect(response.critical).is.not.undefined;
		});

		it("rolling with dice parts and bonuses", async () => {
			const parts = ["@abilityBonus", "@itemBonus", "@talentBonus"];
			const response = await RollSD._rollD20(
				parts,
				{ abilityBonus: "1d12", itemBonus: "3d4" }
			);
			expect(response.renderedHTML).is.not.undefined;
			expect(response.roll).is.not.undefined;
			expect(response.roll.formula).equal("1d20 + 1d12 + 3d4");
			expect(response.roll.terms.length).equal(5);
			expect(response.roll.terms[0].number).equal(1);
			expect(response.roll.terms[0].faces).equal(20);
			expect(response.roll.terms[2].number).equal(1);
			expect(response.roll.terms[2].faces).equal(12);
			expect(response.roll.terms[4].number).equal(3);
			expect(response.roll.terms[4].faces).equal(4);
			expect(response.critical).is.not.undefined;
		});
	});

	/* -------------------------------------------- */
	/*  Special Case Rolling                        */
	/* -------------------------------------------- */
	describe("_rollNpcAttack(data)", () => {
		const mockData = {
			item: {
				system: {
					damage: {
						numDice: 1,
						value: "d6",
					},
					bonuses: {
						attackBonus: 0,
						damagebonus: 0,
						critical: {
							multiplier: 2,
						},
					},
				},
			},
		};

		it("non-critical rolls as intended", async () => {
			mockData.rolls = { main: { critical: null } };
			mockData.damageParts = [];

			const response = await RollSD._rollNpcAttack(mockData);
			expect(response.rolls.primaryDamage).is.not.undefined;
			expect(response.rolls.primaryDamage.renderedHTML).is.not.undefined;
			expect(response.rolls.primaryDamage.roll).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).equal(1);
			expect(response.rolls.primaryDamage.roll.terms[0].faces).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].faces).equal(6);
		});

		it("critical success rolls double dice", async () => {
			mockData.rolls = { main: { critical: "success" } };
			mockData.damageParts = [];

			const response = await RollSD._rollNpcAttack(mockData);
			expect(response.rolls.primaryDamage).is.not.undefined;
			expect(response.rolls.primaryDamage.renderedHTML).is.not.undefined;
			expect(response.rolls.primaryDamage.roll).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).equal(2);
			expect(response.rolls.primaryDamage.roll.terms[0].faces).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].faces).equal(6);
		});

		it("critical failure rolls no damage dice", async () => {
			mockData.rolls = { main: { critical: "failure" } };
			mockData.damageParts = [];

			const response = await RollSD._rollNpcAttack(mockData);
			expect(Object.keys(response.rolls).length).equal(1);
		});
	});

	describe("_rollWeapon(data)", () => {
		it("data expected to be augmented with 3 rolls", async () => {
			const mockItemData = mockData();
			mockItemData.rolls = { main: { critical: null } };
			mockItemData.damageParts = [];
			expect(Object.keys(mockItemData.rolls).length).equal(1);

			const response = await RollSD._rollWeapon(mockItemData);
			expect(Object.keys(response.rolls).length).equal(3);
			expect(response.rolls.primaryDamage).is.not.undefined;
			expect(response.rolls.primaryDamage.renderedHTML).is.not.undefined;
			expect(response.rolls.primaryDamage.roll).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).equal(1);
			expect(response.rolls.secondaryDamage).is.not.undefined;
			expect(response.rolls.secondaryDamage.renderedHTML).is.not.undefined;
			expect(response.rolls.secondaryDamage.roll).is.not.undefined;
			expect(response.rolls.secondaryDamage.roll.terms[0].number).is.not.undefined;
			expect(response.rolls.secondaryDamage.roll.terms[0].number).equal(1);
		});

		it("critical success expected to roll double dice", async () => {
			const mockItemData = mockData();
			mockItemData.rolls = { main: { critical: "success" } };
			mockItemData.damageParts = [];
			expect(Object.keys(mockItemData.rolls).length).equal(1);

			const response = await RollSD._rollWeapon(mockItemData);
			expect(Object.keys(response.rolls).length).equal(3);
			expect(response.rolls.primaryDamage).is.not.undefined;
			expect(response.rolls.primaryDamage.renderedHTML).is.not.undefined;
			expect(response.rolls.primaryDamage.roll).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).equal(2);
			expect(response.rolls.secondaryDamage).is.not.undefined;
			expect(response.rolls.secondaryDamage.renderedHTML).is.not.undefined;
			expect(response.rolls.secondaryDamage.roll).is.not.undefined;
			expect(response.rolls.secondaryDamage.roll.terms[0].number).is.not.undefined;
			expect(response.rolls.secondaryDamage.roll.terms[0].number).equal(2);
		});

		it("critical success expected to roll 4x dice with a 4 crit multiplier", async () => {
			const mockItemData = mockData();
			mockItemData.rolls = { main: { critical: "success" } };
			mockItemData.damageParts = [];
			mockItemData.item.system.bonuses.critical.multiplier = 4;
			expect(Object.keys(mockItemData.rolls).length).equal(1);

			const response = await RollSD._rollWeapon(mockItemData);
			expect(Object.keys(response.rolls).length).equal(3);
			expect(response.rolls.primaryDamage).is.not.undefined;
			expect(response.rolls.primaryDamage.renderedHTML).is.not.undefined;
			expect(response.rolls.primaryDamage.roll).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).is.not.undefined;
			expect(response.rolls.primaryDamage.roll.terms[0].number).equal(4);
			expect(response.rolls.secondaryDamage).is.not.undefined;
			expect(response.rolls.secondaryDamage.renderedHTML).is.not.undefined;
			expect(response.rolls.secondaryDamage.roll).is.not.undefined;
			expect(response.rolls.secondaryDamage.roll.terms[0].number).is.not.undefined;
			expect(response.rolls.secondaryDamage.roll.terms[0].number).equal(4);
		});

		it("critical failure expected to not roll damage dice", async () => {
			const mockItemData = mockData();
			mockItemData.rolls = { main: { critical: "failure" } };
			mockItemData.damageParts = [];
			expect(Object.keys(mockItemData.rolls).length).equal(1);

			const response = await RollSD._rollWeapon(mockItemData);
			expect(Object.keys(response.rolls).length).equal(1);
		});

		describe("Backstabbing", () => {
			it("Backstab rolls the expected dice", async () => {
				const mockItemData = mockData();
				mockItemData.rolls = { main: { critical: null } };
				mockItemData.backstab = true;
				mockItemData.damageParts = [];
				const response = await RollSD._rollWeapon(mockItemData);
				expect(Object.keys(mockItemData.rolls).length).equal(3);
				expect(response.rolls.primaryDamage).is.not.undefined;
				expect(response.rolls.primaryDamage.renderedHTML).is.not.undefined;
				expect(response.rolls.primaryDamage.roll).is.not.undefined;
				expect(response.rolls.primaryDamage.roll.terms.length).equal(1);
				expect(response.rolls.primaryDamage.roll.terms[0].number).is.not.undefined;
				expect(response.rolls.primaryDamage.roll.terms[0].number).equal(1+1+3+2);
				expect(response.rolls.secondaryDamage).is.not.undefined;
				expect(response.rolls.secondaryDamage.renderedHTML).is.not.undefined;
				expect(response.rolls.secondaryDamage.roll).is.not.undefined;
				expect(response.rolls.secondaryDamage.roll.terms[0].number).is.not.undefined;
				expect(response.rolls.secondaryDamage.roll.terms[0].number).equal(7);
			});

			it("Critical backstab rolls the expected dice", async () => {
				const mockItemData = mockData();
				mockItemData.rolls = { main: { critical: "success" } };
				mockItemData.backstab = true;
				mockItemData.damageParts = [];
				const response = await RollSD._rollWeapon(mockItemData);
				expect(Object.keys(mockItemData.rolls).length).equal(3);
				expect(response.rolls.primaryDamage).is.not.undefined;
				expect(response.rolls.primaryDamage.renderedHTML).is.not.undefined;
				expect(response.rolls.primaryDamage.roll).is.not.undefined;
				expect(response.rolls.primaryDamage.roll.terms.length).equal(1);
				expect(response.rolls.primaryDamage.roll.terms[0].number).is.not.undefined;
				expect(response.rolls.primaryDamage.roll.terms[0].number).equal(14);
				expect(response.rolls.secondaryDamage).is.not.undefined;
				expect(response.rolls.secondaryDamage.renderedHTML).is.not.undefined;
				expect(response.rolls.secondaryDamage.roll).is.not.undefined;
				expect(response.rolls.secondaryDamage.roll.terms[0].number).is.not.undefined;
				expect(response.rolls.secondaryDamage.roll.terms[0].number).equal(14);
			});
		});
	});
};

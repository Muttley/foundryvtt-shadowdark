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

	describe("_digestResult(roll)", () => {
		describe("returns an object with critical", () => {
			it("1 returns 'failure'", () => {
				const roll = mockRollResult(20, 1);
				expect(D20RollSD._digestResult(roll).critical).equal("failure");
				expect(D20RollSD._digestResult(roll).total).equal(1);
			});
			it("20 returns 'success'", () => {
				const roll = mockRollResult(20, 20);
				expect(D20RollSD._digestResult(roll).critical).equal("success");
				expect(D20RollSD._digestResult(roll).total).equal(20);
			});
			it("10 returns null", () => {
				const roll = mockRollResult(20, 12);
				expect(D20RollSD._digestResult(roll).critical).is.null;
				expect(D20RollSD._digestResult(roll).total).equal(12);
			});
		});

		it("returns the roll total in object", () => {
			const roll = mockRollResult(20, 499);
			expect(D20RollSD._digestResult(roll).total).equal(499);
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
	/*  Data Generation for Displaying              */
	/* -------------------------------------------- */
	describe("_getChatCardData(roll, speaker, target=false)", () => {
		it("normal roll", () => {
			const roll = mockRollResult(20, 12);
			const chatData = D20RollSD._getChatCardData(roll, "");

			expect(chatData).is.not.undefined;
			expect(chatData.user).is.not.undefined;
			expect(chatData.user).equal(game.user.id);
			expect(chatData.speaker).is.not.undefined;
			expect(chatData.speaker).equal("");
			expect(chatData.flags).is.not.undefined;
			expect(chatData.flags.isRoll).is.not.undefined;
			expect(chatData.flags.isRoll).is.true;
			expect(chatData.flags["core.canPopout"]).is.not.undefined;
			expect(chatData.flags["core.canPopout"]).is.true;
			expect(chatData.flags.hasTarget).is.not.undefined;
			expect(chatData.flags.hasTarget).is.false;
			expect(chatData.flags.critical).is.not.undefined;
			expect(chatData.flags.critical).is.null;
			expect(chatData.flags.success).is.undefined;
		});

		it("critical success roll", () => {
			const roll = mockRollResult(20, 20);
			const chatData = D20RollSD._getChatCardData(roll, "");

			expect(chatData).is.not.undefined;
			expect(chatData.user).is.not.undefined;
			expect(chatData.user).equal(game.user.id);
			expect(chatData.speaker).is.not.undefined;
			expect(chatData.speaker).equal("");
			expect(chatData.flags).is.not.undefined;
			expect(chatData.flags.isRoll).is.not.undefined;
			expect(chatData.flags.isRoll).is.true;
			expect(chatData.flags["core.canPopout"]).is.not.undefined;
			expect(chatData.flags["core.canPopout"]).is.true;
			expect(chatData.flags.hasTarget).is.not.undefined;
			expect(chatData.flags.hasTarget).is.false;
			expect(chatData.flags.critical).is.not.undefined;
			expect(chatData.flags.critical).equal("success");
			expect(chatData.flags.success).is.undefined;
		});

		it("critical failure roll", () => {
			const roll = mockRollResult(20, 1);
			const chatData = D20RollSD._getChatCardData(roll, "");

			expect(chatData).is.not.undefined;
			expect(chatData.user).is.not.undefined;
			expect(chatData.user).equal(game.user.id);
			expect(chatData.speaker).is.not.undefined;
			expect(chatData.speaker).equal("");
			expect(chatData.flags).is.not.undefined;
			expect(chatData.flags.isRoll).is.not.undefined;
			expect(chatData.flags.isRoll).is.true;
			expect(chatData.flags["core.canPopout"]).is.not.undefined;
			expect(chatData.flags["core.canPopout"]).is.true;
			expect(chatData.flags.hasTarget).is.not.undefined;
			expect(chatData.flags.hasTarget).is.false;
			expect(chatData.flags.critical).is.not.undefined;
			expect(chatData.flags.critical).equal("failure");
			expect(chatData.flags.success).is.undefined;
		});

		it("provided a target, determination of success is return", () => {
			const roll = mockRollResult(20, 12);
			const chatData = D20RollSD._getChatCardData(roll, "", 12);

			expect(chatData).is.not.undefined;
			expect(chatData.user).is.not.undefined;
			expect(chatData.user).equal(game.user.id);
			expect(chatData.speaker).is.not.undefined;
			expect(chatData.speaker).equal("");
			expect(chatData.flags).is.not.undefined;
			expect(chatData.flags.isRoll).is.not.undefined;
			expect(chatData.flags.isRoll).is.true;
			expect(chatData.flags["core.canPopout"]).is.not.undefined;
			expect(chatData.flags["core.canPopout"]).is.true;
			expect(chatData.flags.hasTarget).is.not.undefined;
			expect(chatData.flags.hasTarget).is.true;
			expect(chatData.flags.critical).is.not.undefined;
			expect(chatData.flags.critical).is.null;
			expect(chatData.flags.success).is.not.undefined;
		});

		it("rolling under target leads to failure", () => {
			const roll = mockRollResult(20, 12);
			const chatData = D20RollSD._getChatCardData(roll, "", 13);

			expect(chatData).is.not.undefined;
			expect(chatData.user).is.not.undefined;
			expect(chatData.user).equal(game.user.id);
			expect(chatData.speaker).is.not.undefined;
			expect(chatData.speaker).equal("");
			expect(chatData.flags).is.not.undefined;
			expect(chatData.flags.isRoll).is.not.undefined;
			expect(chatData.flags.isRoll).is.true;
			expect(chatData.flags["core.canPopout"]).is.not.undefined;
			expect(chatData.flags["core.canPopout"]).is.true;
			expect(chatData.flags.hasTarget).is.not.undefined;
			expect(chatData.flags.hasTarget).is.true;
			expect(chatData.flags.critical).is.not.undefined;
			expect(chatData.flags.critical).is.null;
			expect(chatData.flags.success).is.not.undefined;
			expect(chatData.flags.success).is.false;
		});

		it("rolling equal to target leads to success", () => {
			const roll = mockRollResult(20, 12);
			const chatData = D20RollSD._getChatCardData(roll, "", 12);

			expect(chatData).is.not.undefined;
			expect(chatData.user).is.not.undefined;
			expect(chatData.user).equal(game.user.id);
			expect(chatData.speaker).is.not.undefined;
			expect(chatData.speaker).equal("");
			expect(chatData.flags).is.not.undefined;
			expect(chatData.flags.isRoll).is.not.undefined;
			expect(chatData.flags.isRoll).is.true;
			expect(chatData.flags["core.canPopout"]).is.not.undefined;
			expect(chatData.flags["core.canPopout"]).is.true;
			expect(chatData.flags.hasTarget).is.not.undefined;
			expect(chatData.flags.hasTarget).is.true;
			expect(chatData.flags.critical).is.not.undefined;
			expect(chatData.flags.critical).is.null;
			expect(chatData.flags.success).is.not.undefined;
			expect(chatData.flags.success).is.true;
		});

		it("rolling over target leads to success", () => {
			const roll = mockRollResult(20, 12);
			const chatData = D20RollSD._getChatCardData(roll, "", 11);

			expect(chatData).is.not.undefined;
			expect(chatData.user).is.not.undefined;
			expect(chatData.user).equal(game.user.id);
			expect(chatData.speaker).is.not.undefined;
			expect(chatData.speaker).equal("");
			expect(chatData.flags).is.not.undefined;
			expect(chatData.flags.isRoll).is.not.undefined;
			expect(chatData.flags.isRoll).is.true;
			expect(chatData.flags["core.canPopout"]).is.not.undefined;
			expect(chatData.flags["core.canPopout"]).is.true;
			expect(chatData.flags.hasTarget).is.not.undefined;
			expect(chatData.flags.hasTarget).is.true;
			expect(chatData.flags.critical).is.not.undefined;
			expect(chatData.flags.critical).is.null;
			expect(chatData.flags.success).is.not.undefined;
			expect(chatData.flags.success).is.true;
		});
	});

	// @todo: Refactor the Handlebar templates to make better sense
	// @todo: Refactor to read the rolls into the chat card instead of
	//        patching them afterwards.
	describe("_getChatCardTemplateData(title, flavor, data, result)", () => {
		const data = {};
		let templateData = {};

		before(async () => {
			data.item = await createMockItemByKey(key, "Weapon");
			data.actor = await createMockActorByKey(key, "Player");
			const title = "test title";
			const flavor = "test flavor";
			const roll = mockRollResult(20, 15);
			const results = D20RollSD._digestResult(roll);
			templateData = D20RollSD._getChatCardTemplateData(title, flavor, data, results);
		});

		after(() => {
			cleanUpItemsByKey(key);
			cleanUpActorsByKey(key);
		});

		it("generate data for ability-card.hbs", () => {
			expect(templateData.title).is.not.undefined;
			expect(templateData.data).is.not.undefined;
			expect(templateData.data.actor).is.not.undefined;
			expect(templateData.data.actor.img).is.not.undefined;
			expect(templateData.data.actor.id).is.not.undefined;
			expect(templateData.rolls).is.not.undefined;
			expect(templateData.rolls.rollD20Result).is.not.undefined;
		});

		describe("generate data for item-card.hbs", () => {
			it("default", () => {
				expect(templateData.title).is.not.undefined;
				expect(templateData.data).is.not.undefined;
				expect(templateData.data.actor).is.not.undefined;
				expect(templateData.data.actor.img).is.not.undefined;
				expect(templateData.data.actor.id).is.not.undefined;
				expect(templateData.data.item).is.not.undefined;
				expect(templateData.data.item.id).is.not.undefined;
				expect(templateData.data.item.img).is.not.undefined;
				expect(templateData.data.item.name).is.not.undefined;
				expect(templateData.data.item.system.description).is.not.undefined;
				expect(templateData.rolls).is.not.undefined;
				expect(templateData.rolls.rollD20Result).is.not.undefined;
				expect(templateData.rolls.primaryDamage).is.not.undefined;
			});

			it("weapon", () => {
				expect(templateData.isSpell).is.false;
				expect(templateData.isWeapon).is.true;
				expect(templateData.isVersatile).is.false;

				expect(templateData.data.item.system).is.not.undefined;
				expect(templateData.data.item.system.type).is.not.undefined;
				expect(templateData.data.item.system.range).is.not.undefined;
				expect(templateData.data.item.system.properties).is.not.undefined;
			});

			it("versatile weapon", async () => {
				await data.item.update({"system.properties": ["versatile"], "system.damage": { oneHanded: "d8", twoHanded: "d10"}});
				await waitForInput();
				const title = "test title";
				const flavor = "test flavor";
				const roll = mockRollResult(20, 15);
				const results = D20RollSD._digestResult(roll);
				templateData = D20RollSD._getChatCardTemplateData(title, flavor, data, results);
				expect(templateData.isSpell).is.false;
				expect(templateData.isWeapon).is.true;
				expect(templateData.isVersatile).is.true;
				expect(templateData.rolls.secondaryDamage).is.not.undefined;
			});

			it("critical", async () => {
				const title = "test title";
				const flavor = "test flavor";
				const roll = mockRollResult(20, 20);
				const results = D20RollSD._digestResult(roll);
				templateData = D20RollSD._getChatCardTemplateData(title, flavor, data, results);
				expect(templateData.result).is.not.undefined;
				expect(templateData.result.critical).is.not.undefined;
			});

			it("spells", async () => {
				data.item = await createMockItemByKey(key, "Spell");
				const title = "test title";
				const flavor = "test flavor";
				const roll = mockRollResult(20, 15);
				const results = D20RollSD._digestResult(roll);
				templateData = D20RollSD._getChatCardTemplateData(title, flavor, data, results);
				expect(templateData.isSpell).is.true;
				expect(templateData.isWeapon).is.false;
				expect(templateData.isVersatile).is.false;
				expect(templateData.data.item.system).is.not.undefined;
				expect(templateData.data.item.system.tier).is.not.undefined;
				expect(templateData.data.item.system.duration).is.not.undefined;
				expect(templateData.data.item.system.duration.type).is.not.undefined;
				expect(templateData.data.item.system.duration.value).is.not.undefined;
				expect(templateData.data.item.system.range).is.not.undefined;
			});
		});
	});

	describe("_getRollDialogData(data, rollMode, parts)", () => {
		it("returns proper data", () => {
			const data = {};
			const rollMode = "blindroll";
			const parts = ["1d20", "1d4"];
			const dialogData = D20RollSD._getRollDialogData(data, rollMode, parts);
			expect(dialogData.data).equal(data);
			expect(dialogData.rollMode).equal(rollMode);
			expect(dialogData.formula).equal("1d20 + 1d4");
			expect(dialogData.rollModes).is.not.undefined;
		});
	});

	describe("_getRollDialogContent(data, rollMode, parts, dialogTemplate)", () => {
		// Skipping tests as this is just rendering a template
	});

	/* -------------------------------------------- */
	/*  Dice Rolling                                */
	/* -------------------------------------------- */

	// @todo: Write tests
	describe("_roll()", () => {});

	// @todo: Refactor, dice rolling to another module?
	describe("_rollWeapon()");

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

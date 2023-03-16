/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for Dice, D20 rolls
 */
import { cleanUpActorsByKey, cleanUpItemsByKey, createMockActorByKey, createMockItemByKey, waitForInput } from "../../testing/testUtils.mjs";
import D20RollSD from "../D20RollSD.mjs";

export const key = "shadowdark.dice.chat-templates";
export const options = {
	displayName: "ShadowDark: Dice: Chat Templates",
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
	// @todo: The flavor field is gone from the cards now. Fix that.
	// @todo: Do we actually test something here?
	describe("_getChatCardTemplateData(title, flavor, data, result)", () => {
		const data = {};
		let templateData = {};

		before(async () => {
			data.item = await createMockItemByKey(key, "Weapon");
			data.actor = await createMockActorByKey(key, "Player");
			const title = "test title";
			data.rolls = {
				rollD20: mockRollResult(20, 15),
				rollD20Result: D20RollSD._digestResult(mockRollResult(20, 15)),
				rollPrimaryDamage: mockRollResult(8, 4),
				rollSecondaryDamage: mockRollResult(10, 7),
			};
			templateData = D20RollSD._getChatCardTemplateData(title, data);
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
				data.rolls = {
					rollD20: mockRollResult(20, 15),
					rollD20Result: D20RollSD._digestResult(mockRollResult(20, 15)),
					rollPrimaryDamage: mockRollResult(8, 4),
					rollSecondaryDamage: mockRollResult(10, 7),
				};
				templateData = D20RollSD._getChatCardTemplateData(title, data);
				expect(templateData.isSpell).is.false;
				expect(templateData.isWeapon).is.true;
				expect(templateData.isVersatile).is.true;
			});

			it("critical", async () => {
				const title = "test title";
				data.rolls = {
					rollD20: mockRollResult(20, 20),
					rollD20Result: D20RollSD._digestResult(mockRollResult(20, 20)),
					rollPrimaryDamage: mockRollResult(8, 4),
					rollSecondaryDamage: mockRollResult(10, 7),
				};
				data.result = D20RollSD._digestResult(data.rolls.rollD20);
				templateData = D20RollSD._getChatCardTemplateData(title, data);
				expect(templateData.rolls.rollD20Result).is.not.undefined;
				expect(templateData.critical).is.not.undefined;
				expect(templateData.critical).equal("success");
			});

			it("spells", async () => {
				data.item = await createMockItemByKey(key, "Spell");
				const title = "test title";
				data.rolls = {
					rollD20: mockRollResult(20, 15),
					rollD20Result: D20RollSD._digestResult(mockRollResult(20, 15)),
					rollPrimaryDamage: mockRollResult(8, 4),
					rollSecondaryDamage: mockRollResult(10, 7),
				};
				data.result = D20RollSD._digestResult(data.rolls.rollD20);
				templateData = D20RollSD._getChatCardTemplateData(title, data);
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
};

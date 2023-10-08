/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for Dice, D20 rolls
 */
import { cleanUpActorsByKey, cleanUpItemsByKey, createMockActorByKey, createMockItemByKey, waitForInput } from "../../testing/testUtils.mjs";
import RollSD from "../RollSD.mjs";

export const key = "shadowdark.dice.chat-templates";
export const options = {
	displayName: "Shadowdark: Dice: Chat Templates",
	preSelected: true,
};

const mockRollResult = (faces, result, critical=null) => {
	return {
		roll: {
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
		},
		critical,
		renderedHTML: "",
	};
};

export default ({ describe, it, after, before, expect }) => {

	/* -------------------------------------------- */
	/*  Data Generation for Displaying              */
	/* -------------------------------------------- */
	describe("_getChatCardData(rollResult, speaker, target=false)", () => {
		it("normal roll", async () => {
			const roll = mockRollResult(20, 12);
			const rolls = { main: roll };
			const chatData = await RollSD._getChatCardData(rolls, "");

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
			expect(chatData.flags.success).is.undefined;
		});

		it("critical success roll", async () => {
			const roll = mockRollResult(20, 20, "success");
			const rolls = { main: roll };
			const chatData = await RollSD._getChatCardData(rolls, "");

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
			expect(chatData.flags.success).is.undefined;
		});

		it("critical failure roll", async () => {
			const roll = mockRollResult(20, 1, "failure");
			const rolls = { main: roll };
			const chatData = await RollSD._getChatCardData(rolls, "");

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
			expect(chatData.flags.success).is.undefined;
		});

		it("provided a target, determination of success is return", async () => {
			const roll = mockRollResult(20, 12);
			const rolls = { main: roll };
			const chatData = await RollSD._getChatCardData(rolls, "", 12);

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
			expect(chatData.flags.success).is.not.undefined;
		});

		it("rolling under target leads to failure", async () => {
			const roll = mockRollResult(20, 12);
			const rolls = { main: roll };
			const chatData = await RollSD._getChatCardData(rolls, "", 13);

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
			expect(chatData.flags.success).is.not.undefined;
			expect(chatData.flags.success).is.false;
		});

		it("rolling equal to target leads to success", async () => {
			const roll = mockRollResult(20, 12);
			const rolls = { main: roll };
			const chatData = await RollSD._getChatCardData(rolls, "", 12);

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
			expect(chatData.flags.success).is.not.undefined;
			expect(chatData.flags.success).is.true;
		});

		it("rolling over target leads to success", async () => {
			const roll = mockRollResult(20, 12);
			const rolls = { main: roll };
			const chatData = await RollSD._getChatCardData(rolls, "", 11);

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
			expect(chatData.flags.success).is.not.undefined;
			expect(chatData.flags.success).is.true;
		});
	});

	describe("_getChatCardTemplateData(title, flavor, data, result)", () => {
		const data = {};
		let templateData = {};

		before(async () => {
			data.item = await createMockItemByKey(key, "Weapon");
			data.actor = await createMockActorByKey(key, "Player");
			// TODO: Have the function generate this instead
			data.rolls = {
				main: mockRollResult(20, 15),
				primaryDamage: mockRollResult(8, 4),
				secondaryDamage: mockRollResult(10, 7),
			};
			templateData = await RollSD._getChatCardTemplateData(data);
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
			expect(templateData.data.rolls).is.not.undefined;
			expect(templateData.data.rolls.main).is.not.undefined;
			expect(templateData.data.rolls.main.renderedHTML).is.not.undefined;
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
				expect(templateData.data.rolls).is.not.undefined;
				expect(templateData.data.rolls.main).is.not.undefined;
				expect(templateData.data.rolls.main.renderedHTML).is.not.undefined;
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
				await data.item.update({"system.properties": ["Compendium.shadowdark.properties.Item.qEIYaQ9j2EUmSrx6"], "system.damage": { oneHanded: "d8", twoHanded: "d10"}});
				await waitForInput();
				templateData = await RollSD._getChatCardTemplateData(data);
				expect(templateData.isSpell).is.false;
				expect(templateData.isWeapon).is.true;
				expect(templateData.isVersatile).is.true;
			});

			it("critical", async () => {
				data.rolls.main.critical = "success";
				templateData = await RollSD._getChatCardTemplateData(data);
				expect(templateData.data.rolls).is.not.undefined;
				expect(templateData.data.rolls.main).is.not.undefined;
				expect(templateData.data.rolls.main.renderedHTML).is.not.undefined;
				expect(templateData.data.rolls.main.critical).is.not.undefined;
				expect(templateData.data.rolls.main.critical).equal("success");
			});

			it("spells", async () => {
				data.item = await createMockItemByKey(key, "Spell");
				data.rolls.main.critical = null;
				templateData = await RollSD._getChatCardTemplateData(data);
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

	describe("_getRollDialogContent(data, rollMode, parts, dialogTemplate)", () => {
		// Skipping tests as this is just rendering a template
	});
};

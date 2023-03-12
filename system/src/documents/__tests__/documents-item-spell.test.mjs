/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for spell item documents
 */
import ItemSD from "../ItemSD.mjs";
import { cleanUpItemsByKey, closeDialogs, itemTypes, openDialogs, trashChat, waitForInput } from "../../testing/testUtils.mjs";

export const key = "shadowdark.documents.item.spell";
export const options = {
	displayName: "ShadowDark: Documents: Item, Spell",
};

const createMockItem = async type => {
	return ItemSD.create({
		name: `Test Item ${key}: ${type}`,
		type,
	});
};

const clickNormal = async () => {
	const button = document.querySelector(".normal");
	await button.click();
	await waitForInput();
	await waitForInput();
};

export default ({ describe, it, after, beforeEach, before, expect }) => {
	let spell = {};

	before(async () => {
		spell = await createMockItem("Spell");
		await trashChat();
	});

	after(() => {
		cleanUpItemsByKey(key);
	});

	describe("rollSpell(parts, abilityBonus, talentBonus, tier, options={})", () => {
		beforeEach(async () => {
			await trashChat();
		});

		it("renders dialog by default", async () => {
			await closeDialogs();
			expect(openDialogs().length).equal(0);
			spell.rollSpell([], 0, 0, 0, {});
			await waitForInput();
			expect(openDialogs().length).equal(1);
			await openDialogs().pop().close();
			await waitForInput();
		});

		it("rolls and displays chat message", async () => {
			expect(openDialogs().length).equal(0);
			expect(game.messages.size).equal(0);
			spell.rollSpell([], 0, 0, 0, {});
			await waitForInput();
			expect(openDialogs().length).equal(1);
			await clickNormal();
			expect(game.messages.size).equal(1);
			await waitForInput();
			expect(openDialogs().length).equal(0);
		});

		it("just rolls when given fastForward options", async () => {
			expect(openDialogs().length).equal(0);
			await spell.rollSpell([], 0, 0, 0, { fastForward: true });
			await waitForInput();
			expect(openDialogs().length).equal(0);
			expect(game.messages.size).equal(1);
		});

		describe("ability bonus", () => {
			it("ignores ability bonus without appropriate parts", async () => {
				await spell.rollSpell([], 1, 2, 0, { fastForward: true });
				await waitForInput();
				expect(game.messages.size).equal(1);

				const chatMessage = game.messages.contents.pop();
				expect(chatMessage.rolls.pop()._formula).equal("1d20");
			});

			it("adds ability bonus with appropriate parts", async () => {
				await spell.rollSpell(["@abilityBonus"], 1, 2, 0, { fastForward: true });
				await waitForInput();
				expect(game.messages.size).equal(1);

				const chatMessage = game.messages.contents.pop();
				expect(chatMessage.rolls.pop()._formula).equal("1d20 + 1");
			});
		});

		describe("talent bonus", () => {
			it("adds talent bonus with appropriate parts", async () => {
				await spell.rollSpell(["@talentBonus"], 1, 2, 0, { fastForward: true });
				await waitForInput();
				expect(game.messages.size).equal(1);

				const chatMessage = game.messages.contents.pop();
				expect(chatMessage.rolls.pop()._formula).equal("1d20 + 2");
			});
		});

		describe("tier", () => {
			it("sets the DC appropriately according to spell tier", async () => {
				await spell.rollSpell([], 0, 0, 3, { fastForward: true });
				await waitForInput();
				expect(game.messages.size).equal(1);

				const chatMessage = game.messages.contents.pop();
				expect(chatMessage.flavor.indexOf("at tier 3 with spell DC 13")).not.equal(-1);
			});
		});

		after(async () => {
			await trashChat();
		});
	});

};

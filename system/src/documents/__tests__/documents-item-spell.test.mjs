/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for spell item documents
 */
import ItemSD from "../ItemSD.mjs";
import { cleanUpItemsByKey, closeDialogs, openDialogs, trashChat, waitForInput } from "../../testing/testUtils.mjs";

export const key = "shadowdark.documents.item.spell";
export const options = {
	displayName: "Shadowdark: Documents: Item, Spell",
	preSelected: false,
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
			spell.rollSpell(["1d20"], {item: spell});
			await waitForInput();
			expect(openDialogs().length).equal(1);
			await openDialogs().pop().close();
			await waitForInput();
		});

		it("rolls and displays chat message", async () => {
			expect(openDialogs().length).equal(0);
			expect(game.messages.size).equal(0);
			spell.rollSpell(["1d20"], {item: spell});
			await waitForInput();
			expect(openDialogs().length).equal(1);
			await clickNormal();
			expect(game.messages.size).equal(1);
			await waitForInput();
			expect(openDialogs().length).equal(0);
		});

		it("just rolls when given fastForward options", async () => {
			expect(openDialogs().length).equal(0);
			spell.rollSpell(["1d20"], {item: spell}, { fastForward: true });
			await waitForInput();
			expect(openDialogs().length).equal(0);
			expect(game.messages.size).equal(1);
		});

		describe("ability bonus", () => {
			it("ignores ability bonus without appropriate parts", async () => {
				await spell.rollSpell(
					["1d20"],
					{
						item: spell,
						abilityBonus: 2,
					},
					{
						fastForward: true,
					}
				);
				await waitForInput();
				expect(game.messages.size).equal(1);

				// TODO: This should probably dig inside chatcard instead
				const formula = $(".dice-formula")[0].innerText;
				expect(formula).equal("1d20");
			});

			it("adds ability bonus with appropriate parts", async () => {
				await spell.rollSpell(
					[
						"1d20",
						"@abilityBonus",
					],
					{
						item: spell,
						itemBonus: 2,
						abilityBonus: 1,
					},
					{
						fastForward: true,
					}
				);
				await waitForInput();
				expect(game.messages.size).equal(1);

				// TODO: This should probably dig inside chatcard instead
				const formula = $(".dice-formula")[0].innerText;
				expect(formula).equal("1d20 + 1");
			});
		});

		describe("talent bonus", () => {
			it("adds talent bonus with appropriate parts", async () => {
				await spell.rollSpell(
					[
						"1d20",
						"@talentBonus",
					],
					{
						item: spell,
						itemBonus: 2,
						abilityBonus: 1,
						talentBonus: 3,
					},
					{
						fastForward: true,
					}
				);
				await waitForInput();
				expect(game.messages.size).equal(1);

				// TODO: This should probably dig inside chatcard instead
				const formula = $(".dice-formula")[0].innerText;
				expect(formula).equal("1d20 + 3");
			});
		});

		describe("tier", () => {
			it("sets the DC appropriately according to spell tier", async () => {
				await spell.update({ system: { tier: 3 } } );
				await spell.rollSpell(
					[
						"1d20",
						"@talentBonus",
					],
					{
						item: spell,
					},
					{
						fastForward: true,
					}
				);
				await waitForInput();
				expect(game.messages.size).equal(1);

				const chatMessage = game.messages.contents.pop();
				expect(chatMessage.flavor.indexOf(", DC 13")).not.equal(-1);
			});
		});

		after(async () => {
			await trashChat();
		});
	});

};

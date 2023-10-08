/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for actor sheets
 */
import {
	cleanUpActorsByKey,
	closeSheets,
	closeDialogs,
	abilities,
	waitForInput,
	cleanUpItemsByKey,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.sheets.actor";
export const options = {
	displayName: "Shadowdark: Sheets: Actor",
	preSelected: false,
};

const createMockActor = async type => {
	return Actor.create({
		name: `Test Actor ${key}: ${type}`,
		type,
	});
};

const createMockItem = async type => {
	return Item.create({
		name: `Test Item ${key}: ${type}`,
		type,
	});
};

export default ({ describe, it, after, before, expect }) => {
	after(async () => {
		await closeSheets();
		await cleanUpActorsByKey(key);
		await cleanUpItemsByKey(key);
		await closeDialogs();
	});

	// TODO: Generalize tests and run for Player & NPC
	// TODO: Split out special cases for Players & NPCs
	describe("getData(options)", () => {
		let actor = {};
		let actorSheetData = {};

		before(async () => {
			actor = await createMockActor("Player");
			actorSheetData = await actor.sheet.getData();
		});

		it("contains actor data", async () => {
			expect(actorSheetData.actor).is.not.undefined;
			// expect(actorSheetData.actor).equal(actor);
		});

		it("contains configuration", async () => {
			expect(actorSheetData.config).is.not.undefined;
			expect(actorSheetData.config).equal(CONFIG.SHADOWDARK);
		});

		it("sets editable css class for owner", async () => {
			expect(actorSheetData.cssClass).is.not.undefined;
			expect(actorSheetData.cssClass).equal("editable");
		});

		// TODO: how should we mock non-owner?
		it("sets locked css class for non-owner", async () => {});

		it("isNpc is false for Player actor", async () => {
			expect(actorSheetData.isNpc).is.not.undefined;
			expect(actorSheetData.isNpc).is.false;
		});

		it("isPlayer is true for Player actor", async () => {
			expect(actorSheetData.isPlayer).is.not.undefined;
			expect(actorSheetData.isPlayer).is.true;
		});

		it("contains items data", async () => {
			expect(actorSheetData.items).is.not.undefined;
			// expect(actorSheetData.items).equal(actor.items);
		});

		it("contains who is the owner", async () => {
			expect(actorSheetData.owner).is.not.undefined;
			expect(actorSheetData.owner).equal(actor.isOwner);
			expect(actorSheetData.owner).is.true;
		});

		// TODO: how to test the `rollData`?
		it("rollData bound from actors getRollData", async () => {});

		it("contains the source system data", async () => {
			expect(actorSheetData.source).is.not.undefined;
			// expect(actorSheetData.source).equal(actor.system);
		});

		it("contains the actor system data", async () => {
			expect(actorSheetData.system).is.not.undefined;
			// expect(actorSheetData.system).equal(actor.system);
		});

		// TODO: write tests for this when it is part of the context
		describe("abiltiy scores for are", () => {
			abilities.forEach(ability => {
				it(`translated label for ${ability}`, async () => {});
				// Deeply tested in documents-actor.test.mjs
				// TODO: write simple tests with non-0 modifier
				it("has modifiers calculated for player", async () => {});
			});
		});

		// NPC Specific tests
		it("isNpc is true for NPC actor", async () => {
			const npc = await createMockActor("NPC");
			const npcSheetData = await npc.sheet.getData();
			expect(npcSheetData.isNpc).is.true;
			await npc.delete();
		});

		it("isPlayer is false for NPC actor", async () => {
			const npc = await createMockActor("NPC");
			const npcSheetData = await npc.sheet.getData();
			expect(npcSheetData.isPlayer).is.false;
			await npc.delete();
		});

		after(() => {
			cleanUpActorsByKey(key);
		});
	});

	describe("Context menu for items", () => {
		let actor = {};
		let item = {};
		let actorItem = {};

		const mockContextMenuClick = element => {
			const event = element.ownerDocument.createEvent("HTMLEvents");
			event.initEvent("contextmenu", true, true);
			element.dispatchEvent(event);
		};

		before(async () => {
			actor = await createMockActor("Player");
			// TODO: Does not work for Gem right now, test for all items.
			item = await createMockItem("Armor");
			await actor.createEmbeddedDocuments("Item", [item]);
			actorItem = await actor.items.contents[0];
			await item.delete();
			// Render the inventory
			await actor.sheet.render(true);
			await waitForInput();
			await document.querySelector("a[data-tab=\"tab-inventory\"]").click();
			await waitForInput();
		});

		it("renders correctly", async () => {
			expect(actor.items.contents[0].name).equal(item.name);
			const noContextMenu = document.querySelector("#context-menu");
			expect(noContextMenu).is.null;

			const element = document.querySelector(`tr[data-item-id="${actorItem.id}"]`);
			mockContextMenuClick(element);
			await waitForInput();

			const contextMenu = document.querySelector("#context-menu");
			expect(contextMenu).is.not.null;
		});

		it("contains 'edit' option", async () => {
			const contextMenuItems  = document.querySelectorAll(".context-item");
			expect(contextMenuItems.length).equal(2);
			expect(contextMenuItems[0].innerText).equal(game.i18n.localize("SHADOWDARK.sheet.general.item_edit.title"));
		});

		it("contains 'delete' option", async () => {
			const contextMenuItems  = document.querySelectorAll(".context-item");
			expect(contextMenuItems.length).equal(2);
			expect(contextMenuItems[1].innerText).equal(game.i18n.localize("SHADOWDARK.sheet.general.item_delete.title"));
		});

		it("clicking Edit Item spawns a the item sheet", async () => {
			const element = document.querySelector(`tr[data-item-id="${actorItem.id}"]`);
			mockContextMenuClick(element);
			await waitForInput();

			const contextMenuItems = document.querySelectorAll(".context-item");
			contextMenuItems[0].click();
			await waitForInput();

			const itemSheets = Object.values(ui.windows).filter(o => o.options.classes.includes("item"));
			expect(itemSheets.length).equal(1);
			await itemSheets[0].close();
		});

		it("clicking Delete Item spawns a dialog asking for confirmation", async () => {
			const element = document.querySelector(`tr[data-item-id="${actorItem.id}"]`);
			mockContextMenuClick(element);
			await waitForInput();

			const contextMenuItems = document.querySelectorAll(".context-item");
			contextMenuItems[1].click();
			await waitForInput();

			const deleteDialogs = Object.values(ui.windows).filter(o => o.options.classes.includes("dialog"));
			expect(deleteDialogs.length).equal(1);
			expect(deleteDialogs[0].data.title).equal(game.i18n.localize("SHADOWDARK.dialog.item.confirm_delete"));
			await deleteDialogs[0].close();
		});

		after(async () => {
			cleanUpActorsByKey(key);
			await closeSheets();
			await closeDialogs();
		});
	});

	describe("_onItemDelete(itemID)", () => {
		let actor = {};
		let item = {};
		let actorItem = {};

		before(async () => {
			await closeDialogs();
			actor = await createMockActor("Player");
			item = await createMockItem("Armor");
			await actor.createEmbeddedDocuments("Item", [item]);
			actorItem = await actor.items.contents[0];
		});

		it("renders dialog for delete confirmation", async () => {
			expect(actor.items.size).equal(1);
			actor.sheet._onItemDelete(actorItem.id);
			await waitForInput();
			const deleteDialogs = Object.values(ui.windows).filter(o => o.options.classes.includes("dialog"));
			expect(deleteDialogs.length).equal(1);
			// TODO: i18n
			expect(deleteDialogs[0].data.title).equal("Confirm Deletion");
		});

		it("cancelled deletion does nothing", async () => {
			expect(actor.items.size).equal(1);
			const cancelElement = document.querySelector(".Cancel");
			expect(cancelElement).is.not.null;
			await cancelElement.click();
			await waitForInput();
			await waitForInput();
			await waitForInput();
			const deleteDialogs = Object.values(ui.windows).filter(o => o.options.classes.includes("dialog"));
			expect(deleteDialogs.length).equal(0);
			expect(actor.items.size).equal(1);
		});

		it("confirmed deletion successfully deletes item", async () => {
			expect(actor.items.size).equal(1);
			actor.sheet._onItemDelete(actorItem.id);
			await waitForInput();
			const deleteDialogs = Object.values(ui.windows).filter(o => o.options.classes.includes("dialog"));
			expect(deleteDialogs.length).equal(1);
			const yesElement = document.querySelector(".Yes");
			expect(yesElement).is.not.null;
			await yesElement.click();
			await waitForInput();
			await waitForInput();
			await waitForInput();
			const remainingDialogs = Object.values(ui.windows).filter(o => o.options.classes.includes("dialog"));
			expect(remainingDialogs.length).equal(0);
			expect(actor.items.size).equal(0);
		});

		after(async () => {
			cleanUpActorsByKey(key);
			await closeDialogs();
		});
	});
};

/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for Player actor sheets
 */
import {
	cleanUpActorsByKey,
	closeSheets,
	abilities,
	waitForInput,
	openDialogs,
	trashChat,
	cleanUpItemsByKey,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.sheets.actor.player";
export const options = {
	displayName: "Shadowdark: Sheets: Actor, Player",
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
		cleanUpActorsByKey(key);
	});

	describe("constructor(object, options)", () => {
		let actor = {};
		before(async () => {
			actor = await createMockActor("Player");
		});

		it("attackes gembag app", async () => {
			expect(actor.sheet.gemBag).is.not.undefined;
		});

		after(async () => {
			await actor.delete();
		});
	});

	describe("defaultOptions", () => {
		let actor = {};
		before(async () => {
			actor = await createMockActor("Player");
		});

		it("has the expected CSS classes", async () => {
			expect(actor.sheet.options.classes).is.not.undefined;
			expect(actor.sheet.options.classes).contain("shadowdark");
			expect(actor.sheet.options.classes).contain("sheet");
			expect(actor.sheet.options.classes).contain("player");
		});

		it("is resizable", async () => {
			expect(actor.sheet.options.resizable).is.not.undefined;
			expect(actor.sheet.options.resizable).is.true;
		});

		it("has the expected window width", async () => {
			expect(actor.sheet.options.width).is.not.undefined;
			expect(actor.sheet.options.width).equal(600);
		});

		it("has the expected window height", async () => {
			expect(actor.sheet.options.height).is.not.undefined;
			expect(actor.sheet.options.height).equal(700);
		});

		it("has the expected tabs", async () => {
			expect(actor.sheet.options.tabs).is.not.undefined;
			expect(actor.sheet.options.tabs.length).equal(1);
			expect(actor.sheet.options.tabs[0].navSelector).is.not.undefined;
			expect(actor.sheet.options.tabs[0].navSelector).equal(".player-navigation");
			expect(actor.sheet.options.tabs[0].contentSelector).is.not.undefined;
			expect(actor.sheet.options.tabs[0].contentSelector).equal(".player-body");
			expect(actor.sheet.options.tabs[0].initial).is.not.undefined;
			expect(actor.sheet.options.tabs[0].initial).equal("tab-abilities");
		});

		after(async () => {
			await actor.delete();
		});
	});

	describe("getData(options)", () => {
		let actor = {};
		let actorData = {};

		before(async () => {
			actor = await createMockActor("Player");
			actorData = await actor.sheet.getData();
		});

		it("contains the xpNextLevel data", () => {
			expect(actorData.xpNextLevel).is.not.undefined;
		});
		it("contains the armorClass data", () => {
			expect(actorData.armorClass).is.not.undefined;
		});

		after(async () => {
			await actor.delete();
		});
	});

	/* Event-based methods */
	// TODO: Write tests
	describe("_onItemQuantityDecrement(event)", () => {
		let actor = {};

		before(async () => {
			actor = await createMockActor("Player");
			await actor.sheet.render(true);
			await waitForInput();
			await document.querySelector("a[data-tab=\"tab-inventory\"]").click();
			await waitForInput();
			// TODO: create item with quantity
		});

		// TODO: write tests when sheet functions are implemented
		it("decreases quantity when clicked in Player sheet", async () => {});
		it("deletes item when quantity becomes 0", async () => {});

		after(async () => {
			await actor.delete();
			await closeSheets();
		});
	});

	// TODO: Write tests
	describe("_onItemQuantityIncrement(event)", () => {
		let actor = {};

		before(async () => {
			actor = await createMockActor("Player");
			await actor.sheet.render(true);
			await waitForInput();
			await document.querySelector("a[data-tab=\"tab-inventory\"]").click();
			await waitForInput();
			// TODO: create item with quantity
		});

		// TODO: write tests when sheet functions are implemented
		it("increases quantity when clicked in Player sheet", async () => {});
		it("increases slots used when exceeding per slot value", async () => {});

		after(async () => {
			await actor.delete();
			await closeSheets();
		});
	});

	describe("_onOpenGemBag(event)", () => {
		let actor = {};
		before(async () => {
			await trashChat();
			actor = await createMockActor("Player");
			await actor.sheet.render(true);
			await waitForInput();

			await document.querySelector("a[data-tab=\"tab-inventory\"]").click();
			await waitForInput();

			const item = await createMockItem("Gem");
			await actor.createEmbeddedDocuments("Item", [item]);
			await item.delete();
		});

		it("clicking the bag, renders the gembag", async () => {
			const bagElement = document.querySelector("a.open-gem-bag");
			expect(bagElement).is.not.null;
			await bagElement.click();
			await waitForInput();

			const openWindows = Object.values(ui.windows).filter(o =>
				o.options.classes.includes("gem-bag"));

			expect(openWindows.length).equal(1);
			await openWindows.pop().close();
		});

		it("clicking the 'sell all gems' button renders the 'sell treasure' dialog", async () => {
			const bagElement = document.querySelector("a.open-gem-bag");
			await bagElement.click();
			await waitForInput();

			const sellElement = document.querySelector("button.sell-all-button");
			expect(sellElement).is.not.null;
			await sellElement.click();
			await waitForInput();

			const dialogs = openDialogs();
			expect(dialogs.length).equal(1);
			await dialogs.pop().close();

			const openWindows = Object.values(ui.windows).filter(o =>
				o.options.classes.includes("gem-bag"));
			await openWindows.pop().close();
		});

		after(async () => {
			await closeSheets();
			cleanUpActorsByKey(key);
			cleanUpItemsByKey(key);
		});
	});

	describe("_onRollAbilityCheck(event)", () => {
		let actor = {};

		before(async () => {
			await trashChat();
			actor = await createMockActor("Player");
			await actor.sheet.render(true);
			await waitForInput();
			await document.querySelector("a[data-tab=\"tab-abilities\"]").click();
			await waitForInput();
		});

		// TODO: If implementing quick-keys for rolling with adv/disadv
		//        store & restore settings here!

		abilities.forEach(ability => {
			it(`rolls and displays result in chat for ${ability} ability roll`, async () => {
				// Clear out chat
				await trashChat();
				expect(game.messages.size).equal(0);

				// Click ability
				const element = document.querySelector(`label[data-ability="${ability}"]`);
				expect(element).is.not.null;
				await element.click();
				await waitForInput();

				// Verify dialog generated
				const dialogs = openDialogs();
				expect(dialogs.length).equal(1);

				const advButtonElement = document.querySelector(".dialog .advantage");
				expect(advButtonElement).is.not.null;
				const disadvButtonElement = document.querySelector(".dialog .disadvantage");
				expect(disadvButtonElement).is.not.null;
				const normalButtonElement = document.querySelector(".dialog .normal");
				expect(normalButtonElement).is.not.null;
				await normalButtonElement.click();
				await waitForInput();

				expect(game.messages.size).equal(1);
				const message = game.messages.contents.pop();

				// TODO: Test the resulting roll chat card

				await message.delete();
				await waitForInput();
			});
		});

		after(async () => {
			await actor.delete();
			await closeSheets();
			await trashChat();
		});
	});

	describe("_onSellTreasure(event)", () => {
		let actor = {};
		before(async () => {
			await trashChat();
			actor = await createMockActor("Player");
			await actor.sheet.render(true);
			await waitForInput();

			await document.querySelector("a[data-tab=\"tab-inventory\"]").click();
			await waitForInput();

			const item = await createMockItem("Basic");
			await item.update({"system.treasure": true});
			await actor.createEmbeddedDocuments("Item", [item]);
			await item.delete();
		});

		it("clicking the 'Sell Treasure' button renders the 'sell treasure' dialog", async () => {
			const sellElement = document.querySelector("a.sell-treasure");
			expect(sellElement).is.not.null;
			await sellElement.click();
			await waitForInput();

			const dialogs = openDialogs();
			expect(dialogs.length).equal(1);
			await dialogs.pop().close();
		});

		after(async () => {
			await closeSheets();
			cleanUpActorsByKey(key);
			cleanUpItemsByKey(key);
		});
	});

	describe("_onToggleEquipped(event)", () => {
		let actor = {};
		let item = {};
		let actorItem = {};

		["Armor", "Weapon"].forEach(type => {
			describe(`${type}`, () => {
				before(async () => {
					actor = await createMockActor("Player");
					item = await createMockItem("Armor");
					[actorItem] = await actor.createEmbeddedDocuments("Item", [item]);
					await item.delete();

					await actor.sheet.render(true);
					await waitForInput();
					await document.querySelector("a[data-tab=\"tab-inventory\"]").click();
					await waitForInput();
				});

				it("click on the equip shirt equips the item", async () => {
					expect(actorItem.system.equipped).is.false;
					const element = document.querySelector("a.item-toggle-equipped");
					expect(element).is.not.null;
					await element.click();
					await waitForInput();

					expect(actorItem.system.equipped).is.true;
				});
				it("click on the equip shirt again unequips the item", async () => {
					expect(actorItem.system.equipped).is.true;
					const element = document.querySelector("a.item-toggle-equipped");
					expect(element).is.not.null;
					await element.click();
					await waitForInput();

					expect(actorItem.system.equipped).is.false;
				});

				after(async () => {
					await actor.delete();
					await closeSheets();
					cleanUpActorsByKey(key);
					cleanUpItemsByKey(key);
				});
			});
		});
	});

	/* Non-event tests */

	// TODO: determine what tests are needed here, has a lot of branches
	// TODO: Write tests
	describe("_prepareItems(context)", () => {});

	// TODO: is there any circumstance where this needs to be tested more than
	//        already done in _prepareItems(context)?
	// TODO: Write tests
	describe("_sortAllItems(context)", () => {});
};

/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for item sheets
 */
import {
	closeSheets,
	closeDialogs,
	waitForInput,
	cleanUpItemsByKey,
	itemTypes,
	delay,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.sheets.item";
export const options = {
	displayName: "Shadowdark: Sheets: Item",
	preSelected: false,
};

const createMockItem = async type => {
	return Item.create({
		name: `Test Item ${key}: ${type}`,
		type,
	});
};

const mockClick = async element => {
	await element.click();
	await waitForInput();
};

const mockClickProperties = async () => {
	const element = document.querySelector("a.item-selector");
	await mockClick(element);
};

export default ({ describe, it, after, before, expect }) => {
	after(async () => {
		cleanUpItemsByKey(key);
		await closeDialogs();
		await closeSheets();
	});

	describe("defaultOptions", () => {
		itemTypes.forEach(type => {
			describe(`for ${type} item`, () => {
				let item = {};

				before(async () => {
					item = await createMockItem(type);
				});

				it("has the expected CSS classes", async () => {
					expect(item.sheet.options.classes).is.not.undefined;
					expect(item.sheet.options.classes).contain("shadowdark");
					expect(item.sheet.options.classes).contain("sheet");
					expect(item.sheet.options.classes).contain("item");
				});

				it("is resizable", async () => {
					expect(item.sheet.options.resizable).is.not.undefined;
					expect(item.sheet.options.resizable).is.true;
				});

				it("has the expected window width", async () => {
					expect(item.sheet.options.width).is.not.undefined;
					expect(item.sheet.options.width).equal(665);
				});

				it("has the expected window height", async () => {
					expect(item.sheet.options.height).is.not.undefined;
					expect(item.sheet.options.height).equal(620);
				});

				after(async () => {
					await item.delete();
				});
			});
		});
	});

	describe("getData", () => {
		itemTypes.forEach(type => {
			describe(`for ${type} item`, () => {
				let item = {};
				let itemData = {};

				before(async () => {
					item = await createMockItem(type);
					itemData = await item.sheet.getData();
				});

				it("contains the hasCost data", () => {
					expect(itemData.hasCost).is.not.undefined;
				});
				it("contains the itemType data", () => {
					expect(itemData.itemType).is.not.undefined;
				});
				it("contains the source data", () => {
					expect(itemData.source).is.not.undefined;
				});
				it("contains the system data", () => {
					expect(itemData.system).is.not.undefined;
				});
				it("contains the usesSlots data", () => {
					expect(itemData.usesSlots).is.not.undefined;
				});

				if (["Armor", "Weapon"].includes(type)) {
					it("contains the properties data", () => {
						expect(itemData.propertyItems).is.not.undefined;
					});
				}

				after(async () => {
					await item.delete();
				});
			});
		});
	});

	describe("_onArmorProperties(event)", () => {
		let item = {};

		before(async () => {
			item = await createMockItem("Armor");
			await item.sheet.render(true);
			await waitForInput();
		});

		it("clicking properties field opens dialog", async () => {
			await mockClickProperties();

			const openDialogs = Object.values(ui.windows).filter(o => o.options.classes.includes("compendium-item-selector"));
			expect(openDialogs.length).equal(1);

			await openDialogs.pop().close();
		});

		// TODO: verify all properties are present in dialog

		after(async () => {
			await item.delete();
		});
	});

	describe("_onWeaponProperties(event)", () => {
		let item = {};

		before(async () => {
			item = await createMockItem("Weapon");
			await item.sheet.render(true);
		});

		it("clicking properties field opens dialog", async () => {
			await mockClickProperties();

			const openDialogs = Object.values(ui.windows).filter(o => o.options.classes.includes("compendium-item-selector"));
			expect(openDialogs.length).equal(1);

			await openDialogs.pop().close();
		});

		// TODO: verify all properties are present in dialog

		after(async () => {
			await item.delete();
		});
	});

	describe("_createPredefinedEffect(key, data", () => {
		it("Adding a predefined effect adds an active effect", async () => {
			// Create item
			const item = await createMockItem("Effect");

			await item.sheet.render(true);
			await waitForInput();

			await document.querySelector("a[data-tab=tab-effects]").click();
			await waitForInput();

			// Ensure no effects are on the items
			expect(item.effects.contents.length).equal(0);

			// Add the effect
			const element = document.querySelector("input[name='system.predefinedEffects']");
			element.value = "meleeAttackBonus";
			element.dispatchEvent(new Event("change", { bubbles: true }));
			await waitForInput();

			// Check that there is an active effect on the item
			expect(item.effects.contents.length).equal(1);

			// Delete item
			await item.delete();
		});

		it("#462: Modifying the effects actually modifies the active effects", async () => {
			// Create item
			const item = await createMockItem("Effect");

			await item.sheet.render(true);
			await waitForInput();

			await document.querySelector("a[data-tab=tab-effects]").click();
			await waitForInput();

			// Ensure no effects are on the items
			expect(item.effects.contents.length).equal(0);

			// Add the effect
			const element = document.querySelector("input[name='system.predefinedEffects']");
			element.value = "meleeAttackBonus";
			element.dispatchEvent(new Event("change", { bubbles: true }));
			await waitForInput();

			// Check that there is an active effect on the item
			expect(item.effects.contents.length).equal(1);
			const activeEffect = item.effects.contents[0];
			expect(activeEffect.changes[0].value).equal("1");

			// Modify the effects
			const changeInput = document.querySelector("input.effect-change-value");
			changeInput.value = "4";
			changeInput.dispatchEvent(new Event("change", { bubbles: true }));
			await delay(500);
			expect(activeEffect.changes[0].value).equal("4");

			// Delete item
			await item.delete();
		});

		after(async () => {
			await cleanUpItemsByKey(key);
		});
	});
};

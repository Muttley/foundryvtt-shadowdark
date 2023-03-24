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
	const element = document.querySelector("p.item-property-list");
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
				it("contains the properties data", () => {
					expect(itemData.properties).is.not.undefined;
				});
				it("contains the propertiesDisplay data", () => {
					expect(itemData.propertiesDisplay).is.not.undefined;
				});

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

			const openDialogs = Object.values(ui.windows).filter(o => o.options.classes.includes("item-properties"));
			expect(openDialogs.length).equal(1);

			await openDialogs.pop().close();
		});

		// @todo: verify all properties are present in dialog

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

			const openDialogs = Object.values(ui.windows).filter(o => o.options.classes.includes("item-properties"));
			expect(openDialogs.length).equal(1);

			await openDialogs.pop().close();
		});

		// @todo: verify all properties are present in dialog

		after(async () => {
			await item.delete();
		});
	});
};

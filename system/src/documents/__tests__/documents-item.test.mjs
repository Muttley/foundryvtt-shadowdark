/**
 * @file Contains tests for item documents
 */
import ItemSD from "../ItemSD.mjs";
import { cleanUpItemsByKey } from "../../testing/testUtils.mjs";

export const key = "shadowdark.documents.item";
export const options = {
	displayName: "ShadowDark: Documents: Item",
};

const createMockItem = async type => {
	return ItemSD.create({
		name: `Test Item ${key}: ${type}`,
		type,
	});
};

export default ({ describe, it, after, expect }) => {
	after(() => {
		cleanUpItemsByKey(key);
	});

	describe("Item creation", () => {
		it("can create Gem item", async () => {
			const item = await createMockItem("Gem");
			expect(item).is.not.undefined;
			await item.delete();
		});

		// @todo: Write creation tests for the rest of the items
	});

	describe("_preCreate(data, options, user)", () => {
		it("Gem type item has slots correctly configured", async () => {
			const item = await createMockItem("Gem");
			expect(item.system.slots.free_cary).equal(0);
			expect(CONFIG.SHADOWDARK.INVENTORY.GEMS_PER_SLOT).is.not.null;
			expect(item.system.slots.per_slot).equal(CONFIG.SHADOWDARK.INVENTORY.GEMS_PER_SLOT);
			expect(item.system.slots.slots_used).equal(1);
		});
	});
};

/* eslint-disable no-unused-expressions */
const fs = require("fs");
const path = require("path");

describe("import", () => {
	const data = fs.readFileSync(path.resolve(__dirname, "../../packs/basic-gear.db"));
	const fixtureData = fs.readFileSync(path.resolve(__dirname, "./fixture/basic-gear.json")).toString();
	const expectedIds = JSON.parse(fixtureData);

	const packData = data.toString().trim().split("\n").map(l => JSON.parse(l));

	test("Light items have the expected ids", () => {
		for (const [itemName, itemId] of Object.entries(expectedIds)) {
			packItem = packData.find(e => e.name === itemName);
			expect(packItem._id).toBe(itemId);
		}
	});
});

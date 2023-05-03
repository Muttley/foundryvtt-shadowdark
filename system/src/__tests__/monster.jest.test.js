/* eslint-disable no-unused-expressions */
const fs = require("fs");
const path = require("path");

describe("import", () => {
	const data = fs.readFileSync(path.resolve(__dirname, "../../packs/monster.db"));
	const fixtureData = fs.readFileSync(path.resolve(__dirname, "./fixture/monster.json")).toString();
	const expectedIds = JSON.parse(fixtureData);

	data.toString().split("\n").forEach(l => {
		// Skip the empty last line
		if (l.length === 0) return;

		const monster = JSON.parse(l);
		test(`${monster.name} has the expected id`, () => {
			expect(expectedIds[monster.name]).toBe(monster._id);
		});
	});
});

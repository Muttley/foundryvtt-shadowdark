/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for the Shadowdarkling Importer hooks
 */

import { openWindows, waitForInput } from "../../testing/testUtils.mjs";

export const key = "shadowdark.hooks.shadowdarkling";
export const options = {
	displayName: "Shadowdark: Hooks: Shadowdarkling Import",
	preSelected: true,
};

const _hasButton = tab => {
	return $(tab).find(".shadowdarkling-import-button");
};

const sidebars = [
	"chat",
	"combat",
	"scenes",
	"actors",
	"items",
	"journal",
	"tables",
	"cards",
	"playlists",
	"compendium",
	"settings",
];

export default ({ describe, it, expect }) => {
	describe("renderSidebarTab hook", () => {
		it("button exists on Actors tab", () => {
			expect($(".actors-sidebar").length).not.equal(0);
			const button = _hasButton(".actors-sidebar");
			expect(button.length).equal(1);
		});

		sidebars.forEach(sidebar => {
			if (sidebar === "actors") return;
			it(`button does not exists on ${sidebar.capitalize()} tab`, () => {
				expect($(`.${sidebar}-sidebar`).length).not.equal(0);
				const button = _hasButton(`.${sidebar}-sidebar`);
				expect(button.length).equal(0);
			});
		});
	});

	describe("click()", () => {
		after(async () => {
			openWindows("shadowdark-importer").forEach(async w => w.close());
		});

		it("renders the dialog", async () => {
			await document.querySelector(".actors-sidebar").click();
			await document.querySelector(".shadowdarkling-import-button").click();
			await waitForInput();
			expect(openWindows("shadowdark-importer").length).equal(1);
		});

		it("dialog contains the right elements", () => {
			const window = openWindows("shadowdark-importer").pop();
			const element = window._element;

			// Has Textarea
			expect(element.find("textarea").length).equal(1);
			expect(element.find("textarea")[0].name).equal("json");

			// Has button
			expect(element.find("button").length).equal(1);
			expect(element.find("button")[0].className).equal("import");
		});
	});
};

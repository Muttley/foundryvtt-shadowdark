/**
 * @file defines the tour for importing the lost citadel adventure
 */
import ShadowdarkTour from "./ShadowdarkTour.mjs";
import { delay } from "../testing/testUtils.mjs";

export class ShadowdarkMonsterImporterTour extends ShadowdarkTour {
	constructor() {
		super({
			title: "Importing Monstesrs",
			description:
        "Learn how quickly import monstesr into Foundry for Shadowdark RPG.",
			canBeResumed: false,
			display: true,
			steps: [
				{
					id: "sd-monster-importer-start",
					selector: ".compendium-sidebar",
					title: "Compendium Tab",
					content: "<p>The compendium tab contains collections that are included in the system. Let's open the macros compendium.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-monster-importer-compendium-open",
					selector: "div[id='compendium-shadowdark.macros'] .directory-header",
					title: "Macros Compendium",
					content: "<p>This compendium includes many useful pre-built macros, such as the monster importer.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-monster-importer-compendium-marco",
					selector: "li[data-document-id=sJTtbWtWigzBHf6N] h4 a",
					title: "Open Monster Importer Macro",
					content: "<p>You can drag this Macro to the hotbar if you want a convenient way of accessing it.</p>",
					action: "click",
				},
				{
					id: "sd-monster-importer-Execute",
					selector: ".execute",
					title: "Run Monster Importer",
					content: "<p>Click execute</p>",
					action: "click",
				},
				{
					id: "sd-monster-importer-Text",
					selector: ".app.window-app.monster-importer",
					title: "Monster Importer Step 1",
					content: "<p>Select and copy the monster's stat block text from your source document.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-monster-importer-Text",
					selector: ".monster-importer textarea",
					title: "Monster Importer Step 2",
					content: "<p>Paste the monster text into the this text box. Make sure to sparate features with a blank line.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-monster-importer-import",
					selector: "button.import",
					title: "Monster Importer Step 3",
					content: "<p>Click Import to create monters as an NPC actor under the actors tab.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-monster-importer-end-tour",
					selector: "#tours-management .window-title",
					title: "Thank you!",
					content:
            "<p><b>Thank you!</b> for following along, learning how to <b>Import Monsters</b> for <b>Shadowdark RPG</b>.</p>\n<p>For more information, see the other available tours.</p>",
					action: "scrollTo",
				},
			],
		});
	}

	/**
   * Override _preStep to wait for elements to exist in the DOM
   */
	async _preStep() {
		if (this.currentStep.id === "sd-monster-importer-start") {
			// Go to compendium
			document.querySelector('a[data-tab="compendium"]').click();
		}

		if (this.currentStep.id === "sd-monster-importer-compendium-open") {
			await game.packs.get("shadowdark.macros").render(true);
			await delay(300);
		}
		if (this.currentStep.id === "sd-monster-importer-end-tour") {
			Object.values(ui.windows).forEach(async w => {
				await w.close();
				await delay(300);
			});
			await $("#settings button[data-action=tours]").click();
			await delay(200);
			await document.querySelector("a.category-tab[data-tab=system]").click();
		}

		await super._preStep();
	}
}

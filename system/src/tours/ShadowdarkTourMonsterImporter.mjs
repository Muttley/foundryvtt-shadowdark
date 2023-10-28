/**
 * @file defines the tour for importing the lost citadel adventure
 */
import { delay } from "../testing/testUtils.mjs";
import ShadowdarkTour from "./ShadowdarkTour.mjs";

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
					id: "sd-tlc-start",
					selector: ".compendium-sidebar",
					title: "Compendium",
					content: "<p>The compendium tab contains collections that are included in the system. Including many useful pre-built macros, such as the monster importer.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-tlc-compendium-folder-1",
					selector: "li[data-folder-id='xz3RYT3OvgUDGXad'] header",
					title: "Shadowdark System folder",
					content: "<p>Open the Shadowdark System folder.</p>",
					action: "click",
				},
				{
					id: "sd-tlc-compendium-item",
					selector: "li[data-pack='shadowdark.macros']",
					title: "Macros Compendium",
					content: "<p>The Monster Importer is located in the Macros Compendium.</p>",
					action: "click",
				},
				{
					id: "sd-monster-importer-macro",
					selector: "li[data-document-id=sJTtbWtWigzBHf6N] h4 a",
					title: "Open Monster Importer Macro",
					content: "<p>You can drag this Macro to the hotbar if you want a convenient way of accessing it.</p>",
					action: "click",
				},
				{
					id: "sd-monster-importer-Execute",
					selector: ".execute",
					title: "Run Monster Importer",
					content: "<p>...</p>",
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
					content: "<p>Click Import to create monters as an NPC actor.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-tlc-end-tour",
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
		if (this.currentStep.id === "sd-tlc-start") {
			// Go to compendium
			document.querySelector('a[data-tab="compendium"]').click();
		}

		if (this.currentStep.id === "sd-tlc-compendium-importer") {
			await delay(300);
		}

		if (this.currentStep.id === "sd-tlc-end-tour") {
			Object.values(ui.windows).forEach(async w => {
				await w.close();
				await delay(300);
			});
			await $("#settings button[data-action=tours]").click();
		}

		await super._preStep();
	}
}

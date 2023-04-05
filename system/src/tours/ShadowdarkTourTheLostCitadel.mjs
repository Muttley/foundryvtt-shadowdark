/**
 * @file defines the tour for importing the lost citadel adventure
 */
import { delay } from "../testing/testUtils.mjs";
import ShadowdarkTour from "./ShadowdarkTour.mjs";

export class ShadowdarkTheLostCitadelTour extends ShadowdarkTour {
	constructor() {
		super({
			title: "The Lost Citadel of the Scarlet Minotaur",
			description:
        "Learn how import the Quickstart adventure into Foundry for Shadowdark RPG.",
			canBeResumed: false,
			display: true,
			steps: [
				{
					id: "sd-tlc-start",
					selector: ".compendium-sidebar",
					title: "Compendium",
					content: "<p>The compendium tab contains various collections that are included in the system (as well as modules, and the world).</p>",
					action: "scrollTo",
				},
				{
					id: "sd-tlc-compendium",
					selector: "li[data-pack='shadowdark.the-lost-citadel-adventure']",
					title: "Adventure Compendium",
					content: "<p>The interesting today is the Adventure Compendiums, specifically the Lost Citadel</p>",
					action: "click",
				},
				{
					id: "sd-tlc-compendium-adventure",
					selector: "li.adventure h4",
					title: "Adventure",
					content: "<p>The system includes the introductory adventure The Lost Citadel of the Scarlet Minotaur from the Quickstarter ruleset.</p>",
					action: "click",
				},
				{
					id: "sd-tlc-compendium-importer",
					selector: ".adventure-importer",
					title: "Adventure Importer",
					content: "<p>The importer allows to easily import the adventure.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-tlc-compendium-importer-import",
					selector: ".adventure-footer button",
					title: "Import Adventure",
					content: "<p>Clicking the Import Adventure button will import the adventure to your world, and you are ready to go.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-tlc-end-tour",
					selector: "#tours-management .window-title",
					title: "Thank you!",
					content:
            "<p><b>Thank you!</b> for following along, learning how to <b>roll from Player character sheet</b> for <b>Shadowdark RPG</b>.</p>\n<p>For more information, see the other available tours.</p>",
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

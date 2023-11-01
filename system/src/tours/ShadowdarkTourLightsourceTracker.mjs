/**
 * @file Defines the Guided Tour for the Lightsource Tracker
 */
import ShadowdarkTour from "./ShadowdarkTour.mjs";
import { delay } from "../testing/testUtils.mjs";

export class ShadowdarkLightsourceTrackerTour extends ShadowdarkTour {
	constructor() {
		super({
			title: "Lightsource Tracking: How it works",
			description:
        "Learn how the Lightsource tracker in Shadowdark RPG works.",
			canBeResumed: false,
			display: true,
			steps: [
				{
					id: "sd-lightsourcetracker-goto-tracker",
					selector: ".shadowdark.light-tracker",
					title: "Lightsource Tracker",
					content: "<p>Welcome to the <b>Lightsource Tracker UI</b>.</p>\n<p>It helps the GM to keep track of the lightsources used on player-claimed actors in the game world.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-stay-tracker",
					selector: ".shadowdark.light-tracker",
					title: "Only for GM",
					content: "<p>The <b>Lightsource Tracker UI</b> is only visible to GMs.</p>\n<p>Let's assign an actor to a user!</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-assigned-actor",
					selector: ".shadowdark.light-tracker",
					title: "Ms Fire-guide",
					content: "<p>Ms Fire-guide has been claimed by The Tour Guide user and shows up on the tracker.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-open-actor-sheet",
					selector: "a[data-tab='tab-inventory']",
					title: "Ms Fire-guide",
					content: "<p>Our player would proceed to the inventory.</p>",
					action: "click",
				},
				{
					id: "sd-lightsourcetracker-activate-torch-icon",
					selector: "a.item-toggle-light",
					title: "Activate Torch",
					content: "<p>By clicking on the activate lightsource button, the player lights their torch.</p>",
					action: "click",
				},
				{
					id: "sd-lightsourcetracker-activate-torch-chat-message",
					selector: "section.chat-sidebar",
					title: "Torch Activated message",
					content: "<p>Activating a light source sends a message to the chat log.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-activate-torch-tracker",
					selector: ".shadowdark.light-tracker div.tourguideactor div.light-sources",
					title: "Torch Activated Tracker",
					content: "<p>... it also shows up in the Lightsource Tracker.</p>\n<p>If the player has a token in a scene, a pre-determined light-setting will activate, providing visibility.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-time-tracking",
					selector: ".shadowdark.light-tracker div.tourguideactor div.light-sources div.time-remaining",
					title: "Real Time",
					content: "<p>With the lightsource activated, the time remaing starts ticking down as configured in the settings.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-goto-active",
					selector: "p.status__value",
					title: "Tracking Status",
					content: "<p>The tracking status indicates if lightsources are being actively depleted.</p>\n<p>Depending on your settings, this will pause with the game.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-douse-torch",
					selector: ".shadowdark.light-tracker div.tourguideactor div.light-sources div.light-controls",
					title: "Douse individual lightsource",
					content: "<p>The GM may douse individual light sources by clicking the flame.</p>\n<p>This will also turn the lights off on any tokens the player has.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-douse-all",
					selector: ".shadowdark.light-tracker button.disable-all-lights",
					title: "Douse all lightsources",
					content: "<p>The GM may also turn off all the light sources, leaving them in darkness as the light from their tokens also deactivates.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-macro-sidebar",
					selector: "a.item[data-tab=compendium]",
					title: "Compendium",
					content: "<p>In case you close the Lightsource Tracker UI by mistake and want to get it back, you need to head to the Macro compendium.</p>",
					action: "click",
				},
				{
					id: "sd-lightsourcetracker-compendium-open",
					selector: "div[id='compendium-shadowdark.macros'] .directory-header",
					title: "Macros Compendium",
					content: "<p>By opening the Macro Compendium, you can find various macros for Shadowdark RPG.</p>",
					action: "ScrollTo",
				},
				{
					id: "sd-lightsourcetracker-macro",
					selector: "li[data-document-id=VgfWt2xWzYJyVMbA]",
					title: "Lightsource Tracker Macro",
					content: "<p>This macro you can drag to the hotbar if you want a convenient way of accessing the Lightsource Tracker UI.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-goto-settings",
					selector: "button[data-action=configure]",
					title: "Go to Settings",
					content: "<p>Let's take a look at the settings.</p>",
					action: "click",
				},
				{
					id: "sd-lightsourcetracker-goto-settings-system",
					selector: "a.category-tab[data-tab=system]",
					title: "Go to Shadowdark Settings",
					content: "<p>Go to system settings.</p>",
					action: "click",
				},
				{
					id: "sd-lightsourcetracker-settings-track-light-sources",
					selector: "input[name='shadowdark.trackLightSources']",
					title: "Tracking Light Sources",
					content: "<p>This setting toggles if light sources shall be tracked at all.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-settings-track-light-sources-open",
					selector: "input[name='shadowdark.trackLightSourcesOpen']",
					title: "Rendering the UI at start",
					content: "<p>This setting toggles if the lightsource tracker UI shall be rendered for the GM when they log in.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-settings-track-inactive-users",
					selector: "input[name='shadowdark.trackInactiveUserLightSources']",
					title: "Tracking inactive users",
					content: "<p>This setting toggles if the lightsource tracker shall track inactive users.</p>\n<p>If <b>checked</b>, the tracker will reduce time remaining even if the user is not logged on.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-settings-paused-with-game",
					selector: "input[name='shadowdark.pauseLightTrackingWithGame']",
					title: "Pausing with the Game",
					content: "<p>This setting toggles if the lightsource tracker shall pause if you pause the game</p>\n<p><b>Unchecked</b> will ignore pausing, for true Real Time tracking</p>\n<p><b>Checking</b> will pause the timer if the GM pauses the game.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-settings-track-intervall",
					selector: "input[name='shadowdark.trackLightSourcesInterval']",
					title: "Update frequency",
					content: "<p>This slider will select how often the lightsources should be updated</p>\n<p>The number indicates the number of seconds between updates</p>",
					action: "scrollTo",
				},
				{
					id: "sd-lightsourcetracker-end-tour",
					selector: "#tours-management .window-title",
					title: "Thank you!",
					content:
            "<p><b>Thank you!</b> for following along, learning how the <b>Lightsource Tracker UI</b> for <b>Shadowdark RPG</b> works.</p>\n<p>For more information, see the other available tours.</p>",
					action: "scrollTo",
				},
			],
		});
	}

	async _setSettings(settings) {
		for (const [key, value] of Object.entries(settings)) {
			await game.settings.set("shadowdark", key, value);
		}
	}

	/**
   * Override _preStep to wait for elements to exist in the DOM
   */
	async _preStep() {
		if (!game.settings.get("shadowdark", "trackLightSources")) {
			ui.notifications.info(
				game.i18n.localize("SHADOWDARK.tours.lightsource.notification.not_enabled"),
				{permanent: true}
			);
			await document.querySelector("button[data-action=configure]").click();
			await delay(200);
			await document.querySelector("a.category-tab[data-tab=system]").click();
			await this.reset();
			return this.exit();
		}

		const MOCK_ACTOR_NAME = "Ms Fire-guide";
		const MOCK_USER = "The Tour Guide";
		const TOUR_SETTINGS = {
			trackLightSourcesOpen: false,
			trackInactiveUserLightSources: true,
			pauseLightTrackingWithGame: true,
		};

		if (this.currentStep.id === "sd-lightsourcetracker-goto-tracker") {
			// Clean-up previous tours if we have restarted
			game.actors.filter(a => a.name === MOCK_ACTOR_NAME).forEach(a => a.delete());
			game.users.filter(u => u.name === MOCK_USER).forEach(a => a.delete());

			// Setup an actor for the tour
			const tourActor = await Actor.create({
				name: MOCK_ACTOR_NAME,
				type: "Player",
				img: "icons/magic/fire/elemental-fire-humanoid.webp",
				ownership: {
					default: 3,
				},
			});

			// Mock a user for the tour
			await game.users.find(u => u.name === MOCK_USER)?.delete();
			await User.create({name: MOCK_USER});
			// character: tourActor._id

			// Add torch to character
			const basicGearPack = game.packs.get("shadowdark.gear");
			const torchId = basicGearPack.index.find(i => i.name === "Torch")._id;
			const torch = await basicGearPack.getDocument(torchId);
			await tourActor.createEmbeddedDocuments("Item", [torch]);

			// Delay so the UI has time to catch up
			await delay(200);
			await game.shadowdark.lightSourceTracker.render(false);

			// Go to chat
			document.querySelector('a[data-tab="chat"]').click();

			// Check if the tour was started the last 10 minutes, if it was, then do not
			// re-record the original settings. Otherwise, store current settings with runtime data.
			if (!(
				game.world.flags.tours
				&& game.world.flags.tours.lightSourceTracker
				&& (game.world.flags.tours.lightSourceTracker.lastRun - Date.now()) < 10*60*1000
			)) {
				// Store data for the run
				game.world.flags.tours = {
					lightsourceTracker: {
						lastRun: Date.now(),
						schemaVersion: game.settings.get("shadowdark", "schemaVersion"),
						originalSettings: {
							trackLightSourcesOpen: game.settings.get("shadowdark", "trackLightSourcesOpen"),
							trackInactiveUserLightSources: game.settings.get("shadowdark", "trackInactiveUserLightSources"),
							pauseLightTrackingWithGame: game.settings.get("shadowdark", "pauseLightTrackingWithGame"),
						},
					},
				};
			}

			// Set the temporary settings
			await this._setSettings(TOUR_SETTINGS);

			// Render the lighttracker UI
			if (!game.shadowdark.lightSourceTracker.rendered) {
				await game.shadowdark.lightSourceTracker.toggleInterface(true);
			}
		}

		if (this.currentStep.id === "sd-lightsourcetracker-compendium-open") {
			await game.packs.get("shadowdark.macros").render(true);
			await delay(300);
		}

		if (this.currentStep.id === "sd-lightsourcetracker-goto-settings") {
			document.querySelector('a[data-tab="settings"]').click();
		}

		if (this.currentStep.id === "sd-lightsourcetracker-assigned-actor") {
			const user = await game.users.find(u => u.name === MOCK_USER);
			const actor = game.actors.find(a => a.name === MOCK_ACTOR_NAME);
			await user.update({
				character: actor._id,
			});
		}

		if (
			[
				"sd-lightsourcetracker-activate-torch-tracker",
				"sd-lightsourcetracker-time-tracking",
				"sd-lightsourcetracker-douse-torch",
				"sd-lightsourcetracker-douse-all",
			].includes(this.currentStep.id)
		) {
			// Add anchor to the div so we can find it later
			$(`div.character-name:contains(${MOCK_ACTOR_NAME})`).parent().addClass("tourguideactor");
		}

		if (this.currentStep.id === "sd-lightsourcetracker-open-actor-sheet") {
			const actor = game.actors.find(a => a.name === MOCK_ACTOR_NAME);
			await actor.sheet.render(true);
		}

		if (this.currentStep.id === "sd-lightsourcetracker-activate-torch-tracker") {
			const actor = game.actors.find(a => a.name === MOCK_ACTOR_NAME);
			await actor.sheet.close();
		}

		if (this.currentStep.id === "sd-lightsourcetracker-end-tour") {
			Object.values(ui.windows).forEach(async w => {
				await w.close();
				await delay(300);
			});
			// Restore the settings
			await this._setSettings(game.world.flags.tours.lightsourceTracker.originalSettings);

			await $("#settings button[data-action=tours]").click();
			await delay(200);
			await document.querySelector("a.category-tab[data-tab=system]").click();

			game.actors.filter(a => a.name === MOCK_ACTOR_NAME).forEach(a => a.delete());
			game.users.find(u => u.name === MOCK_USER).delete();
		}

		await super._preStep();
	}
}

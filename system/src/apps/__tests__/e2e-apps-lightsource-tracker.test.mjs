/* eslint-disable no-unused-expressions */
/**
 * @file Contains E2E tests for the Lightsource Tracker app
 */

import {
	cleanUpActorsByKey,
	cleanUpUsersByKey,
	cleanUpItemsByKey,
	createMockUserByKey,
	createMockActorByKey,
	createMockItemByKey,
	delay,
	openWindows,
	waitForInput,
	trashChat,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.e2e.apps.lightsource-tracker";
export const options = {
	displayName: "Shadowdark: E2E: Apps: Lightsource Tracker",
	preSelected: false,
};

export default ({ describe, it, after, before, expect }) => {
	const wasPaused = game.paused;
	const originalSettings = {
		trackLightSources: game.settings.get("shadowdark", "trackLightSources"),
		trackInactiveUserLightSources: game.settings.get("shadowdark", "trackInactiveUserLightSources"),
		realtimeLightTracking: game.settings.get("shadowdark", "realtimeLightTracking"),
	};

	before(async () => {
		openWindows("light-tracker").forEach(async w => await w.close());
		await delay(300);
	});

	after(async () => {
		for (const [key, value] of Object.entries(originalSettings)) {
			await game.settings.set(
				"shadowdark", key, value
			);
		}
		game.togglePause(wasPaused);
		await waitForInput();
		openWindows("light-tracker").forEach(async w => await w.close());
	});

	describe("render(force, options)", () => {
		// TODO: Write tests if you figure out how to mock another user
	});

	describe("toggleInterface()", () => {
		it("renders for GM on toggle", async () => {
			// Assume the window is the currently open window
			const pre = openWindows("light-tracker");
			expect(pre.length).equal(0);

			await game.shadowdark.lightSourceTracker.toggleInterface();
			await delay(300);
			expect(openWindows("light-tracker").length).equal(1);
		});

		it("closes for GM on another toggle", async () => {
			// Assume the window is the currently open window
			const pre = openWindows("light-tracker");
			expect(pre.length).equal(1);

			await game.shadowdark.lightSourceTracker.toggleInterface();
			await delay(300);
			expect(openWindows("light-tracker").length).equal(0);
		});
	});

	describe("toggleLightSource()", () => {
		// TODO: Figure out how to test sockets
		// Mock an actor and test if there is a socket message in console
		// Mock actor and activate a lightsource
	});

	describe("_gatherLightSources()", () => {
		let mockActor;
		let mockUser;
		let mockItem;

		// Create a light tracker and replace the built in for now
		const app = game.shadowdark.lightSourceTracker;

		let preexistingSources = app.monitoredLightSources.length;

		before(async () => {
			cleanUpActorsByKey(key);
			cleanUpUsersByKey(key);
			cleanUpItemsByKey(key);
			await trashChat();
		});

		after(async () => {
			cleanUpActorsByKey(key);
			cleanUpUsersByKey(key);
			cleanUpItemsByKey(key);
			await trashChat();
		});

		before(async () => {
			await game.settings.set("shadowdark", "trackLightSources", true);
			await game.settings.set("shadowdark", "trackInactiveUserLightSources", true);
			await game.settings.set("shadowdark", "realtimeLightTracking", true);

			// Add another user
			mockUser = await createMockUserByKey(key);

			// Create actor
			mockActor = await createMockActorByKey(key, "Player");
			await mockActor.update({"ownership.default": 3});

			// Create light source
			mockItem = await createMockItemByKey(key, "Basic");
			await mockItem.update({
				system: {
					light: {
						active: false,
						hasBeenUsed: false,
						isSource: true,
						longevityMins: 1,
						remainingSecs: 5,
						template: "torch",
					},
				},
			});

			// Add light source to character
			await mockActor.createEmbeddedDocuments("Item", [mockItem]);

			// Add a character to user
			await mockUser.update({
				character: mockActor._id,
			});

			// Render the actor sheet & go to the inventory
			await mockActor.sheet.render(true);
			await waitForInput();
			await document.querySelector(
				".player-navigation a[data-tab=tab-inventory]").click();
			await game.shadowdark.lightSourceTracker.toggleInterface();
		});

		// it("world sanity check: less than 10 world actors", () => {
		// 	// These tests are sensitive to number of actors in the world,
		// 	// as it iterates over them. And it seems to not function very
		// 	// stable above 10 actors (on bakbak's machine).
		// 	//
		// 	// If you see this test failing, create a fresh world and run the suite.
		// 	expect(game.actors.contents.length).to.be.below(10);
		// });

		it("actor sanity check", () => {
			expect(mockActor).is.not.undefined;
			expect(mockActor.items.contents.length).equal(1);
			expect(mockActor.items.contents[0].isLight()).is.true;
			expect(mockActor.items.contents[0].system.light.remainingSecs).equal(5);
			expect(mockUser.character.id).equal(mockActor.id);
		});

		it("Turning the lightsource on puts it in a tracked state", async () => {
			// click the torch button
			await document.querySelector("a.item-toggle-light").click();
			await app.onUpdateWorldTime(game.time.worldTime, -1);
			await delay(1500);
			expect(app.monitoredLightSources.length).equal(
				preexistingSources + 1
			);

			// Update the tracker
			await app._updateLightSources();

			// Get the right actor
			const monitoredActor = app.monitoredLightSources.find(
				o => o._id === mockActor._id
			);
			expect(monitoredActor.lightSources.length).equal(1);
		});

		it("Turning the lightsource off puts it in a untracked state", async () => {
			// click the torch button
			await document.querySelector("a.item-toggle-light").click();
			await app.onUpdateWorldTime(game.time.worldTime, -1);
			await delay(1500);
			expect(app.monitoredLightSources.length).equal(
				preexistingSources + 1
			);

			// Update the tracker
			await app._updateLightSources();

			// Get the right actor
			const monitoredActor = app.monitoredLightSources.find(
				o => o._id === mockActor._id
			);
			expect(monitoredActor.lightSources.length).equal(0);
		});
	});

	describe("onUpdateWorldTime", () => {
		// TODO: figure out how to test
	});
};

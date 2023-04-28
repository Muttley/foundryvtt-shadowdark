/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for the Lightsource Tracker app
 */

import { waitForInput } from "../../testing/testUtils.mjs";
import LightSourceTrackerSD from "../LightSourceTrackerSD.mjs";

export const key = "shadowdark.apps.lightsource-tracker";
export const options = {
	displayName: "Shadowdark: Apps: Lightsource Tracker",
	preSelected: true,
};

export default ({ describe, it, after, before, expect }) => {
	const originalSettings = {
		trackLightSources: game.settings.get("shadowdark", "trackLightSources"),
		trackInactiveUserLightSources: game.settings.get("shadowdark", "trackInactiveUserLightSources"),
		realtimeLightTracking: game.settings.get("shadowdark", "realtimeLightTracking"),
	};
	const wasPaused = game.paused;

	after(async () => {
		for (const [key, value] of Object.entries(originalSettings)) {
			await game.settings.set(
				"shadowdark", key, value
			);
		}
		game.togglePause(wasPaused);
		await waitForInput();
		Object.values(ui.windows).filter(w => w.options.classes.includes("light-tracker")).forEach(async w => await w.close());
	});

	describe("constructor(object, options)", () => {
		it("can construct", () => {
			const app = new LightSourceTrackerSD();
			expect(app).is.not.undefined;
		});

		describe("constructed object", () => {
			const app = new LightSourceTrackerSD();
			it("has the expected data", () => {
				expect(app.monitoredLightSources.length).equal(0);
				expect(app.lastUpdate).equal(0);
				expect(app.updatingLightSources).is.false;
				expect(app.housekeepingInterval).equal(1000);
				expect(app.housekeepingIntervalId).is.null;
				expect(app.dirty).is.true;
				expect(app.performingTick).is.false;
			});
		});
	});

	describe("defaultOptions()", () => {
		const app = new LightSourceTrackerSD();
		it("contains the correct CSS classes", () => {
			expect(app.options.classes).is.not.undefined;
			expect(app.options.classes).contains("shadowdark");
			expect(app.options.classes).contains("light-tracker");
		});

		it("contains the correct window dimensions", () => {
			expect(app.options.height).is.not.undefined;
			expect(app.options.width).is.not.undefined;
			expect(app.options.resizable).is.not.undefined;
			expect(app.options.height).equal("auto");
			expect(app.options.width).equal("auto");
			expect(app.options.resizable).is.false;
		});
	});

	describe("template()", () => {
		const app = new LightSourceTrackerSD();
		it("returns the right template", () => {
			expect(app.template).equal(
				"systems/shadowdark/templates/apps/light-tracker.hbs"
			);
		});
	});

	// Skipping these tests
	describe("activeListeners()", () => {});

	describe("getData(options)", () => {
		const app = new LightSourceTrackerSD();
		it("returns monitoredLightSources", async () => {
			const data = await app.getData();
			expect(data.monitoredLightSources).is.not.undefined;
		});

		it("returns paused", async () => {
			const data = await app.getData();
			expect(data.paused).is.not.undefined;
		});
	});

	describe("render(force, options)", () => {
		// Tested by E2E
	});

	describe("start()", () => {
		it("required pauseLightTrackingWithGame settings exists", () => {
			const setting = game.settings.get(
				"shadowdark", "pauseLightTrackingWithGame"
			);
			expect(setting).is.not.undefined;
		});

		it("required trackLightSourcesInterval settings exists", () => {
			const setting = game.settings.get(
				"shadowdark", "trackLightSourcesInterval"
			);
			expect(setting).is.not.undefined;
		});

		it("required trackLightSourcesOpen settings exists", () => {
			const setting = game.settings.get(
				"shadowdark", "trackLightSourcesOpen"
			);
			expect(setting).is.not.undefined;
		});
	});

	describe("toggleInterface()", () => {
		// Tested by E2E
	});

	describe("toggleLightSource()", () => {
		// Tested by E2E
	});

	describe("_gatherLightSources()", () => {
		// Tested by E2E
	});

	describe("_deleteActorHook(actor, options, userId)", () => {
		// Unable to test this with potential active tracker
	});

	describe("_deleteItemHook(item, options, userId)", () => {
		// Unable to test this with potential active tracker
	});

	describe("_isEnabled() & _isDisabled()", () => {
		const app = new LightSourceTrackerSD();
		it("returns false when not enabled", async () => {
			await game.settings.set("shadowdark", "trackLightSources", false);
			expect(app._isEnabled()).is.false;
			expect(app._isDisabled()).is.true;
		});

		it("returns false when not enabled", async () => {
			await game.settings.set("shadowdark", "trackLightSources", true);
			expect(app._isEnabled()).is.true;
			expect(app._isDisabled()).is.false;
		});
	});

	describe("_isPaused()", () => {
		// Store original setting
		const setting = game.settings.get(
			"shadowdark", "pauseLightTrackingWithGame"
		);
		const paused = game.paused;

		before(async () => {
			// Ensure that realtime tracking is enabled.
			await game.settings.set("shadowdark", "trackLightSources", true);
			game.togglePause(false);
		});

		// Restore settings
		after(() => {
			game.settings.set(
				"shadowdark", "pauseLightTrackingWithGame", setting
			);
			game.togglePause(paused);
		});

		it("when unpaused and with setting enabled", async () => {
			await game.settings.set(
				"shadowdark", "pauseLightTrackingWithGame", true
			);
			const localSetting = game.settings.get(
				"shadowdark", "pauseLightTrackingWithGame"
			);
			expect(localSetting).is.true;
			const app = new LightSourceTrackerSD();
			expect(game.paused).is.false;
			expect(app._isPaused()).is.false;
		});

		it("when paused and with setting enabled", () => {
			game.togglePause(true);
			expect(game.paused).is.true;
			const localSetting = game.settings.get(
				"shadowdark", "pauseLightTrackingWithGame"
			);
			expect(localSetting).is.true;
			const app = new LightSourceTrackerSD();
			expect(app._isPaused()).is.true;
		});

		it("when paused and with setting disabled", async () => {
			await game.settings.set(
				"shadowdark", "pauseLightTrackingWithGame", false
			);
			expect(game.paused).is.true;
			const localSetting = game.settings.get(
				"shadowdark", "pauseLightTrackingWithGame"
			);
			expect(localSetting).is.false;
			const app = new LightSourceTrackerSD();
			// Fails without calling _settingsChanged as true
			// is the default and isn't updated until called.
			await app._settingsChanged();
			expect(app._isPaused()).is.false;
		});

		it("when unpaused and with setting disabled", () => {
			game.togglePause(false);
			expect(game.paused).is.false;
			const localSetting = game.settings.get(
				"shadowdark", "pauseLightTrackingWithGame"
			);
			expect(localSetting).is.false;
			const app = new LightSourceTrackerSD();
			expect(app._isPaused()).is.false;
		});
	});

	describe("_makeDirty()", () => {
		// This marks the lightsourceTracker as dirty, which then
		// will have _updateLightSources() run through the interval.
		// Thus tested by _updateLightSources()
	});

	describe("_monitorInactiveUsers()", () => {
		const app = new LightSourceTrackerSD();
		it("returns false when not enabled", async () => {
			await game.settings.set("shadowdark", "trackInactiveUserLightSources", false);
			expect(app._monitorInactiveUsers()).is.false;
		});

		it("returns false when not enabled", async () => {
			await game.settings.set("shadowdark", "trackInactiveUserLightSources", true);
			expect(app._monitorInactiveUsers()).is.true;
		});
	});

	describe("_onToggleLightSource()", () => {
		// Skipping tests as it is just a forwarding method
	});

	describe("_pauseGameHook()", () => {
		// Skipping tests
	});

	describe("onUpdateWorldTime", () => {
		// Tested by E2E
	});

	describe("_settingsChanged()", () => {
		// Tested in _isPaused(), as if this fails, the tests there fails
	});

	describe("_updateLightSources()", () => {
		// Tested in _gatherLightSources()
	});
};

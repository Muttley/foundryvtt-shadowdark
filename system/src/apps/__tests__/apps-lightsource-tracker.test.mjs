/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for the Lightsource Tracker app
 */

import LightSourceTrackerSD from "../LightSourceTrackerSD.mjs";

export const key = "shadowdark.apps.lightsource-tracker";
export const options = {
	displayName: "Shadowdark: Apps: Lightsource Tracker",
	preSelected: true,
};

export default ({ describe, it, after, beforeEach, before, expect }) => {
	describe("constructor(object, options)", () => {
		it("can construct", () => {
			const app = new LightSourceTrackerSD();
			expect(app).is.not.undefined;
		});

		describe("constructed object", () => {
			const app = new LightSourceTrackerSD();
			it("has the expected data", () => {
				expect(app.monitoredLightSources.length).equal(0);
				expect(app.updateInterval).equal(60*1000);
				expect(app.updateIntervalId).is.null;
				expect(app.lastUpdate).is.not.null;
				expect(app.updatingLightSources).is.false;
				expect(app.pauseWithGame).is.true;
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
		// @todo: Write tests if you figure out how to mock another user
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
		// @todo: Write tests if you figure out how to mock another user
	});

	describe("toggleLightSource()", () => {
		// @todo: Figure out how to test sockets
		// @todo: Mock an actor and test if there is a socket message in console
		// @todo: Mock actor and activate a lightsource
	});

	describe("_gatherLightSources()", () => {
		// @todo: Mock actor and activate a lightsource
	});

	describe("_isDisabled()", () => {
		it("opposite of setting", () => {
			const setting = game.settings.get(
				"shadowdark", "trackLightSources"
			);
			expect(setting).is.not.undefined;
			const app = new LightSourceTrackerSD();
			expect(app._isDisabled()).equal(!setting);
		});
	});

	describe("_isEnabled()", () => {
		it("required trackLightSources settings exists", () => {
			const setting = game.settings.get(
				"shadowdark", "trackLightSources"
			);
			expect(setting).is.not.undefined;
			const app = new LightSourceTrackerSD();
			expect(app._isEnabled()).equal(setting);
		});
	});

	describe("_isPaused()", () => {
		// Store original setting
		const setting = game.settings.get(
			"shadowdark", "pauseLightTrackingWithGame"
		);
		const paused = game.paused;
		game.togglePause(false);

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

	describe("_monitorInactiveUsers()", () => {
		it("required trackInactiveUserLightSources settings exists", () => {
			const setting = game.settings.get(
				"shadowdark", "trackInactiveUserLightSources"
			);
			expect(setting).is.not.undefined;
			const app = new LightSourceTrackerSD();
			expect(app._monitorInactiveUsers()).equal(setting);
		});
	});

	describe("_onToggleLightSource()", () => {
		// Skipping tests as it is just a gatekeeping method
	});

	describe("_settingsChanged()", () => {
		// Tested in _isPaused(), as if this fails, the tests there fails
	});

	describe("_performTick()", () => {
		// TODO This test will fail if the game is paused.
		const app = new LightSourceTrackerSD();
		it("updates the date", () => {
			const datePre = app.lastUpdate;
			app._performTick();
			expect(app.lastUpdate > datePre).is.true;
		});

		// @todo: e2e tests with sheets
	});

	describe("_updateLightSources()", () => {
		// Skipping tests as they are tested later when _gatherLightSources
		//   tests are written
	});
};

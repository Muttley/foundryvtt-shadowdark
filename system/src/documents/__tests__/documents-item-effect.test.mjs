/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for effect item documents.
 * Pre-defined effects are tested in another test package.
 *
 */
import {
	createMockItemByKey,
	createMockActorByKey,
	cleanUpItemsByKey,
	cleanUpActorsByKey,
	trashChat,
	waitForInput,
	delay,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.documents.item.effect";
export const options = {
	displayName: "Shadowdark: Documents: Item, Effect",
	preSelected: true,
};

const createMockItem = async type => createMockItemByKey(key, "Effect");
const createMockPlayer = async () => createMockActorByKey(key, "Player");
const createMockNPC = async () => createMockActorByKey(key, "NPC");

export default ({ describe, it, before, after, afterEach, expect }) => {
	after(() => {
		cleanUpItemsByKey(key);
	});

	describe("Item Document", () => {
		after(() => {
			cleanUpItemsByKey(key);
		});

		it("Can create Effect item", async () => {
			const _e = await createMockItem();
			expect(_e).is.not.undefined;
			_e.delete();
		});

		it("isEffect()", async () => {
			const _e = await createMockItem();
			expect(_e.isEffect()).is.true;
			_e.delete();
		});

		describe("_preCreate(data, options, user)", () => {
			afterEach(() => {
				cleanUpItemsByKey(key);
				cleanUpActorsByKey(key);
			});

			after(async () => {
				const scene = await game.scenes.getName(`Mock Scene: ${key}`);
				if (scene) scene.delete();
				game.combats.forEach(async c => await c.delete());
				trashChat();
			});

			before(async () => {
				const paused = game.paused;
				game.togglePause(false);
				await game.time.advance(2);
				game.togglePause(paused);
			});

			it("Game Time stored when adding Effect to Player", async () => {
				const _p = await createMockPlayer();
				const _e = await createMockItem();
				expect(_e.system.start.value).to.be.above(0);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_pe[0].system.start.value).to.be.above(0);
			});

			it("Game Time stored when adding Effect to NPC", async () => {
				const _n = await createMockNPC();
				const _e = await createMockItem();
				expect(_e.system.start.value).to.be.above(0);

				const _ne = await _n.createEmbeddedDocuments("Item", [_e]);
				expect(_ne.length).equal(1);
				expect(_ne[0]).is.not.undefined;
				expect(_ne[0].system.start.value).to.be.above(0);
			});

			it("Initiative stored when adding Effect to actor in combat", async () => {
				// Stop current combat encounters
				if (game.combat) game.combats.forEach(async c => await c.delete());
				await waitForInput();
				expect(game.combat).is.null;

				// Create Combat
				let removeScene = false;
				let scene = {};
				if (canvas.scene === null) {
					scene = await Scene.create({name: `Mock Scene: ${key}`});
					await delay(1200);
					removeScene = true;
				}
				const combat = await Combat.create({
					scene: canvas.scene.id,
					active: true,
				});
				expect(combat).is.not.undefined;
				expect(game.combat).is.not.null;

				// Create Actor
				const _p = await createMockPlayer();
				await game.combat.createEmbeddedDocuments("Combatant", [_p]);
				await game.combat.rollAll();
				await game.combat.startCombat();
				await game.combat.nextTurn();
				const combatTime = `${game.combat?.round}.${game.combat?.turn}`;

				// Create effect & make sure it stores inititive value
				const _e = await createMockItem();
				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_pe[0].system.start.combatTime).equal(combatTime);

				combat.delete();
				if (removeScene) scene.delete();
			});
		});
	});

	describe("Duration tests", () => {
		after(() => {
			cleanUpItemsByKey(key);
		});

		describe("totalDuration", () => {
			it("unlimited", async () => {
				const _e = await createMockItem();
				await _e.update({
					"system.duration.type": "unlimited",
				});
				expect(_e.totalDuration).equal(Infinity);
			});

			it("focus", async () => {
				const _e = await createMockItem();
				await _e.update({
					"system.duration.type": "focus",
				});
				expect(_e.totalDuration).equal(Infinity);
			});

			it("instant", async () => {
				const _e = await createMockItem();
				await _e.update({
					"system.duration.type": "instant",
				});
				expect(_e.totalDuration).equal(0);
			});

			describe("Game time totalDuration", () => {
				after(() => {
					cleanUpItemsByKey(key);
				});

				describe("seconds", () => {
					it("small numbers", async () => {
						const _e = await createMockItem();
						await _e.update({
							"system.duration.type": "seconds",
							"system.duration.value": 4,
						});
						expect(_e.totalDuration).equal(4);
					});

					it("large numbers", async () => {
						const _e = await createMockItem();
						await _e.update({
							"system.duration.type": "seconds",
							"system.duration.value": 400,
						});
						expect(_e.totalDuration).equal(400);
					});
				});

				describe("minutes", () => {
					it("small numbers", async () => {
						const _e = await createMockItem();
						await _e.update({
							"system.duration.type": "minutes",
							"system.duration.value": 4,
						});
						expect(_e.totalDuration).equal(4 * 60);
					});

					it("large numbers", async () => {
						const _e = await createMockItem();
						await _e.update({
							"system.duration.type": "minutes",
							"system.duration.value": 400,
						});
						expect(_e.totalDuration).equal(400 * 60);
					});
				});

				describe("hours", () => {
					it("small numbers", async () => {
						const _e = await createMockItem();
						await _e.update({
							"system.duration.type": "hours",
							"system.duration.value": 4,
						});
						expect(_e.totalDuration).equal(4 * 60 * 60);
					});

					it("large numbers", async () => {
						const _e = await createMockItem();
						await _e.update({
							"system.duration.type": "hours",
							"system.duration.value": 400,
						});
						expect(_e.totalDuration).equal(400 * 60 * 60);
					});
				});

				describe("days", () => {
					it("small numbers", async () => {
						const _e = await createMockItem();
						await _e.update({
							"system.duration.type": "days",
							"system.duration.value": 4,
						});
						expect(_e.totalDuration).equal(4 * 60 * 60 * 24);
					});

					it("large numbers", async () => {
						const _e = await createMockItem();
						await _e.update({
							"system.duration.type": "days",
							"system.duration.value": 400,
						});
						expect(_e.totalDuration).equal(400 * 60 * 60 * 24);
					});
				});
			});
		});

		describe("remainingDuration", () => {
			after(() => {
				cleanUpItemsByKey(key);
				cleanUpActorsByKey(key);
			});

			it("unlimited", async () => {
				const _e = await createMockItem();
				await _e.update({
					"system.duration.type": "unlimited",
				});
				expect(_e.remainingDuration.expired).is.false;
				expect(_e.remainingDuration.remaining).equal(Infinity);
				expect(_e.remainingDuration.progress).equal(0);
			});

			it("focus", async () => {
				const _e = await createMockItem();
				await _e.update({
					"system.duration.type": "focus",
				});
				expect(_e.remainingDuration.expired).is.false;
				expect(_e.remainingDuration.remaining).equal(Infinity);
				expect(_e.remainingDuration.progress).equal(0);
			});

			it("instant", async () => {
				const _e = await createMockItem();
				await _e.update({
					"system.duration.type": "instant",
				});
				expect(_e.remainingDuration.expired).is.true;
				expect(_e.remainingDuration.remaining).equal(0);
				expect(_e.remainingDuration.progress).equal(0);
			});

			it("ticks down when using game time", async () => {
				// Ensure game is paused
				game.togglePause(true);

				const _e = await createMockItem();
				await _e.update({
					"system.duration.type": "seconds",
					"system.duration.value": 4,
				});
				expect(_e.totalDuration).equal(4);

				// Create actor and assign the effect
				const _p = await createMockPlayer();
				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_pe[0].system.start.value).to.be.above(0);

				expect(_pe[0].remainingDuration.expired).is.false;
				expect(_pe[0].remainingDuration.remaining).equal(4);
				expect(_pe[0].remainingDuration.progress).equal(0);

				// Unpause and wait for two second
				game.togglePause(false);
				await game.time.advance(2);

				// Check that the progress is recorded
				expect(_pe[0].totalDuration).equal(4);
				expect(_pe[0].remainingDuration.expired).is.false;
				expect(_pe[0].remainingDuration.remaining).to.be.below(4);
				expect(_pe[0].remainingDuration.progress).to.be.above(0);
			});
		});
	});
};

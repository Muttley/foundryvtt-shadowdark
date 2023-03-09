/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for actor documents
 */
import ActorSD from "../ActorSD.mjs";
import {
	cleanUpActorsByKey,
	abilities,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.documents.actor";
export const options = {
	displayName: "ShadowDark: Documents: Actor",
};

const createMockActor = async type => {
	return ActorSD.create({
		name: `Test Actor ${key}`,
		type,
	});
};

export default ({ describe, it, after, before, expect }) => {
	after(() => {
		cleanUpActorsByKey(key);
	});

	describe("Actor creation", () => {
		it("can create Player actor", async () => {
			const actor = await createMockActor("Player");
			expect(actor).is.not.undefined;
			await actor.delete();
		});

		it("can create NPC actor", async () => {
			const actor = await createMockActor("NPC");
			expect(actor).is.not.undefined;
			await actor.delete();
		});
	});

	describe("abilityModifier(ability)", () => {
		const modifiers = {
			1: -4,
			2: -4,
			3: -4,
			4: -3,
			5: -3,
			6: -2,
			7: -2,
			8: -1,
			9: -1,
			10: 0,
			11: 0,
			12: 1,
			13: 1,
			14: 2,
			15: 2,
			16: 3,
			17: 3,
			18: 4,
			19: 4,
			20: 4,
		};

		before(async () => {
			await createMockActor("Player");
		});

		Object.keys(modifiers).forEach(value => {
			let modifier = modifiers[value];
			describe(`${value} as value generates correct modifier`, () => {
				abilities.forEach(ability => {
					it(`for ${ability}`, async () => {
						const actor = await game.actors.getName(`Test Actor ${key}`);
						const updateData = {};
						updateData[`system.abilities.${ability}.value`] = value;
						await actor.update(updateData);

						expect(actor.abilityModifier(ability)).equal(modifier);
					});
				});
			});
		});

		after(() => {
			cleanUpActorsByKey(key);
		});
	});

	describe("numGearSlots()", () => {
		it("returns default gearslots for NPC", async () => {
			const actor = await createMockActor("NPC");
			expect(actor.numGearSlots()).equal(CONFIG.SHADOWDARK.DEFAULTS.GEAR_SLOTS);
			await actor.delete();
		});

		it("returns default gearslots for Player actor with lower str", async () => {
			const actor = await createMockActor("Player");
			await actor.update({"system.abilities.str.value": 3});
			expect(actor.numGearSlots()).equal(CONFIG.SHADOWDARK.DEFAULTS.GEAR_SLOTS);
			await actor.delete();
		});

		it("returns str gearslots when higher than default gearslots", async () => {
			const actor = await createMockActor("Player");
			await actor.update({
				"system.abilities.str.value": CONFIG.SHADOWDARK.DEFAULTS.GEAR_SLOTS + 1,
			});
			expect(actor.numGearSlots()).equal(CONFIG.SHADOWDARK.DEFAULTS.GEAR_SLOTS + 1);
			await actor.delete();
		});
	});

	describe("rollAbility(abilityId, options={})", () => {});
};

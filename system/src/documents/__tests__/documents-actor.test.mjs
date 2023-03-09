/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for actor documents
 */
import ActorSD from "../ActorSD.mjs";
import { 
	cleanUpActorsByKey,
	abilities,
	waitForInput,
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

	describe("attackBonus(attackType)", () => {
		let actor = {};

		before(async () => {
			actor = await createMockActor("Player");
			await actor.update({
				"system.abilities.str.value": 18,
				"system.abilities.dex.value": 3,
			});
		});

		// @todo: talent bonus for both melee & ranged
		it("melee attack returns str modifier", async () => {
			expect(actor.attackBonus("melee")).equal(4);
		});
		it("ranged attack returns dex modifier", async () => {
			expect(actor.attackBonus("ranged")).equal(-4);
		});

		after(async () => {
			await actor.delete();
		});
	});

	describe("rollAbility(abilityId, options={})", () => {});

	describe("updateArmor(updatedItem)", () => {
		let actor = {};

		before(async () => {
			actor = await createMockActor("Player");
			await actor.createEmbeddedDocuments("Item", [
				{
					type: "Armor",
					name: "Test Armor 1",
					"system.equipped": true,
				},
				{
					type: "Armor",
					name: "Test Armor 2",
				},
				{
					type: "Armor",
					name: "Test Shield 1",
					"system.properties": ["shield"],
					"system.equipped": true,
				},
				{
					type: "Armor",
					name: "Test Shield 2",
					"system.properties": ["shield"],
				},
			]);
		});

		it("switches equipped status if another shield is equiiped", async () => {
			const oldShield = actor.items.getName("Test Shield 1");
			expect(oldShield.system.equipped).is.true;
			const newShield = actor.items.getName("Test Shield 2");
			expect(newShield.system.equipped).is.false;

			await newShield.update({"system.equipped": true});
			expect(oldShield.system.equipped).is.true;
			expect(newShield.system.equipped).is.true;

			await actor.updateArmor(newShield);
			expect(oldShield.system.equipped).is.false;
			expect(newShield.system.equipped).is.true;
		});

		it("switches equipped status if another armor (non-shield) is equipped", async () => {});

		after(async () => {
			await actor.delete();
		});
	});

	describe("updateArmorClass()", () => {
		let actor = {};

		before(async () => {
			actor = await createMockActor("Player");
			await actor.update({
				"system.abilities.dex.value": 18,
			});
		});

		it("calculates the correct AC with no armor equipped", async () => {
			await actor.updateArmorClass();
			await waitForInput();
			expect(actor.system.attributes.ac.value).equal(10 + 4);
		});
		it("calculates the correct AC with armor equipped", async () => {
			await actor.createEmbeddedDocuments("Item", [
				{
					type: "Armor",
					name: "Test Armor 1",
					"system.ac.base": 11,
					"system.ac.modifier": 2,
					"system.equipped": true,
				},
			]);
			await actor.updateArmorClass();
			await waitForInput();
			expect(actor.system.attributes.ac.value).equal(11 + 4 + 2);
		});

		it("calculates the correct AC with armor and shield equipped", async () => {
			await actor.createEmbeddedDocuments("Item", [
				{
					type: "Armor",
					name: "Test Shield 1",
					"system.properties": ["shield"],
					"system.ac.modifier": 3,
					"system.equipped": true,
				},
			]);
			await actor.updateArmorClass();
			await waitForInput();
			expect(actor.system.attributes.ac.value).equal(11 + 4 + 2 + 3);
		});

		after(async () => {
			await actor.delete();
		});
	});
};

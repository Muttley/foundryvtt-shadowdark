/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for actor documents
 */
import ActorSD from "../ActorSD.mjs";
import {
	cleanUpActorsByKey,
	abilities,
	waitForInput,
	trashChat,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.documents.actor";
export const options = {
	displayName: "Shadowdark: Documents: Actor",
	preSelected: true,
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

	describe("Player actor has expected information", () => {
		let actor = {};

		before(async () => {
			actor = await createMockActor("Player");
		});

		/* Shared Details */
		it("has attributes", () => {
			expect(actor.system.attributes).is.not.undefined;
		});
		it("has attributes.hp", () => {
			expect(actor.system.attributes.hp).is.not.undefined;
		});
		it("has attributes.hp.max", () => {
			expect(actor.system.attributes.hp.max).is.not.undefined;
		});
		it("has attributes.hp.value", () => {
			expect(actor.system.attributes.hp.value).is.not.undefined;
		});
		it("has alignment", () => {
			expect(actor.system.alignment).is.not.undefined;
		});
		it("has notes", () => {
			expect(actor.system.notes).is.not.undefined;
		});

		/**  Player Specific  */
		it("has abilities", () => {
			expect(actor.system.abilities).is.not.undefined;
		});
		it("has abilities.str", () => {
			expect(actor.system.abilities.str).is.not.undefined;
		});
		it("has abilities.str.base", () => {
			expect(actor.system.abilities.str.base).is.not.undefined;
		});
		it("has abilities.str.bonus", () => {
			expect(actor.system.abilities.str.bonus).is.not.undefined;
		});
		it("has abilities.dex", () => {
			expect(actor.system.abilities.dex).is.not.undefined;
		});
		it("has abilities.dex.base", () => {
			expect(actor.system.abilities.dex.base).is.not.undefined;
		});
		it("has abilities.dex.bonus", () => {
			expect(actor.system.abilities.dex.bonus).is.not.undefined;
		});
		it("has abilities.con", () => {
			expect(actor.system.abilities.con).is.not.undefined;
		});
		it("has abilities.con.base", () => {
			expect(actor.system.abilities.con.base).is.not.undefined;
		});
		it("has abilities.con.bonus", () => {
			expect(actor.system.abilities.con.bonus).is.not.undefined;
		});
		it("has abilities.int", () => {
			expect(actor.system.abilities.int).is.not.undefined;
		});
		it("has abilities.int.base", () => {
			expect(actor.system.abilities.int.base).is.not.undefined;
		});
		it("has abilities.int.bonus", () => {
			expect(actor.system.abilities.int.bonus).is.not.undefined;
		});
		it("has abilities.wis", () => {
			expect(actor.system.abilities.wis).is.not.undefined;
		});
		it("has abilities.wis.base", () => {
			expect(actor.system.abilities.wis.base).is.not.undefined;
		});
		it("has abilities.wis.bonus", () => {
			expect(actor.system.abilities.wis.bonus).is.not.undefined;
		});
		it("has abilities.cha", () => {
			expect(actor.system.abilities.cha).is.not.undefined;
		});
		it("has abilities.cha.base", () => {
			expect(actor.system.abilities.cha.base).is.not.undefined;
		});
		it("has abilities.cha.bonus", () => {
			expect(actor.system.abilities.cha.bonus).is.not.undefined;
		});
		it("has ancestry", () => {
			expect(actor.system.ancestry).is.not.undefined;
		});
		it("has background", () => {
			expect(actor.system.background).is.not.undefined;
		});
		it("has class", () => {
			expect(actor.system.class).is.not.undefined;
		});
		it("has coins", () => {
			expect(actor.system.coins).is.not.undefined;
		});
		it("has coins.gp", () => {
			expect(actor.system.coins.gp).is.not.undefined;
		});
		it("has coins.sp", () => {
			expect(actor.system.coins.sp).is.not.undefined;
		});
		it("has coins.cp", () => {
			expect(actor.system.coins.cp).is.not.undefined;
		});
		it("has deity", () => {
			expect(actor.system.deity).is.not.undefined;
		});
		it("has languages", () => {
			expect(actor.system.languages).is.not.undefined;
			expect(actor.system.languages.length).equal(0);
		});
		it("has level", () => {
			expect(actor.system.level).is.not.undefined;
		});
		it("has level.value", () => {
			expect(actor.system.level.value).is.not.undefined;
		});
		it("has level.xp", () => {
			expect(actor.system.level.xp).is.not.undefined;
		});
		it("has luck", () => {
			expect(actor.system.luck).is.not.undefined;
		});

		after(async () => {
			await actor.delete();
		});
	});

	describe("NPC actor has expected information", () => {
		let actor = {};

		before(async () => {
			actor = await createMockActor("NPC");
		});

		/* Shared Details */
		it("has attributes", () => {
			expect(actor.system.attributes).is.not.undefined;
		});
		it("has attributes.ac", () => {
			expect(actor.system.attributes.ac).is.not.undefined;
		});
		it("has attributes.ac.value", () => {
			expect(actor.system.attributes.ac.value).is.not.undefined;
		});
		it("has attributes.hp", () => {
			expect(actor.system.attributes.hp).is.not.undefined;
		});
		it("has attributes.hp.max", () => {
			expect(actor.system.attributes.hp.max).is.not.undefined;
		});
		it("has attributes.hp.value", () => {
			expect(actor.system.attributes.hp.value).is.not.undefined;
		});
		it("has alignment", () => {
			expect(actor.system.alignment).is.not.undefined;
		});
		it("has notes", () => {
			expect(actor.system.notes).is.not.undefined;
		});

		/**  NPC Specific  */
		it("has abilities", () => {
			expect(actor.system.abilities).is.not.undefined;
		});
		it("has abilities.str", () => {
			expect(actor.system.abilities.str).is.not.undefined;
		});
		it("has abilities.str.mod", () => {
			expect(actor.system.abilities.str.mod).is.not.undefined;
		});
		it("has abilities.dex", () => {
			expect(actor.system.abilities.dex).is.not.undefined;
		});
		it("has abilities.dex.mod", () => {
			expect(actor.system.abilities.dex.mod).is.not.undefined;
		});
		it("has abilities.con", () => {
			expect(actor.system.abilities.con).is.not.undefined;
		});
		it("has abilities.con.mod", () => {
			expect(actor.system.abilities.con.mod).is.not.undefined;
		});
		it("has abilities.int", () => {
			expect(actor.system.abilities.int).is.not.undefined;
		});
		it("has abilities.int.mod", () => {
			expect(actor.system.abilities.int.mod).is.not.undefined;
		});
		it("has abilities.wis", () => {
			expect(actor.system.abilities.wis).is.not.undefined;
		});
		it("has abilities.wis.mod", () => {
			expect(actor.system.abilities.wis.mod).is.not.undefined;
		});
		it("has abilities.cha", () => {
			expect(actor.system.abilities.cha).is.not.undefined;
		});
		it("has abilities.cha.mod", () => {
			expect(actor.system.abilities.cha.mod).is.not.undefined;
		});
		it("has attributes.hp.hd", () => {
			expect(actor.system.attributes.hp.hd).is.not.undefined;
		});
		it("has level", () => {
			expect(actor.system.level).is.not.undefined;
		});
		it("has move", () => {
			expect(actor.system.move).is.not.undefined;
		});
		// Expecting attacks to be items rather than system data
		// TODO: Write tests for attacks

		after(async () => {
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
						let actor = await game.actors.getName(`Test Actor ${key}`);
						const updateData = {};
						updateData[`system.abilities.${ability}.base`] = Number(value);
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
			expect(actor.numGearSlots()).equal(shadowdark.defaults.GEAR_SLOTS);
			await actor.delete();
		});

		it("returns default gearslots for Player actor with lower str", async () => {
			const actor = await createMockActor("Player");
			await actor.update({"system.abilities.str.base": 3});
			expect(actor.numGearSlots()).equal(shadowdark.defaults.GEAR_SLOTS);
			await actor.delete();
		});

		it("returns str gearslots when higher than default gearslots", async () => {
			const actor = await createMockActor("Player");
			await actor.update({
				"system.abilities.str.base": shadowdark.defaults.GEAR_SLOTS + 1,
			});
			expect(actor.numGearSlots()).equal(shadowdark.defaults.GEAR_SLOTS + 1);
			await actor.delete();
		});
	});

	describe("attackBonus(attackType)", () => {
		let actor = {};

		before(async () => {
			actor = await createMockActor("Player");
			await actor.update({
				"system.abilities.str.base": 18,
				"system.abilities.dex.base": 3,
			});
		});

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

	describe("getArmorClass()", () => {
		// Tested under updateArmorClass()
		it("returns the correct armor class", async () => {
			const actor = await createMockActor("Player");
			await actor.update({
				"system.abilities.dex.base": 1,
			});

			expect(await actor.getArmorClass()).equal(10 - 4);
		});
	});

	describe("rollAbility(abilityId, options={})", () => {});

	describe("_npcRollHP(options={})", () => {
		const originalSetting = game.settings.get("shadowdark", "rollNpcHpWhenAddedToScene");
		let actor = {};

		before(async () => {
			actor = await createMockActor("NPC");
		});

		after(async () => {
			game.settings.set("shadowdark", "rollNpcHpWhenAddedToScene", originalSetting);
			await trashChat();
		});

		describe("#568 Level 0 NPC HP Roll should be at least 1", async () => {
			Array.from(Array(5), (_, i) => (i - 4)).forEach(async mod => {
				it(`NPC with CON Mod ${mod} should have 1 HP`, async () => {
					await trashChat();
					await actor.update({
						"system.abilities.con.mod": mod,
						"system.level.value": 0,
					});
					// Roll HP
					await actor._npcRollHP();
					await waitForInput();

					// Check the formula
					expect(actor.system.attributes.hp.max).equal(1);
					expect(actor.system.attributes.hp.value).equal(1);

					// Remove chat card
					await trashChat();
				});
			});
		});

		it("#466 Autorolled NPC HP is applied to actor", async () => {
			await trashChat();
			// Set the settings
			await game.settings.set("shadowdark", "rollNpcHpWhenAddedToScene", true);

			// Trigger the hook as a token was dropped
			Hooks.call("createToken", {actor}, {}, {});
			await waitForInput();

			// Get the HP result
			expect(game.messages?.size).equal(1);
			const content = game.messages.contents[0].content;
			const newHP = Number($(content).find(".dice-total")[0].innerText);

			// Check the actor has updated HP
			expect(actor.system.attributes.hp.max).equal(newHP);
			expect(actor.system.attributes.hp.value).equal(newHP);
		});
	});

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
					"system.properties": ["Compendium.shadowdark.properties.Item.61gM0DuJQwLbIBwu"],
					"system.equipped": true,
				},
				{
					type: "Armor",
					name: "Test Shield 2",
					"system.properties": ["Compendium.shadowdark.properties.Item.61gM0DuJQwLbIBwu"],
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
				"system.abilities.dex.base": 18,
			});
		});

		it("calculates the correct AC with no armor equipped", async () => {
			await actor.updateArmorClass();
			await waitForInput();
			expect(await actor.getArmorClass()).equal(10 + 4);
		});
		it("calculates the correct AC with armor equipped", async () => {
			await actor.createEmbeddedDocuments("Item", [
				{
					type: "Armor",
					name: "Test Armor 1",
					"system.ac.base": 11,
					"system.ac.modifier": 2,
					"system.ac.attribute": "dex",
					"system.equipped": true,
				},
			]);
			await actor.updateArmorClass();
			await waitForInput();
			expect(await actor.getArmorClass()).equal(11 + 4 + 2);
		});

		it("calculates the correct AC with armor and shield equipped", async () => {
			await actor.createEmbeddedDocuments("Item", [
				{
					type: "Armor",
					name: "Test Shield 1",
					"system.properties": ["Compendium.shadowdark.properties.Item.61gM0DuJQwLbIBwu"],
					"system.ac.modifier": 3,
					"system.equipped": true,
				},
			]);
			await actor.updateArmorClass();
			await waitForInput();
			expect(await actor.getArmorClass()).equal(11 + 4 + 2 + 3);
		});

		after(async () => {
			await actor.delete();
		});
	});
};

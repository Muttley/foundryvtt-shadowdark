/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for interactivity with effect items
 */
import {
	createMockItemByKey,
	createMockActorByKey,
	cleanUpItemsByKey,
	cleanUpActorsByKey,
	waitForInput,
	delay,
	openDialogs,
	closeDialogs,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.e2e.documents.item.effect";
export const options = {
	displayName: "Shadowdark: E2E: Documents: Item, Effect",
	preSelected: true,
};

const predefinedEffects = await foundry.utils.fetchJsonWithTimeout(
	"systems/shadowdark/assets/mappings/map-predefined-effects.json"
);

const createMockItem = async type => createMockItemByKey(key, "Effect");
const createMockPlayer = async () => createMockActorByKey(key, "Player");

const cleanUpActorItems = async _a => {
	_a.items.forEach(async i => await i.delete());
	await waitForInput();
};

// Add the pre-defined effect
const createPrefabEffect = async (key, _pde) => {
	const _e = await createMockItem();
	return _e.sheet._createPredefinedEffect(key, _pde);
};

export default ({ describe, it, before, after, afterEach, expect }) => {
	let _p = {};

	after(() => {
		cleanUpItemsByKey(key);
		cleanUpActorsByKey(key);
	});

	before(async () => {
		_p = await createMockPlayer();
		await _p.updateArmorClass();

		await waitForInput();
	});

	describe("sanity checks", () => {
		it("Mock actor is defined", () => {
			expect(_p).is.not.undefined;
			expect(_p.system.bonuses.armorMastery.length).equal(0);
			expect(_p.system.bonuses.weaponMastery.length).equal(0);
			expect(_p.system.bonuses.advantage.length).equal(0);
			expect(_p.system.bonuses.lightSource).equal("");
		});

		it("Predefined effects could be read", () => {
			expect(predefinedEffects).is.not.undefined;
			expect(typeof predefinedEffects).equal("object");
			expect(Object.entries(predefinedEffects).length > 0).is.true;
		});
	});

	describe("Predefiend Effects requiring user input", () => {
		// Test case that is used for both Armor & Weapon Mastery
		// can also be used for spells!
		const masteryTest = async (mastery, choices, itemName, translatedName, bonus = mastery) => {
			const _pde = predefinedEffects[mastery];
			createPrefabEffect(mastery, _pde);
			await delay(300);

			// Expect a dialog
			const dialogs = openDialogs();
			expect(dialogs.length).equal(1);
			const dialog = dialogs[0];

			// Expect the item to exist in the curated list
			const dataLists = dialog.element.find("datalist");
			expect(dataLists.length).equal(1);
			const dataList = dataLists[0];
			const options = Array.from(dataList.options);
			expect(options.length).equal(choices.length);
			expect(options.map(o => o.value)).contains(translatedName);

			// Select item
			const inputFields = dialog.element.find("input");
			expect(inputFields.length).equal(1);
			const input = inputFields[0];
			input.value = translatedName;

			// Click Submit
			await $(".submit").click();
			await delay(300);
			const postClickDialogs = openDialogs();
			expect(postClickDialogs.length).equal(0);

			// Check that the effect is created
			const _a = await game.items.getName(`Test Item ${key}: Effect`);
			expect(_a).is.not.undefined;
			expect(_a.type).equal("Effect");

			// Put the effect on the actor
			const _pa = await _p.createEmbeddedDocuments("Item", [_a]);
			expect(_pa).is.not.undefined;
			expect(_p.system.bonuses[bonus]).contains(itemName);

			// Delete the effect
			await cleanUpActorItems(_p);

			// Expect the bonus.`mastery` to be empty
			expect(_p.system.bonuses[bonus].length).equal(0);
		};

		const damageDieTest = async (choices, itemName, translatedName) => {
			const _pde = predefinedEffects.weaponDamageDieD12;
			createPrefabEffect("weaponDamageDieD12", _pde);
			await delay(300);

			// Expect a dialog
			const dialogs = openDialogs();
			expect(dialogs.length).equal(1);
			const dialog = dialogs[0];

			// Expect the item to exist in the curated list
			const dataLists = dialog.element.find("datalist");
			expect(dataLists.length).equal(1);
			const dataList = dataLists[0];
			const options = Array.from(dataList.options);
			expect(options.length).equal(choices.length);
			expect(options.map(o => o.value)).contains(translatedName);

			// Select item
			const inputFields = dialog.element.find("input");
			expect(inputFields.length).equal(1);
			const input = inputFields[0];
			input.value = translatedName;

			// Click Submit
			await $(".submit").click();
			await delay(300);
			const postClickDialogs = openDialogs();
			expect(postClickDialogs.length).equal(0);

			// Check that the effect is created
			const _a = await game.items.getName(`Test Item ${key}: Effect`);
			expect(_a).is.not.undefined;
			expect(_a.type).equal("Effect");

			// Put the effect on the actor
			const _pa = await _p.createEmbeddedDocuments("Item", [_a]);
			expect(_pa).is.not.undefined;
			expect(_p.system.bonuses.weaponDamageDieD12).contains(itemName);

			// Delete the effect
			await cleanUpActorItems(_p);

			// Expect the bonus.`weaponDamageDieD12` to be empty
			expect(_p.system.bonuses.weaponDamageDieD12.length).equal(0);
		};

		describe("Weapon Damage Die D12", () => {
			/* eslint-disable quote-props */
			const baseWeapons = {
				"bastard-sword": "Bastard Sword",
				"club": "Club",
				"crossbow": "Crossbow",
				"dagger": "Dagger",
				"greataxe": "Greataxe",
				"greatsword": "Greatsword",
				"javelin": "Javelin",
				"longbow": "Longbow",
				"longsword": "Longsword",
				"mace": "Mace",
				"shortbow": "Shortbow",
				"shortsword": "Shortsword",
				"spear": "Spear",
				"staff": "Staff",
				"warhammer": "Warhammer",
			};
			/* eslint-enable quote-props */

			const weapons = Object.keys(baseWeapons);

			it("Sanity checks", () => {
				expect(weapons.length).not.equal(0);
			});

			beforeEach(async () => {
				await cleanUpItemsByKey(key);
				await closeDialogs();
			});

			after(async () => {
				await closeDialogs();
			});

			weapons.forEach(w => {
				it(`${w} weaponDamageDieD12`, async () => {
					await damageDieTest(
						weapons,
						w,
						baseWeapons[w]
					);
				});
			});
		});

		describe("Armor mastery", () => {
			/* eslint-disable quote-props */
			const baseArmor = {
				"chainmail": "Chainmail",
				"leather-armor": "Leather Armor",
				"plate-mail": "Plate Mail",
				"shield": "Shield",
			};
			/* eslint-enable quote-props */

			const armor = Object.keys(baseArmor);

			it("Sanity checks", () => {
				expect(armor.length).not.equal(0);
			});

			beforeEach(async () => {
				await cleanUpItemsByKey(key);
				await closeDialogs();
			});

			after(async () => {
				await closeDialogs();
			});

			armor.forEach(a => {
				it(`${a} armorMastery`, async () => {
					await masteryTest(
						"armorMastery",
						armor,
						a,
						baseArmor[a]
					);
				});
			});
		});

		describe("Weapon mastery", () => {
			/* eslint-disable quote-props */
			const baseWeapons = {
				"bastard-sword": "Bastard Sword",
				"club": "Club",
				"crossbow": "Crossbow",
				"dagger": "Dagger",
				"greataxe": "Greataxe",
				"greatsword": "Greatsword",
				"javelin": "Javelin",
				"longbow": "Longbow",
				"longsword": "Longsword",
				"mace": "Mace",
				"shortbow": "Shortbow",
				"shortsword": "Shortsword",
				"spear": "Spear",
				"staff": "Staff",
				"warhammer": "Warhammer",
			};
			/* eslint-enable quote-props */

			const weapons = Object.keys(baseWeapons);

			it("Sanity checks", () => {
				expect(weapons.length).not.equal(0);
			});

			beforeEach(async () => {
				await cleanUpItemsByKey(key);
				await closeDialogs();
			});

			after(async () => {
				await closeDialogs();
			});

			weapons.forEach(w => {
				it(`${w} weaponMastery`, async () => {
					await masteryTest(
						"weaponMastery",
						weapons,
						w,
						baseWeapons[w]
					);
				});
			});
		});

		describe("Advantage: Spell Casting with specific spells", () => {
			/* eslint-disable quote-props */
			const spellNames = {
				"acid-arrow": "Acid Arrow",
				"alarm": "Alarm",
				"alter-self": "Alter Self",
				"augury": "Augury",
				"bless": "Bless",
				"blind/deafen": "Blind/Deafen",
				"burning-hands": "Burning Hands",
				"charm-person": "Charm Person",
				"cleansing-weapon": "Cleansing Weapon",
				"cure-wounds": "Cure Wounds",
				"detect-magic": "Detect Magic",
				"detect-thoughts": "Detect Thoughts",
				"feather-fall": "Feather Fall",
				"fixed-object": "Fixed Object",
				"floating-disk": "Floating Disk",
				"hold-person": "Hold Person",
				"hold-portal": "Hold Portal",
				"holy-weapon": "Holy Weapon",
				"invisibility": "Invisibility",
				"knock": "Knock",
				"levitate": "Levitate",
				"light": "Light",
				"mage-armor": "Mage Armor",
				"magic-missile": "Magic Missile",
				"mirror-image": "Mirror Image",
				"misty-step": "Misty Step",
				"protection-from-evil": "Protection From Evil",
				"shield-of-faith": "Shield of Faith",
				"silence": "Silence",
				"sleep": "Sleep",
				"smite": "Smite",
				"turn-undead": "Turn Undead",
				"web": "Web",
				"zone-of-truth": "Zone of Truth",
			};
			/* eslint-enable quote-props */

			const spells = Object.keys(spellNames);

			it("Sanity checks", () => {
				expect(spells.length).not.equal(0);
			});

			beforeEach(async () => {
				await cleanUpItemsByKey(key);
				await closeDialogs();
			});

			after(async () => {
				await closeDialogs();
			});

			spells.forEach(s => {
				it(`${s} spellAdvantage`, async () => {
					await masteryTest(
						"spellAdvantage",
						spells,
						s,
						spellNames[s],
						"advantage"
					);
				});
			});
		});

		describe("Light Source", () => {});
	});
};

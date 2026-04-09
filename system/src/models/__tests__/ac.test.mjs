import "./setup.mjs";
import { makeActor, loadItem, loadEffect } from "./helpers.mjs";
import { describe, it, expect } from "vitest";

// Import the actual methods from the real source
import PlayerSD from "../PlayerSD.mjs";
import { ActorBaseSD } from "../_ActorBaseSD.mjs";

const calcAC = PlayerSD.prototype._calcArmorClass;
const getAEKeys = ActorBaseSD.prototype._getActiveEffectKeys;

function actorAC(actor) {
	// Bind both methods so _calcArmorClass can call this._getActiveEffectKeys
	actor._getActiveEffectKeys = getAEKeys.bind(actor);
	return calcAC.call(actor);
}

// -- Fixtures from compendium packs --

const leatherArmor = loadItem("gear.db", "leather_armor__EoTEHXApVDS7rHfw.json", { equipped: true });
const plateMail = loadItem("gear.db", "plate_mail__o0261gnDqGC5hQB1.json", { equipped: true });
const plateMailUnequipped = loadItem("gear.db", "plate_mail__o0261gnDqGC5hQB1.json", { equipped: false });
const shield = loadItem("gear.db", "shield__UWp4WkkiaBMSXYPE.json", { equipped: true });
const ophidianArmor = loadItem("magic-items.db", "ophidian_armor__MyHXrPewu36OmWB6.json", { equipped: true });
const mageArmor = loadEffect("spell-effects.db", "mage_armor__441BBv90QacBfojj.json");
const mageArmorCrit = loadEffect("spell-effects.db", "mage_armor__gyGa1ckOLwWnF86M.json");
const shieldOfFaith = loadEffect("spell-effects.db", "ac_bonus__GKcLELNdIj1o3OX3.json");

// -- Tests --

describe("AC calculation — unarmored", () => {
	it("base AC is 10 with no modifiers", () => {
		const actor = makeActor({ abilities: { dex: 10 } });
		const result = actorAC(actor);
		expect(result.value).toBe(10);
	});

	it("adds DEX modifier to base AC", () => {
		const actor = makeActor({ abilities: { dex: 16 } }); // +3 mod
		const result = actorAC(actor);
		expect(result.value).toBe(13);
	});

	it("shield adds modifier to unarmored AC", () => {
		// Unarmored (10 + DEX 14 +2 = 12) + Shield (+2) = 14
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [shield],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(14);
	});

	it("subtracts negative DEX modifier", () => {
		const actor = makeActor({ abilities: { dex: 8 } }); // -1 mod
		const result = actorAC(actor);
		expect(result.value).toBe(9);
	});
});

describe("AC calculation — with armor", () => {
	it("leather armor uses DEX modifier", () => {
		// Leather: base 11 + DEX 14 (+2) = 13
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [leatherArmor],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(13);
	});

	it("plate mail ignores DEX", () => {
		// Plate: base 15, no attribute. AC = 15 regardless of DEX
		const actor = makeActor({
			abilities: { dex: 16 },
			items: [plateMail],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(15);
	});

	it("shield adds modifier on top of base armor", () => {
		// Leather (11 + DEX +2 = 13) + Shield (+2) = 15
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [leatherArmor, shield],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(15);
	});

	it("picks the best armor when multiple are equipped", () => {
		// Leather (13) vs Plate (15). Plate wins. AC = 15
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [leatherArmor, plateMail],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(15);
	});

	it("picks armor with bonus over higher base armor", () => {
		// Leather (11 + DEX 14 +2 = 13) + Armor Mastery x3 = 16
		// Plate (15) with no bonuses
		// Leather + bonus should win
		const leatherBonus = {
			isSituational: false,
			parent: { name: "Armor Mastery (Leather)", uuid: "armor-mastery-leather" },
			changes: [{
				key: "system.attributes.ac.leather-armor",
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: "3",
				priority: null,
			}],
		};
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [leatherArmor, plateMail],
			effects: [leatherBonus],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(16);
	});

	it("+1 magical armor includes modifier in its AC", () => {
		// Ophidian Armor: base 11 + DEX 14 (+2) + modifier 1 = 14
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [ophidianArmor],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(14);
	});

	it("+1 magical armor modifier does not apply when another armor wins", () => {
		// Plate (15) beats Ophidian (11 + DEX +2 + 1 = 14)
		// Ophidian's +1 modifier should NOT add to plate's AC
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [ophidianArmor, plateMail],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(15); // not 16
	});

	it("unequipped armor is ignored", () => {
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [plateMailUnequipped],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(12); // unarmored: 10 + 2 DEX
	});
});

describe("AC calculation — spells", () => {
	it("Mage Armor sets AC to 14 on an unarmored character", () => {
		const actor = makeActor({
			abilities: { dex: 14 },
			effects: [mageArmor],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(14);
	});

	it("Mage Armor (critical) sets AC to 18 on an unarmored character", () => {
		const actor = makeActor({
			abilities: { dex: 14 },
			effects: [mageArmorCrit],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(18);
	});

	it("Mage Armor sets AC to 14 even when wearing armor", () => {
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [plateMail],
			effects: [mageArmor],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(14);
	});

	it("Shield of Faith adds +2 AC to an unarmored character", () => {
		// Unarmored: 10 + DEX 14 (+2) = 12, then +2 = 14
		const actor = makeActor({
			abilities: { dex: 14 },
			effects: [shieldOfFaith],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(14);
	});

	it("Shield of Faith adds +2 AC on top of armor", () => {
		// Plate 15 + Shield of Faith +2 = 17
		const actor = makeActor({
			abilities: { dex: 14 },
			items: [plateMail],
			effects: [shieldOfFaith],
		});
		const result = actorAC(actor);
		expect(result.value).toBe(17);
	});
});

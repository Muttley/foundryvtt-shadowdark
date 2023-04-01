const json = {
	name: "Treeplin",
	stats: {
		STR: 14,
		DEX: 10,
		CON: 10,
		INT: 12,
		WIS: 8,
		CHA: 9,
	},
	ancestry: "Human",
	class: "Wizard",
	level: 1,
	title: "Shaman",
	alignment: "Neutral",
	background: "Ranger",
	deity: "The Lost",
	maxHitPoints: 2,
	armorClass: 10,
	gearSlotsTotal: 14,
	gearSlotsUsed: 7,
	bonuses: [
		{
			sourceType: "Class",
			sourceName: "Wizard",
			sourceCategory: "Ability",
			gainedAtLevel: 1,
			name: "Spell: Wizard, Tier 1, Spell 2",
			bonusTo: "Tier:1, Spell:2",
			bonusName: "Alarm",
		},
		{
			sourceType: "Class",
			sourceName: "Wizard",
			sourceCategory: "Talent",
			gainedAtLevel: 1,
			name: "AdvOnCastOneSpell",
			bonusTo: "AdvOnCastOneSpell",
			bonusName: "Alarm",
		},
		{
			sourceType: "Class",
			sourceName: "Wizard",
			sourceCategory: "Ability",
			gainedAtLevel: 1,
			name: "ExtraLanguage: Wizard 1",
			bonusTo: "Languages",
			bonusName: "Dwarvish",
		},
		{
			sourceType: "Class",
			sourceName: "Wizard",
			sourceCategory: "Ability",
			gainedAtLevel: 1,
			name: "ExtraLanguage: Wizard 2",
			bonusTo: "Languages",
			bonusName: "Elvish",
		},
		{
			sourceType: "Class",
			sourceName: "Wizard",
			sourceCategory: "Ability",
			gainedAtLevel: 1,
			name: "ExtraLanguage: Wizard 3",
			bonusTo: "Languages",
			bonusName: "Celestial",
		},
		{
			sourceType: "Class",
			sourceName: "Wizard",
			sourceCategory: "Ability",
			gainedAtLevel: 1,
			name: "ExtraLanguage: Wizard 4",
			bonusTo: "Languages",
			bonusName: "Diabolic",
		},
		{
			sourceType: "Class",
			sourceName: "Wizard",
			sourceCategory: "Ability",
			gainedAtLevel: 1,
			name: "Spell: Wizard, Tier 1, Spell 1",
			bonusTo: "Tier:1, Spell:1",
			bonusName: "Burning Hands",
		},
		{
			sourceType: "Class",
			sourceName: "Wizard",
			sourceCategory: "Ability",
			gainedAtLevel: 1,
			name: "Spell: Wizard, Tier 1, Spell 3",
			bonusTo: "Tier:1, Spell:3",
			bonusName: "Floating Disk",
		},
		{
			sourceType: "Ancestry",
			sourceName: "Human Ambition",
			sourceCategory: "Talent",
			gainedAtLevel: 1,
			name: "AdvOnCastOneSpell",
			bonusTo: "AdvOnCastOneSpell",
			bonusName: "Burning Hands",
		},
		{
			sourceType: "Ancestry",
			sourceName: "Human",
			sourceCategory: "Ability",
			gainedAtLevel: 1,
			name: "ExtraLanguage: Human undefined",
			bonusTo: "Languages",
			bonusName: "Reptilian",
		},
	],
	goldRolled: 45,
	gold: 38,
	silver: 0,
	copper: 0,
	gear: [
		{
			instanceId: "lfwl9ekm",
			gearId: "s2",
			name: "Backpack",
			type: "sundry",
			quantity: 1,
			totalUnits: 1,
			slots: 0,
			cost: 2,
			currency: "gp",
		},
		{
			instanceId: "lfwl9ekn",
			gearId: "s8",
			name: "Flint and steel",
			type: "sundry",
			quantity: 1,
			totalUnits: 1,
			slots: 1,
			cost: 5,
			currency: "sp",
		},
		{
			instanceId: "lfwl9eko",
			gearId: "s17",
			name: "Torch",
			type: "sundry",
			quantity: 2,
			totalUnits: 2,
			slots: 2,
			cost: 10,
			currency: "sp",
		},
		{
			instanceId: "lfwl9ekq",
			gearId: "s15",
			name: "Rations",
			type: "sundry",
			quantity: 1,
			totalUnits: 3,
			slots: 1,
			cost: 5,
			currency: "sp",
		},
		{
			instanceId: "lfwl9ekr",
			gearId: "s10",
			name: "Iron spikes",
			type: "sundry",
			quantity: 1,
			totalUnits: 10,
			slots: 1,
			cost: 1,
			currency: "gp",
		},
		{
			instanceId: "lfwl9eks",
			gearId: "s9",
			name: "Grappling hook",
			type: "sundry",
			quantity: 1,
			totalUnits: 1,
			slots: 1,
			cost: 1,
			currency: "gp",
		},
		{
			instanceId: "lfwl9ekt",
			gearId: "s16",
			name: "Rope, 60'",
			type: "sundry",
			quantity: 1,
			totalUnits: 1,
			slots: 1,
			cost: 1,
			currency: "gp",
		},
	],
	spellsKnown: "Alarm, Burning Hands, Floating Disk",
	languages: "Celestial, Common, Diabolic, Dwarvish, Elvish, Reptilian",
};

function _getSpellCastingAbility(actorClass) {
	if (Object.keys(CONFIG.SHADOWDARK.SPELL_CASTER_CLASSES).includes(actorClass)) {
		return CONFIG.SHADOWDARK.SPELLCASTING_ABILITY[actorClass];
	}
	return "";
}

async function _spellCastingAdvantageTalent(spell) {
	const talent = await _findInCompendium("Spellcasting Advantage", "shadowdark.talents");
	const modifiedTalent = talent.toObject();
	modifiedTalent.effects[0].changes[0].value = spell.slugify();
	modifiedTalent.name += ` (${spell})`;
	return modifiedTalent;
}

async function _findInCompendium(contentName, packName) {
	const pack = await game.packs.get(packName);
	const itemIndex = pack.index.find(
		i => i.name.toLowerCase() === contentName.toLowerCase()
	);
	if (itemIndex) {
		const item = await pack.getDocument(itemIndex._id);
		return item;
	}
	return false;
}

async function importActor(json) {
	const importedActor = {
		name: json.name,
		type: "Player",
		system: {
			abilities: {
				str: { value: json.stats.STR },
				dex: { value: json.stats.DEX },
				con: { value: json.stats.CON },
				int: { value: json.stats.INT },
				wis: { value: json.stats.WIS },
				cha: { value: json.stats.CHA },
			},
			alignment: json.alignment.toLowerCase(),
			ancestry: json.ancestry,
			attributes: {
				hp: {
					value: json.maxHitPoints,
					max: json.maxHitPoints,
					base: (json.ancestry === "Dwarf") ? json.maxHitPoints - 2 : json.maxHitPoints,
				},
			},
			background: json.background,
			class: json.class.toLowerCase(),
			coins: {
				gp: json.gold,
				sp: json.silver,
				cp: json.copper,
			},
			deity: json.deity,
			languages: json.languages.toLowerCase().split(", "),
			level: {
				value: json.level,
				xp: 0,
			},
			slots: json.gearSlotsTotal,
			title: json.title,
			spellcastingAbility: _getSpellCastingAbility(json.class.toLowerCase()),
		},
	};

	const spells = [];
	const talents = [];
	const statBonus = {
		"STR:+2": "+2 to Strength",
		"DEX:+2": "+2 to Dexterity",
		"CON:+2": "+2 to Constitution",
		"INT:+2": "+2 to Intelligence",
		"WIS:+2": "+2 to Wisdom",
		"CHA:+2": "+2 to Charisma",
	};
	json.bonuses.forEach(async bonus => {
		if (bonus.name.includes("Spell:") || bonus.name === "LearnExtraSpell") {
			const spell = await _findInCompendium(bonus.bonusName, "shadowdark.spells");
			spells.push(spell);
		}
		if (bonus.sourceCategory === "Talent") {
			if (bonus.name === "StatBonus") {
				talents.push(
					await _findInCompendium(statBonus[bonus.bonusTo], "shadowdark.talents")
				);
			}
			// Fighter
			if (bonus.name === "WeaponMastery") {
				talents.push(
					await _findInCompendium(`Weapon Master (${bonus.bonusTo})`, "shadowdark.talents")
				);
			}
			if (bonus.name === "Grit") {
				talents.push(
					await _findInCompendium(`Grit (${bonus.bonusName})`, "shadowdark.talents")
				);
			}
			if (bonus.name === "ArmorMastery") {
				talents.push(
					await _findInCompendium("Armor Mastery", "shadowdark.talents")
				);
			}
			// Thief
			if (bonus.name === "BackstabIncrease") {
				talents.push(
					await _findInCompendium("Backstab +1 Damage Dice", "shadowdark.talents")
				);
			}
			if (bonus.name === "AdvOnInitiative") {
				talents.push(
					await _findInCompendium("Initiative Advantage", "shadowdark.talents")
				);
			}
			// Priest
			if (bonus.name === "Plus1ToHit") {
				talents.push(
					await _findInCompendium(bonus.bonusTo, "shadowdark.talents")
				);
			}
			// Wizard
			if (bonus.bonusName === "Plus1ToCastingSpells") {
				talents.push(
					await _findInCompendium("+1 on Spellcasting Checks", "shadowdark.talents")
				); // Also Priest
			}
			if (bonus.name === "LearnExtraSpell") {
				talents.push(
					await _findInCompendium("Learn Spell", "shadowdark.talents")
				);
			}
			if (bonus.name === "AdvOnCastOneSpell") {
				talents.push(
					await _spellCastingAdvantageTalent(bonus.bonusName)
				);
			}
		}
	});

	// Class talents
	if (json.class === "Thief") {
		talents.push(
			await _findInCompendium("Backstab", "shadowdark.talents")
		);
		talents.push(
			await _findInCompendium("Thievery", "shadowdark.talents")
		);
	}
	if (json.class === "Fighter") {
		talents.push(
			await _findInCompendium("Hauler", "shadowdark.talents")
		);
	}
	if (json.class === "Wizard") {
		talents.push(
			await _findInCompendium("Magic Missile Advantage", "shadowdark.talents")
		);
	}
	if (json.priest === "Priest") {
		talents.push(
			await _findInCompendium("Turn Undead", "shadowdark.talents")
		);
		spells.push(
			await _findInCompendium("Turn Undead", "shadowdark.spells")
		);
	}

	// Ancestry talents
	if (json.ancestry === "Elf") {
		const farSight = json.bonuses.find(o => o.name === "FarSight");
		const bonus = (farSight.bonusTo === "RangedWeapon") ? "Farsight (Ranged)" : "Farsight (Spell)";
		talents.push(
			await _findInCompendium(bonus, "shadowdark.talents")
		);
	}
	if (json.ancestry === "Orc") {
		talents.push(
			await _findInCompendium("Mighty", "shadowdark.talents")
		);
	}
	if (json.ancestry === "Halfling") {
		talents.push(
			await _findInCompendium("Stealthy", "shadowdark.talents")
		);
	}
	if (json.ancestry === "Dwarf") {
		talents.push(
			await _findInCompendium("Stout", "shadowdark.talents")
		);
	}
	if (json.ancestry === "Human") {
		talents.push(
			await _findInCompendium("Ambitious", "shadowdark.talents")
		);
	}
	if (json.ancestry === "Goblin") {
		talents.push(
			await _findInCompendium("Keen Senses", "shadowdark.talents")
		);
	}

	// Gear
	const items = [];
	const compendium = [
		"shadowdark.armor",
		"shadowdark.weapons",
		"shadowdark.basic-gear",
	];

	await json.gear.forEach(async item => {
		compendium.forEach(async comp => {
			const newItem = await _findInCompendium(item.name, comp);
			if (newItem) items.push(newItem);
		});
	});

	// Create the actor
	const newActor = await Actor.create(importedActor);
	await newActor.createEmbeddedDocuments("Item", [...spells, ...items, ...talents]);
	await newActor.update({
		"system.spellcastingAbility": newActor.getSpellcastingAbility(),
	});
	return newActor;
}

console.log(await importActor(json));

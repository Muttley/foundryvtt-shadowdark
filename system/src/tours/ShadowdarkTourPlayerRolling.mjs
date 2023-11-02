/**
 * @file defines the system user guide tour
 */
import ShadowdarkTour from "./ShadowdarkTour.mjs";
import { closeDialogs, delay, waitForInput } from "../testing/testUtils.mjs";

export class ShadowdarkPlayerRollingTour extends ShadowdarkTour {
	constructor() {
		super({
			title: "Players: Rolling dice from the character sheet",
			description:
        "Learn how rolling attacks, spells, etc. for a player works in Shadowdark RPG.",
			canBeResumed: false,
			display: true,
			steps: [
				{
					id: "sd-playerroll-start",
					selector: ".shadowdark.player",
					title: "Player Character Sheet: Rolling Dice",
					content: "<p>Welcome to the <b>Player Character Sheet</b>.</p>\n<p>Here you will be able to find and modify your character, including adding spells and items, and especially; rolling dice.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-abilities",
					selector: ".ability[data-ability=str]",
					title: "Ability Scores",
					content: "<p>Clicking on an <b>ability score</b> will prompt you with a roll dialog for rolling the associated ability check.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-abilities-click",
					selector: ".ability[data-ability=str] .rollable",
					title: "Ability Scores: Rolling",
					content: "<p>Lets roll a <b>strength ability score</b>.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-ability-roll-ability-window",
					selector: ".dialog",
					title: "Ability Check Roll",
					content: "<p>This dialog asks for your input and before it rolls the dice..</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-ability-roll-ability-bonus",
					selector: ".shadowdark-dialog input[name=ability-bonus]",
					title: "Ability Check: Ability Bonus",
					content: "<p>This field contains your <b>ability modifier</b> and will be added to the roll.</p>\n<p>The field is already filled out, but you could change it before the roll executes.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-ability-roll-mode",
					selector: ".shadowdark-dialog select[name=rollMode]",
					title: "Ability Check: Roll Mode",
					content: "<p>This field allows you to select how the roll will be displayed in the chat.</p>\n<p><em>Public Roll</em> shows the result to everyone.</p>\n<p><em>Private GM Roll</em> send the roll to the GM, but you can also see the result.</p>\n<p><em>Blind GM Roll</em> sends the roll to the GM and hides it from you.</p>\n<p><em>Self Roll</em> only shows the roll to yourself, not even the GM can see it.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-ability-roll-mode-advantage",
					selector: "button.advantage",
					title: "Ability Check: Advantage",
					content: "<p>This button rolls with advantage (roll two D20 and keep the highest).</p>\n<p>This will light up green if you have a talent that gives you advantage.</p>\n<p>The roll will <b><em>not</em></b> be automatically rolled with advantage however, as this is left to the conversation between player and GM</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-ability-roll-mode-normal",
					selector: "button.normal",
					title: "Ability Check: Normal",
					content: "<p>This button rolls normally.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-ability-roll-mode-disadvantage",
					selector: "button.disadvantage",
					title: "Ability Check: Disadvantage",
					content: "<p>This button rolls with disadvantage (roll two D20 and keep the lowest).</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-ability-roll-message",
					selector: ".message:last-child",
					title: "Rolling to chat",
					content: "<p>Clicking on one of the buttons in the previous dialog will roll to chat.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-hp",
					selector: "label.hp",
					title: "Rolling HD",
					content: "<p>Clicking on an <b>HP</b> label will roll your hit dice.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-hp-dialog",
					selector: ".dialog",
					title: "Rolling HD Dialog",
					content: "<p>This is the dialog for rolling HP / HD.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-hp-normal",
					selector: "button.normal",
					title: "Rolling HD: Normal",
					content: "<p>Let's roll a normal roll this time.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-hp-roll-message",
					selector: ".message:last-child",
					title: "HP Chat Card",
					content: "<p>The HP card is slightly different, as it has a button.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-hp-roll-message-button",
					selector: ".message:last-child button[data-action='apply-hp-to-max']",
					title: "HP Chat Card: Button",
					content: "<p>The HP card has a button that allows you to add the roll result to your maximum HP if you want to.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-items-navigate",
					selector: "a.navigation-tab[data-tab='tab-inventory']",
					title: "Items",
					content: "<p>Lets look at how you roll items.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-items-list",
					selector: ".inventory-list",
					title: "List of Items",
					content: "<p>In this example, the Player has access to a Greataxe.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-items-rollable",
					selector: ".item-image[style='background-image: url(icons/weapons/axes/axe-broad-engraved-chipped-blue.webp)']",
					title: "Rolling Weapon",
					content: "<p>Clicking the icon will create a chat message with information about the item.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-items-chatcard",
					selector: ".message:last-child button[data-action=roll-attack]",
					title: "Roll weapon attack",
					content: "<p>Clicking on the button on the chat card will open the roll weapon dialog",
					action: "click",
				},
				{
					id: "sd-playerroll-items-dialog",
					selector: ".dialog",
					title: "Roll Weapon Dialog",
					content: "<p>The Roll Weapon dialog has more options than the previous ones.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-items-dialog-item-bonus",
					selector: "input[name='item-bonus']",
					title: "Item Bonus",
					content: "<p>If the item is magical, or of extraordinary quality, the bonus will be added here in this field.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-items-dialog-item-bonus",
					selector: "input[name='weapon-backstab']",
					title: "Backstab",
					content: "<p>If you are playing a Thief (like our example), you will have the option to backstab and adding the extra dice you get with that.</p>\n<p>If you have talents that add dice to these rolls, it adds them automatically</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-items-roll",
					selector: "button.advantage",
					title: "Roll",
					content: "<p>Let's roll with advantage</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-items-roll-message",
					selector: ".message:last-child",
					title: "Weapon attack roll",
					content: "<p>The weapon roll is displayed to chat.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-items-roll-message-damage",
					selector: ".message:last-child .card-damage-rolls",
					title: "Damage rolls",
					content: "<p>The weapon was a versatile weapon, and will immediately roll both damage dice simultaneously to speed up combat.</p>\n<p>As you can see, the additional dice are added as it was a backstab!</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-items-item",
					selector: "a.item-toggle-equipped",
					title: "Equipping the weapon",
					content: "<p>Clicking the gray shirt will equip the weapon (or armor).</p>\n<p>This generates attacks on the <b>Abilities</b> tab.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-items-abilities-navigate",
					selector: "a.navigation-tab[data-tab='tab-abilities']",
					title: "Items",
					content: "<p>Lets look at how you roll items.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-items-attack",
					selector: "li.attack-item",
					title: "Attack rolls",
					content: "<p>These attacks are automatically created when you equip a weapon</p>\n<p>Clicking on them will give you the roll dialog.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-items-attack-normal",
					selector: "button.normal",
					title: "Attack normally",
					content: "<p>Let's just roll normally this time.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-items-attack-roll-message",
					selector: ".message:last-child",
					title: "Weapon attack to chat",
					content: "<p>The weapon roll is once again displayed to chat.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-back-to-actor",
					selector: ".sheet.player",
					title: "Spells",
					content: "<p>Lets transform our hero into a Wizard and look at how you roll spells!</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-spells-navigate",
					selector: ".sheet.player a.navigation-tab[data-tab='tab-spells']",
					title: "Spells: Tab",
					content: "<p>Lets look at the spells tab.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-spells-spell-list",
					selector: ".spells-list",
					title: "Spells",
					content: "<p>In this example, the Player has access to Magic Missile.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-spells-spell-available",
					selector: "a.item-control.toggle-lost",
					title: "Spell Available?",
					content: "<p>This check-mark means the spell is available.</p>\n<p>A miscast will automatically lose the spell for the day, turning the check-mark to a cross</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-spells-spell-roll",
					selector: "a.item-control.cast-spell",
					title: "Cast Spell",
					content: "<p>Clicking the <b>wand</b> icon will give you a cast dialog and cast the spell.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-hp-dialog",
					selector: ".dialog",
					title: "Rolling Spell Dialog",
					content: "<p>This is the dialog for rolling a spell.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-spells-spell-roll-talent",
					selector: "input[name='talent-bonus']",
					title: "Talent Bonus",
					content: "<p>If you are lucky and get +1 to spell checks through talents, the bonuses will be added and displayed here.</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-spells-spell-roll-cast",
					selector: "button.disadvantage",
					title: "Cast Spell with Disadadvantage",
					content: "<p>Let's try a roll at disadvantage!</p>",
					action: "click",
				},
				{
					id: "sd-playerroll-spells-roll-message",
					selector: ".message:last-child",
					title: "Spell Chat Card",
					content: "<p>The Spell chat cards contains the information for the spell. In some cases it includes a clickable roll for damage rolls e.g.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-spells-roll-message-damage",
					selector: ".message:last-child .inline-roll",
					title: "Rollable button",
					content: "<p>For Magic Missile we get the chance to roll a 1d4 damage.</p>",
					action: "scrollTo",
				},

				{
					id: "sd-playerroll-spells-miscast",
					selector: ".player a.item-control.toggle-lost",
					title: "Lost Spell",
					content: "<p>If a spell is lost due to failed spell cast, clicking the cross will restore it.</p>",
					action: "scrollTo",
				},
				{
					id: "sd-playerroll-end-tour",
					selector: "#tours-management .window-title",
					title: "Thank you!",
					content:
            "<p><b>Thank you!</b> for following along, learning how to <b>roll from Player character sheet</b> for <b>Shadowdark RPG</b>.</p>\n<p>For more information, see the other available tours.</p>",
					action: "scrollTo",
				},
			],
		});
	}

	async _setSettings(settings) {
		for (const [key, value] of Object.entries(settings)) {
			await game.settings.set("shadowdark", key, value);
		}
	}

	/**
   * Override _preStep to wait for elements to exist in the DOM
   */
	async _preStep() {
		const MOCK_ACTOR_NAME = "Tour Player";

		if (this.currentStep.id === "sd-playerroll-start") {
			// Clean-up previous tours if we have restarted
			game.actors.filter(a => a.name === MOCK_ACTOR_NAME).forEach(a => a.delete());

			// Go to chat
			document.querySelector('a[data-tab="chat"]').click();

			// Setup an actor for the tour
			const tourActor = await Actor.create({
				name: MOCK_ACTOR_NAME,
				type: "Player",
				system: { class: "Compendium.shadowdark.classes.Item.C6wkCa2w5dlgSq7f" }, // thief class
				ownership: { default: 3 },
				img: "systems/shadowdark/assets/quickstart/pregens/Zaldini_the_Red_portrait.webp",
			});

			// Add items to character
			const items = [];
			const talentPack = game.packs.get("shadowdark.talents");
			const talentId = talentPack.index.find(i => i.name === "Backstab")._id;
			items.push(await talentPack.getDocument(talentId));

			const weaponsPack = game.packs.get("shadowdark.gear");
			const weaponId = weaponsPack.index.find(i => i.name === "Greataxe")._id;
			items.push(await weaponsPack.getDocument(weaponId));

			await tourActor.createEmbeddedDocuments("Item", items);

			// Delay so the UI has time to catch up
			await tourActor.sheet.render(true);
			await delay(200);
		}

		if (this.currentStep.id === "sd-playerroll-back-to-actor") {
			let tourActor = await game.actors.find(actor => actor.name === MOCK_ACTOR_NAME);

			tourActor = await tourActor.update({
				"system.class": "Compendium.shadowdark.classes.Item.035nuVkU9q2wtMPs", // wizard class
				"system.spellcastingAbility": "int",
			});

			const items = [];
			const spellsPack = game.packs.get("shadowdark.spells");
			const spellId = spellsPack.index.find(i => i.name === "Magic Missile")._id;
			items.push(await spellsPack.getDocument(spellId));

			await tourActor.createEmbeddedDocuments("Item", items);
		}

		if (this.currentStep.selector.includes(".message")) {
			await waitForInput();
		}

		if (this.currentStep === "sd-playerroll-hp") {
			await closeDialogs();
		}

		if (this.currentStep.id === "sd-playerroll-end-tour") {
			Object.values(ui.windows).forEach(async w => {
				await w.close();
				await delay(300);
			});
			await $("#settings button[data-action=tours]").click();
			await delay(200);
			await document.querySelector("a.category-tab[data-tab=system]").click();
			game.actors.filter(a => a.name === MOCK_ACTOR_NAME).forEach(a => a.delete());
		}

		await super._preStep();
	}
}

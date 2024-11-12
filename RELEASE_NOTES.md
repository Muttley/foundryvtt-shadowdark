# vX.X.X

## Enhancements
* [#657] Consume Ammunition When Attacking With Ranged Weapons if Required
* [#847] Add support for Warlock class Boon which gives the ability to learn a Wizard spell
* [#879] Add new Patron item class
* [#880] Create a new Patron Boon type for Talents
* [#881] Support rolling on a character's Patron's Boon table if necessary in the Level Up app
* [#901] Added Russian as a partially complete system language.
* [#908] Add rollable dice to Cure Wounds spell that includes the necessary calculations *(Many thanks to **nschoenwald** for contributing to this issue)*
* [#920] Show tooltips on weapon and armor properties when showing expanded inline view in inventory
* [#937] Support selecting or rolling Patron in character generator
* [#939] Add macro for launching the character generator

## Bugfixes
* [#894] Unnecessary "items not found" warning for "+2 Stats Points" from ShadowDarklings
* [#896] Add additional padding to blockquote style so text doesn't blend into decorations
* [#902] Can't paste Shadowdarklings JSON if previously copied text object
* [#903] Importing Wizards from Shadowdarklings returns "Plus2INTOrPlus1Casting" errors
* [#906] There's always an extra space between special attack name and effect
* [#918] Actor and Item type names missing from i18n data
* [#919] Class item template has incorrect default spellcasting class value
* [#930] Class Abilities can't be used if they have no associated skill roll
* [#936] Character Generator: Don't display empty alignment for Deities that don't have one
* [#938] Unecessary line breaks in Farsight talent descriptions

## Chores
* [#911] Replaced compendium art mapping with default Foundry method. *(Settings for compendium art mapping are now found in *Settings > Core > Compendium Art*)*
* [#917] Restructure Item sheet templates to make them a bit more manageable
* [#924] Perform an audit of existing templates to ensure we don't have any raw strings that should be i18n-ified
* [#927] Migration runner accessing globalThis.duplicate which must now be accessed via foundry.utils.duplicate
* [#928] Migrate "Deities" to new "Patrons and Deities" compendium
* [#929] Merged Russian language updates from Crowdin

*Many thanks to **AdamsGH** for contributing **Russian** translation data.*


---

# v3.1.3

## Enhancements
* [#895] Added "Portuguese, Brazilian" as a fully translated system language.

*Many thanks to **Felipe Pereira Pinto (Salazar)** for contributing **Portuguese, Brazilian** translation data.*

---

# v3.1.2

## Bugfixes
* [#888] Max and Current HP not set correctly during character creation

## Chores
* [#891] Merged Finnish language updates from Crowdin

---

# v3.1.1

## Bugfixes
* [#885] Character Spell Book showing duplicate spells and spells from incorrect classes in Level Up app

## Chores
* [#886] Merged i18n updates for all languages from Crowdin

---

# v3.1.0

## Enhancements
* [#693] Changes made to active effects on actors will now take effect immediately
* [#849] The UI and functionality of the Shadowdarklings importer has been improved
* [#853] CSS Styling for Journals
* [#854] Added SoloDark journals, roll tables and a new oracle app
* [#856] Beauty pass over Quickstart journals
* [#874] Added class descriptions to the character generator and class sheet remain open during level up

## Bugfixes
* [#852] Fixed a bug where ranged attacks were not showing correct damage
* [#855] Corrected minor UI bugs
* [#858] Character Generator now properly displaying text in Foundry v12
* [#868] Thrown property text updated to match latest rules.
* [#869] Monster Importer not working in v12
* [#870] Fixed a bug related to picking up dropped light sources
* [#875] Fixes to links in Quickstart Adventure and make use of new Journal styling

## Chores
* [#332] Implemented v11 method of working with Active Effects
* [#866] Updated README and Welcome message documentation.

	- Welcome message now includes a link to the video tutorial: https://youtu.be/hoBxiK71DBQ

* [#872] Updated Bard abilities to the definitions in the Bard and Ranger v1.3 PDF

* Many thanks to *Kelsey* at *The Arcane Library* for allowing us to include SoloDark in the core FoundryVTT System.
* Thanks to *Cussa* for contributing fixes in this build.

**NOTE:** This release marks the end of support for FoundryVTT v11 and requires FoundryVTT v12

---

# v3.0.0

## Enhancements
* [#438] Inventory header disappearing on large inventory
* [#740] Holding shift now rolls some rolls without a prompt
* [#769] UI has been updated

	- User interface has been redesigned with a new look and feel
	- Character inventory now supports drag and drop reordering of items
	- Holding shift while clicking on a rollable link will bypass the roll prompt, rolling with normal values

* [#798] Allow for tokens and combat tracker to display dynamic AC

	- `system.attributes.ac.value` now always holds the current AC

* [#820] All ability scores now store a total value of base stats + modifiers. e.g. `system.abilities.str.total`
* [#833] Implemented rolls for NPC special attacks

## Bugfixes
* [#757] Special Attack Life Drain doesn't roll for attack
* [#809] Add new `grid.distance` and `grid.units` values to `system.json` *(Foundry V12 compatibility)*
* [#811] `description` typo in `system.json`
* [#814] The roll initiative button on the player sheet will no longer double roll when re-rolling initiative
* [#816] Updated Ranger Herbalism talent description to the latest version
* [#822] The spellbook now works for Knight of St. Ydris and other classes that use another class's spell list
* [#832] Melee weapons with the "Thrown" property now rolling correctly when used as a ranged attack
* [#835] Update Sleep spell description to the latest version
* [#837] AC not displaying consistently when adding effects
* [#839] Free Carry item calculation wrong if you have duplicate items instead of just using item quantity
* [#841] Compendium item links no longer working in Foundry v12

## Chores
* [#813] Merged Finnish language updates from Crowdin
* [#829] Remove all Tours

	- **NOTE:** We have found that the Tours are very fragile and onerous to maintain; needing to be tested/updated when even minor changes are made to the interface.  Therefore we are removing them and will rely on alternate methods of teaching the system going forward.

* [#840] Remove Roll Initiative button from character sheet

	- **NOTE:** As part of the redesign of the character sheets we have decided that this feature doesn't really fit the design, and as rolling initiative is easily done via the combat tracker is unnecessary.

* [#843] Remove quench tests

Many thanks to *andrewbeard* for contributing fixes in this build

---

# v2.2.2

## Bugfixes
* [#799] Character Generator incorrectly generating character stats
* [#802] Light sources counting down too quickly with multiple GMs logged in

## Chores
* [#797] Merged Finnish language updates from Crowdin

---

# v2.2.1

## Bugfixes
* [#793] Spell Book won't open on Foundry thick client: Object.groupBy is not a function

---

# v2.2.0

## Enhancements
* [#763] Make attributes.hp primaryTokenAttribute in system.json
* [#765] Implement generic loading dialog that can be used whenever potentially slow compendium searching occurs
* [#767] Load times when accessing certain items and menus significantly improved when hosting on Forge VTTs

## Bugfixes
* [#780] A level up screen being shown directly after creating level 0 characters.
* [#761] Advantage on Magic Missile talent missing from Wizard Class item
* [#768] Level 1 characters generating with 1 hp, despite HP roll
* [#776] NPC spell DC not calculating when converting from PC spell
* [#758] Unable to drag light spell items onto player sheets.

## Chores
* [#774] Merged Finnish language updates from Crowdin
* [#762] Ensure the Shadowdark system works without issues in Foundry V12 Development Releases
* [#784] The {{select}} handlebars helper is deprecated *(Foundry V12 compatibility)*
* [#785] The async option for Roll#evaluate has been removed *(Foundry V12 compatibility)*
* [#786] globalThis.mergeObject which must now be accessed via foundry.utils.mergeObject *(Foundry V12 compatibility)*
* [#787] Global AudioHelper instance is deprecated *(Foundry V12 compatibility)*
* [#788] CONST.CHAT_MESSAGE_TYPES is deprecated in favor of CONST.CHAT_MESSAGE_STYLES *(Foundry V12 compatibility)*
* [#789] ActiveEffect#icon has been migrated to ActiveEffect#img *(Foundry V12 compatibility)*

---

# v2.1.0

## Bugfixes
* [#751] Fixes an issue where players are unable to drag spells from the class spell list app.
* [#753] Added roll links to the spell text for Fireball, Lightning bolt, and Cloud Kill.

## Enhancements
* [#755] Add spell effects for higher-level spells to compendium

## Chores
* [#748] Merge i18n updates from Crowdin

Many thanks to *cmleinz* for contributing code included in this build

---

# v2.0.0

## Bugfixes
* [#715] Learned scrolls don't show usual spell icon

## Enhancements
* [#500] Support added for leveling up characters. A class spells list can be opened from the character sheet spell tab or leveling window.
* [#644] Improve chat card for Effects
* [#690] All monsters from the core rules are now available in the monsters compendium.
* [#694] Content from the Cursed Scroll Zines 1-3 is now available. This includes new Classes, Backgrounds, Deities, Telents, Weapons, Armor, and Spells.
* [#696] Core rules content was expanded to include Tier 3-5 Wizard and Priest spells. All content from the core rules is now labeld as "Core Rules" in the source selection settings.
* [#713] Added dice sounds to Character Builder
* [#718] Fixed an issue where the "common" language was not correctly loading in the Character Generator when selecting classes with fixed languages
* [#725] Update token mapping for new core monsters.
* [#728] Spell items can now be dragged onto NPC sheets to add that spell to the NPC's spell list.
* [#731] Added 1d2 as an option for weapon damage.
* [#733] Negative Dex modifier not correctly applied to characters with armor
* [#736] Added random names table for Kobold ancestry
* [#738] Ancestries can now be given a weight to effect roll chance in the Character Generator. Ancestries from the core rules have been updated to match the randomization table on page 40.

## Feature Notes
Character leveling now occurs via a structed leveling up systems that is triggered when xp gained meets or exceeds the next level requirement.
* All HP rolls, talent, and spell selections are now done in the leveling up window.
* Selecting class while leveling up from 0 to 1
* Class items now support adding a known spell table.
* An audit log of character leveling changes is accessible via script under the property actor.auditLog

---

# v1.8.0

## Bugfixes
* [#689] Can't return to the description page on a Background Item sheet
* [#703] Error in character creator when blank Ancestry choice selected
* [#702] Show warning in character creator when rolling a name with no Ancestry selected

## Enhancements
* [#437] Added Character Builder
* [#681] Added Item Importer Macro
* [#692] Added Spell Importer macro
* [#695] Add ability to have Effects on Boon items
* [#697] Updated the formating of monster descriptions created with the monster importer.
* [#704] Open character sheet after it has been created by the character creator
* [#705] Character creator should be usable by players without giving them full permission to create actors
* [#708] If user has ACTOR_CREATE permissions already, don't use socket to make GM create character

## Feature Notes
A new Character Generator is now available via the actors tab. The generator can be used to create new characters randomly or via selection. Features include:
* All character options respect the source filters in the Shadowdark RPG settings
* Character names are randomized via a linked roll table based on the selected ancesty
* level 1 characters still require manually rolling and adding first level talents and spells

Many thanks to *arcos* and *chrpow* for contributing code included in this build

---

# v1.7.6

## Bugfixes
* [#685] Calculated AC incorrect when only a shield is equipped

---

# v1.7.5

## Bugfixes
* [#658] Armor mastery not stacking
* [#662] Multiple Rolls per PC with Clockwise Initiative Enabled

	- Disallow initiative rolling and show a warning message saying that only GMs can roll initiative when clockwise initiative is enabled.

* [#670] Equipping Bracers of Defense unequips other armor

	- Removed the restriction on the number of pieces of armor that can be equipped and altered the Bracers of Defence item to only provide an AC bonus (not using effects so it will toggle off when unequipped).  If only armor pieces that don't provide a base AC level are equipped, then the baseline 10+DEX AC will be used, so unarmored characters could equip the bracers of defence for the bonus is desired.

---

# v1.7.4

## Bugfixes
* [#656] Typo in Player Quickstart Guide
* [#666] Fixed a bug in the monster importer where trailing spaces could cause parsing to fail
* [#668] Typo in Sleep spell description
* [#671] Rolled NPC HP formula incorrect
* [#672] Fixed the Bag of Holding magical item in the shadowdark compendium
* [#673] Fixed an issue with importing priests from shadowdarklings.net

---

# v1.7.3

## Bugfixes
* [#660] Fix broken Compendium links

## Chores
* [#661] Merged latest Korean and French translations from Crowdin

Many thanks to *pyrige* for contributing code included in this build

---

# v1.7.2

## Bugfixes

* [#650] New hotbar support breaks standard document drag to hotbar support

## Enhancements

* [#649] Apply compendium source filtering to selectors on Item sheets as well as player Sheets
* [#653] Allow spell items to be dragged from character sheet to hotbar

---

# v1.7.1

## Bugfixes

* [#640] Unable to override or add bonus to armor class via active effects
* [#642] "Round" duration configuration set to 6 minutes instead of 6 seconds
* [#645] Occassionally the Pre-defined effects don't seem to load/be available
* [#647] Spells tab doesn't get rendered for Wizard class the first time you open the character sheet

## Enhancements

* [#641] Add support for "Turn" durations in Spells/Effect (using 10 minutes as the duration)
* [#646] Make spellcasting base DC customisable on a class basis

---

# v1.7.0

## Bugfixes

* [#618] Fixed a bug in the Monster Importer where special attacks were importing without descriptions
* [#620] Show a notification error if no token selected when using hotbar items
* [#622] Fixed issue when importing monsters with static damage values via monster importer

## Enhancements

* [#590] Support optional "clockwise" initiative
* [#616] Improved detection of NPC spell range when importing via monster importer
* [#625] Added dice rolls syntax to monster ability descriptions when importing via monster importer
* [#631] Add ability to filter out item sources at the game settings level so they are not available for selection on character sheets
* [#634] Display system release notes the first time you open a world in a new version

## Chores

* Merged contributed new French, Spanish and Swedish translations from Crowdin

## Feature Notes

### Support for Module Defined Sources

Module creators can add their own custom source names which will become available in the system by creating a custom config section to the `flags` section of their `module.json` configuration file.  For example:

```json
"flags": {
	"shadowdark": {
		"sources": {
			"<source_uuid>": "<source_name>"
		}
	}
}
```

Where `<source_uuid>` is a unique identifier for your custom source, and `<source_name>` is the human readable/display name of your source.

## Acknowledgements

Many thanks to *chrpow* for contributing code included in this build.

---

# v1.6.2

## Bugfixes
* [#610] Thief backstab option now shows on the dialog box when using ranged weapons.

---

# v1.6.1

## Bugfixes
* [#601] Fixed a bug that resulted in NPC damage always rolling as a critical hit. Updated monster importer to correctly add NPC roll formula.

## Chores
* Merged contributed Swedish translations from Crowdin

# v.1.6.0

## Bugfixes
* [#573] Fixed an issue with item attack bonuses not being calculated if added manually via the roll dialog.
* [#580] Learning a spell from a scroll doesn't detect that the player cancelled the roll
* [#581] Spellcasting ability used for learning spells hardcoded, this should be dynamic to support custom/homebrew classes
* [#582] Grick token is named "Monster"
* [#583] Regex parser in MonsterImporterSD.mjs can't handle attacks that have '+' in the name
* [#597] Unable to drag Actor to hotbar and have it open character sheet

## Enhancements
* [#220] Added ability to drag attacks, spells, abilities, potions, and light sources to the Hotbar.
* [#184] Added special attack type to NPCs. The monster importer now adds special attacks.
* [#328] Added spellcasting abilities and spells to NPCs. The monster importer now adds spells.
* [#566] Warn players when they're attempting to learn a spell that is from a different class
* [#578] Standardize spellcasting iconography
* [#585] Add predefined Talent effect that allows the addition of an extra damage die to weapons with specified tags (`weaponDamageExtraDieByProperty`)
* [#586] Add predefined Talent effect that allows extra damage die for weapons with specified tags to be increased by category (`weaponDamageExtraDieImprovementByProperty`)
* [#587] Add predefined Talent effect that allows damage die for weapons with specified tags to be increased by category (`weaponDamageDieImprovementByProperty`)
* [#596] Switch NPC number of attacks to text in order to support roll macros within attack strings

## Chores
* Improvements to GitHub Workflows around building a release

*Please welcome Prototype to the Shadowdark system development team*

*Many thanks to chrpow for contributing code included in this build*

# v.1.5.1

## Bugfixes
* [#560] More fixes to Tours (Lightsource Tracking, The Lost Citadel and Importing Monsters) (Prototype)
* [#568] NPC HP calculation is using +1 min CON bonus instead of 1 being the minimum HP

## Enhancements
* [#565] Prepare actor data automatically rather than waiting for character sheet to open

# v.1.5.0

## Bugfixes
* [#556] Tours not working

## Enhancements
* [#557] Added tool to help with importing monsters which can be launched by a new macro (see Macro compedium and new tour)

*Many thanks to Prototype for contributing code included in this build*

# v.1.4.10

## Bugfixes
* [#548] Class armor selector showing non-base armor items in selector
* [#549] Newly created Scrolls and Wands won't open after initial creation

## Enhancements
* [#184] NPC Special attacks can now be posted to chat by clicking on them

*Many thanks to Prototype for contributing code included in this build*

# v.1.4.9

## Bugfixes
* [#537] Ranger with D12 damage talent always rolls two damage dice even if weapon does not have the Versatile property (cosmetic issue only)

## Enhancements
* [#343] Added World setting to enable Pulp Mode. This switches the luck tracker on the character sheet to numeric input rather than boolean toggle
* [#372] Add ability to indicate physical items are stashed and no longer taking up inventory slots
* [#543] Add macro to initialize player luck.  This gives player characters a normal luck token, and rolls a number of tokens for Pulp Mode

# v.1.4.8

## Bugfixes
* [#526] Quickstart macros using incorrect compendium paths
* [#535] Un-migrated weapon properties in compendiums causing problems opening character sheets when added to them
* [#540] Move quickstart adventure related macros into the adventure pack, as they don't work without that imported anyway

*Many thanks to Prototype for contributing fixes included in this build*

# v.1.4.7

## Bugfixes
* [#530] Token art mapping from Pathfinder Token Pack: Bestiaries module not working
* [#531] Missing attack bonuses on the following Talents
	- +1 to Melee Attacks and Damage
	- +1 to Ranged Attacks and Damage

## Enhancements
* [#527] New predefined effect that will add selected attribute bonuses to AC (if positive)
* [#528] Add built-in effect to support weapon damage dice improvent via matching weapon properties
* [#529] Add predefined affect that adds to AC if no armor is worn

# v.1.4.6

## Bugfixes
* [#485] Spell Advantage talent not functioning
* [#521] Unable to add Weapon and Armor Mastery talents to character sheet

## Enhancements
* [#520] Switch Class HP roll setting to be a free text field so custom dice roll formulas can be used
* [#522] Added "All Ranged Weapons" and "All Melee Weapons" checkbox to class equipment settings for more granular options

# v.1.4.5

## Bugfixes
* [#515] Backstab option not available on attack rolls
* [#516] Wand and Scroll item sheets not showing spell caster classes correctly

## Enhancements
* [#499] Add support for Boons and their various subtypes
* [#517] Add support for limited use Class Abilities, and Class Abilities with no associated rolls
* [#518] Weapon and Armor mastery using fixed base weapons rather than dynamically building a list from items available in compendiums

# v.1.4.4

## Bugfixes
* [#513] Compendium item selectors need unique IDs to ensure they show the correct selection

# v.1.4.3

**NOTE:** If you have compendiums in your worlds you will need to re-migrate a pre-1.4.0 backup of your world once this version is installed to ensure it is migrated correctly.

## Bugfixes
* [#508] Migrating compendiums for 1.3.7 to 1.4.0 fails

# v.1.4.2

** Purely a version bump **

# v.1.4.1

** Release withdrawn due to packaging errors **

# v.1.4.0

## Bugfixes
* [#431] Mage Armor Active Effect does not change AC
* [#476] Attack bonuses missing from monsters
* [#482] Can't create or import active effects when not in combat
* [#483] Secret text doesn't behave correctly
* [#486] Fixed typo in Magic Item Table 1, Result 20
* [#488] Fixes for locked doors and missing monsters in The Lost Citadel of the Scarlet Minotaur adventure
* [#493] Compendium item "Sword of the Ancients" missing base weapon type
* [#496] Mage Armor spell effect not being applied

## Enhancements
* [#71] Add the ability to extend various character options
* [#374] Added ability to create custom Classes
* [#375] Added support for custom ancestries
* [#376] Added support for rollable Class Abilities
* [#342] Identify "rare" languages in the language selector to aid in selection
* [#447] Added ability to easily access filtered compendium items
* [#444] Added Bard class
* [#449] Support Bard Bonuses exported by ShadowDarklings
* [#480] Added ability to create custom weapon and armor properties
* [#490] Added Condition for Halfling's "Stealthy" Invisibility ability
* [#491] Added support for custom languages
* [#494] Added support for custom background items
* [#495] Added support for Deity items
* [#497] Split character sheet notes out into their own tab
* [#498] Fix character sheet header and tab controls at top of character sheet window
* [#501] Update ShadowDarklings importer to use new character background items

# v.1.3.7

## Bugfixes
* [#472] Handle situations where Spellcasting Ability is not set better
* [#473] Incorrect damage rolls when only 2H damage set

## Enhancements
* [#460] Added additional Move options for NPCs (None, Far & Special)

## Bugfixes
* [#470] Chat message Success/Fail messages only render once

# v.1.3.6

## Bugfixes
* [#466] Autorolling NPC HP now correctly applies HP to NPC

# v.1.3.5

We welcome @gatesvp as a contributor to the system!

## Bugfixes
* [#452] Refers the issue tracker to the actual issue tracker instead of repo
* [#450] Rolling NPC HP now correctly adds CON mod bonus (minimum 1) to HP
* [#461] Allows players with edit permission to get context menu on items on a character to edit and delete
* [#462] Properly awaiting Active Effects to be created for V11 compatability

## Enhancements
* [#452] Added special attack to chat card when applicable
* [#277] Partial implementation provides quick way to apply damage and healing directly from the chat card
* [#311] Initiative field on PC sheets

# v.1.3.4

## Enhancements
* [#443] Kobold ancestry bonuses added, supports Shadowdarkling import

# v.1.3.3

## Bugfixes
* [#427] Tour for the lightsource tracker now works again
* [#432] Tour for the Dice rolling mechanics now works again

## Enhancements
* [#435] Korean & Finnish fully translated system

# v.1.3.2

## Bugfixes
* [#419] Shadowdarklings.net uses https instead of http
* [#420] NPC attacks now rolls with the damage bonus as well
* [#422] Characters with ability stat bonuses now import correctly
* [#428] Verified with Foundry v11

# v.1.3.1

## Bugfixes
* [#407] New languages are now activated and available in game
* [#411] Duration value not showing up on Potion, Scroll and Wand item sheet
* [#413] Effects durations are now updated when changing the duration values on the sheet, and temporary conditions are removed on expiry
* [#417] Now catches effects providing light source using either name or if any change is manipulating the light template field

## Errata
* [#412] Updated Ranger items to latest version
* [#415] Apply latest Shadowdark V2 errate where needed

---

# v1.3.0

## Bugfixes
* [#319] Right-Click context menu binding to tab links on character sheets
* [#321] We can now add AC Bonus effects to items
* [#325] Bonuses from Weapon Mastery now functions as intended
* [#336] Data migration always run for new worlds the first time they are opened
* [#341] Wizard Mishap Tier 1-2 table now rerolls itself twice on a 1
* [#350] Inline rolls of NPC Features now render properly
* [#322] Flask or Bottle had typo-cost in the Shadowdarkling tests
* [#358] Updated Sleep spell description according to errata
* [#394] Dragging a light from one character sheet to another should delete it from the original owner
* [#396] Dropped light sources retain their active status


## Enhancements
* [#23] In conjunction with [#329] add support for wand items with associated Spell data and ability to use from inventory/item chat cards
* [#192] Use world time for Light Tracker in order to facilitate the usage of Calendar/Time adjustment tools. Allows time stepping through the use of third-party world time manipulation modules like [Simple Calendar](https://foundryvtt.com/packages/foundryvtt-simple-calendar), etc.
* [#302] Improvements to Shadowdarklings importer, with in-game frame for ease of access
* [#306] Create compendiums from source data at build time
* [#309] More consistent behaviour when clicking item icons on character sheet. Now they post the item to chat, and the chat item has buttons to perform relevant actions
* [#310] Clicking on the names of inventory items, spells and talents on the Player character sheet now reveals information about that item along buttons to perform relevant actions
* [#329] Promote Spell Scrolls basic items to full blown Items in their own right, and provide ability to learn spells from scrolls.
* [#338] Complete overhaul of effects:
	- Introducing Effect items that comes in two flavors, "condition" and "effect"
	- Introduction of the Effect Panel that will show temporary effects (And passive if setting is checked)
	- Now uses datalists instead of popup windows for determining effect types, making them searchable
		- [#68] Selecting an effect type that requires input from the user will now ask for it (e.g. Weapon & Armor Mastery + Spell Advantage)
		- [#258] Adding a talent/effect that requires input will ask the user to choose when dragging onto the sheet
	- Time tracking including rounds tracking of temporary effects
	- Automatic cleanup of expired effects
	- [#272] Active Effects are ready for V11
	- [#317] Users on Foundry v10 will now be locked out from editing effects if owned by actor. For V11 this is allowed since the database allows such operations.
	- [#357] Added Light Source effects that are working like prior lightsources
	- [#385] Added Damage Multiplier effects for both actors (should be used as temporary effects only) and items (may be permanent)
* [#338] Added a Condition compendium with drag-n-droppable conditions. [#266]
* [#339] Adds "Unlimited" as a choice for Spell Ranges
* [#348] Adds missing config values for NPC Movement, Spell Ranges, and Spell Durations (#346, #347)
* [#353] Shadowdarkling now tests basic items to have the correct cost
* [#356] Added Korean as fully translated system language thanks to (Twitter: @momslastson)
* [#357] Added Light Source mappings for easy additions of new light source types
* [#364] Added Random Encounter: Reaction table, as well as a Macro to help draw from tables and summarize into a chat message
* [#365] Added macro script (not in-game macro) for creating a Carousing macro with in-game Carousing roll table
* [#373] Added Foundry VTT CLI to npm scripts to enable CI-compilations of compendium packs for both v11+ and earlier
* [#377] Add warning message to Light Tracker interface when there are users who have not selected a character
* [#381] Add ability to track/control Actor-based Active Effect light sources in the Light Tracker
* [#388] Adds a Light actor that is only used for dropping a light source on a scene, and allows it to be picked up again. The dropped lightsource will continue being tracked by the lightsource tracker
* [#392] Official GM screen artwork added as default World login background image (thanks to Kelsey for giving us permission to use this awesome artwork)
* [#393] Support for Ranger class, including importing from Shadowdarklings.net
* [#395] Allows the GM to pick up light sources for users if they are logged in and have an assigned character
* [#399] Show all Actors that have one or more Users with Owner permissions on the Light Tracker
	- Also adds a toggle to the Light Tracker to show/hide actors with no active light source

---

# v1.2.4

## Bugfixes
* [#313] Fixed a typo in the books where flasks & bottles cost 3 GP instead of SP

---

# v1.2.3

## Bugfixes
* [#292] Clicking a rollable item on the inventory screen triggers two dialog boxes
* [#294] Player rolls tour stalls due to us hiding the spell casting tab for non-casters
* [#296] Placing a Monster with Auto Roll NPC HP causes multiple HP rolls
* [#297] Quickstart pregens have all have zero current hit points

---

# v1.2.2

## Bugfixes
* [#288] Unable to make attack using Attack/Actions shortcuts

---

# v1.2.1

## Bugfixes
* [#283] Attribute labels missing from NPC sheet

---

# v1.2.0

## Bugfixes
* [#75] Implements Armor Mastery talents properly
* [#110] Ensure manual edits to attribute values after ActiveEffects have been applied to a character do not result in incorrect values
* [#244] "Track Inactive User Light Sources" option does not immediately update the Light Tracker interface
* [#249] Some default token sizes not correct in monster pack
* [#261] Create Item button tooltips not working on character and NPC sheets
* [#265] Always shows the properties field for magic items and talents
* [#267] Typo in lightsource tour step 21
* [#268] Removed `acBonus` talents. **BREAKING**: Users that already picked the Armor Bonus talent needs to re-pick it.
* [#269] Fix incorrect ability scores on a couple of pregens
* [#274] Changes to how we store Ability scores broke the character importer

## Enhancements
* [#147] Hide Spells tab on character sheet for classes that cannot cast.
* [#170] Dynamically use tokens from the PF2e Bestiary module if users have it installed/enabled (also provides support for additional token packs in the future).  Requires v1.0.5 or higher of the [Pathfinder Token Pack: Bestiaries](https://foundryvtt.com/packages/pf2e-tokens-bestiaries) module.
* [#187] Disable Fog Exploration on The Lost Citadel map
* [#197] Add ability to import characters created in the [ShadowDarklings](http://shadowdarklings.net/) character generator
* [#213] Make PC ability modifiers available for scripted rolls. They will now be available as `@abilities.[ability].mod`, for example `@abilities.str.mod`, etc.
* [#219] Optionally roll NPC Hit Points when they are added to a Scene
* [#235] Allow opening of character sheet by clicking on portrait on light tracker
* [#240] Add system welcome chat message pointing out that we have tours available
* [#241] Adds end to end testing for Lightsource Tracker
* [#242] Adds a guided tour for rolling from the Player character sheet
* [#248] Adds a guided tour for importing the Lost Citadel of the Scarlet Minotaur into the world
* [#252] Adds tests to ensure monster compendium doesn't change IDs, as that would break integration with PF2e beastiary token module
* [#254] Adds a welcome message when first starting the system, referring to the tours as well as the issue tracker
* [#256] Adds spell scroll creation (Drag a spell to a players inventory) & scroll rolling if player is caster (click scroll icon)
* [#270] Adds contributions to Swedish, Finnish, German, and French from [Crowdin](https://crowdin.com/project/shadowdark-rpg-for-foundry-vtt)
* [#271] Adjustments for Shadowdarkling importer & sheet tests for v11 compatability

---

# v1.1.2

## Bugfixes
* [#227] Reverted HP Rolling automation. Instead provides a "Apply HP Roll to max HP" button on the HP roll card. All HP modifications are now manual (except talent bonuses).
* [#232] Martin Rast got incorrect dex in the Pregen characters.
* [#236] Don't offer to add HP to max for NPCs, just auto change max HP to rolled result.

## Enhancements
* [#234] Added finding the Macro for the lightsource tracker tour.

---

# v1.1.1

## Bugfixes
* [#209] Items in locked system compediums partially editable
* [#221] Lightsource tracker tour now require the tracker to be on, otherwise warns. Also stores and restores original settings (assuming the user doesn't restart the world or the tour within a 10 minute interval).
* [#222] Rolling HP for a newly created 1st level character fails, if the class entry is left at the default

---

# v1.1.0

## Bugfixes
* [#185] Refactored HP and updated schema to account fix HP issues on PCs
* [#199] toggling a light source throws an error without a token on scene
* [#201] Chat messages missed from light tracker events due to errors thrown
* [#202] Thrown error prevented the light from being updated on token
* [#207] Fixes issue where item was deleted before light could be activated
* [#208] Character sheet item context menu not working for non-GM users
* [#210] Possible race condition in Light Tracker
* [#214] Dice roller not honouring requested rollMode

## Enhancements
* [#139] Added Guided Tour for explaining the Lightsource Tracker
* [#190] Added HP rolling for players by level, including data migration
* [#195] Added gulp livereloading for developers
* [#196] Added Lightsource Tracker testing
* [#198] & [#216] Added contributed i18n updates for German, Finnish, French translation
* [#211] Increase granularity of Light Tracker intervals as allowed by performance enhancements
* Various small tweaks to character sheet CSS and layout

---

# v1.0.2

## Bugfixes

* [#189] When a custom effect was renamed, it caused an error that prevented the selector app opening

## Enhancements

* [#188] Added contributed i18n updates for Finnish, German and Swedish languages

---

# v1.0.1

## Bugfixes

* [#178] Fixed NaN display issue with ranged attacks

---

# v1.0.0

Initial release.

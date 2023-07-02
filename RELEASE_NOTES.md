## v.1.3.6

### Bugfixes
* [#466] Autorolling NPC HP now correctly applies HP to NPC

## v.1.3.5

We welcome @gatesvp as a contributor to the system!

### Bugfixes
* [#452] Refers the issue tracker to the actual issue tracker instead of repo
* [#450] Rolling NPC HP now correctly adds CON mod bonus (minimum 1) to HP
* [#461] Allows players with edit permission to get context menu on items on a character to edit and delete
* [#462] Properly awaiting Active Effects to be created for V11 compatability

### Enhancements
* [#452] Added special attack to chat card when applicable
* [#277] Partial implementation provides quick way to apply damage and healing directly from the chat card
* [#311] Initiative field on PC sheets

## v.1.3.4

### Enhancements
* [#443] Kobold ancestry bonuses added, supports Shadowdarkling import

## v.1.3.3

### Bugfixes
* [#427] Tour for the lightsource tracker now works again
* [#432] Tour for the Dice rolling mechanics now works again

### Enhancements
* [#435] Korean & Finnish fully translated system

## v.1.3.2

### Bugfixes
* [#419] Shadowdarklings.net uses https instead of http
* [#420] NPC attacks now rolls with the damage bonus as well
* [#422] Characters with ability stat bonuses now import correctly
* [#428] Verified with Foundry v11

## v.1.3.1

### Bugfixes
* [#407] New languages are now activated and available in game
* [#411] Duration value not showing up on Potion, Scroll and Wand item sheet
* [#413] Effects durations are now updated when changing the duration values on the sheet, and temporary conditions are removed on expiry
* [#417] Now catches effects providing light source using either name or if any change is manipulating the light template field

### Errata
* [#412] Updated Ranger items to latest version
* [#415] Apply latest Shadowdark V2 errate where needed

## v1.3.0

### Bugfixes
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


### Enhancements
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

## v1.2.4

### Bugfixes
* [#313] Fixed a typo in the books where flasks & bottles cost 3 GP instead of SP

## v1.2.3

### Bugfixes
* [#292] Clicking a rollable item on the inventory screen triggers two dialog boxes
* [#294] Player rolls tour stalls due to us hiding the spell casting tab for non-casters
* [#296] Placing a Monster with Auto Roll NPC HP causes multiple HP rolls
* [#297] Quickstart pregens have all have zero current hit points

## v1.2.2

### Bugfixes
* [#288] Unable to make attack using Attack/Actions shortcuts

## v1.2.1

### Bugfixes
* [#283] Attribute labels missing from NPC sheet

## v1.2.0

### Bugfixes
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

### Enhancements
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

## v1.1.2

### Bugfixes
* [#227] Reverted HP Rolling automation. Instead provides a "Apply HP Roll to max HP" button on the HP roll card. All HP modifications are now manual (except talent bonuses).
* [#232] Martin Rast got incorrect dex in the Pregen characters.
* [#236] Don't offer to add HP to max for NPCs, just auto change max HP to rolled result.

### Enhancements
* [#234] Added finding the Macro for the lightsource tracker tour.

## v1.1.1

### Bugfixes
* [#209] Items in locked system compediums partially editable
* [#221] Lightsource tracker tour now require the tracker to be on, otherwise warns. Also stores and restores original settings (assuming the user doesn't restart the world or the tour within a 10 minute interval).
* [#222] Rolling HP for a newly created 1st level character fails, if the class entry is left at the default

## v1.1.0

### Bugfixes
* [#185] Refactored HP and updated schema to account fix HP issues on PCs
* [#199] toggling a light source throws an error without a token on scene
* [#201] Chat messages missed from light tracker events due to errors thrown
* [#202] Thrown error prevented the light from being updated on token
* [#207] Fixes issue where item was deleted before light could be activated
* [#208] Character sheet item context menu not working for non-GM users
* [#210] Possible race condition in Light Tracker
* [#214] Dice roller not honouring requested rollMode

### Enhancements
* [#139] Added Guided Tour for explaining the Lightsource Tracker
* [#190] Added HP rolling for players by level, including data migration
* [#195] Added gulp livereloading for developers
* [#196] Added Lightsource Tracker testing
* [#198] & [#216] Added contributed i18n updates for German, Finnish, French translation
* [#211] Increase granularity of Light Tracker intervals as allowed by performance enhancements
* Various small tweaks to character sheet CSS and layout

## v1.0.2

### Bugfixes

* [#189] When a custom effect was renamed, it caused an error that prevented the selector app opening

### Enhancements

* [#188] Added contributed i18n updates for Finnish, German and Swedish languages

## v1.0.1

### Bugfixes

* [#178] Fixed NaN display issue with ranged attacks

## v1.0.0

Initial release.

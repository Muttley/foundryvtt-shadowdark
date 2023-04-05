## v1.x.x

### Bugfixes
* [#292] Clicking a rollable item on the inventory screen triggers two dialog boxes

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

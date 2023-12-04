![GitHub Release](https://img.shields.io/github/release-date/Muttley/foundryvtt-shadowdark)
![All Versions](https://img.shields.io/github/downloads/Muttley/foundryvtt-shadowdark/total)
![Latest Version](https://img.shields.io/github/downloads/Muttley/foundryvtt-shadowdark/latest/shadowdark.zip)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fshadowdark)
[![Crowdin](https://badges.crowdin.net/foundryvtt-shadowdark/localized.svg)](https://crowdin.com/project/foundryvtt-shadowdark)

# Shadowdark RPG for Foundry VTT

**foundryvtt-shadowdark** is a community contributed and maintained system for playing the [Shadowdark RPG][1] with the [Foundry VTT][2] virtual tabletop software.

## Features
- **Sheets**
  - Fully featured sheets for:
    - Players
      - Automatic calculations for HP (augmented by talents), AC (based on equipped armor), ability modifiers
      - Attacks summarized on the Abilities sheet based on equipped weapon
      - Tracker for Luck token
      - Tabs to easily access different aspects of the character
    - NPCs
    - Items
      - Including Gem Bag

- **Classes**
  - All base classes from Quickstart guides are available
  - Rolltables for rolling talents
  - Automatic amount of damage dice for Thiefs backstab talent (may be augmented by supplied bonus die talent)

- **Items**
  - All items from the Quickstart guides are available in item compendiums
  - Lightsource items automatically sets the light settings for your tokens so you don't have to
  - Tracking of ammunition is available from the inventory screen of your character
  - Selling of gems is easy with the gem bag interface, which also tracks your different gems and how many slots they take up
  - Automatic tracking of gear slots, including augmentations from talents

- **Monsters**
  - Compendium full of monsters from the Quickstart Guide, including the Lost Citadel of the Scarlet Minotaur
  - (Note: Complex attack patterns are not implemented, such as the combinations of AND & OR and multiples of attacks)
	- Support for optional Token image mapping from the Pathfinder Token Pack: Bestiaries module or other modules which provide a Shadowdark mapping file

- **Spells**
  - Spells from the Quickstart guide are all available
  - Automatically checks for failure and success during spell checks. Spells are lost on failure
  - Indication of critical failure & success with indications of what to do

- **Weapons**
  - All weapons from the Quickstart Guide implemented and available through the compendiums
  - Automatic weapon mastery calculations based on either weapon name or selected base weapon (for named weapons)

- **Talents**
  - All ancestry & class talents, including talent rolltables, are available from the Quickstart guides
  - Active effects on talents modify the data of the actor, automating the setup
  - Talents pre-defined for:
    - Advantage on Initiative, HP rolls, Spell casting with certain spells
      - Advantage button colored green when advantage from talents, as suggestion on the roll dialog
    - Ability score modifications
    - Weapon Mastery
      - Uses either the weapon name, or the base weapon as selected per item basis
    - Additional damage dice during Backstab
  - Custom talents can be defined
  - (Note: Foundry limitations doesn't allow changing talents on the actors, so they need to be imported and changed before being dragged to the actor in some cases)


- **Quickstarter Guides**
  - Both the Player Guide and the Gamemaster Guide from the Quickstart are available as journals
  - Compendium containing the content available for: Items, Talents, Spells, Monster, Rollable tables, Pregenerated Characters, and the Lost Citadel of the Scarlet Minotaur


- **The Lost Citadel of the Scarlet Minotaur Adventure**
  - The intro adventure in the Quickstart guide is available as an Adventure Import using the built-in compendium

- **Pregen Player characters**
  - The pregen characters from the Quickstart Guide are all available in the built-in compendium

- **Lightsource Tracker**
  - Interface only available for GMs
    - GMs can track the remaining burn time of lightsources, see system options
    - GMs have to ability to douse individual lightsources, or douse them all at once
  - Individual tracking per player and item
  - Tracks associated actors per player. A Player character *must* be claimed by a user to enable tracking

- **Macros**
  - Macros for drawing traps, hazards, random ruin encounters, rumors, what is happening, random magic item names, and adventure site names available from the Game Master guide
  - Macros for The Lost Citadel available: random beastman NPC, random ettercap NPC, random encounter check

- **Tours**
	- A selection of tutorial Tours, explaining various parts of the system

- **Localization**
  - We currently fully support English and Swedish translations
  - We currenly have various levels of support for French, German & Finnish translations.  Please see the [Translation][5] information on our [Wiki][4] for details on how to help with existing translations, or with getting new languages added

# Community Contributions

Code and content contributions are welcome. Please feel free to submit issues to the [issue tracker](https://github.com/Muttley/foundryvtt-shadowdark/issues) or submit merge requests for code changes.

Details for how to get started hacking on the system can be found in the [Wiki](https://github.com/Muttley/foundryvtt-shadowdark/wiki)

# License

**foundryvtt-shadowdark** is an independent product published under the Shadowdark RPG Third-Party License and is not affiliated with The Arcane Library, LLC. Shadowdark RPG © 2023 The Arcane Library, LLC.

The [Arcane Library][1] logo, and additional [Shadowdark RPG][1] images included within **foundryvtt-shadowdark** are used with the kind permission of Kelsey Dionne and [Arcane Library][1].

[1]: https://www.thearcanelibrary.com
[2]: https://www.thearcanelibrary.com/pages/shadowdark
[3]: https://foundryvtt.com
[4]: https://github.com/Muttley/foundryvtt-shadowdark/wiki/
[5]: https://github.com/Muttley/foundryvtt-shadowdark/wiki/Other-ways-to-contribute#translation

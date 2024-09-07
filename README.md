![GitHub Release](https://img.shields.io/github/release-date/Muttley/foundryvtt-shadowdark)
![All Versions](https://img.shields.io/github/downloads/Muttley/foundryvtt-shadowdark/total)
![Latest Version](https://img.shields.io/github/downloads/Muttley/foundryvtt-shadowdark/latest/shadowdark.zip)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fshadowdark)
[![Crowdin](https://badges.crowdin.net/foundryvtt-shadowdark/localized.svg)](https://crowdin.com/project/foundryvtt-shadowdark)

# Shadowdark RPG for Foundry VTT

**foundryvtt-shadowdark** is a community contributed and maintained system for playing the [Shadowdark RPG][2] with the [Foundry VTT][3] virtual tabletop software.

## Features

**Core Rule Book Content**
- All Weapons, armor, gear
- All Ancestries, Background, Classes, Deities
- All Talents with Roll Tables
- Spells (Teir 1-5)
- all 238 monsters from the core rules book

**Cursed Scrolls zines (1-3) Content**
- All classes, background, weapons, armor
- Talents and tables
- New spells (Teir 1-5)

**Quickstart Set Content**
- Both the Player Guide and the Gamemaster Guide from the Quickstart are available as journals
- Included adventure: The Lost Citadel of the Scarlet Minotaur
- Compendium of pre-generated characters
- Magical items
- Wizard Mishap tier 1-3 Table
- Macros for The Lost Citadel available: random beastman NPC, random ettercap NPC, random encounter check

**Sheets**
- Automated checks with calculated modifiers:
	- Attack checks (based on equipped weapons)
    - Spell checks, with spells lost on failure
	- Stat checks
	- Tracking of permanent or temporary conditions and effects
- Items
	- Automatic tracking of gear slots, including augmentations from talents
    - Light source item tracking, automatically sets the light settings for your tokens
	- Selling of treasure and gems
	- Items can be equipped, carried or stashed
- Characters (Players)
    - Calculated HP (augmented by talents),
	- Calculated AC (based on equipped armor)
    - Luck token tracking in normal or pulp mode
- Monsters (NPCs)
	- Fix HP or randomized by hit dice
	- Basic attacks, spells, features,

**Character Management**
- A character generator for quickly rolling new characters
- Import existing characters from Shadowdarklings.net
- A guided level up process based on class details
- Automatic roll tables for randomizing talents

**Customization**
- Support for creating custom:
	- ancestries, classes, languages, talents, monsters
	- weapons, armor, properties, spells, magic items
- Active effects on talents can modify the data of the actor:
    - Advantage on Initiative, HP rolls, Spell casting
    - Ability score modifications
	- Pre-defined talents for core classes
		- Weapon mastery calculations
    	- Additional damage dice during Backstab
		- Spell advantage on named spells

**Light source Tracker for GMs**
- Track the remaining burn time of Light sources
- Douse individual Light sources, or douse them all at once
- Tracks associated actors per player. A character *must* be claimed by a player to enable tracking

**Macros**
- Useful macros compendium with tools for running the game
- Macros for drawing traps, hazards, random ruin encounters, rumors, what is happening, random magic item names
- Import, items and spells from source material PDFs

**Monsters**
- Import monsters from source PDFs using the Monster Importer
- Support for monster token image remapping from a custom module or supported product. e.g. Pathfinder Token Pack: Bestiaries module

**Localization**
- Full support for English and Swedish translations
- Best effort support for French, German & Finnish translations.
- Please see the [Translation][5] information on our [Wiki][4] for details on how to help with existing translations, or with getting new languages added

# Video Tutorial
[![Shadowdark RPG on Foundry VTT Basics](https://img.youtube.com/vi/hoBxiK71DBQ/hqdefault.jpg)](https://www.youtube.com/watch?v=hoBxiK71DBQ&list=PLpf8dHUKN9f0of47XUk6V3dt3McRWYkcU)

# Community Contributions

Code and content contributions are welcome. Please feel free to submit issues to the [issue tracker](https://github.com/Muttley/foundryvtt-shadowdark/issues) or submit merge requests for code changes.

Details for how to get started hacking on the system can be found in the [Wiki](https://github.com/Muttley/foundryvtt-shadowdark/wiki)

# License

**foundryvtt-shadowdark** is an independent product published under the Shadowdark RPG Third-Party License and is not affiliated with The Arcane Library, LLC. Shadowdark RPG © 2023 The Arcane Library, LLC.

The software code that makes up the core of this system is published under the MIT license (see LICENSE.txt).

The [Arcane Library][1] logo, and additional [Shadowdark RPG][1] images included within **foundryvtt-shadowdark** are used with the kind permission of Kelsey Dionne and [Arcane Library][1].

[1]: https://www.thearcanelibrary.com
[2]: https://www.thearcanelibrary.com/pages/shadowdark
[3]: https://foundryvtt.com
[4]: https://github.com/Muttley/foundryvtt-shadowdark/wiki/
[5]: https://github.com/Muttley/foundryvtt-shadowdark/wiki/Other-ways-to-contribute#translation

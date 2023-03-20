const items = [
  "A mutated cave brute explodes through a crumbling wall",
  "A silent gelatinous cube sweeps up a corridor",
  "A roving brown bear scavenges for dead bodies to eat",
  "Rival crawlers confront the PCs; they were \"here first\"",
  "[[/r 1d6]] rust monsters swarm a crack bubbling with mercury",
  "A legless suit of animated armor pulls itself along the floor",
  "A groaning wall collapses at the slightest touch",
  "A chalk note on the wall: \"Karov, we'll be at the Loyal Hog\"",
  "Mort the goblin is digging in cracks for grubs and beetles",
  "The floor collapses into a pit [[/r 1d6*10]] feet deep",
  "A raiding team of [[/r 2d4]] hobgoblins moves in tight formation",
  "[[/r 2d4]] web-covered skeletons form from scattered bones",
  "[[/r 1d4]] giant dung beetles roll huge balls of dried excrement",
  "An ochre jelly hides inside a pond or sinkhole",
  "A single, perfect rose grows up between the flagstones",
  "[[/r 2d4]] bandits shutter lanterns and set up a hasty ambush",
  "Three goblins toughen each other's skulls with frying pans",
  "[[/r 2d6]] beastmen pummel a giant centipede with rocks",
  "A gas leak causes all light sources to explode and go out",
  "A gelatinous cube full of handy items is stuck inside a pit",
  "A swarm of clattering, gold scarab beetles flies into sight",
  "A wounded NPC staggers up to the PCs and begs for help",
  "A rusty portcullis slams down, separating the PCs",
  "A giant spider hides above an old, rotten backpack",
  "A weeping ghost floats by, distracted by its own ranting",
  "[[/r 2d4]] kobolds sneak up behind the PCs for a surprise attack",
  "Ancient clay pots vibrate with hypnotizing resonance",
  "[[/r 1d6]] gricks shred dead giant rats and use the fur for nesting",
  "Rival crawlers escort a frail noble tourist on an \"adventure\"",
  "[[/r 3d4]] goblin scavengers barter and trade for odd trinkets",
  "[[/r 2d4]] dwarven miners (soldiers) shore up a collapsing wall",
  "[[/r 2d4]] giant wasps build a huge, papery nest on the ceiling",
  "A dense cloud of sulfuric mist rises from a floor crack",
  "A swarm of spiders surges out of a gauzy egg sack",
  "An ogre named Lud scratches rude words into the wall",
  "[[/r 1d6]] goblins brawl with [[/r 2d4]] kobolds over a grick carcass",
  "[[/r 2d4]] giant bats roost on the ceiling; light disturbs them",
  "An ettercap spins web cocoons around its still-living prey",
  "[[/r 1d6]] cultists hunt for humanoid bones for a nefarious ritual",
  "A dryad searches for her tree that bugbears chopped up",
  "A deep gnome plays haunting music on humming fungi",
  "[[/r 2d6]] kobolds work in a makeshift, volatile alchemy lab",
  "A stone golem endlessly stacks the same rocks into piles",
  "Two darkmantles circle each other in a duel of intimidation",
  "[[/r 2d6]] goblins carry their bugbear king on a rickety litter",
  "[[/r 2d4]] cave creepers swarm up the hallway",
  "A recent campfire still burns with glowing cinders",
  "A minotaur guides a mysterious merchant along a path",
  "Roll two encounters and combine the results (reroll 98-99)",
  "The body of a dead crawler holds a random magic item",
];

const table = await RollTable.create({name: "Ruin Encounters"});
const results = [];

items.forEach((value, idx) => {
  results.push(
    {
      text: value,
      weight: 2,
      range: [idx+1, idx+1]
    }
  )
});

await table.createEmbeddedDocuments("TableResult", results);
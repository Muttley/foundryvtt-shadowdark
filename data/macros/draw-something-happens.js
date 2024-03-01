// Macro to draw on the Somethings Happens! table and only show it to the GM.

const pack = game.packs.get("shadowdark.rollable-tables");

const tableID = pack.index.find(o => o.name === "Something Happens!")._id;
const table = await pack.getDocument(tableID);

await table.draw({ rollMode: CONST.DICE_ROLL_MODES.PRIVATE});

// Macro to draw and construct a hazard, being sent in a whisper to GMs on the
// server.

const pack = game.packs.get("shadowdark.rollable-tables");

const movementTableID = pack.index.find(o => o.name === "Hazard: Movement")._id;
const movementTable = await pack.getDocument(movementTableID);
const movementDraw = await movementTable.draw({displayChat: false});
const movementResult = movementDraw.results.pop();
const movement = movementResult.description || movementResult.name;

const damageTableID = pack.index.find(o => o.name === "Hazard: Damage")._id;
const damageTable = await pack.getDocument(damageTableID);
const damageDraw = await damageTable.draw({displayChat: false});
const damageResult = damageDraw.results.pop();
const damage = damageResult.description || damageResult.name;

const weakenTableID = pack.index.find(o => o.name === "Hazard: Weaken")._id;
const weakenTable = await pack.getDocument(weakenTableID);
const weakenDraw = await weakenTable.draw({displayChat: false});
const weakenResult = weakenDraw.results.pop();
const weaken = weakenResult.description || weakenResult.name;

const message = `
<p>
	A location with <b>${movement}</b> that will weaken the characters with
	<b>${weaken}</b> and causes damage through <b>${damage}</b>
</p>
`;

const chatData = {
	user: game.user._id,
	speaker: ChatMessage.getSpeaker(),
	content: message,
	whisper: game.users.filter(u => u.isGM).map(u => u._id),
};

ChatMessage.create(chatData, {});

// Macro to generate a random name for an adventure site, only shown to the GM(s).

const pack = game.packs.get("shadowdark.rollable-tables");

const nameoneTableID = pack.index.find(o => o.name === "Adventuring Site Name: Name 1")._id;
const nameoneTable = await pack.getDocument(nameoneTableID);
const nameoneDraw = await nameoneTable.draw({displayChat: false});
const nameoneResult = nameoneDraw.results.pop();
const nameone = nameoneResult.description || nameoneResult.name;

const nametwoTableID = pack.index.find(o => o.name === "Adventuring Site Name: Name 2")._id;
const nametwoTable = await pack.getDocument(nametwoTableID);
const nametwoDraw = await nametwoTable.draw({displayChat: false});
const nametwoResult = nametwoDraw.results.pop();
const nametwo = nametwoResult.description || nametwoResult.name;

const namethreeTableID = pack.index.find(o => o.name === "Adventuring Site Name: Name 3")._id;
const namethreeTable = await pack.getDocument(namethreeTableID);
const namethreeDraw = await namethreeTable.draw({displayChat: false});
const namethreeResult = namethreeDraw.results.pop();
const namethree = namethreeResult.description || namethreeResult.name;

const message = `<h3>${nameone} ${nametwo} ${namethree}</h3>`;

const chatData = {
	user: game.user._id,
	speaker: ChatMessage.getSpeaker(),
	content: message,
	whisper: game.users.filter(u => u.isGM).map(u => u._id),
};

ChatMessage.create(chatData, {});

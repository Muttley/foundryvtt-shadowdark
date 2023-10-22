// Macro to generate a random name for an adventure site, only shown to the GM(s).

const pack = game.packs.get("shadowdark.rollable-tables");

const nameoneTableID = pack.index.find(o => o.name === "Adventuring Site Name: Name 1")._id;
const nameoneTable = await pack.getDocument(nameoneTableID);
const nameoneResult = await nameoneTable.draw({displayChat: false});
const nameone = nameoneResult.results.pop().getChatText();

const nametwoTableID = pack.index.find(o => o.name === "Adventuring Site Name: Name 2")._id;
const nametwoTable = await pack.getDocument(nametwoTableID);
const nametwoResult = await nametwoTable.draw({displayChat: false});
const nametwo = nametwoResult.results.pop().getChatText();

const namethreeTableID = pack.index.find(o => o.name === "Adventuring Site Name: Name 3")._id;
const namethreeTable = await pack.getDocument(namethreeTableID);
const namethreeResult = await namethreeTable.draw({displayChat: false});
const namethree = namethreeResult.results.pop().getChatText();

const message = `<h3>${nameone} ${nametwo} ${namethree}</h3>`;

const chatData = {
	user: game.user._id,
	speaker: ChatMessage.getSpeaker(),
	content: message,
	whisper: game.users.filter(u => u.isGM).map(u => u._id),
};

ChatMessage.create(chatData, {});

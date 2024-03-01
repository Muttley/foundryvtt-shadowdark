// Macro to draw and construct a named Magic Item, being sent in a whisper to
// GMs on the server.

const pack = game.packs.get("shadowdark.rollable-tables");

const firstTableID = pack.index.find(o => o.name === "Magic Item: Name 1")._id;
const firstTable = await pack.getDocument(firstTableID);
const firstResult = await firstTable.draw({displayChat: false});
const first = firstResult.results.pop().getChatText();

const secondTableID = pack.index.find(o => o.name === "Magic Item: Name 2")._id;
const secondTable = await pack.getDocument(secondTableID);
const secondResult = await secondTable.draw({displayChat: false});
const second = secondResult.results.pop().getChatText();

const thirdTableID = pack.index.find(o => o.name === "Magic Item: Name 3")._id;
const thirdTable = await pack.getDocument(thirdTableID);
const thirdResult = await thirdTable.draw({displayChat: false});
const third = thirdResult.results.pop().getChatText();

const message = `<p><b>${first} ${second} ${third}</b></p>`;

const chatData = {
	user: game.user._id,
	speaker: ChatMessage.getSpeaker(),
	content: message,
	whisper: game.users.filter(u => u.isGM).map(u => u._id),
};

ChatMessage.create(chatData, {});

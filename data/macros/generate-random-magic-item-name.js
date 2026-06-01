// Macro to draw and construct a named Magic Item, being sent in a whisper to
// GMs on the server.

const pack = game.packs.get("shadowdark.rollable-tables");

const firstTableID = pack.index.find(o => o.name === "Magic Item: Name 1")._id;
const firstTable = await pack.getDocument(firstTableID);
const firstDraw = await firstTable.draw({displayChat: false});
const firstResult = firstDraw.results.pop();
const first = firstResult.description || firstResult.name;

const secondTableID = pack.index.find(o => o.name === "Magic Item: Name 2")._id;
const secondTable = await pack.getDocument(secondTableID);
const secondDraw = await secondTable.draw({displayChat: false});
const secondResult = secondDraw.results.pop();
const second = secondResult.description || secondResult.name;

const thirdTableID = pack.index.find(o => o.name === "Magic Item: Name 3")._id;
const thirdTable = await pack.getDocument(thirdTableID);
const thirdDraw = await thirdTable.draw({displayChat: false});
const thirdResult = thirdDraw.results.pop();
const third = thirdResult.description || thirdResult.name;

const message = `<p><b>${first} ${second} ${third}</b></p>`;

const chatData = {
	user: game.user._id,
	speaker: ChatMessage.getSpeaker(),
	content: message,
	whisper: game.users.filter(u => u.isGM).map(u => u._id),
};

ChatMessage.create(chatData, {});

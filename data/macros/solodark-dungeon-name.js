// Macro to generate a random SoloDark Dungeon Name, only shown to the GM(s).

const pack = game.packs.get("shadowdark.rollable-tables");

const tableNames = [
	"Dungeon Names: Name 1",
	"Dungeon Names: Name 2",
	"Dungeon Names: Name 3",
];

const selected = [];

for (const name of tableNames) {
	const tableId = pack.index.find(o => o.name === name)._id;
	const table = await pack.getDocument(tableId);
	const draw = await table.draw({displayChat: false});
	const tableResult = draw.results.pop();
	selected.push(tableResult.description || tableResult.name);
}

const message = `<h3>${selected.join(" ")}</h3>`;

const chatData = {
	user: game.user._id,
	speaker: ChatMessage.getSpeaker(),
	content: message,
	whisper: game.users.filter(u => u.isGM).map(u => u._id),
};

ChatMessage.create(chatData, {});

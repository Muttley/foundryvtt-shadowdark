const pack = game.packs.get("shadowdark.rollable-tables");

const trapTableID = pack.index.find(o => o.name === "Trap: Trap")._id;
const trapTable = await pack.getDocument(trapTableID);
const trapDraw = await trapTable.draw({displayChat: false});
const trapResult = trapDraw.results.pop();
const trap = trapResult.description || trapResult.name;

const triggerTableID = pack.index.find(o => o.name === "Trap: Trigger")._id;
const triggerTable = await pack.getDocument(triggerTableID);
const triggerDraw = await triggerTable.draw({displayChat: false});
const triggerResult = triggerDraw.results.pop();
const trigger = triggerResult.description || triggerResult.name;

const effectTableID = pack.index.find(o => o.name === "Trap: Damage or Effect")._id;
const effectTable = await pack.getDocument(effectTableID);
const effectDraw = await effectTable.draw({displayChat: false});
const effectResult = effectDraw.results.pop();
const effect = effectResult.description || effectResult.name;

const message = `
<p>
	A <b>${trap}</b> trap that is triggered by <b>${trigger}</b> that causes <b>${effect}</b>
</p>
`;

const chatData = {
	user: game.user._id,
	speaker: ChatMessage.getSpeaker(),
	content: message,
	whisper: game.users.filter(u => u.isGM).map(u => u._id),
};

ChatMessage.create(chatData, {});

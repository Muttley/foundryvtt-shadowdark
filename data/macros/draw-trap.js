const pack = game.packs.get("shadowdark.rollable-tables");

const trapTableID = pack.index.find(o => o.name === "Trap: Trap")._id;
const trapTable = await pack.getDocument(trapTableID);
const trapResult = await trapTable.draw({displayChat: false});
const trap = trapResult.results.pop().getChatText();

const triggerTableID = pack.index.find(o => o.name === "Trap: Trigger")._id;
const triggerTable = await pack.getDocument(triggerTableID);
const triggerResult = await triggerTable.draw({displayChat: false});
const trigger = triggerResult.results.pop().getChatText();

const effectTableID = pack.index.find(o => o.name === "Trap: Damage or Effect")._id;
const effectTable = await pack.getDocument(effectTableID);
const effectResult = await effectTable.draw({displayChat: false});
const effect = effectResult.results.pop().getChatText();

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

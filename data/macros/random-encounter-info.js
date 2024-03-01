// Macro to get some information on random encounters
const pack = game.packs.get("shadowdark.rollable-tables");

if (!actor || (actor.type === "NPC")) {
	ui.notifications.warn("Can't draw from reactions without a Player actor assigned/selected!");
}

// Starting Distance
const distanceTableID = pack.index.find(o => o.name === "Random Encounter: Distance")._id;
const distanceTable = await pack.getDocument(distanceTableID);
const distanceResult = await distanceTable.roll();
const distance = distanceResult.results[0].text;

// Activity
const activityTableID = pack.index.find(o => o.name === "Random Encounter: Activity")._id;
const activityTable = await pack.getDocument(activityTableID);
const activityResult = await activityTable.roll();
const activity = activityResult.results[0].text;

// Reaction
const reactionTableID = pack.index.find(o => o.name === "Random Encounter: Reaction")._id;
const reactionTable = await pack.getDocument(reactionTableID);
const actorCha = actor.system.abilities.cha.mod;
const reactionRoll = await new Roll(`2d6 + ${actorCha}`).evaluate({async: true});
const reaction = reactionTable.getResultsForRoll(reactionRoll._total)[0].text;

// Treasure
const treasureRoll = await new Roll("1d100").evaluate({ async: true });
const treasure = (treasureRoll._total >= 50) ? "have treasure" : "have no treasure";

const chatHtml = `
<div class="shadowdark chat-card item-card">
	<header class="card-header flexrow">
		<img src="icons/environment/people/charge.webp" />
		<h3>Random Encounter!</h3>
	</header>

	<div class="card-content">
		<p>The monster(s) that <em>${actor.name}</em> has run into are...</p>
		<p>At a distance of: <b>${distance}</b></p>
		<p>Currently doing: <b>${activity}</b></p>
		<p>And their reaction is: <b>${reaction}</b></p>
		<p>They <b>${treasure}</b></p>
	</div>
</div>
`;

const chatData = {
	user: game.user._id,
	speaker: ChatMessage.getSpeaker(),
	content: chatHtml,
	whisper: game.users.filter(u => u.isGM).map(u => u._id),
};

ChatMessage.create(chatData, {});

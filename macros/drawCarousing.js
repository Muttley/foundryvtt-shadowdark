// Macro to draw on carousing tables.
//
// Entries in the carousing table should be on the format:
// <p>Text</p><p><em>Benefit</em></p>

const table = game.tables.getName("Carousing");

if (!table) {
	ui.notifications.warn("Couldn't find the 'Carousing' table");
	return false;
}

// Create a dialog, after checking the controlled actors amount of gold
if (!actor || !actor.system.coins) {
	ui.notifications.warn("Can't draw from carousing without an actor assigned!");
	return false;
};

const carousingEventTable = [
	{
		cost: 30,
		event: "Party A",
		bonus: 0,
	},
	{
		cost: 100,
		event: "Party B",
		bonus: 1,
	},
	{
		cost: 300,
		event: "Party C",
		bonus: 2,
	},
	{
		cost: 600,
		event: "Party D",
		bonus: 3,
	},
	{
		cost: 900,
		event: "Party E",
		bonus: 4,
	},
	{
		cost: 1200,
		event: "Party F",
		bonus: 5,
	},
	{
		cost: 1800,
		event: "Party G",
		bonus: 6,
	},
];

const actorGold = actor.system.coins.gp;
const availableEvents = carousingEventTable.filter(e => e.cost <= actorGold);

if (availableEvents.length < 1) {
	ui.notifications.warn("You don't have enought GP to draw on the carousing table.");
	return false;
}

const options = availableEvents.map(e => {
	return `<option value="${e.cost}"><b>${e.cost} gp</b> for <b>+${e.bonus} bonus</b>: ${e.event}</option>`;
});

let html = `
<form>
	<h3>Choose your Carousing Event!</h3>
	<div class="form-group">
		<div class="form-fields">
			<select name="carousing" id="carousing" style="width:50%">
				${options}
			</select>
		</div>
	</div>
</form>
`;

const cost = await Dialog.wait({
	title: "Carousing Event Choice",
	content: html,
	buttons: {
		submit: {
			label: "Select",
			callback: html => (html[0].querySelector("#carousing").value)
				? html[0].querySelector("#carousing").value
				: false,
		},
	},
	close: () => false,
});

const selectedEvent = availableEvents.find(e => e.cost === parseInt(cost, 10));
const carousingEvent = selectedEvent.event;

// Evaluate the roll & get the resulting carousing result
const tableRoll = await new Roll(`1d8 + ${selectedEvent.bonus}`).evaluate({ async: true });
const tableResult = table.getResultsForRoll(tableRoll._total);

const xpGain = parseInt(tableResult[0].text.match(/(\d+) XP/)[1], 10);

let levelUp = ``;
if (
	actor.system.level.xp + xpGain >= actor.system.level.value * 10
) levelUp = `<p><b>You have earned enough XP to gain a level!</b></b>`

const chatHtml = `
<div class="shadowdark chat-card item-card">
	<header class="card-header flexrow">
		<img src="icons/commodities/currency/coin-engraved-skull-gold.webp" />
		<h3>Carousing!</h3>
	</header>

	<div class="card-content">
		<p>After spending ${cost} GP and ${carousingEvent}....</p>
		${tableResult[0].text}
		${levelUp}
	</div>
</div>
`;

const chatData = {
	user: game.user._id,
	speaker: ChatMessage.getSpeaker(),
	content: chatHtml,
};

ChatMessage.create(chatData, {});

actor.update({
	"system.coins.gp": actor.system.coins.gp - cost,
	"system.level.xp": actor.system.level.xp + xpGain,
});
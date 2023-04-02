export async function welcomeMessage() {
	if (!game.user.getFlag("shadowdark", "welcomeMessageShown")) {
		const template = "systems/shadowdark/templates/chat/welcome-message.hbs";
		const chatCardData = {
			logo: "systems/shadowdark/assets/logo/arcane-library-logo.webp",
			title: game.i18n.localize("SHADOWDARK.chat.welcome_message.title"),
		};

		const content = await renderTemplate(template, chatCardData);
		const card = {
			content,
			user: game.user.id,
			whisper: [game.user.id],
			flags: { core: { canPopout: true } },
			speaker: { alias: "Shadowdark RPG for Foundry VTT" },
		};
		await ChatMessage.create(card);

		game.user.setFlag("shadowdark", "welcomeMessageShown", true);
	}

	// Always initiate listeners if the card has already been rendered
	_initListeners();
}

function _initListeners() {
	// Add listeners
	$(document).on("click", "button.shadowdark-tours", event => {
		event.preventDefault();
		shadowdark.log("Importing a Shadowdarkling");
		new ToursManagement().render(true);
	});

	$(document).on("click", "button.shadowdark-issue-tracker", event => {
		event.preventDefault();
		window.open("https://github.com/Muttley/foundryvtt-shadowdark");
	});
}

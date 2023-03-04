export default class ItemSD extends Item {

	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// Gems have non-configurable slot settings
		if (data.type === "Gem") {
			const slots = {
				free_carry: 0,
				per_slot: 10,
				slots_used: 1,
			};

			this.updateSource({"system.slots": slots});
		}
	}

	prepareData() {
		super.prepareData();
	}
}

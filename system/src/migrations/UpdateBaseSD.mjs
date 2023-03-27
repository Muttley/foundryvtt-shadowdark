
export class UpdateBaseSD {

	static version;

	version = this.constructor["version"]; // eslint-disable-line

	// Update the actor to the latest schema version.
	//
	async updateActor(actorData) {}

	// Update the item to the latest schema version.
	//
	async updateItem(itemData) {}

}
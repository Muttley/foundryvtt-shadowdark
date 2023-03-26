
export class UpdateBaseSD {

	static version;

	version = this.constructor["version"]; // eslint-disable-line

	// Update the actor to the latest schema version.
	//
	async updateActor(actorData, updateData) {}

	// Update the item to the latest schema version.
	//
	async updateItem(itemData, updateData) {}

	// Run other migrations for this schema version.
	//
	// This can be used for anything more fancy than just changes to Actor
	// and/or Item data
	//
	async migrate() {}

}

const fields = foundry.data.fields;

export class ItemBaseSD extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		return {
			description: new fields.HTMLField(),
			source: new fields.SchemaField({
				title: new fields.StringField({initial: ""}),
			}),
		};
	}
}

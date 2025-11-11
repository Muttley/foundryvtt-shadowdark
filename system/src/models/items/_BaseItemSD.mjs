const fields = foundry.data.fields;

export class BaseItemSD extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		return {
			description: new fields.HTMLField(),
			source: new fields.SchemaField({
				title: new fields.StringField({initial: ""}),
			}),
			properties: new fields.ArrayField(new fields.DocumentUUIDField()),
		};
	}

	get isPhysical() {
		return false;
	}

	get propertyNames() {
		const propertyItems = [];
		for (const uuid of this.properties ?? []) {
			propertyItems.push(fromUuidSync(uuid));
		}
		return propertyItems.map(p => p.name.slugify());
	}

	hasProperty(property) {
		const propertyItems = [];
		for (const uuid of this.properties ?? []) {
			propertyItems.push(fromUuidSync(uuid));
		}
		const propertyItem = propertyItems.find(
			p => p.name.slugify() === property.slugify()
		);
		return propertyItem ? true : false;
	}

}

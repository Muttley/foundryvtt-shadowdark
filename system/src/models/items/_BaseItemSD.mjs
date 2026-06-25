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
		
		const propSlug = (property || "").slugify();
		
		const propertyItem = propertyItems.find(p => {
			if (!p) return false;
			const engName = p.originalName || p.flags?.babele?.originalName || p.name || "";
			return engName.slugify() === propSlug || (p.name || "").slugify() === propSlug;
		});
		
		return propertyItem ? true : false;
	}

	async render(data={}, template=null) {
		template ??= "systems/shadowdark/templates/chat/item-card.hbs";
		data.subtext ??= this.subtext;
		data.item ??= this.parent;
		data.description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			data.description ?? this.description, {async: true}
		);

		return await foundry.applications.handlebars.renderTemplate(template, data);
	}

}

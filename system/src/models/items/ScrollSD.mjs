import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class ScrollSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			spellUuid: new fields.DocumentUUIDField(),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	prepareBaseData() {
		super.prepareBaseData();
		this.magicItem = true;
	}

	get isRollable() {
		return true;
	}

	get isScroll() {
		return true;
	}

	async render(data={}, template=null) {
		if (this.isIdentified && data?.spellUuid) {
			const spell = await fromUuid(data.spellUuid);
			if (spell) return spell.system.render(data, template);
		}

		const parts = [this.description];
		if (this.isIdentified && this.spellUuid) {
			const spell = await fromUuid(this.spellUuid);
			if (spell) {
				const classes = await spell.system.getClassNames();
				const subtext = [spell.system.subtext, classes].filter(Boolean).join(" • ");
				parts.push(
					`<span class="spell-name">${spell.name}</span>`
					+ `<span class="item-subtext">${subtext}</span>`
				);
			}
		}

		data.description = parts.join("");
		return super.render(data, template);
	}

}

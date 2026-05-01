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
}

import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

const LIGHT_SETTINGS = {
	"lantern": {animation: "torch", bright: 15, color: "#d1c846", dim: 60},
	"light-suppression": {animation: "vortex", bright: 1, color: "#a600ff", dim: 5},
	"lightSpellDouble": {animation: "", bright: 60, color: "#ffffff", dim: 0},
	"lightSpellNear": {animation: "", bright: 30, color: "#ffffff", dim: 0},
	"purple-glow": {animation: "roiling", bright: 1, color: "#a600ff", dim: 5},
	"torch": {animation: "torch", bright: 5, color: "#d1c846", dim: 30},
};

export default class Update_260731_1 extends UpdateBaseSD {

	static version = 260731.1;

	async updateItem(itemData) {
		const updateData = {};
		const template = itemData.system?.light?.template;

		if (LIGHT_SETTINGS[template]) {
			const light = LIGHT_SETTINGS[template];
			updateData["system.light.animation"] = light.animation;
			updateData["system.light.bright"] = light.bright;
			updateData["system.light.color"] = light.color;
			updateData["system.light.dim"] = light.dim;
			updateData["system.light.template"] = "";
		}

		let effectsChanged = false;
		const effects = itemData.effects?.map(effect => {
			const changes = [];

			for (const change of effect.changes) {
				if (change.key !== "system.light.template") {
					changes.push(change);
					continue;
				}

				const light = LIGHT_SETTINGS[change.value];
				if (!light) {
					changes.push(change);
					continue;
				}

				effectsChanged = true;
				for (const [field, value] of Object.entries({
					isSource: true,
					...light,
				})) {
					changes.push({
						...change,
						key: `system.light.${field}`,
						value,
					});
				}
			}

			return {...effect, changes};
		});

		if (effectsChanged) updateData.effects = effects;
		return updateData;
	}
}

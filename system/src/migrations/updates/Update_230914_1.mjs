import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_230914_1 extends UpdateBaseSD {

	static version = 230914.1;

	async updateItem(itemData, actorData) {
		const requiredTypes = ["Armor", "Weapon"];

		const updateData = {};

		if (requiredTypes.includes(itemData.type)) {
			const propertyItems = {
				disadvStealth: "Compendium.shadowdark.properties.Item.WhfSBiji8VG1mMzV",
				disadvSwim: "Compendium.shadowdark.properties.Item.F4wv0ycualMPaoco",
				finesse: "Compendium.shadowdark.properties.Item.rqQwpoeWEqi0ZcYK",
				loading: "Compendium.shadowdark.properties.Item.HyqHR9AhIDkm4La9",
				noSwim: "Compendium.shadowdark.properties.Item.kBLs47xhX1snaDGA",
				oneHanded: "Compendium.shadowdark.properties.Item.jq0m0lGb7QOCSJXL",
				shield: "Compendium.shadowdark.properties.Item.61gM0DuJQwLbIBwu",
				thrown: "Compendium.shadowdark.properties.Item.c35ROL1nXwC840kC",
				twoHanded: "Compendium.shadowdark.properties.Item.b6Gm2ULKj2qyy2xJ",
				versatile: "Compendium.shadowdark.properties.Item.qEIYaQ9j2EUmSrx6",
			};

			const newProperties = [];

			for (const property of itemData.system.properties ?? []) {
				const propertyUuid = propertyItems[property] ?? null;

				if (propertyUuid) {
					newProperties.push(propertyUuid);
				}
			}

			updateData["system.properties"] = newProperties;
		}
		else {
			updateData["system.-=properties"] = null;
		}

		return updateData;
	}
}

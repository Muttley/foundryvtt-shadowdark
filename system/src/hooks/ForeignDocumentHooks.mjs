import {cacheForeignDocuments} from "../documents/cacheForeignDocuments.mjs";

export const ForeignDocumentHooks = {
	attach: () => {
		Hooks.on("deleteItem", cacheForeignDocuments);
		Hooks.on("createItem", cacheForeignDocuments);
	},
};

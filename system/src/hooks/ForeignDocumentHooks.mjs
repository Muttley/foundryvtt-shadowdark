import {cacheForeignDocuments} from "../documents/cacheForeignDocuments";

export const ForeignDocumentHooks = {
	attach: () => {
		Hooks.on("deleteItem", cacheForeignDocuments);
		Hooks.on("createItem", cacheForeignDocuments);
	},
};

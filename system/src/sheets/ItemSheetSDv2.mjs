const {api, sheets} = foundry.applications;

const TextEditor = foundry.applications.ux.TextEditor.implementation;

export default class ItemSheetSDv2
	extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {

}

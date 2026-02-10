import ItemSheetSDv2 from "../ItemSheetSDv2.mjs";

export default class LightSourceSheetSD extends ItemSheetSDv2 {


	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {},
		classes: ["shadowdark"],
		position: {
			width: 665,
			height: "auto",
		},
		tag: "form",
	};


	/** @override */
	static PARTS = {
		header: {
			template: templatePath("items/_partials/header"),
		},
		tabs: {
			template: templatePath("items/_partials/tab-navigation"),
		},
		details: {
			template: templatePath("items/light-source/details-tab"),
			templates: [
				// "item/_shared-partials/choice-selector",
				// "item/_shared-partials/spirit",
				// "item/_shared-partials/supply-point-cost",
				// "item/_shared-partials/supply-points",
				// "item/_shared-partials/tech-level",
				// "item/l/_partials/attribute-choices",
				// "item/origin/_partials/attributes",
				// "item/origin/_partials/skill-choices",
				// "item/origin/_partials/skills",
				// "item/origin/_partials/special-abilities",
			].map(path => templatePath(path)),
		},
		description: {
			template: templatePath("items/_partials/description-tab"),
		},
		source: {
			template: templatePath("items/_partials/source-tab"),
		},
	};


	static TABS = {
		primary: {
			tabs: [
				{
					id: "details",
					label: "SHADOWDARK.sheet.item.tab.details",
					cssClass: "navigation-tab",
				},
				{
					id: "description",
					label: "SHADOWDARK.sheet.item.tab.description",
					cssClass: "navigation-tab",
				},
				{
					id: "source",
					label: "SHADOWDARK.sheet.item.tab.source",
					cssClass: "navigation-tab",
				},
			],
		},
	};
}

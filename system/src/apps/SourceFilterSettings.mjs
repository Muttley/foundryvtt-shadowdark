export default class SourceFilterSettings extends FormApplication {
	constructor(object, options) {
		super(object, options);

		this.filtered = game.settings.get("shadowdark", "sourceFilters") ?? [];
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			title: game.i18n.localize("SHADOWDARK.settings.source_filter.title"),
			template: "systems/shadowdark/templates/apps/source-filter.hbs",
			width: 300,
			height: "auto",
			resizable: false,
			closeOnSubmit: true,
		});
	}

	static registerSetting() {
		game.settings.register("shadowdark", "sourceFilters", {
			name: game.i18n.localize("SHADOWDARK.settings.source_filter.title"),
			hint: game.i18n.localize("SHADOWDARK.settings.source_filter.hint"),
			config: false,
			scope: "world",
			type: Array,
			requiresReload: true,
			default: [],
		});
	}

	activateListeners(html) {
		html.find(".delete-choice").click(event => this._deleteChoiceItem(event));

		super.activateListeners(html);
	}

	async getData() {
		const data = await super.getData();

		const sources = await shadowdark.compendiums.sources();

		data.selectedSources = [];
		for (const source of sources) {
			if (this.filtered.includes(source.uuid)) {
				data.selectedSources.push(source);
			}
		}

		data.hasSelectedSources = data.selectedSources.length > 0;

		data.unselectedSources = sources.map(
			source => ({name: source.name, uuid: source.uuid})
		).filter(source => !this.filtered.includes(source.uuid));

		return data;
	}

	async _deleteChoiceItem(event) {
		event.preventDefault();
		event.stopPropagation();

		const deleteUuid = $(event.currentTarget).data("uuid");

		const newChoices = [];
		for (const itemUuid of this.filtered) {
			if (itemUuid === deleteUuid) continue;
			newChoices.push(itemUuid);
		}

		this.filtered = newChoices;

		return this.render(true);
	}

	async _onChangeInput(event) {
		const options = event.target.list.options;
		const value = event.target.value;

		let uuid = null;
		for (const option of options) {
			if (option.value === value) {
				uuid = option.getAttribute("data-uuid");
				break;
			}
		}

		if (uuid === null) return;

		if (this.filtered.includes(uuid)) return; // No duplicates

		this.filtered.push(uuid);

		this.filtered.sort((a, b) => a.localeCompare(b));

		return this.render(true);
	}

	async _updateObject(event, data) {
		game.settings.set("shadowdark", "sourceFilters", this.filtered);
	}
}

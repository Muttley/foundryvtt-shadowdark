export default class EffectPanelSD extends Application {
	static DURATION_CONVERSION = {
		IN_ONE_ROUND: 10,
		IN_ONE_MINUTE: 60,
		IN_TWO_MINUTES: 120,
		IN_ONE_HOUR: 3_600,
		IN_TWO_HOURS: 7_200,
		IN_ONE_DAY: 86_400,
		IN_TWO_DAYS: 172_800,
		IN_ONE_WEEK: 604_800,
		IN_TWO_WEEKS: 1_209_600,
		IN_ONE_YEAR: 31_536_000,
		IN_TWO_YEARS: 63_072_000,
	};

	constructor() {
		super();

		this._controller = new EffectPanelControllerSD(this);

		// Add a slight delay to the rendering, this is necessary to cover
		// some occasions when properly waiting for a promise is not doable.
		this.refresh = foundry.utils.debounce(this.render.bind(this), 100);
	}

	/* -------------------------------------------- */
	/*  Inherited                                   */
	/* -------------------------------------------- */

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "effect-panel"],
			popOut: false,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/effect-panel.hbs";
	}

	/** @inheritdoc */
	async _render(force = false, options = {}) {
		await super._render(force, options);

		this.element.css("right", this.getRightPx);
	}

	/* -------------------------------------------- */
	/*  Overrides                                   */
	/* -------------------------------------------- */

	/** @override */
	getData(options) {
		return this._controller.getEffectData();
	}

	/** @override */
	activateListeners($html) {
		this._rootView = $html;

		this._icons.click(
			this._controller.onIconClick.bind(this._controller)
		);

		this._icons.contextmenu(
			this._controller.onIconRightClick.bind(this._controller)
		);

		this._dragHandler.mousedown(
			this._controller.onMouseDown.bind(this._controller)
		);
	}

	/* -------------------------------------------- */
	/*  Getters                                     */
	/* -------------------------------------------- */

	get token() {
		return canvas.tokens.controlled.at(0)?.document ?? null;
	}

	get actor() {
		return this.token?.actor ?? game.user?.character ?? null;
	}

	get _icons() {
		return this._rootView.find("div.icon[data-effect-id]");
	}

	get _dragHandler() {
		return this._rootView.find("#effect-panel-drag-handler");
	}

	/* -------------------------------------------- */
	/*  Methods                                     */
	/* -------------------------------------------- */

	/**
	 * Manages expired Effect items.
	 * @returns {void}
	 */
	async deleteExpiredEffects() {
		const effectData = this._controller.getEffectData();

		// Get effects that have unique origin
		const expiredEffects = [...effectData.temporaryEffects, ...effectData.conditionEffects]
			.filter(e => {
				// Light source Effects are cleaned up by the Light Source Tracker
				return e.isExpired
				&& !(
					e.effectName === "Light Source"
					|| e.changes.some(c => c.key === "system.light.template")
				);
			})
			.filter((value, index, self) => {
				return self.findIndex(v => v.origin === value.origin) === index;
			});

		expiredEffects.forEach(e => {
			const i = fromUuidSync(e.parent.uuid);
			i.delete();
		});
	}

	/**
	 * Calculates a new x-axis position for the effect panel.
	 * @returns {string}
	 */
	getRightPx() {
		const sidebarElement = ui.sidebar.element instanceof jQuery
			? ui.sidebar.element[0] : ui.sidebar.element;
		const sidebarPosition = sidebarElement.getBoundingClientRect();
		return `${window.innerWidth - sidebarPosition.left + 18}px`;
	}

	/**
	 * Animates the Effect panel to the newly calculated x-position.
	 * @returns {void}
	 */
	updateFromRightPx() {
		this.element.animate({ right: this.getRightPx });
	}
}

export class EffectPanelControllerSD {
	constructor(panel) {
		this._panel = panel;
	}

	/**
	 * Returns an array with effects that are sorted and active
	 * to be used for rendering the effect panel.
	 * @returns {Array<ActiveEffect>}
	 */
	get _actorEffects() {
		const actor = this._actor;
		if (!actor) return [];
		const activeEffects = [];

		actor.appliedEffects.forEach(effect => {
			// only get effects that are applied to the actor
			if (effect.transfer) {

				const effectData = effect.clone({}, { keepId: true});

				// get the parent object of the effect
				effectData.parentName = effect.parent.name;
				if (effectData.parentName !== effect.name) {
					effectData.effectName = effect.name;
				}

				// get properties if parent is effect type
				if (effect.parent.type === "Effect") {
					effectData.category = effect.parent.system.category;
					effectData.hidden = !effect.parent.system.effectPanel.show ?? false;

					effectData.remainingDuration = effect.parent.remainingDuration;
					effectData.rounds = (effect.parent.system.duration?.type === "rounds")
						? effect.parent.system.duration.value
						: 0;
					effectData.isExpired = effectData.remainingDuration.expired;
					effectData.infinite = effectData.remainingDuration.remaining === Infinity;
					effectData.temporary = !effectData.infinite;

					// is item hidden
					effectData.hidden = !effect.parent.system.effectPanel.show ?? false;

				}

				if (effect.parent.type === "Talent") {
					effectData.talentType = effect.parent.system.talentClass;
				}

				activeEffects.push(effectData);
			}
		});

		return activeEffects;
	}

	/**
	 * Get the actor from either the token or the assigned actor for the user
	 * @returns {Actor|null}
	 */
	get _actor() {
		return canvas.tokens.controlled[0]?.actor ?? game.user?.character ?? null;
	}

	/**
	 * Builds up an object that contains the effects categorized for rendering
	 * the template.
	 * @returns {Object}
	 */
	getEffectData() {
		const conditionEffects = [];
		const temporaryEffects = [];
		const passiveEffects = [];

		const effects = this._actorEffects;

		effects.forEach(effect => {
			if (effect.hidden) return;
			// show non effect type item according to settings
			if (!effect.category && game.settings.get("shadowdark", "showPassiveEffects")) {
				passiveEffects.push(effect);
			}
			if (effect.category === "condition") {
				conditionEffects.push(effect);
			}
			else if (effect.category === "effect") {
				temporaryEffects.push(effect);
			}
		});

		return {
			conditionEffects,
			temporaryEffects,
			passiveEffects,
			topStyle: this._getTopStyle(),
		};
	}

	/**
	 * Gets the top level position as stored for the user
	 * @returns {string}
	 */
	_getTopStyle() {
		let topPosition = game.user.getFlag(
			"shadowdark",
			"effectPanelTopPosition"
		);

		if (topPosition === undefined) {
			topPosition = 5;
			game.user.setFlag(
				"shadowdark",
				"effectPanelTopPosition",
				topPosition
			);
		}

		return `top: ${topPosition}px;`;
	}

	/* -------------------------------------------- */
	/*  Event Handling                              */
	/* -------------------------------------------- */

	/**
	 * Handles right clicking on an effect icon through the _handleEffectChange method.
	 * @param {Event} event - Mouse Event
	 * @returns {void}
	 */
	async onIconRightClick(event) {
		const $target = $(event.currentTarget);
		const actor = this._actor;
		const sourceItem = actor.items.get($target[0].dataset.effectId);
		if (!sourceItem || sourceItem.type !== "Effect") return;

		// TODO: Consider allowing default behavior to just delete effect item in settings.
		return Dialog.confirm({
			title: game.i18n.localize("SHADOWDARK.apps.effect_panel.dialog.delete_effect.title"),
			content: `<h4>${game.i18n.format(
				"SHADOWDARK.apps.effect_panel.dialog.delete_effect.content",
				{effectName: sourceItem.name}
			)}</h4>`,
			yes: async () => {
				if (sourceItem.system.light.active) {
					await sourceItem.parent.sheet._toggleLightSource(sourceItem);
				}
				await sourceItem.delete();
				this._panel.refresh();
			},
			defaultYes: true,
		});
	}

	/**
	 * Handles single clicking on an effect icon.
	 * @param {Event} event - Mouse Event
	 * @returns
	 */
	async onIconClick(event) {
		const $target = $(event.currentTarget);
		const actor = this._actor;
		const sourceItem = actor.items.get($target[0].dataset.effectId);
		if (!sourceItem) return;

		if (event.ctrlKey || event.metaKey) {
			sourceItem?.sheet.render(true);
		}
		else {
			sourceItem?.displayCard();
		}
	}

	/**
	 * Allows the effect panel to be dragged around on the screen for positioning
	 * @param {Event} event - Mouse Down event
	 * @returns {void}
	 */
	async onMouseDown(event) {
		event.preventDefault();
		event = event || window.event;

		// Determine if it is the right mouse button that is clicked
		let isRightButton = false;
		// Gecko (Firefox), Webkit (Safari/Chrome) & Opera
		if ("which" in event) {
			isRightButton = event.which === 3;
		}
		// IE, Opera
		else if ("button" in event) {
			isRightButton = event.button === 2;
		}
		if (isRightButton) return;

		dragElement(document.querySelector("section.effect-panel"));

		function dragElement(element) {
			let newYPosition = 0;
			let mouseYPosition = 0;
			let timer;

			element.onmousedown = dragMouseDown;

			function dragMouseDown(event) {
				event.preventDefault();
				event = event || window.event;

				mouseYPosition = event.clientY;
				document.onmouseup = closeDragElement;

				timer = setTimeout(() => document.onmousemove = elementDrag, 200);
			}

			function elementDrag(event) {
				event.preventDefault();
				event = event || window.event;

				newYPosition = mouseYPosition - event.clientY;
				mouseYPosition = event.clientY;

				// Set the new position
				element.style.top = `${element.offsetTop - newYPosition}px`;
			}

			function closeDragElement() {
				// Stop moving when the mouse button is released
				element.onmousedown = null;
				document.onmouseup = null;
				document.onmousemove = null;
				clearTimeout(timer);

				// Ensure the panel is on the screen, on the bottom it will show
				// one icon at least.
				const topPosition = Math.max(
					5,
					Math.min(
						ui.sidebar.element.outerHeight() - 50,
						element.offsetTop - newYPosition
					)
				);
				element.style.top = `${topPosition}px`;

				game.user.setFlag(
					"shadowdark",
					"effectPanelTopPosition",
					topPosition
				);
			}
		}
	}
}

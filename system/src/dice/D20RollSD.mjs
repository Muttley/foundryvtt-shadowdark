export default class D20RollSD extends Roll {

	constructor(formula, data, options) {
		super(formula, data, options);

		if (!this.options.configured) this.configureModifiers();
	}

	configureModifiers() {
		this.options.configured = true;
	}
}

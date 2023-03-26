export default class ShadowdarkTour extends Tour {
	// Overchange the "step" data with
	//  action: "click" or "scrollTo"
	//  target: CSS selector of the element to use for the action.

	/**
   * Wait for an element to exist in the DOM, then resolve the promise
   *
   * @param {string} selector - CSS selector of the element to wait for
   * @returns {Promise<void>}
   */
	async waitForElement(selector) {
		return new Promise((resolve, reject) => {
			const element = document.querySelector(selector);
			if (element) {
				resolve();
				return;
			}

			const observer = new MutationObserver((mutations, observer) => {
				document.querySelectorAll(selector).forEach(el => {
					resolve(el);
					observer.disconnect();
				});
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
		});
	}

	async _preStep() {
		await super._preStep();
		await this.waitForElement(this.currentStep.selector);
	}

	async _postStep() {
		await super._postStep();
		if (this.stepIndex < 0 || !this.hasNext) return;

		if (!this.currentStep.action) return;

		if (this.triggerReset) {
			this.triggerReset = false;
			return;
		}

		const target = this.currentStep.target ?? this.currentStep.selector;
		// eslint-disable-next-line default-case
		switch (this.currentStep.action) {
			case "click":
				document.querySelector(target).click();
				break;

			case "scrollTo":
				document
					.querySelector(target)
					.scrollIntoView({ block: "start", inline: "nearest" });
				break;
		}
	}

	/**
   * Detect when a reset is triggered and stop the actions in _postStep
   */
	async reset() {
		if (this.status !== "completed") this.triggerReset = true;

		await super.reset();
	}
}

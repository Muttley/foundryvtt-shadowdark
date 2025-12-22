export default class ActiveEffectSD extends ActiveEffect {

	apply(actor, change) {

		if (!change.value) return;

		// allow only deterministic formulas for non roll system keys
		if (change.key.startsWith("system.") && !change.key.startsWith("system.roll.")) {

			const resolvedFormula = shadowdark.dice.resolveFormula(
				change.value,
				actor.getRollData(),
				true // return only deterministic
			);

			// don't apply null values or non-deterministic formulas
			if (!resolvedFormula) {
				console.error(
					"ERROR: Cannot Resolve AE formula:",
					`${actor?.name} > ${change.effect?.name} > ${change.value}`
				);
				return;
			}

			// apply resolved formula value
			change.value = resolvedFormula;
		}

		// call default behavior for everything else
		return super.apply(actor, change);
	}

	get isSituational() {
		return this.getFlag("shadowdark", "situational") ?? false;
	}

	/**
	 * Automatically deactivate effects when parent item is stashed.
	 * @inheritdoc
	 */
	get isSuppressed() {
		if (this.parent?.system?.stashed) {
			return true;
		}
		else {
			return super.isSuppressed;
		}
	}

	async toggleSituational() {
		await this.setFlag("shadowdark", "situational", !this.isSituational);
	}
}

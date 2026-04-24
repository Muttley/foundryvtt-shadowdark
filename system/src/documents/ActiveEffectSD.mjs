export default class ActiveEffectSD extends ActiveEffect {

	apply(actor, change) {

		if (!change.value) return;

		// Overriding this value can cause failures as it's a schema object
		if (change.key === "system.attributes.ac" || change.key.startsWith("system.bonuses")) {
			console.error(
				"ERROR: Invalid AE key:",
				`${actor?.name} > ${change.effect?.name} > ${change.value}. `
			);
			return;
		}

		const field = actor.system.schema.getField(change.key.slice(7));

		// enforce deterministic formulas for integer keys
		if (field?.integer) {

			const resolvedFormula = shadowdark.dice.resolveFormula(
				change.value,
				actor.getRollData(),
				true // return only deterministic
			);

			// don't apply null values or non-deterministic formulas
			if (!Number.isInteger(resolvedFormula)) {
				console.error(
					"ERROR: Cannot Resolve AE formula to integer:",
					`${actor?.name} > ${change.effect?.name} > ${change.value}`
				);
				return;
			}

			// apply resolved formula value
			change.value = resolvedFormula;
		}

		// TODO Enforce validation where (field.constructor.name === "DocumentUUIDField")

		// call default behavior for everything else
		return super.apply(actor, change);
	}

	get isSituational() {
		return this.getFlag("shadowdark", "situational") ?? false;
	}

	/**
	 * Automatically deactivate effects under some conditions.
	 * @inheritdoc
	 */
	get isSuppressed() {
		// item is stashed
		if (this.parent?.system?.stashed) {
			return true;
		}
		// item can be equipped but isn't
		else if (this.parent?.system.canBeEquipped && this.parent?.system?.equipped === false ) {
			return true;
		}
		// item is not identified
		else if (this.parent?.system?.identification?.identified === false) {
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

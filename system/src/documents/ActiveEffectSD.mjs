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
}

export default class ActiveEffectSD extends ActiveEffect {

	apply(actor, change) {

		if (!change.value) return;

		// allow only deterministic formulas for non roll system keys
		if (change.key.startsWith("system.") && !change.key.startsWith("system.roll.")) {

			const r = new Roll(change.value, actor.getRollData());
			if (r.isDeterministic) {
				// try to evaluate the formula
				try {
					r.evaluateSync();
				}
				catch(err) {
					console.error("Unresolvable AE formula: ", change);
				}

				// don't apply null values
				if (!r.total) return;

				// apply resolved formula value
				change.value = r.total;
			}
			else {
				console.error("Non-deterministic AE formula: ", change);
				return;
			}
		}

		// call default behavior for everything else
		return super.apply(actor, change);
	}
}

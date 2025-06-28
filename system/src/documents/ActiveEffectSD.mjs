export default class ActiveEffectSD extends ActiveEffect {

	apply(actor, change) {

		if (!change.value) return;

		// override behavior for system.roll
		if (change.key.startsWith("system.roll.")) {

			// update key data with new changes
			this._updateKeyArray(actor, change.key, {
				name: change.effect.name,
				mode: change.mode,
				value: change.value,
			});

			return;
		}
		else if (change.key.startsWith("system.")) {
			// allow for only deterministic formulas
			const r = new Roll(change.value, actor.getRollData());
			if (r.isDeterministic) {
				// try to evaluate the formula
				try {
					r.evaluateSync();
				}
				catch(err) {
					console.error("Unresolvable AE formula: ", change);
				}
				if (!r.total) return;

				change.value = r.total;

				// make a copy of the changes to bonus
				this._updateKeyArray(
					actor,
					change.key.replace("system.", "system.bonus."),
					{
						name: change.effect.name,
						mode: change.mode,
						value: change.value,
					}
				);
			}
			else {
				console.error("Non-deterministic AE formula: ", change);
				return;
			}
		}

		// call default behavior
		return super.apply(actor, change);
	}

	_updateKeyArray(actor, key, data) {
		// make sure array is properly formatted
		let newKeyValue = foundry.utils.getProperty(actor, key) ?? [];
		if (!Array.isArray(newKeyValue)) newKeyValue = [];
		newKeyValue.push(data);

		// apply changes to actor key
		const changes = {};
		changes[key] = newKeyValue;
		foundry.utils.mergeObject(actor, changes);
	}

}

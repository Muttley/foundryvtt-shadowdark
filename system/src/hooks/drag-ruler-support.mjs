// A plugin for the Drag-Ruler module (https://github.com/manuelVo/foundryvtt-drag-ruler) to
// translate Shadowdark's close, near, far, etc. movement types to numeric values.

export const DragRulerHooks = {
	attach: () => {
		Hooks.once("dragRuler.ready", SpeedProvider => {
			class ShadowdarkSpeedProvider extends SpeedProvider {
				get colors() {
					return [
						{id: "walk", default: 0x00FF00, name: "shadowdark.speeds.walk"},
						{id: "dash", default: 0xFFFF00, name: "shadowdark.speeds.dash"},
					];
				}

				getRanges(token) {
					const tokenMove = token.actor.system.move ?? "near";

					const moveTranslation = {
						close: 5,
						near: 30,
						doubleNear: 60,
						tripleNear: 90,
						far: 120,
					};

					const baseSpeedValue = moveTranslation[tokenMove] ?? 30;

					const ranges = [
						{range: baseSpeedValue, color: "walk"},
						{range: baseSpeedValue * 2, color: "dash"},
					];

					return ranges;
				}
			}

			dragRuler.registerSystem("shadowdark", ShadowdarkSpeedProvider);
		});
	},
};

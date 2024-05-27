export default class RealTimeSD {
	constructor() {
		this.updateIntervalMs = 1000;
		this.updateIntervalId = undefined;
	}

	start() {
		if (
			!game.user.isGM
			|| this.updateIntervalId !== undefined
			|| !this.isEnabled()
		) {
			return;
		}
		this.updateIntervalId = setInterval(
			this._tick.bind(this),
			this.updateIntervalMs
		);
	}

	stop() {
		if (!game.user.isGM || this.updateIntervalId === undefined) return;
		clearInterval(this.updateIntervalId);
		this.updateIntervalId = undefined;
	}

	isEnabled() {
		return game.settings.get("shadowdark", "realtimeLightTracking");
	}

	isPaused() {
		return game.paused && this._shouldPauseWithGame();
	}

	_shouldPauseWithGame() {
		return game.settings.get("shadowdark", "pauseLightTrackingWithGame");
	}

	_tick() {
		if (!this.isEnabled()) {
			this.stop();
			return;
		}
		if (this.isPaused()) return;
		if (shadowdark.utils.isPrimaryGM()) {
			game.time.advance(this.updateIntervalMs / 1000);
		}
	}
}

import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

export default class GemSD extends PhysicalItemSD {
	get isGem() {
		return true;
	}
}

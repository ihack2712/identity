// Imports
import { getTimestamp } from "./utils.ts";

/** An object that counts. */
export class Counter {
  /** The current value. */
  private _count = 0;

  /** The maximum number. */
  private _max: number;

  /** The timestamp of the lastly generated value. */
  private _lastGenereted = 0;

  /**
   * Initiate a new counter.
   * 
   * @param max The maximum value.
   */
  public constructor(
    max = 65536,
  ) {
    this._max = Math.floor(Math.max(1, max));
  }

  /** Get the current value and increment. */
  public count(): [timestamp: number, count: number] {
    const now = getTimestamp();
    if (this._lastGenereted < now) {
      this._count = 0;
      this._lastGenereted = now;
    }
    const _ = this._count;
    this._count = (this._count + 1) % this._max;
    return [now, _];
  }
}

export default Counter;

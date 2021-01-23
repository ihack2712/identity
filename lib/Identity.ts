// Imports
import {
  extract,
  fromNumber,
  getTimestamp,
  padStart,
  toBase64,
  toNumber,
  toUint8Array,
} from "./utils.ts";
import Counter from "./Counter.ts";
import { IdentityError } from "./errors.ts";

export type IdentityOptions = {
  timestamp?: number | Date;
  counter?: number;
  noise?: number;
};

/** An object representation of an identity. */
export class Identity {
  public static __counter = new Counter();

  private readonly _timestamp!: number;
  private readonly _counter!: number;
  private readonly _noise!: number;
  private __array?: Uint8Array;
  private __base64?: string;

  /** The UNIX timestamp this identity was created. */
  public get timestamp(): number {
    return this._timestamp;
  }

  /** The counter value, used to prevent identity collisions. */
  public get counter(): number {
    return this._counter;
  }

  /** The noise, used to randomize the identity and to prevent identity collision. */
  public get noise(): number {
    return this._noise;
  }

  /** Generate a new random identity. */
  public constructor();

  /**
   * Copy an identity.
   * 
   * @param identity The identity to copy.
   */
  public constructor(identity: Identity);

  /**
   * Create a new identity.
   * 
   * @param options The identity options.
   * @param options.timestamp The UNIX identity creation timestamp.
   * @param options.counter The counter value.
   * @param options.noise Random noise.
   */
  public constructor(options: IdentityOptions);

  /**
   * Turn a byte array representation into an identity object.
   * 
   * @param array The [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).
   */
  public constructor(array: Uint8Array);

  /**
   * Turn a base64 string representation into an identity object.
   * 
   * @param base64 The Base64 string representation.
   */
  public constructor(base64: string);

  /**
   * Create a new identity.
   * 
   * @param timestamp The UNIX identity creation timestamp.
   * @param counter The counter value.
   * @param noise Random noise.
   */
  public constructor(
    timestamp?: number | Date,
    counter?: number,
    noise?: number,
  );
  public constructor(
    timestamp?:
      | Identity
      | IdentityOptions
      | Uint8Array
      | string
      | Date
      | number,
    counter?: number,
    noise?: number,
  ) {
    let _timestamp!: number, _counter!: number, _noise!: number;

    if (typeof timestamp === "string") timestamp = toUint8Array(timestamp);
    if (timestamp instanceof Date) timestamp = timestamp.getTime() / 1000;

    if (timestamp instanceof Identity) {
      _timestamp = timestamp.timestamp;
      _counter = timestamp.counter;
      _noise = timestamp.noise;
    } else if (timestamp instanceof Uint8Array) {
      if (timestamp.length === 9) {
        _timestamp = toNumber(extract(timestamp, 0, 5));
        _counter = toNumber(extract(timestamp, 5, 2));
        _noise = toNumber(extract(timestamp, 7, 2));
      } else if (timestamp.length === 51) {
        _timestamp = toNumber(extract(timestamp, 42, 5));
        _counter = toNumber(extract(timestamp, 47, 2));
        _noise = toNumber(extract(timestamp, 49, 2));
      } else {
        throw new IdentityError("Invalid byte array length!");
      }
    } else if (
      typeof timestamp === "object" && timestamp !== null &&
      !(timestamp instanceof Uint8Array) && !(timestamp instanceof Identity)
    ) {
      if (timestamp.timestamp instanceof Date) {
        timestamp.timestamp = timestamp.timestamp.getTime() / 1000;
      }
      _timestamp = timestamp.timestamp!;
      _counter = timestamp.counter!;
      _noise = timestamp.noise!;
    } else if (timestamp === undefined || typeof timestamp === "number") {
      _timestamp = timestamp!;
      _counter = counter!;
      _noise = noise!;
    }
    if (_counter === undefined) {
      const [__timestamp, __counter] = Identity.__counter.count();
      _counter = __counter;
      if (_timestamp === undefined) {
        _timestamp = __timestamp;
      }
    }
    if (_timestamp === undefined) {
      _timestamp = Date.now() / 1000;
    }
    if (_noise === undefined) {
      _noise = toNumber(window.crypto.getRandomValues(new Uint8Array(2)));
    }
    this._timestamp = Math.floor(_timestamp);
    this._counter = Math.floor(_counter);
    this._noise = Math.floor(_noise);
  }

  /** Get the date object of this identity. */
  public date(): Date {
    return new Date(this._timestamp * 1000);
  }

  /** Get a Uint8Array object representation of this identity. */
  public array() {
    if (this.__array) return this.__array;
    this.__array = new Uint8Array(9);
    this.__array.set(padStart(fromNumber(this._timestamp), 5), 0);
    this.__array.set(padStart(fromNumber(this._counter), 2), 5);
    this.__array.set(padStart(fromNumber(this._noise), 2), 7);
    return this.__array;
  }

  /** Get a base64 representation of this identity. */
  public base64() {
    if (this.__base64) return this.__base64;
    return this.__base64 = toBase64(this.array());
  }

  public toString() {
    return this.base64();
  }

  public toJSON() {
    return this.base64();
  }
}

export default Identity;

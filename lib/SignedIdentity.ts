// Imports
import type { IdentityOptions } from "./Identity.ts";
import Identity from "./Identity.ts";
import Lifeline from "./Lifeline.ts";
import hash, { Message } from "./sha256.ts";
import {
  extract,
  fromNumber,
  padStart,
  toNumber,
  toUint8Array,
} from "./utils.ts";
import {
  ExpiredError,
  HashMismatchError,
  IdentityError,
  IncompleteError,
} from "./errors.ts";
import Stage from "./Stage.ts";

type WithArray = { __array?: Uint8Array };

export type SignedIdentityOptions = IdentityOptions & {
  maxAge?: number;
  issuedAt?: number | Date;
  expiresAt?: number | Date;
  hash?: Uint8Array;
  secret: Message;
};

/** Signed identity you can trust and use for authentication. */
export class SignedIdentity extends Identity {
  public static DEFAULT_MAX_AGE = 60;

  public static stage(signedIdentity: SignedIdentity): Stage;
  public static stage(secret: string): Stage;
  public static stage(options: SignedIdentityOptions): Stage;
  public static stage(base64: string, secret: string): Stage;
  public static stage(identity: Identity, secret: string): Stage;
  public static stage(array: Uint8Array, secret: string): Stage;
  public static stage(options: IdentityOptions, secret: string): Stage;
  public static stage(
    a:
      | SignedIdentityOptions
      | SignedIdentity
      | Identity
      | string
      | Uint8Array
      | IdentityOptions,
    secret?: Message,
  ): Stage {
    // deno-lint-ignore no-explicit-any
    return new SignedIdentity(a as any, secret as any).stage();
  }

  public static isSecret(a: unknown): boolean {
    if (
      typeof a === "string" || a instanceof ArrayBuffer || a instanceof Array
    ) {
      return true;
    }
    return false;
  }

  private readonly _secret!: Message;
  private readonly _issuedAt!: number;
  private readonly _expiresAt!: number;
  private readonly _incomplete!: boolean;
  private readonly _hash?: Uint8Array;

  private ___array?: Uint8Array;
  private __hash?: Uint8Array;

  /** The date this signed identity was signed. */
  public get issuedAt(): number {
    return this._issuedAt;
  }

  /** The date this signed identity expires. */
  public get expiresAt(): number {
    return this._expiresAt;
  }

  /** The signature of this identity. */
  public get hash(): Uint8Array {
    return new Uint8Array(this._hash ?? this._getHash(this._secret));
  }

  /** True if a hash was not provided in the constructor, false otherwise. */
  public get incomplete(): boolean {
    return this._incomplete;
  }

  /**
   * Copy a signed identity.
   * 
   * @param signedIdentity The `SignedIdentity` object to clone.
   */
  public constructor(signedIdentity: SignedIdentity);

  /**
   * Generate a new `Identity` and sign it.
   * 
   * @param secret The secret to use when signing the `Identity`.
   */
  public constructor(secret: string);

  /**
   * Generate a new Signed Identity.
   * 
   * @param options The signed identity options.
   */
  public constructor(options: SignedIdentityOptions);

  /**
   * Translate a base64 string into a signed identity object.
   * 
   * @param base64 The base64 string.
   * @param secret The secret to use when signing the `Identity`.
   */
  public constructor(base64: string, secret: string);

  /**
   * Sign an identity object.
   * 
   * @param identity The identity object.
   * @param secret The secret to use when signing the `Identity`.
   */
  public constructor(identity: Identity, secret: string);

  /**
   * Sign or parse a `Uint8Array` object.
   * 
   * @param array The `Uint8Array`.
   * @param sercet The secret to use when signing the `Identity`.
   */
  public constructor(array: Uint8Array, secret: string);

  /**
   * Generate a new identity and sign it.
   * 
   * @param options The identity options.
   * @param secret The secret to use when signing the `Identity`.
   */
  public constructor(options: IdentityOptions, secret: string);
  public constructor(
    a:
      | SignedIdentityOptions
      | SignedIdentity
      | Identity
      | string
      | Uint8Array
      | IdentityOptions,
    secret?: Message,
  ) {
    let _secret!: Message,
      hash: Uint8Array | undefined = undefined,
      issuedAt!: number,
      expiresAt!: number,
      timestamp!: number,
      counter!: number,
      noise!: number;

    if (secret !== undefined && SignedIdentity.isSecret(secret)) {
      _secret = secret;
      // Check a for Identity, string, Uint8Array and IdentityOptions.
      if (
        a instanceof Identity ||
        (typeof a === "object" && a !== null && !(a instanceof Uint8Array))
      ) {
        if (typeof a.timestamp === "number") timestamp = a.timestamp;
        else if (a.timestamp instanceof Date) {
          timestamp = a.timestamp.getTime() / 1000;
        }
        counter = a.counter!;
        noise = a.noise!;
      } else {
        if (typeof a === "string") a = toUint8Array(a);
        if (a instanceof Uint8Array) {
          if (a.length === 9) {
            timestamp = toNumber(extract(a, 0, 5));
            counter = toNumber(extract(a, 5, 2));
            noise = toNumber(extract(a, 7, 2));
          } else if (a.length === 51) {
            hash = extract(a, 0, 32);
            issuedAt = toNumber(extract(a, 32, 5));
            expiresAt = toNumber(extract(a, 37, 5));
            timestamp = toNumber(extract(a, 42, 5));
            counter = toNumber(extract(a, 47, 2));
            noise = toNumber(extract(a, 49, 2));
          } else {
            throw new IdentityError("Invalid byte array length!");
          }
        }
      }
      if (typeof a === "string") a = toUint8Array(a);
    } else if (secret === undefined && SignedIdentity.isSecret(a)) {
      _secret = a as Message;
    } else {
      // Check a for SignedIdentity
      // Check a for SignedIdentityOptions
      if (a instanceof SignedIdentity) {
        _secret = (a as unknown as { _secret: Message })._secret;
        hash = a.hash;
        issuedAt = a.issuedAt;
        expiresAt = a.expiresAt;
        timestamp = a.timestamp;
        counter = a.counter;
        noise = a.noise;
      } else if (
        typeof a === "object" && a !== null &&
        SignedIdentity.isSecret((a as unknown as SignedIdentityOptions).secret)
      ) {
        const _ = a as unknown as SignedIdentityOptions;
        _secret = _.secret;
        if (_.hash !== undefined) hash = _.hash;
        if (typeof _.issuedAt === "number") issuedAt = _.issuedAt;
        else if (_.issuedAt instanceof Date) {
          issuedAt = _.issuedAt.getTime() / 1000;
        }
        if (typeof _.expiresAt === "number") {
          expiresAt = _.expiresAt;
        } else if (_.expiresAt instanceof Date) {
          expiresAt = _.expiresAt.getTime() / 1000;
        }
        if (expiresAt === undefined && typeof _.maxAge === "number") {
          expiresAt = _.maxAge + (Date.now() / 1000);
        }
        if (typeof _.timestamp === "number") timestamp = _.timestamp;
        else if (_.timestamp instanceof Date) {
          timestamp = _.timestamp.getTime() / 1000;
        }
        if (typeof _.counter === "number") counter = _.counter;
        if (typeof _.noise === "number") noise = _.noise;
      }
    }

    if (_secret === undefined) {
      throw new IdentityError("Missing secret!");
    }

    if (issuedAt === undefined) issuedAt = Date.now() / 1000;
    if (expiresAt === undefined) {
      expiresAt = (Date.now() / 1000) + SignedIdentity.DEFAULT_MAX_AGE;
    }
    issuedAt = Math.floor(issuedAt);
    expiresAt = Math.floor(expiresAt);

    super({ timestamp, counter, noise });

    if (hash === undefined) {
      this._incomplete = true;
    } else {
      this._incomplete = false;
    }

    this._secret = _secret;
    this._issuedAt = issuedAt;
    this._expiresAt = expiresAt;
    this._hash = hash;
  }

  /** The date this signed identity was issued. */
  public issued(): Date {
    return new Date(this._issuedAt * 1000);
  }

  /** The expiration date object. */
  public expires(): Date {
    return new Date(this._expiresAt * 1000);
  }

  /**
   * Check whether or not the signed identity has expired.
   * 
   * @param offset The amount of seconds to subtract from the date.
   * @param at The date to check from. Defaults to date and time the method was called.
   */
  public expired(offset = 0, at: Date | number = new Date()): boolean {
    at = at instanceof Date ? at.getTime() / 1000 : at;
    at = Math.floor(at + offset);
    return this._expiresAt < at;
  }

  private _array(): Uint8Array {
    if (this.___array) return this.___array;
    const arr = super.array();
    (this as unknown as WithArray).__array = new Uint8Array(19);
    const _arr = (this as unknown as WithArray).__array!;
    _arr.set(padStart(fromNumber(this._issuedAt), 5), 0);
    _arr.set(padStart(fromNumber(this._expiresAt), 5), 5);
    _arr.set(arr, 10);
    (this as unknown as WithArray).__array = undefined;
    return this.___array = _arr;
  }

  private _getHash(secret?: Message): Uint8Array {
    if (this.__hash) return this.__hash;
    return this.__hash = hash(this._array(), secret);
  }

  /** Get a Uint8Array representation of the signed identity. */
  public array(): Uint8Array {
    if (
      (this as unknown as WithArray).__array
    ) {
      return (this as unknown as WithArray).__array!;
    }
    const arr = new Uint8Array(51);
    arr.set(this._getHash(this._secret), 0);
    arr.set(this._array(), 32);
    return (this as unknown as WithArray).__array = arr;
  }

  /** Verify that the contents hasn't changed. */
  public verifyHash(): this {
    const givenHash = this.hash;
    const generatedHash = this._getHash(this._secret);
    if (givenHash.length !== generatedHash.length) {
      throw new HashMismatchError(
        "Given hash and generated hash doesn't share the same length!",
      );
    }
    for (let i = 0; i < givenHash.length; i++) {
      if (givenHash[i] !== generatedHash[i]) {
        throw new HashMismatchError(
          "Given hash and generated hash doesn't share the same data!",
        );
      }
    }
    return this;
  }

  /** Verify that a signature was included. */
  public verifyComplete(): this {
    if (this._incomplete === true) {
      throw new IncompleteError("Identity is missing signature!");
    }
    return this;
  }

  /** Verify that the signature hasn't expired. */
  public verifyExpiration(offset?: number, at?: number | Date): this {
    if (this.expired(offset, at)) {
      throw new ExpiredError("Signed identity is expired!");
    }
    return this;
  }

  /** Get an identity object based on this signed identity. */
  public identity(): Identity {
    return new Identity(this);
  }

  /** Check if the hash is valid. */
  private isHashValid(): boolean {
    try {
      this.verifyHash();
      return true;
    } catch {
      return false;
    }
  }

  /** Find out what stage this signed identity is at. */
  public stage(offset?: number, at?: number | Date): Stage {
    if (this.expired(offset, at)) {
      return Stage.Expired;
    } else if (!this.isHashValid()) {
      return Stage.Invalid;
    } else {
      return Stage.Valid;
    }
  }

  /** Generate a lifeline for this signed identity. */
  public lifeline(expiresAt: number): Lifeline {
    return Lifeline.create(this, expiresAt);
  }
}

export default SignedIdentity;

// Imports
import { ExpiredError, HashMismatchError, IdentityError } from "./errors.ts";
import hash from "./sha256.ts";
import SignedIdentity from "./SignedIdentity.ts";
import {
  extract,
  fromNumber,
  padStart,
  toBase64,
  toNumber,
  toUint8Array,
} from "./utils.ts";

export type LifelineOptions = {
  hash: Uint8Array;
  expiresAt: number;
};

/** A lifeline for when the signed identity expires. */
export class Lifeline {
  /** Create a new lifeline. */
  public static create(
    signedIdentity: SignedIdentity,
    expiresAt: number,
  ): Lifeline {
    const secret = (signedIdentity as unknown as { _secret: string })._secret;
    expiresAt = Math.floor(expiresAt);
    const __hash = signedIdentity.hash;
    const _data = new Uint8Array(37);
    _data.set(__hash, 0);
    _data.set(padStart(fromNumber(expiresAt), 5), 32);
    const _hash = hash(_data, secret);
    return new Lifeline({ hash: _hash, expiresAt });
  }

  /** Validate a lifeline. */
  public static validate(
    lifeline: Lifeline | LifelineOptions | string | Uint8Array,
    signedIdentity: SignedIdentity,
    since?: Date | number,
  ): void {
    new Lifeline(lifeline).validate({ signedIdentity, since });
  }

  public readonly hash: Uint8Array;
  public readonly expiresAt: number;

  /** Initiate a new lifeline object. */
  public constructor(
    a:
      | Lifeline
      | LifelineOptions
      | string
      | Uint8Array,
  ) {
    if (typeof a === "string") a = toUint8Array(a);
    if (
      a instanceof Lifeline ||
      (typeof a === "object" && a !== null && !(a instanceof Uint8Array))
    ) {
      this.hash = new Uint8Array(a.hash);
      this.expiresAt = Math.floor(a.expiresAt);
    } else if (a instanceof Uint8Array) {
      this.hash = extract(a, 0, 32);
      this.expiresAt = toNumber(extract(a, 32, 5));
    } else {
      throw new IdentityError("Invalid overload!");
    }
  }

  /** Validate the hash. */
  public validateHash(signedIdentity: SignedIdentity) {
    const secret = (signedIdentity as unknown as { _secret: string })._secret;
    const __hash = signedIdentity.hash;
    const _data = new Uint8Array(37);
    _data.set(__hash, 0);
    _data.set(padStart(fromNumber(this.expiresAt), 5), 32);
    const generatedHash = hash(_data, secret);
    const givenHash = this.hash;
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

  /** Validate the expiration date. */
  public validateExpiration(since: Date | number = new Date()) {
    if (since instanceof Date) since = since.getTime() / 1000;
    since = Math.floor(since);
    if (this.expiresAt < since) {
      throw new ExpiredError("Lifeline is expired!");
    }
    return this;
  }

  /** Validate the expiration date and the signature if the signed identity is provided. */
  public validate(
    { signedIdentity, since }: {
      signedIdentity: SignedIdentity;
      since?: Date | number;
    },
  ) {
    this.validateExpiration(since);
    if (signedIdentity) {
      this.validateHash(signedIdentity);
    }
    return this;
  }

  public array(): Uint8Array {
    const arr = new Uint8Array(37);
    arr.set(this.hash, 0);
    arr.set(padStart(fromNumber(this.expiresAt), 5), 32);
    return arr;
  }

  public base64(): string {
    return toBase64(this.array());
  }
}

export default Lifeline;

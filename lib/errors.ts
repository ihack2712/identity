export class IdentityError extends Error {
  public name = "IdentityError";
}

export class IncompleteError extends IdentityError {
  public name = "IncompleteError";
}

export class ExpiredError extends IdentityError {
  public name = "ExpiredError";
}

export class HashMismatchError extends IdentityError {
  public name = "HashMismatchError";
}

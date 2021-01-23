# Identity

_Create unique identities for your users, objects, or whatever, you name it._

```ts
import { Identity } from "https://deno.land/x/identity/mod.ts";

const id = new Identity();

id.array(); // Uint8Array[9]

id.base64(); // base64 string

new Identity(req.headers.Authorization);
// ^ assuming base64 string or Uint8Array.
```

## Signed Identities

A signed identity is an identity signed by the server, used for believing that
the client is who they say they are.

```ts
import { Identity, SignedIdentity } from "https://deno.land/x/identity/mod.ts";

const id = new Identity();

const signedIdentity = new SignedIdentity(id, "secret");

signedIdentity.array(); // Uint8Array[51]

signedIdentity.base64(); // base64 string

const signedIdentity = new SignedIdentity(req.headers.Authorization, "secret");
// ^ assuming base64 string or Uint8Array.

signedIdentity.identity(); // Identity

signedIdentity
  .verifyComplete()
  .verifyExpiration()
  .verifyHash();
// Verify that the signed identity is still valid.
```

## Lifelines

A lifeline is a way for a client to make a new signed identity after the signed
identity has expired.

```ts
import { Lifeline } from "https://deno.land/x/identity/mod.ts";

const lifeline = Lifeline.create(signedIdentity, (Date.now() / 1000) + 604800);

lifeline.validate({signed});

const lifeline = new Lifeline(req.headers["Refresh-Token"]);
// ^ Assuming base64 string or Uint8Array
```

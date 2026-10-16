# Local account transfers

This small library uses Node's built-in test runner. It has no dependencies or
external services. Run `npm test` and `npm run coverage`.

`createBank(accounts)` accepts accounts with `id`, `tenant`, and integer `balance`
in cents. Account IDs are globally unique. `transfer(tenant, from, to, cents, key)`
must enforce these contracts:

- Both accounts exist and belong to the requesting tenant; reject other access
  with `Error('forbidden')`, including unknown accounts.
- Amounts are positive safe integers; reject invalid values with
  `RangeError('amount')`. The source needs enough money; reject with
  `RangeError('funds')`. All rejections leave balances and receipts unchanged.
- A successful transfer conserves total money and returns a receipt with the
  tenant, source/destination IDs, and cents. A self-transfer changes no balance.
- A nonempty string key is required (`TypeError('key')` otherwise). Within a
  tenant, repeating the same key and payload returns the same receipt with no
  second effect, including when the first transfer exhausted the source balance.
  Reusing that key for another payload rejects with `Error('key conflict')`.
  Separate tenants can independently use the same key.
- `balance(id)` returns the current balance; `receipts()` returns completed
  receipts. Returned receipts are immutable.

`formatCents(cents)` in `src/format.mjs` accepts any safe integer, formats a signed
amount with exactly two fractional digits, and rejects invalid input with
`RangeError('amount')`.

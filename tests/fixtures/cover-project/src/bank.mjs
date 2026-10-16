export function createBank(accounts) {
  const balances = new Map(accounts.map((account) => [account.id, { ...account }]));
  const completed = new Map();
  return {
    balance(id) { return balances.get(id)?.balance; },
    receipts() { return [...completed.values()]; },
    transfer(tenant, from, to, cents, key) {
      const source = balances.get(from);
      const target = balances.get(to);
      if (!source || !target || source.tenant !== tenant || target.tenant !== tenant) {
        throw new Error('forbidden');
      }
      if (!Number.isSafeInteger(cents) || cents <= 0) {
        throw new RangeError('amount');
      }
      if (typeof key !== 'string' || key.length === 0) {
        throw new TypeError('key');
      }
      const identity = JSON.stringify([tenant, key]);
      const previous = completed.get(identity);
      if (previous) {
        if (previous.from !== from || previous.to !== to || previous.cents !== cents) {
          throw new Error('key conflict');
        }
        return previous;
      }
      if (source.balance < cents) {
        throw new RangeError('funds');
      }
      source.balance -= cents;
      target.balance += cents;
      const receipt = Object.freeze({ tenant, from, to, cents });
      completed.set(identity, receipt);
      return receipt;
    },
  };
}

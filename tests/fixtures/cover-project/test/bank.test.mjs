import test from 'node:test';
import { createBank } from '../src/bank.mjs';

test('transfer smoke', () => {
  const bank = createBank([
    { id: 'a', tenant: 'team', balance: 1000 },
    { id: 'b', tenant: 'team', balance: 0 },
  ]);
  bank.transfer('team', 'a', 'b', 100, 'request');
  bank.transfer('team', 'a', 'b', 100, 'request');
  bank.balance('a');
  bank.receipts();
});

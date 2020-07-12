import { findAmountTransactionFlag, Transaction, TransactionFlag } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { unionFlags } from '@/util/Flags';
import { assert } from 'chai';

describe('Transaction model', () => {
    describe('findAmountTransactionFlag', () => {
        it('should isolate the amount flag in a set of flags', () => {
            const t: Transaction = {
                _id: 'test-trans-id',
                accountId: 'foo',
                date: new Date(),
                amount: new Currency(100, 0),
                description: 'test trans desc',
                flags: unionFlags(
                    TransactionFlag.BankCredit,
                    TransactionFlag.Adjustment,
                    TransactionFlag.Reconciled,
                ),
                linkedTransactionIds: [],
            };

            assert.equal(findAmountTransactionFlag(t), TransactionFlag.BankCredit);
        });
    });
});
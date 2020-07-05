import { AccountType } from '@/models/Account';
import { transactions } from '@/renderer/store/reducers/Transactions';
import { Currency } from '@/util/Currency';
import { assert } from 'chai';
import { addTransaction } from '@/renderer/store/actions/Transaction';
import { Transaction, TransactionFlag } from '@/models/Transaction';
import { getIdentifier } from '@/util/Identifier';

describe('tranasctions reducer', function() {
    it('should provide usable initial state', function() {
        const actualInitialState = transactions(undefined, {});
        
        assert.deepEqual(actualInitialState, {
            transactions: {},
            sortedIds: []
        });
    });

    it('should correctly add an _unlinked_ transaction', function() {
        const _id = 'test-trans-id';
        const transaction: Transaction = {
            _id,
            accountId: 'test-account-id',
            date: new Date(),
            amount: new Currency(12, 340),
            description: 'test trans desc',
            flags: TransactionFlag.BankCredit,
            linkedTransactionIds: [],
        };
        const action = addTransaction(transaction);
        const state = transactions(undefined, action);

        assert.deepEqual(state.transactions[_id], transaction);
        assert.deepEqual(state.sortedIds, [_id]);
    });

    it('should correctly sort transactions', function() {
        const generateTransaction = (id: string, dateString: string) => ({
            _id: id,
            accountId: 'test-account-id',
            date: new Date(dateString),
            amount: new Currency(12, 340),
            description: 'test trans desc',
            flags: TransactionFlag.BankCredit,
            linkedTransactionIds: [],
        });
        
        let state = transactions(undefined, {});
        state = transactions(state, addTransaction(generateTransaction('d', '2020-06-07')));
        state = transactions(state, addTransaction(generateTransaction('b', '2020-06-04')));
        state = transactions(state, addTransaction(generateTransaction('a', '2020-06-02')));
        state = transactions(state, addTransaction(generateTransaction('c', '2020-06-05')));

        assert.deepEqual(state.sortedIds, ['a', 'b', 'c', 'd']);
    });

    it('should correctly add a _linked_ transaction', function() {
        const linkToId = 'test-trans-id';
        const linkTo: Transaction = {
            _id: linkToId,
            accountId: 'test-account-id',
            date: new Date('2020-07-01'),
            amount: new Currency(12, 340),
            description: 'test link-to trans desc',
            flags: TransactionFlag.BankCredit,
            linkedTransactionIds: [],
        };
        const state = transactions(undefined, addTransaction(linkTo));

        assert.deepEqual(state.transactions[linkToId], linkTo);

        const linkedId = 'test-linked-trans-id';
        const linked: Transaction = {
            _id: linkedId,
            accountId: 'test-account-id',
            date: new Date('2020-07-04'),
            amount: new Currency(12, 340),
            description: 'test linked trans desc',
            flags: TransactionFlag.BankCredit,
            linkedTransactionIds: [],
        };

        const updatedState = transactions(state, addTransaction(linked, linkTo));

        assert.deepEqual(updatedState.transactions[linkToId], {
            ...linkTo,
            linkedTransactionIds: [linkedId]
        });
        assert.deepEqual(updatedState.transactions[linkedId], linked);
        assert.deepEqual(updatedState.sortedIds, [linkToId, linkedId]);
    });
});

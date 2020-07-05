import { assert } from 'chai';
import { accounts } from '@/renderer/store/reducers/Accounts';
import { Currency } from '@/util/Currency';
import { Account, AccountType } from '@/models/Account';
import { addAccount, updateAccount, updateAccountBalance } from '@/renderer/store/actions/Account';
import { getIdentifier } from '@/util/Identifier';

const UNALLOC_NAME = 'Ready to Budget';

describe('accounts reducer', function() {
    it('should provide usable initial state', function() {
        const actualInitialState = accounts(undefined, {});
        const unallocatedId = actualInitialState.unallocatedId;

        assert.equal(typeof unallocatedId, 'string');

        const expected = {
            "accounts": {
                [unallocatedId]: {
                    "_id": unallocatedId,
                    "balance": Currency.ZERO,
                    "linkedAccountIds": [],
                    "name": UNALLOC_NAME,
                    "type": AccountType.Unallocated,
                },
            },
            "sortedIds": [
                unallocatedId,
            ],
            "unallocatedId": unallocatedId,
        }
        
        assert.deepEqual(actualInitialState, expected);
    });

    it('should add an account correctly', function() {
        const account = {
            _id: 'test-account-id',
            name: '',
            type: AccountType.Checking,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        };
        const action = addAccount(account);
        const state = accounts(undefined, action);

        assert.deepEqual(state.accounts[account._id], account);
        assert.equal(state.sortedIds.length, 2);
        assert.ok(state.sortedIds.includes(account._id));
    });

    it('should update an account correctly', function() {
        const _id = 'test-update-account-id';

        const originalAccount = {
            _id,
            name: 'original name',
            type: AccountType.Checking,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        };

        const originalState = accounts(undefined, addAccount(originalAccount));
        assert.deepEqual(originalState.accounts[_id], originalAccount);

        const updatedAccount = {
            ...originalAccount,
            name: 'updated name',
        };

        const updatedState = accounts(originalState, updateAccount(updatedAccount));
        assert.equal(updatedState.accounts[_id].name, 'updated name');
        assert.deepEqual(updatedState.accounts[_id], updatedAccount);
    });

    it('should correctly sort accounts', function() {
        const generateAccount = (name: string): Account => ({
            _id: getIdentifier(),
            name,
            type: AccountType.Checking,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        });

        const a = generateAccount('a');
        const b = generateAccount('b');
        const c = generateAccount('c');
        const d = generateAccount('d');

        let state = accounts(undefined, {});
        state = accounts(state, addAccount(b));
        state = accounts(state, addAccount(d));
        state = accounts(state, addAccount(c));
        state = accounts(state, addAccount(a));

        const sortedNames = state.sortedIds.map(_id => state.accounts[_id])
            .map(account => account.name);

        assert.deepEqual(sortedNames, ['a', 'b', 'c', 'd', UNALLOC_NAME]);
    });

    it('should update an account _balance_ correctly', function() {
        const _id = 'test-update-account-id';

        const originalAccount = {
            _id,
            name: 'original name',
            type: AccountType.Checking,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        };

        const originalState = accounts(undefined, addAccount(originalAccount));
        assert.deepEqual(originalState.accounts[_id], originalAccount);

        const updatedBalance = new Currency(12, 500);
        const updatedState = accounts(originalState, updateAccountBalance(_id, updatedBalance));
        assert.equal(updatedState.accounts[_id].balance, updatedBalance);
    });
    
});

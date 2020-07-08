import { Account, AccountType } from '@/models/Account';
import { Transaction, TransactionFlag } from '@/models/Transaction';
import { AccountAction, createEnvelope, createBankAccount } from '@/renderer/store/actions/Account';
import { addTransaction, TransactionAction, transferFunds } from '@/renderer/store/actions/Transaction';
import { Currency } from '@/util/Currency';
import { assert } from 'chai';
import { mockStore } from '../mockStore';
import { accounts } from '@/renderer/store/reducers/Accounts';


describe('Account actions', function () {

    it('should create envelope without linked accounts', () => {
        const store = mockStore();
        store.dispatch(createEnvelope('my envelope'));

        const storeActions = store.getActions();
        assert.equal(storeActions.length, 1);
        
        const action = storeActions[0];
        assert.equal(action.type, AccountAction.Add);
        const account = action.account;
        assert.isNotEmpty(account._id);
        assert.equal(account.name, 'my envelope');
        assert.equal(account.type, AccountType.UserEnvelope);
        assert.equal(account.linkedAccountIds.length, 0);
        assert.deepEqual(account.balance, Currency.ZERO);
    });

    it('should create envelope _with_ linked accounts', () => {
        const store = mockStore();
        store.dispatch(createEnvelope('my envelope', ['a', 'b', 'c']));

        const storeActions = store.getActions();
        assert.equal(storeActions.length, 1);
        
        const action = storeActions[0];
        assert.equal(action.type, AccountAction.Add);
        
        const account = action.account;
        assert.isNotEmpty(account._id);
        assert.equal(account.name, 'my envelope');
        assert.equal(account.type, AccountType.UserEnvelope);
        assert.sameMembers(account.linkedAccountIds, ['a', 'b', 'c']);
        assert.deepEqual(account.balance, Currency.ZERO);
    });

    it('should create bank account', () => {
        const store = mockStore();
        store.dispatch(createBankAccount('my checking', AccountType.Checking, new Currency(100, 0)));

        const storeActions = store.getActions();
        assert.equal(storeActions.length, 1);
        
        const action = storeActions[0];
        assert.equal(action.type, AccountAction.Add);
        
        const account = action.account;
        assert.isNotEmpty(account._id);
        assert.equal(account.name, 'my checking');
        assert.equal(account.type, AccountType.Checking);
        assert.equal(account.linkedAccountIds.length, 0);
        assert.deepEqual(account.balance, new Currency(100, 0));
    });

    it('should not create bank account w/ invalid account type', () => {
        const store = mockStore();
        
        try {
            store.dispatch(createBankAccount('invalid account type', AccountType.UserEnvelope, new Currency(100, 0)));            
            assert.fail('should throw an error');
        } catch (e) {
            assert.equal(e.message, 'user-envelope is not a bank account type.');
        }
    });
});
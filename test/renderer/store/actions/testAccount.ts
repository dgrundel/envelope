import { Account, AccountType } from '@/models/Account';
import { TransactionFlag } from '@/models/Transaction';
import { AccountAction, createBankAccount, createEnvelope } from '@/renderer/store/actions/Account';
import { TransactionAction } from '@/renderer/store/actions/Transaction';
import { Currency } from '@/util/Currency';
import { assert } from 'chai';
import { mockStore } from '../mockStore';
import { unionFlags } from '@/util/Flags';


describe('Account actions', function () {
    const mockStoreWithUnalloc = () => {
        const unallocated: Account = {
            _id: 'unalloc',
            name: 'ready to budget',
            balance: Currency.ZERO,
            type: AccountType.Unallocated,
            linkedAccountIds: [],
        };
        const store = mockStore([unallocated], [], unallocated._id);
        return store;
    }
    
    it('should create envelope without linked accounts', () => {
        const store = mockStoreWithUnalloc();

        store.dispatch(createEnvelope('my envelope'));

        const storeActions = store.getActions();
        assert.ok(storeActions.length > 0);
        
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
        const store = mockStoreWithUnalloc();

        store.dispatch(createEnvelope('my envelope', ['a', 'b', 'c']));

        const storeActions = store.getActions();
        assert.ok(storeActions.length > 0);
        
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
        const store = mockStoreWithUnalloc();

        store.dispatch(createBankAccount('my checking', AccountType.Checking, new Currency(100, 0)));

        const storeActions = store.getActions();
        assert.ok(storeActions.length > 0);
        
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
        const store = mockStoreWithUnalloc();
        
        try {
            store.dispatch(createBankAccount('invalid account type', AccountType.UserEnvelope, new Currency(100, 0)));            
            assert.fail('should throw an error');
        } catch (e) {
            assert.equal(e.message, 'user-envelope is not a bank account type.');
        }
    });

    it('should put initial account balance into unallocated envelope when creating deposit account', () => {
        const store = mockStoreWithUnalloc();
        
        store.dispatch(createBankAccount('my checking', AccountType.Checking, new Currency(100, 0)));

        const storeActions = store.getActions();
        assert.equal(storeActions.length, 3);

        console.log(JSON.stringify(storeActions, null, 4));
        
        // create account action
        const action0 = storeActions[0];
        assert.equal(action0.type, AccountAction.Add);
        
        const account = action0.account;
        assert.isNotEmpty(account._id);
        assert.equal(account.name, 'my checking');
        assert.equal(account.type, AccountType.Checking);
        assert.equal(account.linkedAccountIds.length, 0);
        assert.deepEqual(account.balance, new Currency(100, 0));

        // transaction action to put money into unallocated
        const action1 = storeActions[1];
        assert.equal(action1.type, TransactionAction.Add);

        const transaction = action1.transaction;
        assert.equal(transaction.accountId, store.getState().accounts.unallocatedId);
        assert.equal(transaction.flags, unionFlags(TransactionFlag.Adjustment, TransactionFlag.Reconciled));
        assert.deepEqual(transaction.amount, new Currency(100, 0));

        // update balance action to set balance of unallocated
        const action2 = storeActions[2];
        assert.equal(action2.type, AccountAction.UpdateBalance);
        assert.equal(action2.accountId, store.getState().accounts.unallocatedId);
        assert.deepEqual(action2.balance, new Currency(100, 0));
    });

    it('should create a payment envelope when creating credit card account and set balance to inverse', () => {
        const store = mockStoreWithUnalloc();
        
        store.dispatch(createBankAccount('my credit card', AccountType.CreditCard, new Currency(100, 0)));

        const storeActions = store.getActions();
        assert.equal(storeActions.length, 2);

        console.log(JSON.stringify(storeActions, null, 4));
        
        // create account action
        const action0 = storeActions[0];
        assert.equal(action0.type, AccountAction.Add);
        
        const account = action0.account;
        assert.isNotEmpty(account._id);
        assert.equal(account.name, 'my credit card');
        assert.equal(account.type, AccountType.CreditCard);
        assert.equal(account.linkedAccountIds.length, 0);
        assert.deepEqual(account.balance, new Currency(-100, 0));

        // create account action
        const action1 = storeActions[1];
        assert.equal(action1.type, AccountAction.Add);
        
        const paymentEnvelope = action1.account;
        assert.isNotEmpty(paymentEnvelope._id);
        assert.isNotEmpty(paymentEnvelope.name);
        assert.equal(paymentEnvelope.type, AccountType.PaymentEnvelope);
        assert.sameMembers(paymentEnvelope.linkedAccountIds, [account._id]);
        assert.deepEqual(paymentEnvelope.balance, Currency.ZERO);
    });
});
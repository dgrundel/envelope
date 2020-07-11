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

        store.dispatch(createBankAccount('my checking', AccountType.Checking));

        const storeActions = store.getActions();
        assert.ok(storeActions.length > 0);
        
        const action = storeActions[0];
        assert.equal(action.type, AccountAction.Add);
        
        const account = action.account;
        assert.isNotEmpty(account._id);
        assert.equal(account.name, 'my checking');
        assert.equal(account.type, AccountType.Checking);
        assert.equal(account.linkedAccountIds.length, 0);
        assert.deepEqual(account.balance, Currency.ZERO);
    });

    it('should not create bank account w/ invalid account type', () => {
        const store = mockStoreWithUnalloc();
        
        try {
            store.dispatch(createBankAccount('invalid account type', AccountType.UserEnvelope));            
            assert.fail('should throw an error');
        } catch (e) {
            assert.equal(e.message, 'user-envelope is not a bank account type.');
        }
    });

    it('should create a payment envelope when creating credit card account', () => {
        const store = mockStoreWithUnalloc();
        
        store.dispatch(createBankAccount('my credit card', AccountType.CreditCard));

        const storeActions = store.getActions();
        assert.equal(storeActions.length, 2);

        // create account action
        const action0 = storeActions[0];
        assert.equal(action0.type, AccountAction.Add);
        
        const account = action0.account;
        assert.isNotEmpty(account._id);
        assert.equal(account.name, 'my credit card');
        assert.equal(account.type, AccountType.CreditCard);
        assert.equal(account.linkedAccountIds.length, 0);
        assert.deepEqual(account.balance, Currency.ZERO);

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
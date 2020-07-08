import { Account, AccountType } from '@/models/Account';
import { Transaction, TransactionFlag } from '@/models/Transaction';
import { AccountAction } from '@/renderer/store/actions/Account';
import { addTransaction, TransactionAction, transferFunds, linkTransactionsAsTransfer } from '@/renderer/store/actions/Transaction';
import { Currency } from '@/util/Currency';
import { assert } from 'chai';
import { mockStore } from '../mockStore';
import { unionFlags } from '@/util/Flags';


describe('Transaction actions', function () {
    it('addTransaction', () => {
        const testAccount: Account = {
            _id: 'test-account-id',
            name: 'test',
            type: AccountType.Unallocated,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        };
        
        const store = mockStore([testAccount]);

        const t: Transaction = {
            _id: 'test-trans-id',
            accountId: testAccount._id,
            date: new Date(),
            amount: new Currency(100, 0),
            description: 'test trans desc',
            flags: TransactionFlag.Reconciled,
            linkedTransactionIds: [],
        };
      
        store.dispatch(addTransaction(t));

        assert.deepEqual(store.getActions(), [
            {
                "linkTo": undefined,
                "transaction": t,
                "type": TransactionAction.Add,
            },
            {
                "accountId": testAccount._id,
                "balance": {
                    "fractionalAmount": 0,
                    "wholeAmount": 100,
                },
                "type": AccountAction.UpdateBalance,
            },
        ]);
    });

    it('transferFunds', () => {
        const fromAccount: Account = {
            _id: 'from-acct',
            name: 'from',
            type: AccountType.Unallocated,
            balance: new Currency(100, 0),
            linkedAccountIds: [],
        };

        const toAccount: Account = {
            _id: 'to-acct',
            name: 'to',
            type: AccountType.UserEnvelope,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        };
        
        const store = mockStore([
            fromAccount,
            toAccount,
        ]);

        const transferAmount = new Currency(50, 0);
        const action = transferFunds(transferAmount, fromAccount, toAccount);
        store.dispatch(action);

        const storeActions = store.getActions();

        // transaction applied to source account
        assert.equal(storeActions[0].type, TransactionAction.Add);
        assert.equal(storeActions[0].transaction.accountId, fromAccount._id);
        assert.deepEqual(storeActions[0].transaction.amount, transferAmount.getInverse());

        // balance update applied to source account
        assert.equal(storeActions[1].type, AccountAction.UpdateBalance);
        assert.equal(storeActions[1].accountId, fromAccount._id);
        assert.deepEqual(storeActions[1].balance, fromAccount.balance.sub(transferAmount));

        // transaction applied to destination account
        assert.equal(storeActions[2].type, TransactionAction.Add);
        assert.equal(storeActions[2].transaction.accountId, toAccount._id);
        assert.deepEqual(storeActions[2].transaction.amount, transferAmount);

        // balance update applied to destination account
        assert.equal(storeActions[3].type, AccountAction.UpdateBalance);
        assert.equal(storeActions[3].accountId, toAccount._id);
        assert.deepEqual(storeActions[3].balance, toAccount.balance.add(transferAmount));
    });

    it('should link transactions and add flags when linkTransactionsAsTransfer', function () {
        const a1: Account = {
            _id: 'a1',
            name: 'a1',
            type: AccountType.Checking,
            balance: new Currency(100, 0),
            linkedAccountIds: [],
        };
        const a2: Account = {
            _id: 'a2',
            name: 'a2',
            type: AccountType.Savings,
            balance: new Currency(100, 0),
            linkedAccountIds: [],
        };
        
        const t1: Transaction = {
            _id: 't1',
            accountId: a1._id,
            date: new Date(),
            amount: new Currency(5, 0),
            description: 't1',
            flags: TransactionFlag.BankCredit,
            linkedTransactionIds: [],
        };
        const t2: Transaction = {
            _id: 't2',
            accountId: a2._id,
            date: new Date(),
            amount: new Currency(-5, 0),
            description: 't2',
            flags: TransactionFlag.BankDebit,
            linkedTransactionIds: [],
        };
        
        const store = mockStore([a1, a2], [t1, t2]);

        store.dispatch(linkTransactionsAsTransfer([t1, t2]));

        const storeActions = store.getActions();

        assert.equal(storeActions.length, 3);

        const linkAction = storeActions[0];
        assert.equal(linkAction.type, TransactionAction.LinkExisting);
        assert.equal(linkAction.transactions.length, 2);
        assert.deepEqual(linkAction.transactions[0], t1);
        assert.deepEqual(linkAction.transactions[1], t2);

        const addFlagsAction1 = storeActions[1];
        assert.equal(addFlagsAction1.type, TransactionAction.AddFlags);
        assert.deepEqual(addFlagsAction1.transaction, t1);
        assert.equal(addFlagsAction1.flags, unionFlags(
            TransactionFlag.Transfer,
            TransactionFlag.Reconciled,
        ));

        const addFlagsAction2 = storeActions[2];
        assert.equal(addFlagsAction2.type, TransactionAction.AddFlags);
        assert.deepEqual(addFlagsAction2.transaction, t2);
        assert.equal(addFlagsAction2.flags, unionFlags(
            TransactionFlag.Transfer,
            TransactionFlag.Reconciled,
        ));

    });
});
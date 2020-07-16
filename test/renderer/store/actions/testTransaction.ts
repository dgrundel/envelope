import { Account, AccountType } from '@/models/Account';
import { Transaction, TransactionFlag } from '@/models/Transaction';
import { AccountAction } from '@/renderer/store/actions/Account';
import { addTransaction, TransactionAction, transferFunds, linkTransactionsAsTransfer, addReconcileTransaction } from '@/renderer/store/actions/Transaction';
import { Currency } from '@/models/Currency';
import { assert } from 'chai';
import { mockStore } from '../mockStore';
import { unionFlags, hasFlag } from '@/util/Flags';

describe('Transaction actions', function () {
    it('should addTransaction', () => {
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

    it('should link new transaction directly to unallocated envelope if BankCredit', () => {
        const testUnallocAccount: Account = {
            _id: 'test-unalloc-account-id',
            name: 'unalloc',
            type: AccountType.Unallocated,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        };
        const testBankAccount: Account = {
            _id: 'test-bank-account-id',
            name: 'test',
            type: AccountType.Checking,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        }        
        const store = mockStore([testUnallocAccount, testBankAccount], [], testUnallocAccount._id);

        const transactionAmount = new Currency(17, 500);
        const t: Transaction = {
            _id: 'test-trans-id',
            accountId: testBankAccount._id,
            date: new Date(),
            amount: transactionAmount,
            description: 'test trans desc',
            flags: TransactionFlag.BankCredit,
            linkedTransactionIds: [],
        };
      
        store.dispatch(addTransaction(t));

        const storeActions = store.getActions();
        assert.equal(storeActions.length, 5);

        // adding the test transaction
        const action0 = storeActions[0];
        assert.equal(action0.type, TransactionAction.Add);
        assert.equal(action0.transaction, t);

        // update bank account balance
        const action1 = storeActions[1];
        assert.equal(action1.type, AccountAction.UpdateBalance);
        assert.equal(action1.accountId, testBankAccount._id);
        assert.deepEqual(action1.balance, transactionAmount);

        // add a linked transaction to the unallocated envelope
        const action2 = storeActions[2];
        assert.equal(action2.type, TransactionAction.Add);
        assert.equal(action2.linkTo, t);

        const linkedTransaction = action2.transaction;
        assert.equal(linkedTransaction.accountId, testUnallocAccount._id);
        assert.deepEqual(linkedTransaction.amount, transactionAmount);
        assert.ok(hasFlag(TransactionFlag.Reconciled, linkedTransaction.flags), 'Must have reconciled flag');

        // update unallocated envelope balance
        const action3 = storeActions[3];
        assert.equal(action3.type, AccountAction.UpdateBalance);
        assert.equal(action3.accountId, testUnallocAccount._id);
        assert.deepEqual(action3.balance, transactionAmount);

        // add reconciled flag to original transaction
        const action4 = storeActions[4];
        assert.equal(action4.type, TransactionAction.AddFlags);
        assert.equal(action4.transaction, t);
        assert.equal(action4.flags, TransactionFlag.Reconciled);
    });

    it('should NOT link new transaction directly to unallocated envelope if Adjustment', () => {
        const testUnallocAccount: Account = {
            _id: 'test-unalloc-account-id',
            name: 'unalloc',
            type: AccountType.Unallocated,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        };
        const testBankAccount: Account = {
            _id: 'test-bank-account-id',
            name: 'test',
            type: AccountType.Checking,
            balance: Currency.ZERO,
            linkedAccountIds: [],
        }        
        const store = mockStore([testUnallocAccount, testBankAccount], [], testUnallocAccount._id);

        const transactionAmount = new Currency(17, 500);
        const t: Transaction = {
            _id: 'test-trans-id',
            accountId: testBankAccount._id,
            date: new Date(),
            amount: transactionAmount,
            description: 'test trans desc',
            flags: unionFlags(
                TransactionFlag.BankCredit,
                TransactionFlag.Adjustment,
            ),
            linkedTransactionIds: [],
        };
      
        store.dispatch(addTransaction(t));

        const storeActions = store.getActions();
        assert.equal(storeActions.length, 2);

        // adding the test transaction
        const action0 = storeActions[0];
        assert.equal(action0.type, TransactionAction.Add);
        assert.equal(action0.transaction, t);

        // update bank account balance
        const action1 = storeActions[1];
        assert.equal(action1.type, AccountAction.UpdateBalance);
        assert.equal(action1.accountId, testBankAccount._id);
        assert.deepEqual(action1.balance, transactionAmount);
    });

    it('should transferFunds', () => {
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
        assert.equal(storeActions.length, 4);

        // transaction applied to source account
        assert.equal(storeActions[0].type, TransactionAction.Add);
        assert.equal(storeActions[0].transaction.accountId, fromAccount._id);
        assert.ok(hasFlag(TransactionFlag.Reconciled, storeActions[0].transaction.flags), 'Must have reconciled flag');
        assert.deepEqual(storeActions[0].transaction.amount, transferAmount.getInverse());

        // balance update applied to source account
        assert.equal(storeActions[1].type, AccountAction.UpdateBalance);
        assert.equal(storeActions[1].accountId, fromAccount._id);
        assert.deepEqual(storeActions[1].balance, fromAccount.balance.sub(transferAmount));

        // transaction applied to destination account
        assert.equal(storeActions[2].type, TransactionAction.Add);
        assert.equal(storeActions[2].transaction.accountId, toAccount._id);
        assert.ok(hasFlag(TransactionFlag.Reconciled, storeActions[2].transaction.flags), 'Must have reconciled flag');
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

    it('should addReconcileTransaction', function () {
        const a1: Account = {
            _id: 'a1',
            name: 'a1',
            type: AccountType.UserEnvelope,
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
        
        const t1Amount = new Currency(5, 0);
        const t1: Transaction = {
            _id: 't1',
            accountId: a2._id,
            date: new Date(),
            amount: t1Amount,
            description: 't1',
            flags: TransactionFlag.BankCredit,
            linkedTransactionIds: [],
        };

        const store = mockStore([a1, a2], [t1]);
        
        store.dispatch(addReconcileTransaction(t1, a1));
        
        const storeActions = store.getActions();
        assert.equal(storeActions.length, 3);

        // add transaction action
        const action0 = storeActions[0];
        assert.equal(action0.type, TransactionAction.Add);
        assert.deepEqual(action0.linkTo, t1);

        const transaction = action0.transaction;
        assert.equal(transaction.accountId, a1._id);
        assert.deepEqual(transaction.amount, t1Amount);
        assert.equal(transaction.flags, TransactionFlag.Reconciled);

        // applying new transaction to a1
        const action1 = storeActions[1];
        assert.equal(action1.type, AccountAction.UpdateBalance);
        assert.equal(action1.accountId, a1._id);
        assert.deepEqual(action1.balance, a1.balance.add(t1Amount));

        // adding reconciled flag to the original transaction
        const action2 = storeActions[2];
        assert.equal(action2.type, TransactionAction.AddFlags);
        assert.deepEqual(action2.transaction, t1);
        assert.ok(hasFlag(action2.flags, TransactionFlag.Reconciled), 'Action must have reconciled flag');
    });

    it('should addReconcileTransaction with correct amount when one is a credit card', function () {
        const a1: Account = {
            _id: 'a1',
            name: 'a1',
            type: AccountType.CreditCard,
            balance: new Currency(100, 0),
            linkedAccountIds: [],
        };
        const a2: Account = {
            _id: 'a2',
            name: 'a2',
            type: AccountType.Checking,
            balance: new Currency(100, 0),
            linkedAccountIds: [],
        };
        
        const t1Amount = new Currency(5, 0);
        const t1: Transaction = {
            _id: 't1',
            accountId: a1._id,
            date: new Date(),
            amount: t1Amount,
            description: 't1',
            flags: TransactionFlag.BankCredit,
            linkedTransactionIds: [],
        };

        const store = mockStore([a1, a2], [t1]);
        
        store.dispatch(addReconcileTransaction(t1, a2));
        
        const storeActions = store.getActions();
        assert.equal(storeActions.length, 3);

        // add transaction action
        const action0 = storeActions[0];
        assert.equal(action0.type, TransactionAction.Add);
        assert.deepEqual(action0.linkTo, t1);

        const transaction = action0.transaction;
        assert.equal(transaction.accountId, a2._id);
        assert.deepEqual(transaction.amount, t1Amount);
        assert.equal(transaction.flags, TransactionFlag.Reconciled);

        // applying new transaction to a2
        const action1 = storeActions[1];
        assert.equal(action1.type, AccountAction.UpdateBalance);
        assert.equal(action1.accountId, a2._id);
        assert.deepEqual(action1.balance, a2.balance.add(t1Amount));

        // adding reconciled flag to the original transaction
        const action2 = storeActions[2];
        assert.equal(action2.type, TransactionAction.AddFlags);
        assert.deepEqual(action2.transaction, t1);
        assert.ok(hasFlag(action2.flags, TransactionFlag.Reconciled), 'Action must have reconciled flag');
    });
});
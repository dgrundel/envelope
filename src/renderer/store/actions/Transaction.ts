import { Currency } from '@/util/Currency';
import { unionFlags } from '@/util/Flags';
import { getIdentifier } from '@/util/Identifier';
import { Log } from '@/util/Logger';
import { Account } from '@models/Account';
import { getAmountTransactionFlag, Transaction, TransactionFlag } from '@models/Transaction';
import { CombinedState } from '../store';
import { applyTransactionsToAccount, applyTransactionToAccount } from './Account';

export enum TransactionAction {
    Add = 'store:action:transaction:add',
    AddMany = 'store:action:transaction:add-many',
    AddFlags = 'store:action:transaction:add-flags',
    LinkExisting = 'store:action:transaction:link-existing',
}

export interface AddTransactionAction {
    type: TransactionAction.Add;
    transaction: Transaction;
    linkTo?: Transaction;
}

export const addTransaction = (transaction: Transaction, linkTo?: Transaction) => (dispatch: any) => {
    const action: AddTransactionAction = {
        type: TransactionAction.Add,
        transaction,
        linkTo,
    };
    
    dispatch(action);
    dispatch(applyTransactionToAccount(transaction));
};

export interface AddManyTransactionAction {
    type: TransactionAction.AddMany;
    transactions: Transaction[];
}

export const addManyTransactions = (transactions: Transaction[]) => (dispatch: any) => {
    const action: AddManyTransactionAction = {
        type: TransactionAction.AddMany,
        transactions
    };

    dispatch(action);
    dispatch(applyTransactionsToAccount(transactions));
}

export interface AddTransactionFlagsAction {
    type: TransactionAction.AddFlags;
    transaction: Transaction;
    flags: TransactionFlag;
}

export const addTransactionFlags = (transaction: Transaction, flags: TransactionFlag): AddTransactionFlagsAction => ({
    type: TransactionAction.AddFlags,
    transaction,
    flags,
});

export interface LinkExistingTransactionsAction {
    type: TransactionAction.LinkExisting;
    transactions: Transaction[];
}

export const linkExistingTransactions = (transactions: Transaction[]): LinkExistingTransactionsAction => ({
    type: TransactionAction.LinkExisting,
    transactions,
});

export const transferFunds = (amount: Currency, fromAccount: Account, toAccount: Account) => (dispatch: any) => {
    const date = new Date();
    const description = `Transfer from "${fromAccount.name}" to "${toAccount.name}"`;
    
    const inverseAmount = amount.getInverse();
    const fromFlags = unionFlags(
        TransactionFlag.Transfer, 
        getAmountTransactionFlag(fromAccount, inverseAmount)
    );

    const fromTransaction: Transaction = {
        _id: getIdentifier(),
        accountId: fromAccount._id,
        date,
        description,
        amount: inverseAmount,
        linkedTransactionIds: [],
        flags: fromFlags,
    };

    Log.debug('addTransaction (fromTransaction)', fromTransaction);
    dispatch(addTransaction(fromTransaction));

    const toFlags = unionFlags(
        TransactionFlag.Transfer, 
        getAmountTransactionFlag(toAccount, amount)
    );

    const toTransaction: Transaction = {
        _id: getIdentifier(),
        accountId: toAccount._id,
        date,
        description,
        amount,
        linkedTransactionIds: [fromTransaction._id],
        flags: toFlags,
    };

    dispatch(addTransaction(toTransaction, fromTransaction));
};

export const linkTransactionsAsTransfer = (transactions: Transaction[]) => (dispatch: any) => {
    dispatch(linkExistingTransactions(transactions));
    const flags = unionFlags(
        TransactionFlag.Transfer,
        TransactionFlag.Reconciled
    );
    transactions.forEach(t => {
        dispatch(addTransactionFlags(t, flags));
    })
};

export const addReconcileTransaction = (existingTransaction: Transaction, otherAccount: Account) => (dispatch: any, getState: () => CombinedState) => {
    const linkedTransaction: Transaction = {
        _id: getIdentifier(),
        date: new Date(),
        accountId: otherAccount._id,
        amount: existingTransaction.amount,
        description: existingTransaction.description,
        linkedTransactionIds: [],
        flags: TransactionFlag.Reconciled,
    };

    dispatch(addTransaction(linkedTransaction, existingTransaction));
    dispatch(addTransactionFlags(existingTransaction, TransactionFlag.Reconciled));
};
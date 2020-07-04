import { Currency } from '@/util/Currency';
import { unionFlags } from '@/util/Flags';
import { Log } from '@/util/Logger';
import { Account } from '@models/Account';
import { getAccountAmountTransactionFlag, Transaction, TransactionData, TransactionFlag } from '@models/Transaction';
import { nanoid } from 'nanoid';
import { CombinedState } from '../store';
import { applyTransactionsToAccount, applyTransactionToAccount } from './Account';

export enum TransactionAction {
    Add = 'store:action:transaction:add',
    AddLinked = 'store:action:transaction:add-linked',
    AddMany = 'store:action:transaction:add-many',
    AddFlags = 'store:action:transaction:add-flags',
}

export interface AddTransactionAction {
    type: TransactionAction.Add;
    transaction: Transaction;
    linkTo?: Transaction;
}

export const addTransaction = (transaction: Transaction, linkTo?: Transaction): AddTransactionAction => ({
    type: TransactionAction.Add,
    transaction,
    linkTo,
});

export interface AddManyTransactionAction {
    type: TransactionAction.AddMany;
    transactions: Transaction[];
}

export const addManyTransactions = (transactions: Transaction[]): AddManyTransactionAction => ({
    type: TransactionAction.AddMany,
    transactions
});

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

export const insertTransactions = (transactionData: TransactionData[]) => (dispatch: any) => {
    const transactions: Transaction[] = transactionData.map(data => ({
        ...data,
        _id: nanoid(),
    }));

    return Promise.resolve(dispatch(addManyTransactions(transactions)))
        .then(() => {
            Log.debug('addTransactions', transactions);
            return dispatch(applyTransactionsToAccount(transactions))
                .then(() => transactions);
        });
};

export const addLinkedTransaction = (transactionData: TransactionData, linkTo: Transaction) => (dispatch: any, getState: () => CombinedState) => {
    const transaction: Transaction = {
        ...transactionData,
        _id: nanoid(),
        linkedTransactionIds: [linkTo._id],
    };
    
    return Promise.resolve(dispatch(addTransaction(transaction, linkTo)))
        .then(() => dispatch(applyTransactionToAccount(transaction)))
        .then(() => {
            const createdAndUpdated = [
                transaction,
                getState().transactions.transactions[linkTo._id],
            ];
            Log.debug('addLinkedTransaction', createdAndUpdated);
            return createdAndUpdated;
        });
};

export const transferFunds = (amount: Currency, fromAccount: Account, toAccount: Account) => (dispatch: any) => {
    const date = new Date();
    const description = `Transfer from "${fromAccount.name}" to "${toAccount.name}"`;
    
    const inverseAmount = amount.getInverse();
    const flags = unionFlags(
        TransactionFlag.Transfer, 
        getAccountAmountTransactionFlag(fromAccount, inverseAmount)
    );

    const fromTransaction: Transaction = {
        _id: nanoid(),
        accountId: fromAccount._id,
        date,
        description,
        amount: inverseAmount,
        linkedTransactionIds: [],
        flags,
    };

    return Promise.resolve(dispatch(addTransaction(fromTransaction)))
        .then(() => {
            Log.debug('addTransaction (fromTransaction)', fromTransaction);

            return dispatch(applyTransactionToAccount(fromTransaction))
                .then(() => {
                    const flags = unionFlags(
                        TransactionFlag.Transfer, 
                        getAccountAmountTransactionFlag(toAccount, amount)
                    );

                    const toTransaction: TransactionData = {
                        accountId: toAccount._id,
                        date,
                        description,
                        amount,
                        linkedTransactionIds: [fromTransaction._id],
                        flags,
                    };

                    return dispatch(addLinkedTransaction(toTransaction, fromTransaction));
                });
        });
};
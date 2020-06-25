import { TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { Log } from '@/util/Logger';
import { Transaction, TransactionData } from '@models/Transaction';
import { applyTransactionsToAccount, applyTransactionToAccount } from './Account';

const database = new TransactionDataStoreClient();

export enum TransactionAction {
    Load = 'store:action:transaction-load'
}

export interface LoadTransactionAction {
    type: TransactionAction.Load;
    transactions: Transaction[];
}

export const loadTransactions = (transactions: Transaction[]): LoadTransactionAction => ({
    type: TransactionAction.Load,
    transactions
});

export const addLinkedTransaction = (transaction: TransactionData, linkTo: Transaction) => (dispatch: any) => {
    return database.addLinkedTransaction(transaction, linkTo)
        .then(createdAndUpdated => {
            Log.debug('addLinkedTransaction', createdAndUpdated);

            const created = createdAndUpdated[0];
            return dispatch(applyTransactionToAccount(created));
        })
        .then(() => database.getAllTransactions())
        .then(transactions => {
            dispatch(loadTransactions(transactions));
        });
};

export const insertTransactions = (transactionData: TransactionData[]) => (dispatch: any) => {
    return database.addTransactions(transactionData)
        .then(inserted => {
            Log.debug('addTransactions', inserted);
            return dispatch(applyTransactionsToAccount(inserted));
        })
        .then(() => database.getAllTransactions())
        .then(transactions => {
            dispatch(loadTransactions(transactions));
        });
};

import { TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { Log } from '@/util/Logger';
import { Transaction, TransactionData } from '@models/Transaction';

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
        .then(result => Log.debug('addLinkedTransaction', result))
        .then(() => database.getAllTransactions())
        .then(transactions => {
            dispatch(loadTransactions(transactions));
        });
};

export const insertTransactions = (transactionData: TransactionData[]) => (dispatch: any) => {
    return database.addTransactions(transactionData)
        .then(result => Log.debug('addTransactions', result))
        .then(() => database.getAllTransactions())
        .then(transactions => {
            dispatch(loadTransactions(transactions));
        });
};

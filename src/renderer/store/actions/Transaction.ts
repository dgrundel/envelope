import { TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
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

export const insertTransaction = (transactionData: TransactionData) => (dispatch: any) => {
    database.addTransaction(transactionData)
        .then(() => database.getAllTransactions())
        .then(transactions => {
            dispatch(loadTransactions(transactions));
        });
};

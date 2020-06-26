import { TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { Log } from '@/util/Logger';
import { Transaction, TransactionData, TransactionType } from '@models/Transaction';
import { Account } from '@models/Account';
import { applyTransactionsToAccount, applyTransactionToAccount } from './Account';
import { Currency } from '@/util/Currency';
import { transactions } from '../reducers/Transactions';

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
        .then(transactions => dispatch(loadTransactions(transactions)));
};

export const insertTransactions = (transactionData: TransactionData[]) => (dispatch: any) => {
    return database.addTransactions(transactionData)
        .then(inserted => {
            Log.debug('addTransactions', inserted);
            return dispatch(applyTransactionsToAccount(inserted));
        })
        .then(() => database.getAllTransactions())
        .then(transactions => dispatch(loadTransactions(transactions)));
};

export const transferFunds = (amount: Currency, fromAccount: Account, toAccount: Account) => (dispatch: any) => {
    const type = TransactionType.Transfer;
    const date = new Date();
    const description = `Transfer from "${fromAccount.name}" to "${toAccount.name}"`;
    
    const fromTransaction: TransactionData = {
        accountId: fromAccount._id,
        type,
        date,
        description,
        amount: amount.getInverse(),
        linkedTransactionIds: []
    };

    return database.addTransaction(fromTransaction)
        .then(inserted => {
            Log.debug('addTransaction (fromTransaction)', inserted);
            return dispatch(applyTransactionToAccount(inserted))
                .then(() => {

                    const toTransaction: TransactionData = {
                        accountId: toAccount._id,
                        type,
                        date,
                        description,
                        amount,
                        linkedTransactionIds: [inserted._id]
                    };

                    return dispatch(addLinkedTransaction(toTransaction, inserted));
                });
        });
};
import { TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { Currency } from '@/util/Currency';
import { unionFlags } from '@/util/Flags';
import { Log } from '@/util/Logger';
import { Account } from '@models/Account';
import { getAccountAmountTransactionFlag, Transaction, TransactionData, TransactionFlag } from '@models/Transaction';
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
    const transactionData = {
        ...transaction,
        linkedTransactionIds: [linkTo._id]
    };
    
    return database.addLinkedTransaction(transactionData, linkTo)
        .then(createdAndUpdated => {
            Log.debug('addLinkedTransaction', createdAndUpdated);

            const created = createdAndUpdated[0];
            return dispatch(applyTransactionToAccount(created))
                .then(() => database.getAllTransactions())
                .then((transactions: Transaction[]) => dispatch(loadTransactions(transactions)))
                .then(() => createdAndUpdated);
        });
};

export const insertTransactions = (transactionData: TransactionData[]) => (dispatch: any) => {
    return database.addTransactions(transactionData)
        .then(inserted => {
            Log.debug('addTransactions', inserted);
            return dispatch(applyTransactionsToAccount(inserted))
                .then(() => database.getAllTransactions())
                .then((transactions: Transaction[]) => dispatch(loadTransactions(transactions)))
                .then(() => inserted);
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

    const fromTransaction: TransactionData = {
        accountId: fromAccount._id,
        date,
        description,
        amount: inverseAmount,
        linkedTransactionIds: [],
        flags,
    };

    return database.addTransaction(fromTransaction)
        .then(inserted => {
            Log.debug('addTransaction (fromTransaction)', inserted);
            return dispatch(applyTransactionToAccount(inserted))
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
                        linkedTransactionIds: [inserted._id],
                        flags,
                    };

                    return dispatch(addLinkedTransaction(toTransaction, inserted));
                });
        });
};
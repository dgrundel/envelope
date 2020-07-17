import { TransactionState } from '../reducers/Transactions';
import { Currency } from '@/models/Currency';
import { Transaction } from '@/models/Transaction';
import { Log } from '@/util/Logger';

export const transactionStatePreprocessor = (state: TransactionState): TransactionState => {
    const transactions = Object.keys(state.transactions).reduce((map: Record<string, Transaction>, id: string) => {
        map[id] = {
            ...state.transactions[id],
            date: new Date(state.transactions[id].date),
            amount: Currency.fromObject(state.transactions[id].amount),
        }
        return map;
    }, {});

    return {
        ...state,
        transactions,
    };
};

export const getTransactionById = (state: TransactionState, id: string): Transaction => {
    const transaction = state.transactions[id];
    return transaction || Log.andThrow(`No transaction found for id ${id}!`);
}

export const getTransactions = (state: TransactionState, filter?: (transaction: Transaction) => boolean): Transaction[] => {
    const transactions = state.sortedIds.map(id => getTransactionById(state, id));
    return filter
        ? transactions.filter(filter)
        : transactions;
}

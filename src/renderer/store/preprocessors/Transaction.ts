import { TransactionState } from '../reducers/Transactions';
import { Currency } from '@/util/Currency';
import { Transaction } from '@/models/Transaction';

export const transactionStatePreprocessor = (state: TransactionState): TransactionState => {
    const transactions = Object.keys(state.transactions).reduce((map: Record<string, Transaction>, id: string) => {
        map[id] = {
            ...state.transactions[id],
            amount: Currency.fromObject(state.transactions[id].amount)
        }
        return map;
    }, {});

    return {
        ...state,
        transactions,
    };
};

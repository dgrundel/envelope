import { listToMap } from '@/util/Data';
import { Transaction } from '@models/Transaction';
import { TransactionAction, LoadTransactionAction } from '../actions/Transaction';

export interface TransactionState {
    transactions: Record<string, Transaction>;
    sortedIds: string[];
}

const initialState: TransactionState = {
    transactions: {},
    sortedIds: []
};

export const transactions = (state: TransactionState = initialState, action: any): TransactionState => {
    switch(action.type as TransactionAction) {
        case TransactionAction.Load:
            const loadAction = action as LoadTransactionAction;
            return {
                transactions: listToMap(loadAction.transactions),
                sortedIds: loadAction.transactions.map(a => a._id)
            };
        default:
            return state;
    }
}
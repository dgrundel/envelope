import { listToMap } from '@/util/Data';
import { Transaction } from '@models/Transaction';
import { TransactionAction, LoadTransactionAction, AddTransactionAction, AddManyTransactionAction } from '../actions/Transaction';
import memoizeOne from 'memoize-one';
import { Currency } from '@/util/Currency';

export interface TransactionState {
    transactions: Record<string, Transaction>;
    sortedIds: string[];
}

const initialState: TransactionState = {
    transactions: {},
    sortedIds: []
};

const convertFields = memoizeOne((state: TransactionState): TransactionState => {
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
});

const getSortedIds = memoizeOne((transactions: Record<string, Transaction>): string[] => {
    return Object.keys(transactions).sort((a, b) => {
        var dateA = transactions[a].date;
        var dateB = transactions[b].date;
        if (dateA === dateB) {
            return 0;
        }
        return (dateA < dateB) ? -1 : 1;
    });
});

const addTransaction = (state: TransactionState, action: AddTransactionAction): TransactionState => {
    let updates;
    if (action.linkTo) {
        updates = {
            [action.linkTo._id]: {
                ...action.linkTo,
                linkedTransactionIds: [
                    ...action.linkTo.linkedTransactionIds,
                    action.transaction._id,
                ]
            },
            [action.transaction._id]: action.transaction,
        };
    } else {
        updates = {
            [action.transaction._id]: action.transaction,
        };
    }

    const transactions = {
        ...state.transactions,
        ...updates,
    }
    const sortedIds = getSortedIds(transactions);
    return {
        transactions,
        sortedIds,
    };
};

const addManyTransactions = (state: TransactionState, action: AddManyTransactionAction): TransactionState => {
    const asMap = listToMap(action.transactions);
    const transactions = {
        ...state.transactions,
        ...asMap
    }
    const sortedIds = getSortedIds(transactions);
    return {
        transactions,
        sortedIds,
    };
};

export const transactions = (state: TransactionState = initialState, action: any): TransactionState => {
    const converted = convertFields(state);
    
    switch(action.type as TransactionAction) {
        case TransactionAction.Add:
            return addTransaction(converted, action as AddTransactionAction);
        case TransactionAction.AddMany:
            return addManyTransactions(converted, action as AddManyTransactionAction);
        case TransactionAction.Load:
            const loadAction = action as LoadTransactionAction;
            return {
                transactions: listToMap(loadAction.transactions),
                sortedIds: loadAction.transactions.map(a => a._id)
            };
        default:
            return converted;
    }
}
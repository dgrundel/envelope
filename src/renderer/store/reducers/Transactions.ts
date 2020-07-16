import { Currency } from '@/models/Currency';
import { listToMap } from '@/util/Data';
import { Transaction } from '@models/Transaction';
import memoizeOne from 'memoize-one';
import { AddManyTransactionAction, AddTransactionAction, TransactionAction, AddTransactionFlagsAction, LinkExistingTransactionsAction } from '../actions/Transaction';
import { unionFlags } from '@/util/Flags';
import { uniq } from 'lodash';

export interface TransactionState {
    transactions: Record<string, Transaction>;
    sortedIds: string[];
}

const initialState: TransactionState = {
    transactions: {},
    sortedIds: []
};

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
                linkedTransactionIds: uniq([
                    ...action.linkTo.linkedTransactionIds,
                    action.transaction._id,
                ])
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

const addFlags = (state: TransactionState, action: AddTransactionFlagsAction): TransactionState => {
    return {
        ...state,
        transactions: {
            ...state.transactions,
            [action.transaction._id]: {
                ...action.transaction,
                flags: unionFlags(action.transaction.flags, action.flags)
            }
        }
    };
}

const linkExisting = (state: TransactionState, action: LinkExistingTransactionsAction): TransactionState => {
    const linkIds = action.transactions.map(t => t._id);
    const updates = action.transactions.reduce((map: Record<string, Transaction>, transaction: Transaction) => {
        map[transaction._id] = {
            ...transaction,
            linkedTransactionIds: uniq([
                ...transaction.linkedTransactionIds,
                ...linkIds.filter(id => id !== transaction._id),
            ])
        }
        return map;
    }, {});
    
    return {
        ...state,
        transactions: {
            ...state.transactions,
            ...updates,
        }
    };
}

export const transactions = (state: TransactionState = initialState, action: any): TransactionState => {
    switch(action.type as TransactionAction) {
        case TransactionAction.Add:
            return addTransaction(state, action as AddTransactionAction);
        case TransactionAction.AddMany:
            return addManyTransactions(state, action as AddManyTransactionAction);
        case TransactionAction.AddFlags:
            return addFlags(state, action as AddTransactionFlagsAction);
        case TransactionAction.LinkExisting:
            return linkExisting(state, action as LinkExistingTransactionsAction);
        default:
            return state;
    }
}
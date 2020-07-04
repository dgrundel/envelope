import { Account, AccountType } from '@models/Account';
import { AccountAction, AddAccountAction, UpdateAccountAction, UpdateAccountBalanceAction } from '../actions/Account';
import { nanoid } from 'nanoid';
import { Currency } from '@/util/Currency';
import memoizeOne from 'memoize-one';

export interface AccountState {
    accounts: Record<string, Account>;
    sortedIds: string[];
    unallocatedId: string;
}

const createInitialState = (): AccountState => {
    const unallocateAccount: Account = {
        _id: nanoid(),
        name: 'Ready to Budget',
        type: AccountType.Unallocated,
        balance: Currency.ZERO,
        linkedAccountIds: []
    }
    return {
        accounts: {
            [unallocateAccount._id]: unallocateAccount,
        },
        sortedIds: [],
        unallocatedId: unallocateAccount._id
    };
}

const initialState: AccountState = createInitialState();

const convertFields = memoizeOne((state: AccountState): AccountState => {
    const accounts = Object.keys(state.accounts).reduce((map: Record<string, Account>, id: string) => {
        map[id] = {
            ...state.accounts[id],
            balance: Currency.fromObject(state.accounts[id].balance)
        }
        return map;
    }, {});

    return {
        ...state,
        accounts,
    };
});

const getSortedIds = memoizeOne((accounts: Record<string, Account>): string[] => {
    return Object.keys(accounts).sort((a, b) => {
        var nameA = accounts[a].name.toUpperCase();
        var nameB = accounts[b].name.toUpperCase();
        if (nameA === nameB) {
            return 0;
        }
        return (nameA < nameB) ? -1 : 1;
    });
});

const addAccount = (state: AccountState, action: AddAccountAction): AccountState => {
    const accounts = {
        ...state.accounts,
        [action.account._id]: action.account,
    };
    const sortedIds = getSortedIds(accounts);
    return {
        ...state,
        sortedIds,
        accounts,
    }
}

const updateAccount = (state: AccountState, action: UpdateAccountAction): AccountState => {
    return {
        ...state,
        accounts: {
            ...state.accounts,
            [action.account._id]: action.account,
        }
    }
}

const updateAccountBalance = (state: AccountState, action: UpdateAccountBalanceAction): AccountState => {
    return {
        ...state,
        accounts: {
            ...state.accounts,
            [action.accountId]: {
                ...state.accounts[action.accountId],
                balance: action.balance,
            }
        }
    }
}

export const accounts = (state: AccountState = initialState, action: any): AccountState => {
    const converted = convertFields(state);

    switch(action.type as AccountAction) {
        case AccountAction.Add:
            return addAccount(converted, action as AddAccountAction);
        case AccountAction.Update:
            return updateAccount(converted, action as UpdateAccountAction);
        case AccountAction.UpdateBalance:
            return updateAccountBalance(converted, action as UpdateAccountBalanceAction);
        default:
            return converted;
    }
}
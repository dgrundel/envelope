import { listToMap } from '@/util/Data';
import { Account, AccountType } from '@models/Account';
import { AccountAction, LoadAccountAction, UpdateAccountAction } from '../actions/Account';
import { filterOnlyAccountType } from '@/util/Filters';

export interface AccountState {
    accounts: Record<string, Account>;
    sortedIds: string[];
    unallocatedId?: string;
}

const initialState: AccountState = {
    accounts: {},
    sortedIds: []
};

export const accounts = (state: AccountState = initialState, action: any): AccountState => {
    switch(action.type as AccountAction) {
        case AccountAction.Load:
            const loadAction = action as LoadAccountAction;
            const unallocatedId = loadAction.accounts
                .find(filterOnlyAccountType(AccountType.Unallocated))?._id;
            return {
                accounts: listToMap(loadAction.accounts),
                sortedIds: loadAction.accounts.map(a => a._id),
                unallocatedId
            };
        case AccountAction.Update:
            const updateAction = action as UpdateAccountAction;
            return {
                ...state,
                accounts: {
                    ...state.accounts,
                    [action.account._id]: action.account
                }
            }
        default:
            return state;
    }
}
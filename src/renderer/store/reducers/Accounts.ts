import { listToMap } from '@/util/Data';
import { Account } from '@models/Account';
import { AccountAction, LoadAccountAction } from '../actions/Account';

export interface AccountState {
    accounts: Record<string, Account>;
    sortedIds: string[];
}

const initialState: AccountState = {
    accounts: {},
    sortedIds: []
};

export const accounts = (state: AccountState = initialState, action: any): AccountState => {
    switch(action.type as AccountAction) {
        case AccountAction.Load:
            const loadAction = action as LoadAccountAction;
            return {
                accounts: listToMap(loadAction.accounts),
                sortedIds: loadAction.accounts.map(a => a._id)
            };
        default:
            return state;
    }
}
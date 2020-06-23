import { AccountAction, InsertAccountAction, UpdateAccountAction, LoadAccountAction, insertAccount } from '../actions/Account';
import { Account } from '../../../models/Account';
import { listToMap } from '@/util/Data';

type AccountState = Record<string, Account>;

export const accounts = (state: AccountState = {}, action: any): AccountState => {
    switch(action.type as AccountAction) {
        case AccountAction.Load:
            const loadAction = action as LoadAccountAction;
            return listToMap(loadAction.accounts);
        case AccountAction.Insert:
            const insertAction = action as InsertAccountAction;
            const inserted = listToMap(insertAction.accounts);
            return {
                ...state,
                ...inserted
            };
        case AccountAction.Update:
            const updateAction = action as UpdateAccountAction;
            return {
                ...state,
                [updateAction.id]: {
                    ...state[updateAction.id],
                    ...updateAction.updates
                }
            };
        default:
            return state;
    }
}
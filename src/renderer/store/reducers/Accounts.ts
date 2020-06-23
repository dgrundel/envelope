import { AccountAction, CreateAccountAction, UpdateAccountAction, LoadAccountAction } from '../actions/Account';
import { Account } from '../interfaces/Account';
import { listToMap } from '@/util/Data';

type AccountState = Record<string, Account>;

export const accounts = (state: AccountState = {}, action: any): AccountState => {
    switch(action.type as AccountAction) {
        case AccountAction.Load:
            const loadAction = action as LoadAccountAction;
            return listToMap(loadAction.accounts);
        case AccountAction.Create:
            const createAction = action as CreateAccountAction;
            return {
                ...state,
                [createAction.account._id]: createAction.account
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
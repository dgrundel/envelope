import { AccountAction, CreateAccountAction, UpdateAccountAction } from '../actions/AccountActions';
import { Account } from '../interfaces/AccountInterfaces';

type AccountState = Record<string, Account>;

export const accounts = (state: AccountState = {}, action: any): AccountState => {
    switch(action.type as AccountAction) {
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
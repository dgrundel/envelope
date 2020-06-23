import { Account } from '../interfaces/AccountInterfaces';

export enum AccountAction {
    Create = 'store:action:account-create',
    Update = 'store:action:account-update'
}

export interface CreateAccountAction {
    type: AccountAction.Create;
    account: Account;
}

export const createAccount = (account: Account): CreateAccountAction => ({
    type: AccountAction.Create,
    account
});

export interface UpdateAccountAction {
    type: AccountAction.Update;
    id: string;
    updates: Record<string, any>;
}

export const updateAccount = (id: string, updates: any): UpdateAccountAction => ({
    type: AccountAction.Update,
    id,
    updates
});
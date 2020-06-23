import { Account } from '../interfaces/Account';

export enum AccountAction {
    Load = 'store:action:account-load',
    Create = 'store:action:account-create',
    Update = 'store:action:account-update'
}

export interface LoadAccountAction {
    type: AccountAction.Load;
    accounts: Account[];
}

export const loadAccounts = (accounts: Account[]): LoadAccountAction => ({
    type: AccountAction.Load,
    accounts
});

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
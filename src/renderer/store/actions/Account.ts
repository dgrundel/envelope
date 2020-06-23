import { Account, AccountData } from '@models/Account';
import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';

const database = new AccountDataStoreClient();

export enum AccountAction {
    Load = 'store:action:account-load',
    Insert = 'store:action:account-insert',
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

export interface InsertAccountAction {
    type: AccountAction.Insert;
    accounts: Account[];
}

export const insertAccount = (accountData: AccountData) => (dispatch: any) => {
    database.addAccount(accountData)
        .then(accounts => {
            const action: InsertAccountAction = {
                type: AccountAction.Insert,
                accounts
            };
            dispatch(action);
        });
};

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
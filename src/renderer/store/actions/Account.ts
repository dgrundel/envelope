import { Account, AccountData } from '@models/Account';
import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';

const database = new AccountDataStoreClient();

export enum AccountAction {
    Load = 'store:action:account-load'
}

export interface LoadAccountAction {
    type: AccountAction.Load;
    accounts: Account[];
}

export const loadAccounts = (accounts: Account[]): LoadAccountAction => ({
    type: AccountAction.Load,
    accounts
});

export const insertAccount = (accountData: AccountData) => (dispatch: any) => {
    database.addAccount(accountData)
        .then(() => database.getAllAccounts())
        .then(accounts => {
            dispatch(loadAccounts(accounts));
        });
};

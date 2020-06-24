import { Account, AccountData } from '@models/Account';
import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { Currency } from '@/util/Currency';

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
    return database.addAccount(accountData)
        .then(() => database.getAllAccounts())
        .then(accounts => {
            dispatch(loadAccounts(accounts));
        });
};

export const updateAccountBalance = (id: string, balance: Currency) => (dispatch: any) => {
    return database.updateAccountBalance(id, balance)
        .then(() => database.getAllAccounts())
        .then(accounts => {
            dispatch(loadAccounts(accounts));
        });
};
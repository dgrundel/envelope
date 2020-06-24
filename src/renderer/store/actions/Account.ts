import { Account, AccountData, AccountType, getBankAccountTypes, isBankAccountType } from '@models/Account';
import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { Currency } from '@/util/Currency';
import { isBlank } from '@/util/Filters';

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

export const createEnvelope = (name: string) => (dispatch: any) => {
    if (isBlank(name)) {
        throw new Error('Name cannot be blank.');
    }
    
    const accountData: AccountData = {
        name,
        type: AccountType.UserEnvelope,
        balance: Currency.ZERO,
        linkedAccountIds: []
    };

    return database.addAccount(accountData)
        .then(() => database.getAllAccounts())
        .then(accounts => {
            dispatch(loadAccounts(accounts));
        });
};

export const createBankAccount = (name: string, type: AccountType, balance: Currency) => (dispatch: any) => {
    if (isBlank(name)) {
        throw new Error('Name cannot be blank.');
    }
    if (!isBankAccountType(type)) {
        throw new Error(`${type} is not a bank account type.`);
    }
    if (!balance.isValid()) {
        throw new Error(`Balance is invalid: ${balance.toString()}`);
    }
    
    const accountData: AccountData = {
        name,
        type,
        balance,
        linkedAccountIds: []
    };
    
    return database.addAccount(accountData)
        .then(() => database.getAllAccounts())
        .then(accounts => {
            dispatch(loadAccounts(accounts));
        });
}

export const updateAccountBalance = (id: string, balance: Currency) => (dispatch: any) => {
    return database.updateAccountBalance(id, balance)
        .then(() => database.getAllAccounts())
        .then(accounts => {
            dispatch(loadAccounts(accounts));
        });
};
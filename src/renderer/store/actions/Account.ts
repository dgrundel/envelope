import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { TransactionData } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { isBlank } from '@/util/Filters';
import { Account, AccountData, AccountType, isBankAccountType } from '@models/Account';
import { CombinedState } from '../store';
import { Log } from '@/util/Logger';

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

export const applyTransactionToAccount = (transaction: TransactionData) => (dispatch: any) => {
    return applyTransactionsToAccount([transaction]);
};

// TODO: [Broken] This doesn't work because we're not updating 
// the account in the redux store. So, the account balance we're working
// from is out of date. (Because we're breaking the [single source of truth]
//  rules of the redux store)
export const applyTransactionsToAccount = (transactions: TransactionData[]) => (dispatch: any, getState: () => CombinedState) => {
    return Promise.all(transactions.map(transaction => {
        const account = getState().accounts.accounts[transaction.accountId];
        const newBalance = account.balance.add(transaction.amount);

        Log.debug(
            'applyTransactionsToAccount', 
            `transaction: ${transaction.description}`,
            `account: ${account.name}`,
            `starting balance: ${account.balance.toString()}`,
            `transaction amount: ${transaction.amount.toString()}`,
            `updated balance: ${newBalance.toString()}`,
        );

        return database.updateAccountBalance(account._id, newBalance);
    }))
        .then(() => database.getAllAccounts())
        .then(accounts => {
            dispatch(loadAccounts(accounts));
        });
};
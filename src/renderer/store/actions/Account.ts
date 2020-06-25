import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { TransactionData } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { isBlank } from '@/util/Filters';
import { Account, AccountData, AccountType, isBankAccountType } from '@models/Account';
import { CombinedState } from '../store';
import { Log } from '@/util/Logger';

const database = new AccountDataStoreClient();

export enum AccountAction {
    Load = 'store:action:account-load',
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

export interface UpdateAccountAction {
    type: AccountAction.Update;
    account: Account;
}

export const updateAccount = (account: Account): UpdateAccountAction => ({
    type: AccountAction.Update,
    account
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

export const applyTransactionsToAccount = (transactions: TransactionData[]) => (dispatch: any, getState: () => CombinedState) => {
    
    const next = (i: number): Promise<void> => {
        if (i >= transactions.length) {
            return Promise.resolve();
        }

        const transaction = transactions[i];
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

        return database.updateAccountBalance(account._id, newBalance)
            .then(account => dispatch(updateAccount(account)))
            .then(() => next(i + 1));
    };
    
    return next(0);
};
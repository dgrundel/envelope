import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { Transaction } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { isBlank } from '@/util/Filters';
import { Account, AccountData, AccountType, isBankAccountType } from '@models/Account';
import { CombinedState } from '../store';
import { Log } from '@/util/Logger';
import { addLinkedTransaction } from './Transaction';

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
        .then(accounts =>  dispatch(loadAccounts(accounts)));
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
        .then(accounts => dispatch(loadAccounts(accounts)));
}

export const applyTransactionToAccount = (transaction: Transaction) => (dispatch: any) => {
    return dispatch(applyTransactionsToAccount([transaction]));
};

export const applyTransactionsToAccount = (transactions: Transaction[]) => (dispatch: any, getState: () => CombinedState) => {

    const next = (transactions: Transaction[], i: number): Promise<void> => {
        if (i >= transactions.length) {
            return Promise.resolve();
        }

        const transaction = transactions[i];
        const accountsState = getState().accounts;
        const account = accountsState.accounts[transaction.accountId];
        const newBalance = account.balance.add(transaction.amount);
        
        Log.debug(
            'applyTransactionsToAccount', 
            'transaction:', transaction,
            'account:', account,
            `updated balance: ${newBalance.toString()}`,
        );

        return database.updateAccountBalance(account._id, newBalance)
            .then(updated => dispatch(updateAccount(updated)))
            .then(() => next(transactions, i + 1))
            .then(() => {
                /**
                 * Positive transactions on Checking and Savings accounts
                 * go directly to the unallocated envelope to be distributed later.
                 */
                if (account.type === AccountType.Checking || account.type === AccountType.Savings) {
                    if (transaction.amount.isPositive()) {
                        const unallocatedId = getState().accounts.unallocatedId;
                        if (!unallocatedId) {
                            Log.error('No unallocated account exists');
                            return;
                        }
                        
                        return dispatch(addLinkedTransaction({
                            accountId: unallocatedId!,
                            date: new Date(),
                            description: `Inflow from account ${account._id} (${account.name})`,
                            amount: transaction.amount.clone(),
                            linkedTransactionIds: [transaction._id]
                        }, transaction));
                    }
                }
            });
    };
    
    return next(transactions, 0);
};
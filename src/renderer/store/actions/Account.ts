import { Transaction, TransactionFlag } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { isBlank } from '@/util/Filters';
import { hasFlag } from '@/util/Flags';
import { Log } from '@/util/Logger';
import { Account, AccountType, isBankAccountType, isCreditCardAccountType, isDepositAccountType } from '@models/Account';
import { nanoid } from 'nanoid';
import { CombinedState } from '../store';
import { addLinkedTransaction, insertTransactions } from './Transaction';

export enum AccountAction {
    Add = 'store:action:account-add',
    Update = 'store:action:account-update',
    UpdateBalance = 'store:action:account-update-balance',
}

export interface AddAccountAction {
    type: AccountAction.Add;
    account: Account;
}

export const addAccount = (account: Account): AddAccountAction => ({
    type: AccountAction.Add,
    account
});

export interface UpdateAccountAction {
    type: AccountAction.Update;
    account: Account;
}

export const updateAccount = (account: Account): UpdateAccountAction => ({
    type: AccountAction.Update,
    account
});

export interface UpdateAccountBalanceAction {
    type: AccountAction.UpdateBalance;
    accountId: string,
    balance: Currency,
}

export const updateAccountBalance = (accountId: string, balance: Currency): UpdateAccountBalanceAction => ({
    type: AccountAction.UpdateBalance,
    accountId,
    balance,
});

export const createEnvelope = (name: string, linkedAccountIds: string[] = []): AddAccountAction => {
    if (isBlank(name)) {
        throw new Error('Name cannot be blank.');
    }
    
    const account: Account = {
        _id: nanoid(),
        name,
        type: AccountType.UserEnvelope,
        balance: Currency.ZERO,
        linkedAccountIds,
    };

    return addAccount(account);
};

/* *** */

export const createBankAccount = (name: string, type: AccountType, balance: Currency) => (dispatch: any, getState: () => CombinedState) => {
    if (isBlank(name)) {
        throw new Error('Name cannot be blank.');
    }
    if (!isBankAccountType(type)) {
        throw new Error(`${type} is not a bank account type.`);
    }
    if (!balance.isValid()) {
        throw new Error(`Balance is invalid: ${balance.toString()}`);
    }
    
    const account: Account = {
        _id: nanoid(),
        name,
        type,
        balance,
        linkedAccountIds: [],
    };
    
    return dispatch(addAccount(account))
        .then(() => {
            if (isDepositAccountType(type)) {
                const unallocatedId = getState().accounts.unallocatedId;
                if (!unallocatedId) {
                    Log.error('No unallocated account exists');
                    return;
                }
                
                return dispatch(insertTransactions([{
                    flags: TransactionFlag.Adjustment,
                    accountId: unallocatedId!,
                    date: new Date(),
                    description: `Initial balance from account ${account._id} (${name})`,
                    amount: balance,
                    linkedTransactionIds: [],
                }]));

            } else if (isCreditCardAccountType(type)) {
                const paymentEnvelope: Account = {
                    _id: nanoid(),
                    name: `Payment for "${name}"`,
                    type: AccountType.PaymentEnvelope,
                    balance: Currency.ZERO,
                    linkedAccountIds: [account._id as string],
                };
                return dispatch(addAccount(paymentEnvelope));
            }
        });
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

        return dispatch(updateAccountBalance(account._id, newBalance))
            .then(() => next(transactions, i + 1))
            .then(() => {
                /**
                 * Positive transactions on Checking and Savings accounts
                 * go directly to the unallocated envelope to be distributed later.
                 */
                const isNotTransfer = !hasFlag(TransactionFlag.Transfer, transaction.flags);
                if (isNotTransfer && isDepositAccountType(account.type)) {
                    if (transaction.amount.isPositive()) {
                        const unallocatedId = getState().accounts.unallocatedId;
                        if (!unallocatedId) {
                            Log.error('No unallocated account exists');
                            return;
                        }

                        return dispatch(addLinkedTransaction({
                            flags: TransactionFlag.Transfer,
                            accountId: unallocatedId!,
                            date: new Date(),
                            description: `Inflow from account ${account._id} (${account.name})`,
                            amount: transaction.amount,
                            linkedTransactionIds: [transaction._id],
                        }, transaction));
                    }
                }
            });
    };
    
    return next(transactions, 0);
};
import { Transaction, TransactionFlag } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { isBlank } from '@/util/Filters';
import { hasFlag } from '@/util/Flags';
import { getIdentifier } from '@/util/Identifier';
import { Log } from '@/util/Logger';
import { Account, AccountType, isBankAccountType, isCreditCardAccountType, isDepositAccountType } from '@models/Account';
import { CombinedState } from '../store';
import { addTransaction } from './Transaction';

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
        _id: getIdentifier(),
        name,
        type: AccountType.UserEnvelope,
        balance: Currency.ZERO,
        linkedAccountIds,
    };

    return addAccount(account);
};

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
    
    const isCreditCard = isCreditCardAccountType(type);

    // for credit cards, the balance is inverted since it's actually a debt.
    const appliedBalance = isCreditCard ? balance.getInverse() : balance;

    const account: Account = {
        _id: getIdentifier(),
        name,
        type,
        balance: appliedBalance,
        linkedAccountIds: [],
    };
    
    dispatch(addAccount(account));

    if (isCreditCard) {
        const paymentEnvelope: Account = {
            _id: getIdentifier(),
            name: `Payment for "${name}"`,
            type: AccountType.PaymentEnvelope,
            balance: Currency.ZERO,
            linkedAccountIds: [account._id as string],
        };
        dispatch(addAccount(paymentEnvelope));

    } else if (isDepositAccountType(type)) {
        const unallocatedId = getState().accounts.unallocatedId;
        if (!unallocatedId) {
            Log.error('No unallocated account exists');
            return;
        }
        
        const transaction: Transaction = {
            _id: getIdentifier(),
            flags: TransactionFlag.Adjustment,
            accountId: unallocatedId!,
            date: new Date(),
            description: `Initial balance from account ${account._id} (${name})`,
            amount: balance,
            linkedTransactionIds: [],
        };
        dispatch(addTransaction(transaction));
    }
}

export const applyTransactionToAccount = (transaction: Transaction) => (dispatch: any, getState: () => CombinedState) => {
    const accountsState = getState().accounts;
    const account = accountsState.accounts[transaction.accountId];
    const transactionAmount = transaction.amount;
    const newBalance = account.balance.add(transactionAmount);
    
    Log.debug(
        'applyTransactionsToAccount',
        'transaction:', transaction,
        'account:', account,
        `updated balance: ${newBalance.toString()}`,
    );

    dispatch(updateAccountBalance(account._id, newBalance));
};

export const applyTransactionsToAccount = (transactions: Transaction[]) => (dispatch: any) => {
    transactions.forEach(transaction => {
        dispatch(applyTransactionToAccount(transaction));
    });
};
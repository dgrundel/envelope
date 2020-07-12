import { Transaction, TransactionFlag, getAmountTransactionFlag } from '@/models/Transaction';
import { Currency } from '@/util/Currency';
import { isBlank } from '@/util/Filters';
import { hasFlag, unionFlags } from '@/util/Flags';
import { getIdentifier } from '@/util/Identifier';
import { Log } from '@/util/Logger';
import { Account, AccountType, isBankAccountType, isCreditCardAccountType, isDepositAccountType } from '@models/Account';
import { CombinedState, StoreDispatch } from '../store';
import { addTransaction, addReconcileTransaction } from './Transaction';
import { getUnallocatedAccount, getAccountById } from '../transforms/Account';

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

export const createBankAccount = (name: string, type: AccountType) => (dispatch: StoreDispatch, getState: () => CombinedState) => {
    if (isBlank(name)) {
        throw new Error('Name cannot be blank.');
    }
    if (!isBankAccountType(type)) {
        throw new Error(`${type} is not a bank account type.`);
    }
    
    const account: Account = {
        _id: getIdentifier(),
        name,
        type,
        balance: Currency.ZERO,
        linkedAccountIds: [],
    };
    
    dispatch(addAccount(account));

    if (isCreditCardAccountType(type)) {
        const paymentEnvelope: Account = {
            _id: getIdentifier(),
            name: `Payment for "${name}"`,
            type: AccountType.PaymentEnvelope,
            balance: Currency.ZERO,
            linkedAccountIds: [account._id as string],
        };
        dispatch(addAccount(paymentEnvelope));
    }
}

export const applyTransactionToAccount = (transaction: Transaction) => (dispatch: StoreDispatch, getState: () => CombinedState) => {
    const accountsState = getState().accounts;
    const account = accountsState.accounts[transaction.accountId];
    const transactionAmount = transaction.amount;
    const newBalance = account.balance.add(transactionAmount);
    
    Log.debug(
        'applyTransactionsToAccount',
        'transaction:', transaction,
        'account:', account,
        `updated balance: ${newBalance.toInputString()}`,
    );

    dispatch(updateAccountBalance(account._id, newBalance));
};

export const applyTransactionsToAccount = (transactions: Transaction[]) => (dispatch: StoreDispatch) => {
    transactions.forEach(transaction => {
        dispatch(applyTransactionToAccount(transaction));
    });
};

export const adjustAccountBalance = (accountId: string, newBalance: Currency) => (dispatch: StoreDispatch, getState: () => CombinedState) => {
    if (!newBalance.isValid()) {
        throw new Error('Invalid balance argument');
    }
    
    const account = getAccountById(getState().accounts, accountId);
    const currentBalance = account.balance;
    const amount = newBalance.sub(currentBalance);

    if (amount.isZero()) {
        Log.debug(`No adjustment needed (${amount.toFormattedString()}) for account`, account);
        return;
    }

    Log.debug(`Adding adjustment transaction for ${amount.toFormattedString()} to account`, account);
    
    const amountFlag = getAmountTransactionFlag(account, amount);

    const transaction: Transaction = {
        _id: getIdentifier(),
        accountId: account._id,
        date: new Date(),
        amount: amount,
        description: 'Balance adjustment',
        linkedTransactionIds: [],
        flags: unionFlags(
            amountFlag, 
            TransactionFlag.Adjustment, 
            TransactionFlag.Reconciled
        ),
    };

    // add adjustment transaction to account
    dispatch(addTransaction(transaction));

    // if account is a deposit account, also apply adjustment to the unallocated envelope
    if (isDepositAccountType(account.type)) {
        const unallocatedAccount = getUnallocatedAccount(getState().accounts);
        // add reconcile transaction where otherAccount is the unalloc envelope
        dispatch(addReconcileTransaction(transaction, unallocatedAccount));
    }
};
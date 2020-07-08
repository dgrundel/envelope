import { Currency } from '@/util/Currency';
import { unionFlags } from '@/util/Flags';
import { getIdentifier } from '@/util/Identifier';
import { Log } from '@/util/Logger';
import { Account, isCreditCardAccountType, isDepositAccountType } from '@models/Account';
import { getAmountTransactionFlag, Transaction, TransactionData, TransactionFlag, findAmountTransactionFlag } from '@models/Transaction';
import { CombinedState } from '../store';
import { applyTransactionToAccount } from './Account';

export enum TransactionAction {
    Add = 'store:action:transaction:add',
    AddMany = 'store:action:transaction:add-many',
    AddFlags = 'store:action:transaction:add-flags',
    LinkExisting = 'store:action:transaction:link-existing',
}

export interface AddTransactionAction {
    type: TransactionAction.Add;
    transaction: Transaction;
    linkTo?: Transaction;
}

export const addTransaction = (transaction: Transaction, linkTo?: Transaction) => (dispatch: any) => {
    const addAction: AddTransactionAction = {
        type: TransactionAction.Add,
        transaction,
        linkTo,
    };
    
    // TODO: convert this back to a "normal" action creator
    dispatch(addAction);
    dispatch(applyTransactionToAccount(transaction));
};

export interface AddManyTransactionAction {
    type: TransactionAction.AddMany;
    transactions: Transaction[];
}

export const addManyTransactions = (transactions: Transaction[]): AddManyTransactionAction => ({
    type: TransactionAction.AddMany,
    transactions
});

export interface AddTransactionFlagsAction {
    type: TransactionAction.AddFlags;
    transaction: Transaction;
    flags: TransactionFlag;
}

export const addTransactionFlags = (transaction: Transaction, flags: TransactionFlag): AddTransactionFlagsAction => ({
    type: TransactionAction.AddFlags,
    transaction,
    flags,
});

export interface LinkExistingTransactionsAction {
    type: TransactionAction.LinkExisting;
    transactions: Transaction[];
}

export const linkExistingTransactions = (transactions: Transaction[]): LinkExistingTransactionsAction => ({
    type: TransactionAction.LinkExisting,
    transactions,
});

export const transferFunds = (amount: Currency, fromAccount: Account, toAccount: Account) => (dispatch: any) => {
    const date = new Date();
    const description = `Transfer from "${fromAccount.name}" to "${toAccount.name}"`;
    
    const inverseAmount = amount.getInverse();
    const fromFlags = unionFlags(
        TransactionFlag.Transfer, 
        getAmountTransactionFlag(fromAccount, inverseAmount)
    );

    const fromTransaction: Transaction = {
        _id: getIdentifier(),
        accountId: fromAccount._id,
        date,
        description,
        amount: inverseAmount,
        linkedTransactionIds: [],
        flags: fromFlags,
    };

    Log.debug('addTransaction (fromTransaction)', fromTransaction);
    dispatch(addTransaction(fromTransaction));

    const toFlags = unionFlags(
        TransactionFlag.Transfer, 
        getAmountTransactionFlag(toAccount, amount)
    );

    const toTransaction: Transaction = {
        _id: getIdentifier(),
        accountId: toAccount._id,
        date,
        description,
        amount,
        linkedTransactionIds: [fromTransaction._id],
        flags: toFlags,
    };

    dispatch(addTransaction(toTransaction, fromTransaction));
};

export const linkTransactionsAsTransfer = (transactions: Transaction[]) => (dispatch: any) => {
    dispatch(linkExistingTransactions(transactions));
    const flags = unionFlags(
        TransactionFlag.Transfer,
        TransactionFlag.Reconciled
    );
    transactions.forEach(t => {
        dispatch(addTransactionFlags(t, flags));
    })
};

export const addReconcileTransaction = (existingTransaction: Transaction, otherAccount: Account) => (dispatch: any, getState: () => CombinedState) => {
    const amountTypeFlag = findAmountTransactionFlag(existingTransaction);
    const invert = amountTypeFlag === TransactionFlag.CreditAccountCredit || amountTypeFlag === TransactionFlag.CreditAccountDebit;

    const amount = invert
        ? existingTransaction.amount.getInverse()
        : existingTransaction.amount;
    
    const linkedTransaction: Transaction = {
        _id: getIdentifier(),
        date: new Date(),
        accountId: otherAccount._id,
        amount,
        description: existingTransaction.description,
        linkedTransactionIds: [],
        flags: TransactionFlag.Reconciled,
    };

    dispatch(addTransaction(linkedTransaction, existingTransaction));
    dispatch(addTransactionFlags(existingTransaction, TransactionFlag.Reconciled));
};
import { Currency } from '@/models/Currency';
import { unionFlags, hasFlag, doesNotHaveFlag } from '@/util/Flags';
import { getIdentifier } from '@/util/Identifier';
import { Log } from '@/util/Logger';
import { Account, AccountType } from '@models/Account';
import { getAmountTransactionFlag, Transaction, TransactionFlag } from '@models/Transaction';
import { CombinedState, StoreDispatch } from '../store';
import { applyTransactionsToAccount, applyTransactionToAccount } from './Account';
import { getUnallocatedAccount, getAccountById } from '../transforms/Account';
import { transactions } from '../reducers/Transactions';
import { filterOnlyAccountType } from '@/util/Filters';

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

export const addTransaction = (transaction: Transaction, linkTo?: Transaction) => (dispatch: StoreDispatch, getState: () => CombinedState) => {
    const action: AddTransactionAction = {
        type: TransactionAction.Add,
        transaction,
        linkTo,
    };
    
    dispatch(action);
    dispatch(applyTransactionToAccount(transaction));

    const isBankCredit = hasFlag(TransactionFlag.BankCredit, transaction.flags);
    const isNotAdjustment = doesNotHaveFlag(TransactionFlag.Adjustment, transaction.flags);
    // bank credits go directly into the unallocated envelope
    if (isBankCredit && isNotAdjustment) {
        const unallocatedEnvelope = getUnallocatedAccount(getState().accounts);
        dispatch(addLinkedTransactionForBankDeposit(transaction, unallocatedEnvelope));
    }
};

export interface AddManyTransactionAction {
    type: TransactionAction.AddMany;
    transactions: Transaction[];
}

export const addManyTransactions = (transactions: Transaction[]) => (dispatch: StoreDispatch) => {
    const action: AddManyTransactionAction = {
        type: TransactionAction.AddMany,
        transactions
    };

    dispatch(action);
    dispatch(applyTransactionsToAccount(transactions));
}

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

export const transferFunds = (amount: Currency, fromAccount: Account, toAccount: Account) => (dispatch: StoreDispatch) => {
    const date = new Date();
    const description = `Transfer from "${fromAccount.name}" to "${toAccount.name}"`;
    const inverseAmount = amount.getInverse();

    const fromTransaction: Transaction = {
        _id: getIdentifier(),
        accountId: fromAccount._id,
        date,
        description,
        amount: inverseAmount,
        linkedTransactionIds: [],
        flags: unionFlags(
            TransactionFlag.Transfer,
            TransactionFlag.Reconciled,
            getAmountTransactionFlag(fromAccount, inverseAmount),
        ),
    };

    dispatch(addTransaction(fromTransaction));

    const toTransaction: Transaction = {
        _id: getIdentifier(),
        accountId: toAccount._id,
        date,
        description,
        amount,
        linkedTransactionIds: [fromTransaction._id],
        flags: unionFlags(
            TransactionFlag.Transfer,
            TransactionFlag.Reconciled,
            getAmountTransactionFlag(toAccount, amount),
        ),
    };

    dispatch(addTransaction(toTransaction, fromTransaction));

    return Promise.resolve([
        fromTransaction,
        toTransaction
    ]);
};

export const linkTransactionsAsTransfer = (transactions: Transaction[]) => (dispatch: StoreDispatch) => {
    dispatch(linkExistingTransactions(transactions));
    const flags = unionFlags(
        TransactionFlag.Transfer,
        TransactionFlag.Reconciled
    );
    transactions.forEach(t => {
        dispatch(addTransactionFlags(t, flags));
    })
};

export const addReconcileTransaction = (existingTransaction: Transaction, otherAccount: Account) => (dispatch: StoreDispatch) => {
    const linkedTransaction: Transaction = {
        _id: getIdentifier(),
        date: new Date(),
        accountId: otherAccount._id,
        amount: existingTransaction.amount,
        description: existingTransaction.description,
        linkedTransactionIds: [],
        flags: TransactionFlag.Reconciled,
    };

    dispatch(addTransaction(linkedTransaction, existingTransaction));
    dispatch(addTransactionFlags(existingTransaction, TransactionFlag.Reconciled));
};

/**
 * Link two existing transactions that represent a transfer of funds
 * between two known accounts.
 * 
 * @param fromTransaction - transaction with flag TransactionFlag.BankDebit
 * @param toTransaction - transaction with flag TransactionFlag.BankCredit
 */
export const addLinkedTransactionForBankTransfer = (fromTransaction: Transaction, toTransaction: Transaction) => (dispatch: StoreDispatch) => {
    dispatch(linkTransactionsAsTransfer([
        fromTransaction,
        toTransaction,
    ]));
};


/**
 * Link and reconcile a transaction that represents a deposit, 
 * refund, or other income.
 * 
 * @param transaction - the transaction representing the credit 
 *  in the bank account, has flag TransactionFlag.BankCredit
 * @param envelope - the envelope to which the transaction should be applied
 */
export const addLinkedTransactionForBankDeposit = (transaction: Transaction, envelope: Account) => (dispatch: StoreDispatch) => {
    dispatch(addReconcileTransaction(transaction, envelope));
};

/**
 * Link and reconcile a transaction that represents a purchase, fee, 
 * outgoing payment, or other account withdrawl.
 * 
 * @param transaction - the transaction representing the debit in the 
 *  bank account, has flag TransactionFlag.BankDebit
 * @param envelope - the envelope to which the transaction should be applied
 */
export const addLinkedTransactionForBankDebit = (transaction: Transaction, envelope: Account) => (dispatch: StoreDispatch) => {
    dispatch(addReconcileTransaction(transaction, envelope));
};

/**
 * Reconcile a transaction that represents a payment applied to
 * the credit card from a checking or other bank account.
 * 
 * _Note:_ This transaction has no linked transactions. We merely
 * reconcile it. The bank account debit will be linked to a
 * payment envelope.
 * 
 * @param transaction - the transaction representing the credit
 *  to the credit card account, has flag TransactionFlag.CreditAccountCredit
 */
export const reconcileTransactionForCreditCardPaymentFromBank = (transaction: Transaction) => (dispatch: StoreDispatch) => {
    dispatch(addTransactionFlags!(transaction, unionFlags(
        TransactionFlag.Transfer,
        TransactionFlag.Reconciled,
    )));
};

/**
 * Link and reconcile a transaction that represents a refund, promotional 
 * credit, or other type of credit.
 * 
 * @param transaction - transaction in credit card account, has flag TransactionFlag.CreditAccountCredit
 * @param envelope - the envelope to which the transaction should be applied
 */
export const addLinkedTransactionForCreditCardRefund = (transaction: Transaction, envelope: Account) => (dispatch: StoreDispatch) => {
    dispatch(addReconcileTransaction(transaction, envelope));
};

/**
 * Link and reconcile a transaction that represents a credit card purchase.
 * 
 * @param purchaseTransaction - transaction in credit card account, has flag TransactionFlag.CreditAccountDebit
 * @param envelope - the envelope to which the transaction should be applied
 */
export const addLinkedTransactionForCreditCardPurchase = (purchaseTransaction: Transaction, envelope: Account) => (dispatch: StoreDispatch, getState: () => CombinedState) => {
    // find the payment envelope for the credit card
    const accounts = getState().accounts;
    const creditCardAccount = getAccountById(accounts, purchaseTransaction.accountId);
    const paymentEnvelope = creditCardAccount.linkedAccountIds
        .map(id => getAccountById(accounts, id))
        .find(filterOnlyAccountType(AccountType.PaymentEnvelope));

    if (!paymentEnvelope) {
        Log.andThrow(`No payment envelope for account ${creditCardAccount.name} (${creditCardAccount._id})`);
    }
    
    // transfer funds from the envelope to the payment envelope
    const absAmount = purchaseTransaction.amount.getAbsolute();
    return dispatch(transferFunds(absAmount, envelope, paymentEnvelope!)).then((created: [Transaction, Transaction]) => {
        const fromTransaction = created[0];
        const toTransaction = created[1];

        // link all three transactions to each other
        dispatch(linkExistingTransactions([
            fromTransaction,
            toTransaction,
            purchaseTransaction,
        ]));

        // mark the credit card purchase as reconciled
        dispatch(addTransactionFlags(purchaseTransaction, TransactionFlag.Reconciled));
    });
};
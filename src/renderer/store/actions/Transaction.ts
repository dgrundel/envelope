import { Currency } from '@/util/Currency';
import { unionFlags } from '@/util/Flags';
import { getIdentifier } from '@/util/Identifier';
import { Log } from '@/util/Logger';
import { Account } from '@models/Account';
import { getAccountAmountTransactionFlag, Transaction, TransactionData, TransactionFlag } from '@models/Transaction';
import { CombinedState } from '../store';
import { applyTransactionToAccount } from './Account';

export enum TransactionAction {
    Add = 'store:action:transaction:add',
    AddLinked = 'store:action:transaction:add-linked',
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
    // will need to remove the promises from applyTransactionToAccount as well, and probably move that logic into a reducer
    dispatch(addAction);
    return dispatch(applyTransactionToAccount(transaction));
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
    const flags = unionFlags(
        TransactionFlag.Transfer, 
        getAccountAmountTransactionFlag(fromAccount, inverseAmount)
    );

    const fromTransaction: Transaction = {
        _id: getIdentifier(),
        accountId: fromAccount._id,
        date,
        description,
        amount: inverseAmount,
        linkedTransactionIds: [],
        flags,
    };

    return Promise.resolve(dispatch(addTransaction(fromTransaction)))
        .then(() => {
            Log.debug('addTransaction (fromTransaction)', fromTransaction);

            return dispatch(applyTransactionToAccount(fromTransaction))
                .then(() => {
                    const flags = unionFlags(
                        TransactionFlag.Transfer, 
                        getAccountAmountTransactionFlag(toAccount, amount)
                    );

                    const toTransaction: Transaction = {
                        _id: getIdentifier(),
                        accountId: toAccount._id,
                        date,
                        description,
                        amount,
                        linkedTransactionIds: [fromTransaction._id],
                        flags,
                    };

                    return dispatch(addTransaction(toTransaction, fromTransaction));
                });
        });
};
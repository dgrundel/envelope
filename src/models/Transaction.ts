import { Currency } from '@/models/Currency';
import { Account, isCreditCardAccountType, isDepositAccountType } from '@models/Account';
import { intersectFlags, unionFlags } from '@/util/Flags';

export enum TransactionFlag {
    // nothing
    None = 0,

    // A transaction used to adjust an account balance
    // so that it reconciles with the actual account.
    Adjustment = 1 << 0,
    
    // A transfer of funds from one account to another
    Transfer = 1 << 1,
    
    // Credit applied to a bank/deposit account
    // Increases account balance
    // For a checking account, this might be something like a paycheck deposit
    // For a savings account, this could be accured interest paid by the bank
    BankCredit = 1 << 2,
    
    // Debit applied to a bank/deposit account
    // Decreases account balance
    // Generally this is from a purchase, or fees incurred from the bank
    BankDebit = 1 << 3,
    
    // Credit applied to a credit card account
    // Decreases account balance
    // Generally this is from a payment or perhaps a refund issued by a merchant
    CreditAccountCredit = 1 << 4,
    
    // Debit applied to a credit card account
    // Increases account balance
    // This could be from a purchase, an interest charge, or other fees incurred
    CreditAccountDebit = 1 << 5,

    // Transaction that is fully reconciled
    Reconciled = 1 << 6,
};

const transactionFlagDescriptions = {
    [TransactionFlag.None]: '',
    [TransactionFlag.Adjustment]: 'a balance adjustment',
    [TransactionFlag.Transfer]: 'a transfer of funds between accounts and/or envelopes',
    [TransactionFlag.BankCredit]: 'a deposit, refund, or other credit that increases the account balance',
    [TransactionFlag.BankDebit]: 'a purchase, bill payment, fee, or other type of debit that decreases the account balance',
    [TransactionFlag.CreditAccountCredit]: 'a payment, refund, or other credit that decreases the account balance',
    [TransactionFlag.CreditAccountDebit]: 'a purchase, fee, or other charge that increases the account balance',
    [TransactionFlag.Reconciled]: 'reconciled',
};

export const getTransactionFlagDescription = (f: TransactionFlag): string => transactionFlagDescriptions[f];

export const getAmountTransactionFlag = (account: Account, amount: Currency): TransactionFlag => {
    const isAmountNegative = amount.isNegative();
    
    if (isDepositAccountType(account.type)) {
        // checking, savings, other deposit accounts
        return isAmountNegative
            ? TransactionFlag.BankDebit
            : TransactionFlag.BankCredit;

    } else if (isCreditCardAccountType(account.type)) {
        // credit cards
        return isAmountNegative 
            ? TransactionFlag.CreditAccountDebit
            : TransactionFlag.CreditAccountCredit;

    } else {
        // uh oh.
        return TransactionFlag.None;
    }
}

export const findAmountTransactionFlag = (transaction: Transaction) => {
    return intersectFlags(
        transaction.flags,
        unionFlags(
            TransactionFlag.BankCredit,
            TransactionFlag.BankDebit,
            TransactionFlag.CreditAccountCredit,
            TransactionFlag.CreditAccountDebit
        )
    )
}

export interface TransactionData {
    flags: number;
    accountId: string;
    date: Date;
    description: string;
    amount: Currency;
    linkedTransactionIds: string[];
    importData?: Record<string, string>;
}

export interface Transaction extends TransactionData {
    _id: string;
}

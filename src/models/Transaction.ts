import { Currency } from '@/util/Currency';
import { Account, isCreditCardAccountType, isDepositAccountType } from '@models/Account';

export enum TransactionFlag {
    // nothing
    None = 0,

    // A transaction used to adjust an account balance
    // so that it reconciles with the actual account.
    Adjustment = 1,
    
    // A transfer of funds from one account to another
    Transfer = 2,
    
    // Credit applied to a bank/deposit account
    // Increases account balance
    // For a checking account, this might be something like a paycheck deposit
    // For a savings account, this could be accured interest paid by the bank
    BankCredit = 4,
    
    // Debit applied to a bank/deposit account
    // Decreases account balance
    // Generally this is from a purchase, or fees incurred from the bank
    BankDebit = 8,
    
    // Credit applied to a credit card account
    // Decreases account balance
    // Generally this is from a payment or perhaps a refund issued by a merchant
    CreditAccountCredit = 16,
    
    // Debit applied to a credit card account
    // Increases account balance
    // This could be from a purchase, an interest charge, or other fees incurred
    CreditAccountDebit = 32,
};

const transactionFlagDescriptions = {
    [TransactionFlag.None]: '',
    [TransactionFlag.Adjustment]: 'a balance adjustment',
    [TransactionFlag.BankCredit]: 'a deposit, refund, or other credit that increases the account balance',
    [TransactionFlag.BankDebit]: 'a purchase, bill payment, fee, or other type of debit that decreases the account balance',
    [TransactionFlag.CreditAccountCredit]: 'a payment, refund, or other credit that decreases the account balance',
    [TransactionFlag.CreditAccountDebit]: 'a purchase, fee, or other charge that increases the account balance',
    [TransactionFlag.Transfer]: 'a transfer of funds between accounts and/or envelopes',
};

export const getTransactionFlagDescription = (f: TransactionFlag): string => transactionFlagDescriptions[f];

export const getAccountAmountTransactionFlag = (account: Account, amount: Currency): TransactionFlag => {
    const isAmountNegative = amount.isNegative();
    
    if (isDepositAccountType(account.type)) {
        // checking, savings, other deposit accounts
        return isAmountNegative
            ? TransactionFlag.BankDebit
            : TransactionFlag.BankCredit;

    } else if (isCreditCardAccountType(account.type)) {
        // credit cards
        return isAmountNegative 
            ? TransactionFlag.CreditAccountCredit
            : TransactionFlag.CreditAccountDebit;

    } else {
        // uh oh.
        return TransactionFlag.None;
    }
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

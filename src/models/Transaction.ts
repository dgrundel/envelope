import { Currency } from '@/util/Currency';
import { Account, isCreditCardAccountType, isDepositAccountType } from '@models/Account';

export enum TransactionType {
    // A transaction used to adjust an account balance
    // so that it reconciles with the actual account.
    Adjustment = 'adjustment-transaction',
    
    // Credit applied to a bank/deposit account
    // Increases account balance
    // For a checking account, this might be something like a paycheck deposit
    // For a savings account, this could be accured interest paid by the bank
    BankCredit = 'bank-credit-transaction',

    // Debit applied to a bank/deposit account
    // Decreases account balance
    // Generally this is from a purchase, or fees incurred from the bank
    BankDebit = 'bank-debit-transaction',

    // Credit applied to a credit card account
    // Decreases account balance
    // Generally this is from a payment or perhaps a refund issued by a merchant
    CreditAccountCredit = 'credit-account-credit-transaction',
    
    // Debit applied to a credit card account
    // Increases account balance
    // This could be from a purchase, an interest charge, or other fees incurred
    CreditAccountDebit = 'credit-account-debit-transaction',

    // A transfer of funds from one account to another
    Transfer = 'transfer-transaction',
}

const transactionTypeDescriptions = {
    [TransactionType.Adjustment]: 'a balance adjustment',
    [TransactionType.BankCredit]: 'a deposit, refund, or other credit that increases the account balance',
    [TransactionType.BankDebit]: 'a purchase, bill payment, fee, or other type of debit that decreases the account balance',
    [TransactionType.CreditAccountCredit]: 'a payment, refund, or other credit that decreases the account balance',
    [TransactionType.CreditAccountDebit]: 'a purchase, fee, or other charge that increases the account balance',
    [TransactionType.Transfer]: 'a transfer of funds between accounts and/or envelopes',
};

export const getTransactionTypeDescription = (t: TransactionType): string => transactionTypeDescriptions[t];

export const getAccountTransactionType = (account: Account, isAmountNegative: boolean): TransactionType => {
    if (isDepositAccountType(account.type)) {
        // checking, savings, other deposit accounts
        return isAmountNegative
            ? TransactionType.BankDebit
            : TransactionType.BankCredit;

    } else if (isCreditCardAccountType(account.type)) {
        // credit cards
        return isAmountNegative 
            ? TransactionType.CreditAccountCredit
            : TransactionType.CreditAccountDebit;

    } else {
        // uh oh.
        throw new Error('Invalid account type.');
    }
}

export interface TransactionData {
    accountId: string;
    date: Date;
    description: string;
    amount: Currency;
    linkedTransactionIds: string[];
    importData?: Record<string, string>;
    type?: TransactionType;
}

export interface Transaction extends TransactionData {
    _id: string;
}

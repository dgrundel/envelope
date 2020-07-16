import { Currency } from '@/models/Currency';

export enum AccountType {
    Checking = 'bank-account-checking' ,
    Savings = 'bank-account-savings' ,
    CreditCard = 'credit-card-account',
    Unallocated = 'unallocated-envelope',
    PaymentEnvelope = 'payment-envelope',
    UserEnvelope = 'user-envelope'
}

export interface AccountData {
    name: string;
    type: AccountType;
    balance: Currency;
    linkedAccountIds: string[];
}

export interface Account extends AccountData {
    _id: string;
}

const typeLabels = {
    // A "real" checking account at a financial institution
    [AccountType.Checking]: 'Checking',
    
    // A "real" savings account at a financial institution
    [AccountType.Savings]: 'Savings',
    
    // A "real" credit card account at a financial institution
    [AccountType.CreditCard]: 'Credit Card',

    // The catch-all "unbudgetd" pool of funds. Income goes here
    // until the money is moved into an envelope.
    [AccountType.Unallocated]: 'Unallocated',

    // A "bucket" to hold funds that are earmarked for spending
    // on a certain category of expense.
    [AccountType.UserEnvelope]: 'Envelope',
    
    // A special type of envelope that is created and managed by
    // this application to automatically set aside funds for
    // making credit card payments
    [AccountType.PaymentEnvelope]: 'Payment Envelope',
};

export const getAccountTypeLabel = (t: AccountType) => typeLabels[t];

const typeIcons = {
    [AccountType.Checking]: 'Bank',
    [AccountType.Savings]: 'Bank',
    [AccountType.CreditCard]: 'PaymentCard',
    [AccountType.Unallocated]: 'Money',
    [AccountType.UserEnvelope]: 'Mail',  
    [AccountType.PaymentEnvelope]: 'PaymentCard',
};

export const getAccountTypeIcon = (t: AccountType) => typeIcons[t];

/**
 * _Bank accounts_ are accounts that exist in the 
 * "real" world. 
 * 
 * In the context of this application, these accounts:
 *  1. are not an _Envelope_ 
 *  2. may be arbitrarily added by the user
 */
const bankAccountTypes = [
    AccountType.Checking,
    AccountType.Savings,
    AccountType.CreditCard,
];

export const getBankAccountTypes = () => bankAccountTypes;
export const isBankAccountType = (type: AccountType) => bankAccountTypes.some(t => t === type);

/**
 * _Deposit accounts_ are "traditional" bank accounts
 * where a person deposits and withdraws cash.
 * 
 * Positive transactions are treated as cash deposits and
 * immediately applied to the "Unallocated" account.
 * 
 * Negative transactions are treated as spending and must
 * be associated with an envelope by the user.
 */
const depositAccountTypes = [
    AccountType.Checking,
    AccountType.Savings,
];

export const getDepositAccountTypes = () => depositAccountTypes;
export const isDepositAccountType = (type: AccountType) => depositAccountTypes.some(t => t === type);

/**
 * _Credit card accounts_ are ...uh... credit cards. Yep.
 */

export const isCreditCardAccountType = (type: AccountType) => type === AccountType.CreditCard;

/**
 * _Assignable accounts_ refers to account types
 * to which a user may associate a "spending"-type
 * transactions. Generally, this refers to envelopes.
 * 
 * Positive transactions into these accounts are usually
 * seen when moving money between accounts or moving funds
 * from the "unallocated" account.
 * 
 * Negative transactions are the aforementioned "spending".
 */
const assignableAccountTypes = [
    AccountType.UserEnvelope,
    AccountType.PaymentEnvelope
];

export const getAssignableAccountTypes = () => assignableAccountTypes;
import { Currency } from '@/util/Currency';

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
    [AccountType.Checking]: 'Checking',
    [AccountType.Savings]: 'Savings',
    [AccountType.CreditCard]: 'Credit Card',
    [AccountType.Unallocated]: 'Unallocated',
    [AccountType.PaymentEnvelope]: 'Payment Envelope',
    [AccountType.UserEnvelope]: 'User-Defined Envelope',
};

export const getAccountTypeLabel = (t: AccountType) => typeLabels[t];

const bankAccountTypes = [
    AccountType.Checking,
    AccountType.Savings,
    AccountType.CreditCard
];

export const getBankAccountTypes = () => bankAccountTypes;
export const isBankAccountType = (type: AccountType) => bankAccountTypes.some(t => t === type);

const assignableAccountTypes = [
    AccountType.UserEnvelope,
    AccountType.PaymentEnvelope
];

export const getAssignableAccountTypes = () => assignableAccountTypes;
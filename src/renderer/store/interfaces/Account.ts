import { Currency } from '@/util/Currency';

export enum AccountType {
    Checking = 'bank-account-checking' ,
    Savings = 'bank-account-savings' ,
    CreditCard = 'credit-card-account',
    Unallocated = 'unallocated-envelope',
    PaymentEnvelope = 'payment-envelope',
    UserEnvelope = 'user-envelope'
}

export interface Account {
    _id: string;
    name: string;
    type: AccountType;
    balance: Currency;
    linkedAccounts: Account[];
}
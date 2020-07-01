import { Currency } from '@/util/Currency';

export enum TransactionType {
    // A transaction used to adjust an account balance
    // so that it reconciles with the actual account.
    Adjustment = 'adjustment-transaction',
    
    // A transaction created by the import wizard
    Imported = 'imported-transction',

    // A transfer of funds from one account to another
    Transfer = 'transfer-transaction',
}

export interface TransactionData {
    accountId: string;
    date: Date;
    description: string;
    amount: Currency;
    linkedTransactionIds: string[];
    originalRecord?: Record<string, string>;
    type?: TransactionType;
}

export interface Transaction extends TransactionData {
    _id: string;
}

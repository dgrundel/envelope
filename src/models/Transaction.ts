import { Currency } from '@/util/Currency';

export interface TransactionData {
    accountId: string;
    
    date: Date;
    description: string;
    amount: Currency;
    originalRecord?: Record<string, string>;
    linkedTransactionIds?: string[];
}

export interface Transaction extends TransactionData {
    _id: string;
}

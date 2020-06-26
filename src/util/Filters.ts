import { AccountData, getBankAccountTypes, getAssignableAccountTypes, AccountType } from '@/models/Account';
import { TransactionData } from '@/models/Transaction';
import { Currency } from './Currency';

export const filterOnlyAccountType = (type: AccountType) => (account: AccountData) => account.type === type;
export const filterOnlyAccountTypeIn = (types: AccountType[]) => (account: AccountData) => types.some(type => type === account.type);

export const filterOnlyBankAccounts = filterOnlyAccountTypeIn(getBankAccountTypes());
export const filterOnlyAssignableAccounts = filterOnlyAccountTypeIn(getAssignableAccountTypes());

export const filterOnlyImportedTransactions = (transaction: TransactionData) => !!transaction.originalRecord;

export const isNotBlank = (s?: string): s is string => typeof s === 'string' && s.trim().length > 0;
export const isBlank = (s?: string) => !isNotBlank(s);

export const isValidCurrencyString = (s?: string) => isNotBlank(s) && Currency.parse(s).isValid();

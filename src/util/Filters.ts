import { AccountData, getBankAccountTypes, getAssignableAccountTypes, AccountType, getDepositAccountTypes } from '@/models/Account';
import { TransactionData, TransactionFlag } from '@/models/Transaction';
import { Currency } from '../models/Currency';
import { doesNotHaveFlag } from './Flags';

export const filterOnlyAccountType = (type: AccountType) => (account: AccountData) => account.type === type;
export const filterOnlyAccountTypeIn = (types: AccountType[]) => (account: AccountData) => types.some(type => type === account.type);

export const filterOnlyBankAccounts = filterOnlyAccountTypeIn(getBankAccountTypes());
export const filterOnlyDepositAccounts = filterOnlyAccountTypeIn(getDepositAccountTypes());
export const filterOnlyImportableAccounts = filterOnlyBankAccounts;
export const filterOnlyAssignableAccounts = filterOnlyAccountTypeIn(getAssignableAccountTypes());
export const filterOnlyEnvelopeAccounts = filterOnlyAccountTypeIn(getAssignableAccountTypes().concat(AccountType.Unallocated));

export const filterOnlyImportedTransactions = (transaction: TransactionData) => !!transaction.importData;
export const filterOnlyUnreconciledTransactions = (transaction: TransactionData) => doesNotHaveFlag(TransactionFlag.Reconciled, transaction.flags);

export const isNotBlank = (s?: string): s is string => typeof s === 'string' && s.trim().length > 0;
export const isBlank = (s?: string) => !isNotBlank(s);

export const isValidCurrencyString = (s?: string) => isNotBlank(s) && Currency.parse(s).isValid();

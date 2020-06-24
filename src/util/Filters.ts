import { AccountData, getBankAccountTypes, getAssignableAccountTypes, AccountType } from '@/models/Account';
import { TransactionData } from '@/models/Transaction';

export const filterOnlyAccountType = (type: AccountType) => (account: AccountData) => account.type === type;
export const filterOnlyAccountTypeIn = (types: AccountType[]) => (account: AccountData) => types.findIndex(type => type === account.type) !== -1;


export const filterOnlyBankAccounts = filterOnlyAccountTypeIn(getBankAccountTypes());
export const filterOnlyAssignableAccounts = filterOnlyAccountTypeIn(getAssignableAccountTypes());

export const filterOnlyImportedTransactions = (transaction: TransactionData) => !!transaction.originalRecord;
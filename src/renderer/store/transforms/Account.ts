import { Currency } from '@/models/Currency';
import { Account } from '@models/Account';
import { AccountState } from '../reducers/Accounts';
import { stat } from 'fs';
import { Log } from '@/util/Logger';

export const accountStatePreprocessor = (state: AccountState): AccountState => {
    const accounts = Object.keys(state.accounts).reduce((map: Record<string, Account>, id: string) => {
        map[id] = {
            ...state.accounts[id],
            balance: Currency.fromObject(state.accounts[id].balance)
        }
        return map;
    }, {});

    return {
        ...state,
        accounts,
    };
};

export const getAccountById = (state: AccountState, id: string): Account => {
    const account = state.accounts[id];
    return account || Log.andThrow(`No account found for id ${id}!`);
}

export const getUnallocatedAccount = (state: AccountState): Account => {
    const id = state.unallocatedId;
    return getAccountById(state, id);
}

export const getAccounts = (state: AccountState, filter?: (account: Account) => boolean): Account[] => {
    const accounts = state.sortedIds.map(id => getAccountById(state, id));
    return filter
        ? accounts.filter(filter)
        : accounts;
}
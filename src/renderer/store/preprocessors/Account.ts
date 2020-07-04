import { Currency } from '@/util/Currency';
import { Account } from '@models/Account';
import { AccountState } from '../reducers/Accounts';

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
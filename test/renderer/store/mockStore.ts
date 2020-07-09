import { Account } from '@/models/Account';
import { Transaction } from '@/models/Transaction';
import { CombinedState } from '@/renderer/store/store';
import { listToMap } from '@/util/Data';
import * as Redux from 'redux';
import createMockStore from 'redux-mock-store';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { AppPage } from '@/renderer/components/App';

type DispatchExts = ThunkDispatch<CombinedState, void, Redux.AnyAction>;

const middleware: Redux.Middleware[] = [thunk];
const mocker = createMockStore<CombinedState, DispatchExts>(middleware);

export const mockStore = (accounts?: Account[], transactions?: Transaction[], unallocatedId?: string) => {
    return mocker({
        appState: {
            page: AppPage.Dashboard,
        },
        accounts: {
            accounts: listToMap(accounts || []),
            sortedIds: accounts ? accounts.map(a => a._id) : [],
            unallocatedId: unallocatedId || (accounts && accounts.length > 0 && accounts[0]._id) || '',
        },
        transactions: {
            transactions: listToMap(transactions || []),
            sortedIds: transactions ? transactions.map(a => a._id) : [],
        },
    });
};

import { JsonStoreClient, JsonStoreName } from '@/dataStore/JSONStore';
import { applyMiddleware, combineReducers, createStore, AnyAction } from "redux";
import { persistReducer, persistStore, createMigrate, PersistedState } from 'redux-persist';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { accountStatePreprocessor } from './transforms/Account';
import { transactionStatePreprocessor } from './transforms/Transaction';
import { accounts, AccountState } from './reducers/Accounts';
import { appState, AppState } from './reducers/AppState';
import { transactions, TransactionState } from './reducers/Transactions';
import { Log } from '@/util/Logger';
import { accountMigrations } from './migrations/accountMigrations';

export interface CombinedState {
    appState: AppState,
    accounts: AccountState,
    transactions: TransactionState,
}

export type StoreDispatch = ThunkDispatch<CombinedState, void, AnyAction>;

const jsonClient = new JsonStoreClient(JsonStoreName.EnvelopeUserData);
const basePersistConfig = {
    // each config below maintains its own version
    version: 0,
    storage: jsonClient,
};

const accountsPersistConfig = {
    ...basePersistConfig,
    version: 1,
    key: 'accounts',
    stateReconciler: (inbound: AccountState): AccountState => accountStatePreprocessor(inbound),
    migrate: accountMigrations,
}

const transactionsPersistConfig = {
    ...basePersistConfig,
    key: 'transactions',
    stateReconciler: (inbound: TransactionState): TransactionState => transactionStatePreprocessor(inbound),
}

const rootReducer = combineReducers({
    appState,
    accounts: persistReducer(accountsPersistConfig, accounts),
    transactions: persistReducer(transactionsPersistConfig, transactions),
});

export const ReduxStore = createStore(rootReducer, applyMiddleware(thunk));
export const ReduxStorePersistor = persistStore(ReduxStore);
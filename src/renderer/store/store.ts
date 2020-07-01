import { combineReducers, createStore, applyMiddleware } from "redux";
import thunk from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist'
import hardSet from 'redux-persist/lib/stateReconciler/hardSet'
import { accounts, AccountState } from './reducers/Accounts';
import { transactions, TransactionState } from './reducers/Transactions';
import { getAppStorageClient } from '@/storage/StorageApi';

export interface CombinedState {
    accounts: AccountState,
    transactions: TransactionState
}

const persistConfig = {
    key: 'root',
    storage: getAppStorageClient(),
    stateReconciler: hardSet,
};

const rootReducer = combineReducers({
    accounts,
    transactions
});

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const reduxStore = createStore(persistedReducer, applyMiddleware(thunk));
export const storePersistor = persistStore(reduxStore);
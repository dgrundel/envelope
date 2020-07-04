import { JsonStoreClient, JsonStoreName } from '@/dataStore/JSONStore';
import { applyMiddleware, combineReducers, createStore } from "redux";
import { persistReducer, persistStore } from 'redux-persist';
import autoMergeLevel1 from 'redux-persist/es/stateReconciler/autoMergeLevel1';
import thunk from 'redux-thunk';
import { accounts, AccountState } from './reducers/Accounts';
import { transactions, TransactionState } from './reducers/Transactions';

export interface CombinedState {
    accounts: AccountState,
    transactions: TransactionState
}

const jsonClient = new JsonStoreClient(JsonStoreName.EnvelopeUserDate);

const persistConfig = {
    key: 'root',
    storage: jsonClient,
    debug: true,
    stateReconciler: autoMergeLevel1
}

const rootReducer = combineReducers({
    accounts,
    transactions
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const ReduxStore = createStore(persistedReducer, applyMiddleware(thunk));
export const ReduxStorePersistor = persistStore(ReduxStore);
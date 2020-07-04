import { combineReducers, createStore, applyMiddleware } from "redux";
import thunk from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist'
import { accounts, AccountState } from './reducers/Accounts';
import { transactions, TransactionState } from './reducers/Transactions';
import { JsonStoreClient, JsonStoreName } from '@/dataStore/JSONStore';

export interface CombinedState {
    accounts: AccountState,
    transactions: TransactionState
}

const jsonClient = new JsonStoreClient(JsonStoreName.EnvelopeUserDate);

const persistConfig = {
    key: 'root',
    storage: {
        getItem: jsonClient.get.bind(jsonClient),
        setItem: jsonClient.set.bind(jsonClient),
        removeItem: jsonClient.remove.bind(jsonClient),
    },
}

const rootReducer = combineReducers({
    accounts,
    transactions
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const ReduxStore = createStore(persistedReducer, applyMiddleware(thunk));
export const ReduxStorePersistor = persistStore(ReduxStore);
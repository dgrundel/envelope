import { JsonStoreClient, JsonStoreName } from '@/dataStore/JSONStore';
import { applyMiddleware, combineReducers, createStore } from "redux";
import { persistReducer, persistStore } from 'redux-persist';
import thunk from 'redux-thunk';
import { accountStatePreprocessor } from './preprocessors/Account';
import { transactionStatePreprocessor } from './preprocessors/Transaction';
import { accounts, AccountState } from './reducers/Accounts';
import { appState, AppState } from './reducers/AppState';
import { transactions, TransactionState } from './reducers/Transactions';

export interface CombinedState {
    appState: AppState,
    accounts: AccountState,
    transactions: TransactionState,
}

const jsonClient = new JsonStoreClient(JsonStoreName.EnvelopeUserData);
const basePersistConfig = {
    storage: jsonClient,
};

const accountsPersistConfig = {
    ...basePersistConfig,
    key: 'accounts',
    stateReconciler: (inbound: AccountState): AccountState => accountStatePreprocessor(inbound),
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
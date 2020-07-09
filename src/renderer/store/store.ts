import { JsonStoreClient, JsonStoreName } from '@/dataStore/JSONStore';
import { applyMiddleware, combineReducers, createStore } from "redux";
import { persistReducer, persistStore } from 'redux-persist';
import thunk from 'redux-thunk';
import { accountStatePreprocessor } from './preprocessors/Account';
import { transactionStatePreprocessor } from './preprocessors/Transaction';
import { accounts, AccountState } from './reducers/Accounts';
import { transactions, TransactionState } from './reducers/Transactions';
import { appState, AppState } from './reducers/AppState';

export interface CombinedState {
    appState: AppState,
    accounts: AccountState,
    transactions: TransactionState,
}

const jsonClient = new JsonStoreClient(JsonStoreName.EnvelopeUserData);

const reconciler = (inboundState: CombinedState): CombinedState => {
    return {
        ...inboundState,
        accounts: accountStatePreprocessor(inboundState.accounts),
        transactions: transactionStatePreprocessor(inboundState.transactions),
    };
};

const persistConfig = {
    key: 'root',
    storage: jsonClient,
    debug: true,
    stateReconciler: reconciler,
    blacklist: [
        'appState',
    ],
}

const rootReducer = combineReducers({
    appState,
    accounts,
    transactions
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const ReduxStore = createStore(persistedReducer, applyMiddleware(thunk));
export const ReduxStorePersistor = persistStore(ReduxStore);
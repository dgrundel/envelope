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

const reconciler = (inboundState: CombinedState, originalState: CombinedState, reducedState: CombinedState): CombinedState => {
    return {
        ...originalState,
        ...reducedState,
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
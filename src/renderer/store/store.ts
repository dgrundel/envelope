import { combineReducers, createStore, applyMiddleware } from "redux";
import thunk from 'redux-thunk';
import { accounts, AccountState } from './reducers/Accounts';
import { transactions, TransactionState } from './reducers/Transactions';


export interface CombinedState {
    accounts: AccountState,
    transactions: TransactionState
}

const reducer = combineReducers({
    accounts,
    transactions
});

export const ReduxStore = createStore(reducer, applyMiddleware(thunk));
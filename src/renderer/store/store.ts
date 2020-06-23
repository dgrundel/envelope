import { combineReducers, createStore, applyMiddleware } from "redux";
import thunk from 'redux-thunk';
import { accounts, AccountState } from './reducers/Accounts';


export interface CombinedState {
    accounts: AccountState
}

const reducer = combineReducers({
    accounts
});

export const ReduxStore = createStore(reducer, applyMiddleware(thunk));
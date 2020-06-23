import { combineReducers, createStore } from "redux";
import { accounts } from './reducers/Accounts';

const reducer = combineReducers({
    accounts
});

export const ReduxStore = createStore(reducer);
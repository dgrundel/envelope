import { combineReducers, createStore, applyMiddleware } from "redux";
import thunk from 'redux-thunk';
import { accounts } from './reducers/Accounts';

const reducer = combineReducers({
    accounts
});

export const ReduxStore = createStore(reducer, applyMiddleware(thunk));
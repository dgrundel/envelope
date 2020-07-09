import { AppStateAction, SetPageAction } from '../actions/AppState';

export enum AppPage {
    Dashboard,
    Accounts,
    Envelopes,
    Transactions,
}

export interface AppState {
    page: AppPage;
}

const initialState: AppState = {
    page: AppPage.Dashboard,
};

const setPage = (state: AppState, action: SetPageAction): AppState => ({
    ...state,
    page: action.page,
});

export const appState = (state: AppState = initialState, action: any): AppState => {
    switch(action.type as AppStateAction) {
        case AppStateAction.SetPage:
            return setPage(state, action as SetPageAction);
        default:
            return state;
    }
}
import { AppStateAction, SetPageAction, SetModalAction, DismissModalAction } from '../actions/AppState';

export enum AppPage {
    Dashboard,
    Accounts,
    Envelopes,
    Transactions,
    QuickLink,
}

export interface Modal {

}

export interface AppState {
    page: AppPage;
    modal?: Modal;
}

const initialState: AppState = {
    page: AppPage.Dashboard,
};

const setPage = (state: AppState, action: SetPageAction): AppState => ({
    ...state,
    page: action.page,
});

const setModal = (state: AppState, action: SetModalAction): AppState => ({
    ...state,
    modal: action.modal,
});

const dismissModal = (state: AppState, action: DismissModalAction): AppState => ({
    ...state,
    modal: undefined,
});

export const appState = (state: AppState = initialState, action: any): AppState => {
    switch(action.type as AppStateAction) {
        case AppStateAction.SetPage:
            return setPage(state, action as SetPageAction);
        case AppStateAction.SetModal:
            return setModal(state, action as SetModalAction);
        case AppStateAction.DismissModal:
            return dismissModal(state, action as DismissModalAction);
        default:
            return state;
    }
}
import { AppPage } from '../reducers/AppState';

export enum AppStateAction {
    SetPage = 'store:action:app-state:set-page',
}

export interface SetPageAction {
    type: AppStateAction.SetPage;
    page: AppPage;
}

export const setPage = (page: AppPage): SetPageAction => ({
    type: AppStateAction.SetPage,
    page,
});

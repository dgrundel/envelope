import { AppPage, Modal } from '../reducers/AppState';

export enum AppStateAction {
    SetPage = 'store:action:app-state:set-page',
    SetModal = 'store:action:app-state:set-modal',
    DismissModal = 'store:action:app-state:dismiss-modal',
}

export interface SetPageAction {
    type: AppStateAction.SetPage;
    page: AppPage;
}

export const setPage = (page: AppPage): SetPageAction => ({
    type: AppStateAction.SetPage,
    page,
});

export interface SetModalAction {
    type: AppStateAction.SetModal;
    modal: Modal;
}

export const setModal = (modal: Modal): SetModalAction => ({
    type: AppStateAction.SetModal,
    modal,
});

export interface DismissModalAction {
    type: AppStateAction.DismissModal;
}

export const dismissModal = (): DismissModalAction => ({
    type: AppStateAction.DismissModal,
});
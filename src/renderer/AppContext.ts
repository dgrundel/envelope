import { ModalApi } from './components/uiElements/Modal';

export interface AppContext {
    modalApi: ModalApi;
}

class AppContextImpl implements AppContext {
    readonly modalApi: ModalApi;

    constructor(app: ModalApi) {
        this.modalApi = app;
    }
}

let appContext: AppContext;

export const initAppContext = (app: ModalApi) => {
    if (appContext) {
        throw new Error('App context is already initialized.');
    }

    appContext = new AppContextImpl(app);
    return appContext;
}

export const getAppContext = () => {
    if (!appContext) {
        throw new Error('App context was never initialized.');
    }
    return appContext;
}
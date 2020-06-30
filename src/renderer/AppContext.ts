import { ModalApi } from './components/uiElements/Modal';
import { PageApi } from './components/App';

export interface AppContext {
    modalApi: ModalApi;
    pageApi: PageApi;
}

class AppContextImpl implements AppContext {
    readonly modalApi: ModalApi;
    readonly pageApi: PageApi;

    constructor(app: ModalApi & PageApi) {
        this.modalApi = app;
        this.pageApi = app;
    }
}

let appContext: AppContext;

export const initAppContext = (app: ModalApi & PageApi) => {
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
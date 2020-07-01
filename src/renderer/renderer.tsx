import '@public/style.scss';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { App } from './components/App';
import { reduxStore, storePersistor } from './store/store';
import { Log } from '@/util/Logger';
import { initializeTheme } from './theme';
import { SpinnerModal } from './components/SpinnerModal';

initializeTheme();

reduxStore.subscribe(() => Log.debug('Redux Store Change', reduxStore.getState()));

ReactDOM.render(
    <Provider store={reduxStore}>
        <PersistGate persistor={storePersistor} loading={<SpinnerModal/>}>
            <App/>
        </PersistGate>
    </Provider>,
    document.getElementById('root')
);
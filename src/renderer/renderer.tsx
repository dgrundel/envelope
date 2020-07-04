import '@public/style.scss';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { App } from './components/App';
import { ReduxStore, ReduxStorePersistor } from './store/store';
import { Log } from '@/util/Logger';
import { initializeTheme } from './theme';
import { PersistGate } from 'redux-persist/integration/react';
import { SpinnerModal } from './components/SpinnerModal';

initializeTheme();

ReduxStore.subscribe(() => Log.debug('Redux Store Change', ReduxStore.getState()));

ReactDOM.render(
    <Provider store={ReduxStore}>
        <PersistGate persistor={ReduxStorePersistor} loading={<SpinnerModal/>}>
            <App/>
        </PersistGate>
    </Provider>,
    document.getElementById('root')
);
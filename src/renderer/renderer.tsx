import '@public/style.scss';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { App } from './components/App';
import { ReduxStore } from './store/store';
import { Log } from '@/util/Logger';

ReduxStore.subscribe(() => Log.debug(ReduxStore.getState()));

ReactDOM.render(
    <Provider store={ReduxStore}>
        <App/>
    </Provider>,
    document.getElementById('root')
);
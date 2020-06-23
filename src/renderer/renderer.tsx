import '@public/style.scss';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { App } from './components/App';
import { ReduxStore } from './store/store';

ReactDOM.render(
    <Provider store={ReduxStore}>
        <App/>
    </Provider>,
    document.getElementById('root')
);
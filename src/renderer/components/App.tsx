import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import '@public/components/App.scss';
import * as React from "react";
import { initAppContext } from '../AppContext';
import { loadAccounts } from '../store/actions/Account';
import { loadTransactions } from '../store/actions/Transaction';
import { ReduxStore } from '../store/store';
import { Modal, ModalApi } from "./Modal";
import { AccountsPage } from "./pages/AccountsPage";
import { DashboardPage } from './pages/DashboardPage';
import { EnvelopesPage } from './pages/EnvelopesPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { Sidebar } from './Sidebar';
import { FontIcon } from '@fluentui/react/lib/Icon';
import { mergeStyles } from '@fluentui/react/lib/Styling';

import { initializeIcons } from '@uifabric/icons';
initializeIcons('fonts/');

const iconClass = mergeStyles({
  fontSize: 50,
  height: 50,
  width: 50,
  margin: '0 25px',
});

const envelopeIcon = require('@public/images/envelope-icon.svg');

export enum AppPage {
    Dashboard,
    Accounts,
    Envelopes,
    Transactions
}

export interface PageApi {
    setPage: (page: AppPage) => void;
    getActivePage: () => AppPage;
}

export interface AppProps {
}

export interface AppState {
    ready: boolean;
    modals: Modal[];
    page: AppPage;
}

export class App extends React.Component<AppProps, AppState> implements ModalApi, PageApi {

    constructor(props: AppProps) {
        super(props);

        this.state = {
            ready: false,
            modals: [],
            page: AppPage.Dashboard
        };

        // ModalApi
        this.dismissModal = this.dismissModal.bind(this);
        this.queueModal = this.queueModal.bind(this);
        
        // PageApi
        this.setPage = this.setPage.bind(this);
        this.getActivePage = this.getActivePage.bind(this);

        initAppContext(this);

        // setTimeout(() => {
        //     const sampleModal = <BaseModal heading="Test modal" buttons={ButtonSets.ok(this)} closeButtonHandler={this.dismissModal}>Hello, modal.</BaseModal>;
        //     this.queueModal(sampleModal);
        // }, 2000);

        Promise.all([
            new AccountDataStoreClient().getAllAccounts()
                .then(accounts => ReduxStore.dispatch(loadAccounts(accounts))),
            new TransactionDataStoreClient().getAllTransactions()
                .then(transactions => ReduxStore.dispatch(loadTransactions(transactions)))
        ]).then(() => this.setState({ ready: true }));
    }

    render() {
        return <div id="app">
            <div id="header">
                <span className="envelope-icon" dangerouslySetInnerHTML={({__html: envelopeIcon})} />
                <h1 className="header-text">Envelope</h1>
            </div>
            <Sidebar/>
            <div id="main">
                <FontIcon iconName="Dictionary" className={iconClass} />
                {this.renderPage()}
                {this.showModal()}
            </div>
        </div>;
    }

    setPage(page: AppPage) {
        this.setState({ page });
    }

    getActivePage() {
        return this.state.page;
    }

    renderPage(): React.ReactNode {
        switch(this.state.page) {
            case AppPage.Accounts:
                return <AccountsPage/>;
            case AppPage.Envelopes:
                return <EnvelopesPage/>;
            case AppPage.Transactions:
                return <TransactionsPage/>;
            case AppPage.Dashboard:
            default:
                return <DashboardPage/>;
        }
    }

    queueModal(modal: Modal) {
        this.setState(prev => {
            return {
                modals: prev.modals.concat(modal)
            }
        });
    }

    showModal() {
        if (this.state.modals.length) {
            return this.state.modals[0];
        }
        return null;
    }

    dismissModal() {
        this.setState(prev => {
            return {
                modals: prev.modals.slice(1)
            }
        });
    }
}
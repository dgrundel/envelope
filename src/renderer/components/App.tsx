import { AccountDataStoreClient } from '@/dataStore/impl/AccountDataStore';
import { TransactionDataStoreClient } from '@/dataStore/impl/TransactionDataStore';
import { Account, AccountType, AccountData } from '@/models/Account';
import { Transaction } from '@/models/Transaction';
import '@public/components/App.scss';
import * as React from "react";
import { connect } from 'react-redux';
import { initAppContext } from '../AppContext';
import { loadAccounts } from '../store/actions/Account';
import { loadTransactions } from '../store/actions/Transaction';
import { Modal, ModalApi } from "./uiElements/Modal";
import { AccountsPage } from "./account/AccountsPage";
import { DashboardPage } from './DashboardPage';
import { EnvelopesPage } from './account/EnvelopesPage';
import { TransactionsPage } from './transaction/TransactionsPage';
import { Sidebar } from './Sidebar';
import { filterOnlyAccountType } from '@/util/Filters';
import { Currency } from '@/util/Currency';
import { Log } from '@/util/Logger';

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
    loadAccounts?: (accounts: Account[]) => void;
    loadTransactions?: (transactions: Transaction[]) => void;
}

export interface AppState {
    ready: boolean;
    modals: Modal[];
    page: AppPage;
}

class Component extends React.Component<AppProps, AppState> implements ModalApi, PageApi {
    
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

        this.initApp();
    }

    initApp() {
        const loadAccounts = this.props.loadAccounts!;
        const loadTransactions = this.props.loadTransactions!;

        const accountsDataStore = new AccountDataStoreClient();
        const transactionsDataStore = new TransactionDataStoreClient();
        
        Promise.all([
            accountsDataStore.getOrCreateUnallocatedAccount()
                .then(() => accountsDataStore.getAllAccounts())
                .then(accounts => loadAccounts(accounts)),
            transactionsDataStore.getAllTransactions()
                .then(transactions => loadTransactions(transactions))
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

export const App = connect(null, { loadAccounts, loadTransactions })(Component); 
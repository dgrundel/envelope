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
import { Modal, ModalApi } from "./Modal";
import { AccountsPage } from "./pages/AccountsPage";
import { DashboardPage } from './pages/DashboardPage';
import { EnvelopesPage } from './pages/EnvelopesPage';
import { TransactionsPage } from './pages/TransactionsPage';
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
        const accountsPromise = accountsDataStore.getAllAccounts()
            .then(accounts => {
                const unallocatedAccountExists = accounts.some(filterOnlyAccountType(AccountType.Unallocated));
                if (unallocatedAccountExists) {
                    return accounts;
                } else {
                    Log.debug('No unallocated account exists. Creating.');

                    // leading slashes in name are a dumb 
                    // performance optimization, as we expect:
                    // - returned records to be sorted by name
                    // - `find` to search in order
                    const accountData: AccountData = {
                        name: '__Unallocated',
                        type: AccountType.Unallocated,
                        balance: Currency.ZERO,
                        linkedAccountIds: []
                    };
                    return accountsDataStore.addAccount(accountData)
                        .then(created => {
                            Log.debug('Created "unallocated" account', created);
                            return accountsDataStore.getAllAccounts()
                        });
                }
            })
            .then(accounts => loadAccounts(accounts));
        const transactionsPromise = new TransactionDataStoreClient().getAllTransactions()
            .then(transactions => loadTransactions(transactions));
        
        Promise.all([
            accountsPromise,
            transactionsPromise
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
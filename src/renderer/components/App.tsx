import { Account } from '@/models/Account';
import { Transaction } from '@/models/Transaction';
import '@public/components/App.scss';
import * as React from "react";
import { initAppContext } from '../AppContext';
import { AccountsPage } from "./account/AccountsPage";
import { EnvelopesPage } from './account/EnvelopesPage';
import { DashboardPage } from './DashboardPage';
import { Sidebar } from './Sidebar';
import { TransactionsPage } from './transaction/TransactionsPage';
import { Modal, ModalApi } from "./uiElements/Modal";

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
    modals: Modal[];
    page: AppPage;
}

class Component extends React.Component<AppProps, AppState> implements ModalApi, PageApi {
    
    constructor(props: AppProps) {
        super(props);

        this.state = {
            modals: [],
            page: AppPage.Dashboard
        };

        // ModalApi
        this.dismissModal = this.dismissModal.bind(this);
        this.queueModal = this.queueModal.bind(this);
        this.replaceModal = this.replaceModal.bind(this);
        
        // PageApi
        this.setPage = this.setPage.bind(this);
        this.getActivePage = this.getActivePage.bind(this);

        initAppContext(this);

        // setTimeout(() => {
        //     const sampleModal = <BaseModal heading="Test modal" buttons={ButtonSets.ok(this)} closeButtonHandler={this.dismissModal}>Hello, modal.</BaseModal>;
        //     this.queueModal(sampleModal);
        // }, 2000);
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

    replaceModal(modal: Modal) {
        this.setState({
            modals: [modal]
        });
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

export const App = Component; 
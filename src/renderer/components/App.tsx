import '@public/components/App.scss';
import * as React from "react";
import { connect } from 'react-redux';
import { initAppContext } from '../AppContext';
import { CombinedState } from '../store/store';
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
    Transactions,
}

export interface AppProps {
    activePage?: AppPage;
}

export interface AppState {
    modals: Modal[];
}

class Component extends React.Component<AppProps, AppState> implements ModalApi {
    
    constructor(props: AppProps) {
        super(props);

        this.state = {
            modals: [],
        };

        // ModalApi
        this.dismissModal = this.dismissModal.bind(this);
        this.queueModal = this.queueModal.bind(this);
        this.replaceModal = this.replaceModal.bind(this);
        
        initAppContext(this);
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

    renderPage(): React.ReactNode {
        switch(this.props.activePage) {
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

const mapStateToProps = (state: CombinedState, ownProps: AppProps): AppProps => {
    return {
        ...ownProps,
        activePage: state.appState.page,
    };
};

export const App = connect(mapStateToProps, {})(Component); 
import '@public/components/App.scss';
import * as React from "react";
import { connect } from 'react-redux';
import { CombinedState } from '../store/store';
import { AccountsPage } from "./account/AccountsPage";
import { EnvelopesPage } from './account/EnvelopesPage';
import { DashboardPage } from './DashboardPage';
import { AppSidebar } from './AppSidebar';
import { TransactionsPage } from './transaction/TransactionsPage';
import { AppPage, Modal } from '../store/reducers/AppState';
import { AppHeader } from './AppHeader';

const envelopeIcon = require('@public/images/envelope-icon.svg');

export interface AppProps {
    // mapped state
    activePage?: AppPage;
    activeModal?: Modal;
}

class Component extends React.Component<AppProps> {
    
    render() {
        return <div id="app">
            <AppHeader/>
            <AppSidebar/>
            <div id="main" data-is-scrollable="true">
                {this.renderPage()}
                {this.props.activeModal}
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
}

const mapStateToProps = (state: CombinedState, ownProps: AppProps): AppProps => {
    return {
        ...ownProps,
        activePage: state.appState.page,
        activeModal: state.appState.modal,
    };
};

export const App = connect(mapStateToProps, {})(Component); 
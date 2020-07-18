import * as React from "react";
import { connect } from 'react-redux';
import { AppPage, Modal } from '../store/reducers/AppState';
import { CombinedState } from '../store/store';
import { AccountsPage } from "./account/AccountsPage";
import { EnvelopesPage } from './account/EnvelopesPage';
import { AppSidebar } from './AppSidebar';
import { DashboardPage } from './DashboardPage';
import { TransactionsPage } from './transaction/TransactionsPage';
import { mergeStyles } from '@fluentui/react';
import { QuickLink } from './transaction/QuickLinkPage';

export interface AppProps {
    // mapped state
    activePage?: AppPage;
    activeModal?: Modal;
}

const envelopeIcon = require('@public/images/envelope-icon.svg');


const appStyle = mergeStyles({
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: 'grid',
    gridTemplateRows: '1fr',
    gridTemplateColumns: '220px 1fr',
});

const mainStyle = mergeStyles({
    overflowY: 'auto',
    overflowX: 'hidden',
});

class Component extends React.Component<AppProps> {
    
    render() {
        return <div className={appStyle}>
            <AppSidebar/>
            <div data-is-scrollable="true" className={mainStyle}>
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
            case AppPage.QuickLink:
                return <QuickLink/>;
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
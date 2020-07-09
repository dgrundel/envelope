import { Transaction, TransactionFlag } from '@/models/Transaction';
import { doesNotHaveFlag } from '@/util/Flags';
import { FontIcon } from '@fluentui/react/lib/Icon';
import '@public/components/Sidebar.scss';
import memoizeOne from 'memoize-one';
import * as React from "react";
import { connect } from 'react-redux';
import { setPage } from '../store/actions/AppState';
import { CombinedState } from '../store/store';
import { ImportDropTarget } from './import/ImportDropTarget';
import { AppPage } from '../store/reducers/AppState';

export interface SidebarProps {
    // mapped from state
    activePage?: AppPage,
    unreconciledTransactionCount?: number;

    // store actions
    setPage?: (page: AppPage) => void;
}

class Component extends React.Component<SidebarProps, {}> {
    render() {
        return <div id="sidebar">
            <h4 className="sidebar-nav-header">Navigation Header</h4>
            <ul className="sidebar-nav">
                {this.renderNavLink(AppPage.Dashboard, 'Dashboard')}
                {this.renderNavLink(AppPage.Accounts, 'Accounts')}
                {this.renderNavLink(AppPage.Envelopes, 'Envelopes')}
                {this.renderNavLink(AppPage.Transactions, <>
                    Transactions
                    {this.props.unreconciledTransactionCount! > 0 && <FontIcon iconName="AlertSolid" />}
                </>)}
            </ul>
            <ImportDropTarget/>
        </div>;
    }

    renderNavLink(page: AppPage, label: any) {
        const onClick = () => this.props.setPage!(page);

        return <li className={this.props.activePage === page ? 'sidebar-nav-link-active' : ''} onClick={onClick}>{label}</li>;
    }
}

const getUnreconciledCount = memoizeOne((transactions: Record<string, Transaction>): number => {
    return Object.values(transactions)
        .filter(transaction => doesNotHaveFlag(TransactionFlag.Reconciled, transaction.flags))
        .length;
});

const mapStateToProps = (state: CombinedState, ownProps: SidebarProps): SidebarProps => {
    return {
        ...ownProps,
        activePage: state.appState.page,
        unreconciledTransactionCount: getUnreconciledCount(state.transactions.transactions),
    };
};

export const Sidebar = connect(mapStateToProps, { setPage, })(Component);
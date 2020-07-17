import { Account } from '@/models/Account';
import { Currency } from '@/models/Currency';
import { Transaction, TransactionFlag } from '@/models/Transaction';
import { filterOnlyEnvelopeAccounts } from '@/util/Filters';
import { doesNotHaveFlag } from '@/util/Flags';
import { FontIcon } from '@fluentui/react/lib/Icon';
import '@public/components/Sidebar.scss';
import memoizeOne from 'memoize-one';
import * as React from "react";
import { connect } from 'react-redux';
import { setPage } from '../store/actions/AppState';
import { AppPage } from '../store/reducers/AppState';
import { CombinedState } from '../store/store';
import { ImportDropTarget } from './transaction/importWizard/ImportDropTarget';
import { SVG } from './uiElements/SVG';

export interface SidebarProps {
    // mapped from state
    activePage?: AppPage,
    unreconciledTransactionCount?: number;
    negativeEnvelopeCount?: number;

    // store actions
    setPage?: (page: AppPage) => void;
}

class Component extends React.Component<SidebarProps, {}> {
    render() {
        return <div id="sidebar">
            <SVG html={require('@public/images/envelope-icon.svg')} className="app-icon" />

            {/* <h4 className="sidebar-nav-header">Navigation Header</h4> */}
            <ul className="sidebar-nav">
                {this.renderNavLink(AppPage.Dashboard, 'Dashboard')}
                {this.renderNavLink(AppPage.Accounts, 'Accounts')}
                {this.renderNavLink(AppPage.Envelopes, <>
                    Envelopes
                    {this.renderAlert(this.props.negativeEnvelopeCount!)}
                </>)}
                {this.renderNavLink(AppPage.Transactions, <>
                    Transactions
                    {this.renderAlert(this.props.unreconciledTransactionCount!)}
                </>)}
            </ul>
            <ImportDropTarget/>
        </div>;
    }

    renderNavLink(page: AppPage, label: any) {
        const onClick = () => this.props.setPage!(page);

        return <li className={this.props.activePage === page ? 'sidebar-nav-link-active' : ''} onClick={onClick}>{label}</li>;
    }

    renderAlert(count: number) {
        if (count === 0) {
            return null;
        }

        return <FontIcon iconName="AlertSolid" />;
    }
}

const getUnreconciledCount = memoizeOne((transactions: Record<string, Transaction>): number => {
    return Object.values(transactions)
        .filter(transaction => doesNotHaveFlag(TransactionFlag.Reconciled, transaction.flags))
        .length;
});

const getNegativeEnvelopeCount = memoizeOne((accounts: Record<string, Account>): number => {
    return Object.values(accounts)
        .filter(filterOnlyEnvelopeAccounts)
        .filter(account => account.balance.lt(Currency.ZERO))
        .length;
});

const mapStateToProps = (state: CombinedState, ownProps: SidebarProps): SidebarProps => {
    return {
        ...ownProps,
        activePage: state.appState.page,
        unreconciledTransactionCount: getUnreconciledCount(state.transactions.transactions),
        negativeEnvelopeCount: getNegativeEnvelopeCount(state.accounts.accounts),
    };
};

export const AppSidebar = connect(mapStateToProps, { setPage, })(Component);
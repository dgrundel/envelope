import { Transaction, TransactionFlag } from '@/models/Transaction';
import { setModal } from '@/renderer/store/actions/AppState';
import { Modal } from '@/renderer/store/reducers/AppState';
import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { filterOnlyImportedTransactions } from '@/util/Filters';
import { hasFlag } from '@/util/Flags';
import { DetailsList, DetailsListLayoutMode, FontIcon, IColumn, SelectionMode } from '@fluentui/react';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { Card } from '../uiElements/Card';
import { TransactionModal } from './TransactionModal';
import { Layout } from '../uiElements/Layout';

export interface TransactionsPageProps {
    // mapped from state
    sortedTransactions?: Transaction[];
    transactions?: Record<string, Transaction>;
    accounts?: Record<string, Account>;

    // store actions
    setModal?: (modal: Modal) => void;
}

export interface TransactionsPageState {
}

const columns: IColumn[] = [
    { key: 'column1', name: 'Date', fieldName: 'date', minWidth: 100, maxWidth: 120, },
    { key: 'column2', name: 'Account', fieldName: 'account', minWidth: 150, maxWidth: 180, },
    { key: 'column3', name: 'Description', fieldName: 'description', minWidth: 350, },
    { key: 'column4', name: 'Amount', fieldName: 'amount', minWidth: 100, maxWidth: 200,  },
    { key: 'column5', name: 'reconciled', fieldName: 'reconciled', minWidth: 32, maxWidth: 48, isIconOnly: true, },
];

class Component extends React.Component<TransactionsPageProps, TransactionsPageState> {
    constructor(props: TransactionsPageProps) {
        super(props);
        this.state = {};
    }

    render() {
        return <Layout>
            <Card heading="Transactions">
                {this.renderList()}
            </Card>
        </Layout>;
    }

    renderList() {
        const sortedTransactions = this.props.sortedTransactions!;
        const accounts = this.props.accounts!;
        const setModal = (this.props.setModal!);

        if (sortedTransactions.length === 0) {
            return <p>No transactions yet.</p>;
        }

        const items = sortedTransactions
            .map(t => {
                const isReconciled = hasFlag(TransactionFlag.Reconciled, t.flags);
                
                const onClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    setModal(<TransactionModal transaction={t} />);
                };

                return {
                    key: t._id,
                    date: t.date.toLocaleDateString(),
                    account: accounts[t.accountId].name,
                    description: t.description,
                    amount: t.amount.toFormattedString(),
                    reconciled: <span onClick={onClick}>
                        <FontIcon iconName={isReconciled ? 'CheckMark' : 'AlertSolid'} className={isReconciled ? 'color-success' : 'color-warn'} />
                    </span>
                }
            });

        return <DetailsList
            items={items}
            columns={columns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            // selectionMode={SelectionMode.single}
            // selection={this.selection}
            // selectionPreservedOnEmptyClick={true}
        />;

    }
}

const mapStateToProps = (state: CombinedState, ownProps: TransactionsPageProps): TransactionsPageProps => ({
    ...ownProps,
    transactions: state.transactions.transactions,
    accounts: state.accounts.accounts,
    sortedTransactions: state.transactions.sortedIds
        .map(id => state.transactions.transactions[id])
        .filter(filterOnlyImportedTransactions)
});

export const TransactionsPage = connect(mapStateToProps, { setModal, })(Component);
import { Transaction, TransactionFlag } from '@/models/Transaction';
import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { filterOnlyImportedTransactions } from '@/util/Filters';
import { hasFlag } from '@/util/Flags';
import { DetailsList, DetailsListLayoutMode, FontIcon, IColumn, SelectionMode } from '@fluentui/react';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { Box } from "../uiElements/Box";
import { TransactionModal } from './TransactionModal';
import { setModal } from '@/renderer/store/actions/AppState';
import { Modal } from '@/renderer/store/reducers/AppState';

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
    { key: 'column4', name: 'reconciled', fieldName: 'reconciled', minWidth: 32, maxWidth: 48, isIconOnly: true, },
];

class Component extends React.Component<TransactionsPageProps, TransactionsPageState> {
    constructor(props: TransactionsPageProps) {
        super(props);
        this.state = {};
    }

    render() {
        return <Box heading="Transactions">
            {this.renderList()}
        </Box>;
    }

    renderList() {
        const sortedTransactions = this.props.sortedTransactions!;
        const accounts = this.props.accounts!;
        const transactionMap = this.props.transactions!;
        const setModal = (this.props.setModal!);

        if (sortedTransactions.length === 0) {
            return 'No transactions yet.';
        }

        const items = sortedTransactions
            .map(t => {
                const isReconciled = hasFlag(TransactionFlag.Reconciled, t.flags);
                const existingLinks = t.linkedTransactionIds.map(id => transactionMap[id]) || [];
                const balance = existingLinks.reduce(
                    (bal: Currency, link: Transaction) => {
                        // Log.debug('link', link);
                        // subtract linked amounts to see if it zeros out
                        return bal.sub(link.amount);
                    },
                    t.amount
                );
                
                const onClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    setModal(<TransactionModal transaction={t} unlinkedBalance={balance} />);
                };

                return {
                    key: t._id,
                    date: t.date.toLocaleDateString(),
                    account: accounts[t.accountId].name,
                    description: t.description,
                    reconciled: <span onClick={onClick}>
                        <FontIcon iconName={isReconciled ? 'CheckMark' : 'Error'} />
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
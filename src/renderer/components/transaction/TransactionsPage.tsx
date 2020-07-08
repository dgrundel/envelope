import { Transaction, TransactionFlag } from '@/models/Transaction';
import { getAppContext } from '@/renderer/AppContext';
import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { Log } from '@/util/Logger';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { TransactionModal } from './TransactionModal';
import { Box } from "../uiElements/Box";
import { DataTable } from '../uiElements/DataTable';
import { filterOnlyImportedTransactions } from '@/util/Filters';
import { FontIcon } from '@fluentui/react';
import { hasFlag } from '@/util/Flags';

export interface TransactionsPageProps {
    sortedTransactions?: Transaction[];
    transactions?: Record<string, Transaction>;
    accounts?: Record<string, Account>;
}

export interface TransactionsPageState {
}

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
        const sortedTransactions = this.props.sortedTransactions || [];
        const accounts = this.props.accounts || {};

        if (sortedTransactions.length === 0) {
            return 'No transactions yet.';
        }

        return <DataTable<Transaction>
            rows={sortedTransactions}
            fields={[{
                name: 'date',
                label: 'Date',
                formatter: (value, row) => row.date.toLocaleDateString()
            },{
                name: 'accountId',
                label: 'Account',
                formatter: (id) => accounts[id].name
            },{
                name: 'description',
                label: 'Description'
            },{
                name: 'amount',
                label: 'Amount',
                formatter: (value: Currency, row) => value.toFormattedString()
            },{
                name: 'linkedTransactions',
                label: <FontIcon iconName="Link"/>,
                formatter: this.linkedTransactionsFormatter.bind(this)
            }]}
            keyField={'_id'}
            onSelect={(selected) => Log.debug('Table selection changed', selected)}
        />

    }

    private linkedTransactionsFormatter(value: string, row: Transaction) {
        const transactionMap = this.props.transactions || {};
        const transaction = transactionMap[row._id];
        const isReconciled = hasFlag(TransactionFlag.Reconciled, transaction.flags);
        
        const existingLinks = transaction.linkedTransactionIds.map(id => transactionMap[id]) || [];
        
        const balance = existingLinks.reduce(
            (bal: Currency, link: Transaction) => {
                // Log.debug('link', link);
                // subtract linked amounts to see if it zeros out
                return bal.sub(link.amount);
            },
            transaction.amount
        );

        // Log.debug('balance', transaction.description, balance.toString());
        
        const clickHander = (e: React.MouseEvent) => {
            e.preventDefault();

            const modal = <TransactionModal transaction={transaction} unlinkedBalance={balance} />;
            
            getAppContext().modalApi.queueModal(modal);
        };
        
        let icon = <FontIcon iconName="Error" />;
        if (isReconciled) {
            icon = <FontIcon iconName="CheckMark" />;
        }

        return <span onClick={clickHander}>
            {icon}
        </span>;
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

export const TransactionsPage = connect(mapStateToProps, {})(Component);
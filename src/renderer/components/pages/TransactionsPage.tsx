import { Transaction } from '@/models/Transaction';
import { getAppContext } from '@/renderer/AppContext';
import { CombinedState } from '@/renderer/store/store';
import { Currency } from '@/util/Currency';
import { Log } from '@/util/Logger';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { AddLinkedTransactions } from '../AddLinkedTransactions';
import { Box } from "../Box";
import { DataTable } from '../DataTable';

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
                name: 'accountName',
                label: 'Account'
            },{
                name: 'description',
                label: 'Description'
            },{
                name: 'amount',
                label: 'Amount',
                formatter: (value: Currency, row) => value.toFormattedString()
            },{
                name: 'linkedTransactions',
                label: '',
                formatter: this.linkedTransactionsFormatter.bind(this)
            }]}
            keyField={'_id'}
            onSelect={(selected) => Log.debug('Table selection changed', selected)}
        />

    }

    private linkedTransactionsFormatter(value: string, row: Transaction) {
        const transactionMap = this.props.transactions || {};
        const existingLinks = row.linkedTransactionIds.map(id => transactionMap[id]) || [];
        const balance = existingLinks.reduce(
            (bal: Currency, link: Transaction) => {
                Log.debug('link', link);
                // subtract linked amounts to see if it zeros out
                return bal.sub(link.amount);
            },
            row.amount
        );

        Log.debug('balance', row.description, balance.toString());
        
        const clickHander = (e: React.MouseEvent) => {
            e.preventDefault();

            const modal = <AddLinkedTransactions transaction={row} existingLinks={existingLinks} suggestedValue={balance} maxValue={balance} />;
            
            getAppContext().modalApi.queueModal(modal);
        };
        
        let icon = <i className="material-icons transaction-list-icon-unlinked">error_outline</i>;
        if (balance.isZero()) {
            icon = <i className="material-icons transaction-list-icon-linked">check_circle_outline</i>;
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
    sortedTransactions: state.transactions.sortedIds.map(id => state.transactions.transactions[id])
});

export const TransactionsPage = connect(mapStateToProps, {})(Component);
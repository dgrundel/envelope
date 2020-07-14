import { Transaction, TransactionFlag } from '@/models/Transaction';
import { setModal } from '@/renderer/store/actions/AppState';
import { Modal } from '@/renderer/store/reducers/AppState';
import { CombinedState } from '@/renderer/store/store';
import { filterOnlyImportedTransactions } from '@/util/Filters';
import { doesNotHaveFlag, hasFlag } from '@/util/Flags';
import { Log } from '@/util/Logger';
import { CommandBar, DetailsList, DetailsListLayoutMode, FontIcon, IColumn, ICommandBarItemProps, IObjectWithKey, Selection, SelectionMode } from '@fluentui/react';
import { Account } from '@models/Account';
import memoizeOne from 'memoize-one';
import * as React from "react";
import { connect } from 'react-redux';
import { Card } from '../uiElements/Card';
import { Layout } from '../uiElements/Layout';
import { TransactionModal } from './TransactionModal';

export interface TransactionsPageProps {
    // mapped from state
    sortedTransactions?: Transaction[];
    accounts?: Record<string, Account>;

    // store actions
    setModal?: (modal: Modal) => void;
}

const columns: IColumn[] = [
    { key: 'column1', name: 'Date', fieldName: 'date', minWidth: 100, maxWidth: 120, },
    { key: 'column2', name: 'Account', fieldName: 'account', minWidth: 150, maxWidth: 180, },
    { key: 'column3', name: 'Description', fieldName: 'description', minWidth: 350, },
    { key: 'column4', name: 'Amount', fieldName: 'amount', minWidth: 100, maxWidth: 200,  },
    { key: 'column5', name: 'reconciled', fieldName: 'reconciled', minWidth: 32, maxWidth: 48, isIconOnly: true, },
];

interface DetailListItem extends IObjectWithKey {
    date: string;
    account: string;
    description: string;
    amount: string;
    reconciled: any;
}

class Component extends React.Component<TransactionsPageProps> {
    
    constructor(props: TransactionsPageProps) {
        super(props);

        this.computeItems = memoizeOne(this.computeItems.bind(this));
    }

    computeItems(transactions: Transaction[], accounts: Record<string, Account>): DetailListItem[] {        
        return transactions
            .map(t => {
                const isReconciled = hasFlag(TransactionFlag.Reconciled, t.flags);

                const onClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    this.props.setModal!(<TransactionModal transaction={t} />);
                };

                return {
                    key: t._id,
                    date: t.date.toLocaleDateString(),
                    account: accounts[t.accountId].name,
                    description: t.description,
                    amount: t.amount.toFormattedString(),
                    reconciled: <span onClick={onClick}>
                        <FontIcon iconName={isReconciled ? 'CheckMark' : 'AlertSolid'} className={isReconciled ? 'color-success' : 'color-warn'} />
                    </span>,
                };
            });
    }

    render() {
        return <Layout>
            <Card heading="Transactions">
                {this.renderList()}
            </Card>
        </Layout>;
    }

    renderList() {
        const items = this.computeItems(
            this.props.sortedTransactions!, 
            this.props.accounts!,
        );

        if (items.length === 0) {
            return <p>No transactions yet.</p>;
        }

        return <>
            <DetailsList
                items={items}
                columns={columns}
                compact={true}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.none}
            />
        </>;

    }
}

const mapStateToProps = (state: CombinedState, ownProps: TransactionsPageProps): TransactionsPageProps => ({
    ...ownProps,
    accounts: state.accounts.accounts,
    sortedTransactions: state.transactions.sortedIds
        .map(id => state.transactions.transactions[id])
        .filter(filterOnlyImportedTransactions)
});

export const TransactionsPage = connect(mapStateToProps, { setModal, })(Component);
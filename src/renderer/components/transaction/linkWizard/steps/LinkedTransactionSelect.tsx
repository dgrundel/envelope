import { Transaction, TransactionFlag } from '@/models/Transaction';
import { CombinedState } from '@/renderer/store/store';
import { Separator, Selection, IObjectWithKey, IColumn, DetailsList, DetailsListLayoutMode, SelectionMode } from '@fluentui/react';
import * as React from "react";
import { connect } from 'react-redux';
import { TransactionCard } from '../../TransactionCard';
import { LinkWizardStepProps } from '../LinkWizardFactory';
import { LinkWizardStepFrame } from '../LinkWizardStepFrame';
import { Log } from '@/util/Logger';
import { isBlank } from '@/util/Filters';

export interface LinkedTransactionSelectProps extends LinkWizardStepProps {
    linkableTransactions?: Transaction[];
}

const columns: IColumn[] = [
    { key: 'column1', name: 'Date', fieldName: 'date', minWidth: 150, },
    { key: 'column2', name: 'Description', fieldName: 'description', minWidth: 350, },
    { key: 'column3', name: 'Amount', fieldName: 'amount', minWidth: 150, },
];

class Component extends React.Component<LinkedTransactionSelectProps> {
    private readonly items: IObjectWithKey[];
    private readonly selection: Selection;

    constructor(props: LinkedTransactionSelectProps) {
        super(props);

        this.items = props.linkableTransactions!.map(t => ({
            key: t._id,
            date: t.date.toLocaleDateString(),
            description: t.description,
            amount: t.amount.toFormattedString(),
        }));

        if (this.items.length === 0) {
            Log.error('No linkable transactions found.');
        }

        this.selection = new Selection({
            items: this.items,
            onSelectionChanged: () => {
                const items = this.selection.getSelection();
                const key = items[0]?.key?.toString();
                this.props.setState({
                    linkedTransactionId: key
                });
            },
        });

        if (this.props.linkedTransactionId) {
            this.selection.setKeySelected(this.props.linkedTransactionId, true, false);
        }

        if (props.selectedTransactionFlag === TransactionFlag.Transfer) {
            props.setStepValidator(this.validateState);

        } else {
            props.nextStep();
        }
    }

    validateState(state: LinkWizardStepProps) {
        if (isBlank(state.linkedTransactionId)) {
            return 'Please select a transaction.';
        }
    }
    
    render() {
        return <LinkWizardStepFrame transaction={this.props.transaction}>
            <DetailsList
                items={this.items}
                columns={columns}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.single}
                selection={this.selection}
                selectionPreservedOnEmptyClick={true}
            />
        </LinkWizardStepFrame>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: LinkedTransactionSelectProps): LinkedTransactionSelectProps => {
    const accountId = ownProps.selectedAccountId;
    const absAmount = ownProps.transaction.amount.getAbsolute();
    
    const accountTransactions = state.transactions.sortedIds
        .map(id => state.transactions.transactions[id])
        .filter(transaction => transaction.accountId === accountId);

    const withSameAmount = accountTransactions.filter(transaction => transaction.amount.getAbsolute().eq(absAmount));
    const linkableTransactions = withSameAmount.length > 0 ? withSameAmount : accountTransactions;

    return {
        ...ownProps,
        linkableTransactions,
    };
}

export const LinkedTransactionSelect = connect(mapStateToProps, {})(Component);
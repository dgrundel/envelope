import { Transaction, TransactionFlag } from '@/models/Transaction';
import { CombinedState } from '@/renderer/store/store';
import { Separator, Selection, IObjectWithKey, IColumn, DetailsList, DetailsListLayoutMode, SelectionMode } from '@fluentui/react';
import * as React from "react";
import { connect } from 'react-redux';
import { TransactionCard } from '../../TransactionCard';
import { SingleLinkWizardStepProps } from '../SingleLinkWizardFactory';
import { SingleLinkWizardStepFrame } from '../SingleLinkWizardStepFrame';
import { Log } from '@/util/Logger';
import { isBlank } from '@/util/Filters';
import { unionFlags, intersectFlags } from '@/util/Flags';
import { Account } from '@/models/Account';

export interface LinkedTransactionSelectProps extends SingleLinkWizardStepProps {
    linkableTransactions?: Transaction[];
    selectedAccount?: Account;
}

const columns: IColumn[] = [
    { key: 'column1', name: 'Date', fieldName: 'date', minWidth: 150, },
    { key: 'column2', name: 'Description', fieldName: 'description', minWidth: 350, },
    { key: 'column3', name: 'Amount', fieldName: 'amount', minWidth: 150, },
];

interface ListItem extends IObjectWithKey {
    date: string;
    description: string;
    amount: string;
    transaction: Transaction;
}

class Component extends React.Component<LinkedTransactionSelectProps> {
    private readonly items: ListItem[];
    private readonly selection: Selection;

    constructor(props: LinkedTransactionSelectProps) {
        super(props);

        this.items = props.linkableTransactions!.map(t => ({
            key: t._id,
            date: t.date.toLocaleDateString(),
            description: t.description,
            amount: t.amount.toFormattedString(),
            transaction: t,
        }));

        this.selection = new Selection({
            items: this.items,
            onSelectionChanged: () => {
                const items = this.selection.getSelection();
                const item = items[0] as ListItem;
                if (item) {
                    this.props.setState({
                        relatedTransaction: item.transaction,
                    });
                }
            },
        });

        if (this.props.relatedTransaction) {
            this.selection.setKeySelected(this.props.relatedTransaction._id, true, false);
        }

        if (props.selectedTransactionFlag === TransactionFlag.Transfer) {
            if (this.items.length === 0) {
                Log.error('No linkable transactions found.');
            }

            props.setStepValidator(this.validateState);

        } else {
            props.nextStep();
        }
    }

    validateState(state: SingleLinkWizardStepProps) {
        if (!state.relatedTransaction) {
            return 'Please select a transaction.';
        }
    }
    
    render() {
        return <SingleLinkWizardStepFrame transaction={this.props.transaction}>
            <p>Select the related transaction from <strong>{this.props.selectedAccount!.name}</strong></p>

            <DetailsList
                items={this.items}
                columns={columns}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.single}
                selection={this.selection}
                selectionPreservedOnEmptyClick={true}
            />
        </SingleLinkWizardStepFrame>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: LinkedTransactionSelectProps): LinkedTransactionSelectProps => {
    const selectedAccountId = ownProps.relatedAccountId!;
    const selectedAccount = state.accounts.accounts[selectedAccountId];
    const absAmount = ownProps.transaction.amount.getAbsolute();

    let flags = TransactionFlag.None;
    switch(ownProps.amountTypeFlag) {
        case TransactionFlag.BankCredit:
            flags = TransactionFlag.BankDebit;
            break;
        case TransactionFlag.BankDebit:
            flags = unionFlags(
                TransactionFlag.BankCredit,
                TransactionFlag.CreditAccountCredit
            );
            break;
        case TransactionFlag.CreditAccountCredit:
            flags = TransactionFlag.BankDebit;
            break;
    }
    
    const accountTransactions = state.transactions.sortedIds
        .map(id => state.transactions.transactions[id])
        .filter(transaction => transaction.accountId === selectedAccountId
            && intersectFlags(transaction.flags, flags) > 0);

    const withSameAmount = accountTransactions.filter(transaction => transaction.amount.getAbsolute().eq(absAmount));
    const linkableTransactions = withSameAmount.length > 0 ? withSameAmount : accountTransactions;

    return {
        ...ownProps,
        linkableTransactions,
        selectedAccount,
    };
}

export const RelatedTransactionSelect = connect(mapStateToProps, {})(Component);
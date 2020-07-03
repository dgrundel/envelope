import { Transaction } from '@/models/Transaction';
import { CombinedState } from '@/renderer/store/store';
import { filterOnlyImportedTransactions } from '@/util/Filters';
import { DetailsList, DetailsListLayoutMode, FontIcon, IColumn, MessageBar, MessageBarType, Selection, SelectionMode } from '@fluentui/react';
import { Account } from '@models/Account';
import { isEqual } from 'lodash';
import * as React from "react";
import { connect } from 'react-redux';
import { ImportWizardStepProps, rowToTransactionData } from "../ImportWizardFactory";

export interface InvertAmountsSelectProps extends ImportWizardStepProps {
    duplicateTransactions?: Transaction[];
    selectedAccount?: Account;
}

const columns: IColumn[] = [
    { key: 'dateColumn', name: 'Date', fieldName: 'date', minWidth: 150, },
    { key: 'dupeColumn', name: 'Duplicate', fieldName: 'duplicateIcon', minWidth: 48, maxWidth: 48, isIconOnly: true, },
    { key: 'descColumn', name: 'Description', fieldName: 'description', minWidth: 350, },
    { key: 'amtColumn', name: 'Amount', fieldName: 'amount', minWidth: 150, },
];

const DUPLICATE_ICON = <FontIcon iconName="Warning" title="Duplicate Transaction" />;
class Component extends React.Component<InvertAmountsSelectProps> {
    private readonly items: any[];
    private readonly selection: Selection;
    
    constructor(props: InvertAmountsSelectProps) {
        super(props);

        this.state = {};

        this.items = props.rows.map((row, i) => {
            const transaction = rowToTransactionData(
                row, 
                this.props.invertTransactions, 
                this.props.dateColumn!,
                this.props.amountColumn!,
                this.props.descriptionColumns!,
                this.props.selectedAccount!
            );

            const isDuplicate = props.duplicateTransactions!.some(t => isEqual(t.importData, row));

            return {
                key: i.toString(),
                index: i,
                isDuplicate,
                duplicateIcon: isDuplicate ? DUPLICATE_ICON : '',
                date: transaction.date.toLocaleDateString(),
                amount: transaction.amount.toFormattedString(),
                description: transaction.description,
            };
        });

        this.selection = new Selection({
            items: this.items,
            onSelectionChanged: () => {
                const selectedForImport = this.selection.getSelection()
                    .map(item => (item as any).index as number);
                
                this.props.setState({
                    selectedForImport
                });
            },
        });

        if (this.props.selectedForImport) {
            this.props.selectedForImport.forEach(i => {
                this.selection.setKeySelected(i.toString(), true, false);
            });
        } else {
            this.selection.getItems().forEach((item: any) => {
                const isSelected = item.isDuplicate !== true;
                this.selection.setKeySelected(item.key as string, isSelected, false);
            })
        }
    }
    
    render() {
        const account = this.props.selectedAccount!;

        let messageBar;
        if (this.props.duplicateTransactions!.length > 0) {
            messageBar = <MessageBar messageBarType={MessageBarType.warning} isMultiline={true}>
                <p>It looks like some transactions have already been imported into your account.</p>
                
                <p>These transactions are marked with {DUPLICATE_ICON} and have been de-selected
                in the list below. If you'd like to import these transactions anyway, select them.</p>
            </MessageBar>;
        }

        return <div>
            {messageBar}

            <h3>Ready to import.</h3>

            <p>The transactions selected will be imported into your account <strong>{account.name}</strong>.</p>

            <p>You can select multiple items using the <strong>Ctrl</strong> or <strong>Cmd</strong> key.</p>

            <DetailsList
                items={this.items}
                columns={columns}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.multiple}
                selection={this.selection}
                selectionPreservedOnEmptyClick={true}
            />
        </div>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: InvertAmountsSelectProps): InvertAmountsSelectProps => {
    const accountId = ownProps.accountId;
    const selectedAccount = accountId ? state.accounts.accounts[accountId] : undefined;
    const duplicateTransactions = state.transactions.sortedIds
        .map(id => state.transactions.transactions[id])
        .filter(filterOnlyImportedTransactions)
        .filter(transaction => transaction.accountId === accountId
            && transaction.importData 
            && ownProps.rows.some(row => isEqual(row, transaction.importData)))

    return {
        ...ownProps,
        duplicateTransactions,
        selectedAccount,
    };
}

export const DuplicatesSelect = connect(mapStateToProps, {})(Component);
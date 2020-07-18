import { findAmountTransactionFlag, Transaction, TransactionFlag } from '@/models/Transaction';
import { setModal } from '@/renderer/store/actions/AppState';
import { addLinkedTransactionForBankDebit, addLinkedTransactionForCreditCardPurchase } from '@/renderer/store/actions/Transaction';
import { Modal } from '@/renderer/store/reducers/AppState';
import { CombinedState } from '@/renderer/store/store';
import { getAccounts } from '@/renderer/store/transforms/Account';
import { getTransactions } from '@/renderer/store/transforms/Transaction';
import { listToMap } from '@/util/Data';
import { filterOnlyAssignableAccounts, filterOnlyImportedTransactions } from '@/util/Filters';
import { hasFlag } from '@/util/Flags';
import { Log } from '@/util/Logger';
import { DetailsList, DetailsListLayoutMode, DetailsRow, FontIcon, IColumn, IDetailsRowProps, IObjectWithKey, mergeStyles, Panel, SelectionMode, Text } from '@fluentui/react';
import { Account } from '@models/Account';
import memoizeOne from 'memoize-one';
import * as React from "react";
import { connect } from 'react-redux';
import { Card } from '../uiElements/Card';
import { Draggable } from '../uiElements/Draggable';
import { DraggableDropTarget } from '../uiElements/DraggableDropTarget';
import { Layout } from '../uiElements/Layout';
import { Colors, Mixins } from '../uiElements/styleValues';
import { TransactionModal } from './TransactionModal';

export interface TransactionsPageProps {
    // mapped from state
    importedTransactions?: Transaction[];
    accounts?: Record<string, Account>;
    envelopes?: Account[];
    transactionMap?: Record<string, Transaction>;

    // store actions
    setModal?: (modal: Modal) => void;
    addLinkedTransactionForBankDebit?: (transaction: Transaction, envelope: Account) => void;
    addLinkedTransactionForCreditCardPurchase?: (transaction: Transaction, envelope: Account) => void;
}

interface State {
    isPanelOpen: boolean;
}

const columns: IColumn[] = [
    { key: 'column0', name: 'dragHandle', fieldName: 'dragHandle', minWidth: 32, maxWidth: 48, isIconOnly: true, },
    { key: 'column1', name: 'Date', fieldName: 'date', minWidth: 100, maxWidth: 120, },
    { key: 'column2', name: 'Account', fieldName: 'account', minWidth: 150, maxWidth: 180, },
    { key: 'column3', name: 'Description', fieldName: 'description', minWidth: 350, },
    { key: 'column4', name: 'Amount', fieldName: 'amount', minWidth: 100, maxWidth: 200,  },
    { key: 'column5', name: 'reconciled', fieldName: 'reconciled', minWidth: 32, maxWidth: 48, isIconOnly: true, },
];

const envelopeDropTargetClassName = mergeStyles({
    padding: '0.5em',
    margin: '0.1em -0.5em',
}, Mixins.rounded);

interface EnvelopeDropTargetProps {
    envelope: Account;
    onDrop: (data: string | Record<string, string>) => void;
}

const EnvelopeDropTarget = (props: EnvelopeDropTargetProps) => {
    const [isHover, setIsHover] = React.useState(false);
    const envelope = props.envelope;
    const style = {
        color: isHover ? Colors.HighlightForeground : undefined,
        backgroundColor: isHover ? Colors.HighlightBackground : undefined,
    };

    return <DraggableDropTarget onDrop={props.onDrop} onHoverStateChange={b => setIsHover(b)} className={envelopeDropTargetClassName} style={style}>
        <Text variant={'medium'}>{envelope.name}</Text>
        <Text variant={'small'}> {envelope.balance.toFormattedString()}</Text>
    </DraggableDropTarget>
};

interface DetailListItem extends IObjectWithKey {
    draggable: boolean;
    dragHandle: any;
    date: string;
    account: string;
    description: string;
    amount: string;
    reconciled: any;
    transaction: Transaction;
}

class Component extends React.Component<TransactionsPageProps, State> {
    
    constructor(props: TransactionsPageProps) {
        super(props);

        this.computeItems = memoizeOne(this.computeItems.bind(this));
        this.onRenderRow = this.onRenderRow.bind(this);

        this.state = {
            isPanelOpen: false,
        };
    }

    computeItems(transactions: Transaction[], accounts: Record<string, Account>): DetailListItem[] {        
        return transactions
            .map(transaction => {
                const isReconciled = hasFlag(TransactionFlag.Reconciled, transaction.flags);
                const draggable = isReconciled === false && (
                    hasFlag(TransactionFlag.BankDebit, transaction.flags) || 
                    hasFlag(TransactionFlag.CreditAccountDebit, transaction.flags)
                );

                const onClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    this.props.setModal!(<TransactionModal transaction={transaction} />);
                };

                return {
                    key: transaction._id,
                    draggable,
                    dragHandle: draggable ? <FontIcon iconName="GlobalNavButton" /> : null,
                    date: transaction.date.toLocaleDateString(),
                    account: accounts[transaction.accountId].name,
                    description: transaction.description,
                    amount: transaction.amount.toFormattedString(),
                    reconciled: <span onClick={onClick}>
                        <FontIcon iconName={isReconciled ? 'CheckMark' : 'AlertSolid'} style={{ color: isReconciled ? Colors.Success : Colors.Warning }} />
                    </span>,
                    transaction,
                };
            });
    }

    render() {
        return <Layout>
            <Card heading="Transactions">
                {this.renderList()}
            </Card>
            {this.renderEnvelopePanel()}
        </Layout>;
    }
    
    renderList() {
        const items = this.computeItems(
            this.props.importedTransactions!, 
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
                onRenderRow={this.onRenderRow}
            />
        </>;

    }

    onRenderRow(props: IDetailsRowProps): JSX.Element | null {
        const item: DetailListItem = props.item;
        if (item.draggable) {
            const onDragStateChange = (isDrag: boolean) => {
                this.setState({ isPanelOpen: isDrag });
            };

            return <Draggable data={item.transaction._id} onDragStateChange={onDragStateChange}>
                <DetailsRow {...props} />
            </Draggable>
        } else {
            return <DetailsRow {...props} />;
        }
    }

    renderEnvelopePanel() {
        const envelopes = this.props.envelopes!;

        return <Panel
            headerText="Envelopes"
            isOpen={this.state.isPanelOpen}
            hasCloseButton={false}
            isLightDismiss={false}
            isBlocking={false}
        >
            {envelopes.map(envelope => {
                return <EnvelopeDropTarget key={envelope._id} envelope={envelope} onDrop={this.getEnvelopeDropHandler(envelope)} />
            })}
        </Panel>;
    }

    getEnvelopeDropHandler(envelope: Account) {
        const transactionMap = this.props.transactionMap!;

        return (data: string | Record<string, string>) => {
            const id = data as string;
            const transaction = transactionMap[id];
            const amountFlag = findAmountTransactionFlag(transaction);

            if (amountFlag === TransactionFlag.CreditAccountDebit) {
                this.props.addLinkedTransactionForCreditCardPurchase!(transaction, envelope);
            } else if (amountFlag === TransactionFlag.BankDebit) {
                this.props.addLinkedTransactionForBankDebit!(transaction, envelope);
            } else {
                Log.andThrow(`Unexpected amount flag ${amountFlag}`);
            }

            setTimeout(() => this.setState({ isPanelOpen: false }), 500);
        }
    }
}

const mapStateToProps = (state: CombinedState, ownProps: TransactionsPageProps): TransactionsPageProps => {
    const accounts = state.accounts.accounts;
    const envelopes = getAccounts(state.accounts, filterOnlyAssignableAccounts);
    const importedTransactions = getTransactions(state.transactions, filterOnlyImportedTransactions);
    const transactionMap = listToMap(importedTransactions);

    return {
        ...ownProps,
        accounts,
        envelopes,
        importedTransactions,
        transactionMap,
    }
};

const mappedActions = { 
    setModal,
    addLinkedTransactionForBankDebit,
    addLinkedTransactionForCreditCardPurchase,
};

export const TransactionsPage = connect(mapStateToProps, mappedActions)(Component);
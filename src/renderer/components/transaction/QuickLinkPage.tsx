import { Transaction, TransactionFlag, findAmountTransactionFlag } from '@/models/Transaction';
import { CombinedState } from '@/renderer/store/store';
import { getAccounts } from '@/renderer/store/transforms/Account';
import { getTransactions } from '@/renderer/store/transforms/Transaction';
import { filterOnlyAssignableAccounts, filterOnlyUnreconciledTransactions } from '@/util/Filters';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { Card } from '../uiElements/Card';
import { Layout } from '../uiElements/Layout';
import { TransactionCard } from './TransactionCard';
import { Draggable } from '../uiElements/Draggable';
import { DraggableDropTarget } from '../uiElements/DraggableDropTarget';
import { Log } from '@/util/Logger';
import { hasFlag } from '@/util/Flags';
import { addLinkedTransactionForBankDebit, addLinkedTransactionForCreditCardPurchase } from '@/renderer/store/actions/Transaction';
import { listToMap } from '@/util/Data';
import { transactions } from '@/renderer/store/reducers/Transactions';

export interface QuickLinkProps {
    // mapped from state
    transactions?: Transaction[];
    transactionsAsMap?: Record<string, Transaction>;
    envelopes?: Account[];

    // store actions
    addLinkedTransactionForBankDebit?: (transaction: Transaction, envelope: Account) => void;
    addLinkedTransactionForCreditCardPurchase?: (transaction: Transaction, envelope: Account) => void;
}

class Component extends React.Component<QuickLinkProps> {
    
    constructor(props: QuickLinkProps) {
        super(props);
    }

    render() {
        const transactions = this.props.transactions!;
        const envelopes = this.props.envelopes!;

        return <Layout split={2} noMargin>
            <Layout alignContent="start">
                {transactions.map(transaction => {
                    const onDragStateChange = (isDrag: boolean) => {};

                    return <Draggable key={transaction._id} data={transaction._id} onDragStateChange={onDragStateChange}>
                        <Card>
                            <TransactionCard transaction={transaction} />
                        </Card>
                    </Draggable>
                })}
            </Layout>
            
            <Layout alignContent="start">
                {envelopes.map(envelope => {
                    const onDrop = (data: string | Record<string, string>) => {
                        const id = data as string;
                        const transaction = this.props.transactionsAsMap![id];
                        const amountFlag = findAmountTransactionFlag(transaction);

                        if (amountFlag === TransactionFlag.CreditAccountDebit) {
                            this.props.addLinkedTransactionForCreditCardPurchase!(transaction, envelope);
                        } else if (amountFlag === TransactionFlag.BankDebit) {
                            this.props.addLinkedTransactionForBankDebit!(transaction, envelope);
                        } else {
                            Log.andThrow(`Unexpected amount flag ${amountFlag}`);
                        }
                    };
                    
                    return <DraggableDropTarget key={envelope._id} onDrop={onDrop}>
                        <Card>
                            {envelope.name}
                            {envelope.balance.toFormattedString()}
                        </Card>
                    </DraggableDropTarget>;
                })}
            </Layout>
        </Layout>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: QuickLinkProps): QuickLinkProps => {
    // find unreconciled debits
    const transactionFilter = (transaction: Transaction) => filterOnlyUnreconciledTransactions(transaction) && 
            (hasFlag(TransactionFlag.BankDebit, transaction.flags) || hasFlag(TransactionFlag.CreditAccountDebit, transaction.flags));

    const transactions = getTransactions(state.transactions, transactionFilter);
    const transactionsAsMap = listToMap(transactions);

    return {
        ...ownProps,
        transactions,
        transactionsAsMap,
        envelopes: getAccounts(state.accounts, filterOnlyAssignableAccounts),
    };
};

const mappedActions = {
    addLinkedTransactionForBankDebit,
    addLinkedTransactionForCreditCardPurchase,
};

export const QuickLink = connect(mapStateToProps, mappedActions)(Component);
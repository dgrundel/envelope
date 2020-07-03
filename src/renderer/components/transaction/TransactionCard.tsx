import * as React from "react";
import { CombinedState } from '@/renderer/store/store';
import { connect } from 'react-redux';
import { Transaction } from '@/models/Transaction';
import { mergeStyles, Text } from '@fluentui/react';
import { Account } from '@/models/Account';

export interface TransactionCardProps {
    transaction: Transaction;
    account?: Account;
}

const transactionCardStyle = mergeStyles({
    margin: '0.2em 0 2em',
    clear: 'right',
});

const transactionCardAmountStyle = mergeStyles({
    float: 'right',
    margin: '0 0 1em 1em',
});

const transactionCardDescStyle = mergeStyles({
    margin: '0 0 0.5em',
});

class Component extends React.Component<TransactionCardProps> {
    render() {
        const transaction = this.props.transaction;
        const account = this.props.account!;
        
        return <div className={transactionCardStyle}>
            <Text block className={transactionCardAmountStyle} variant={'xxLarge'}>{transaction.amount.toFormattedString()}</Text>

            <Text block className={transactionCardDescStyle} variant={'xLarge'}>{transaction.description}</Text>
            <Text block variant={'medium'}>
                {`${transaction.date.toLocaleDateString()} `}
                &bull;
                {` ${account.name}`}
            </Text>
        </div>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: TransactionCardProps): TransactionCardProps => {
    const accountId = ownProps.transaction.accountId;
    return {
        ...ownProps,
        account: state.accounts.accounts[accountId]
    };
}

export const TransactionCard = connect(mapStateToProps, {})(Component);
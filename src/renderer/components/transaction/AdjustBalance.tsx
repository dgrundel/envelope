import { Account } from '@/models/Account';
import { Transaction, TransactionData, TransactionType } from '@/models/Transaction';
import { insertTransactions } from '@/renderer/store/actions/Transaction';
import { Currency, CURRENCY_SYMBOL } from '@/util/Currency';
import { getRequiredCurrencyError } from '@/util/ErrorGenerators';
import { Log } from '@/util/Logger';
import { MessageBar, MessageBarType, PrimaryButton, Text, TextField } from '@fluentui/react';
import * as React from "react";
import { connect } from 'react-redux';
import { CombinedState } from '../../store/store';

export interface AdjustBalanceProps {
    account: Account;
    onComplete?: () => void;

    // store actions
    insertTransactions?: (transactionData: TransactionData[]) => Promise<Transaction>;
}

interface State {
    messages?: any;

    // form fields
    newBalance?: string;
}

class Component extends React.Component<AdjustBalanceProps, State> {
    
    constructor(props: AdjustBalanceProps) {
        super(props);
        this.state = {
            newBalance: this.props.account.balance.toString()
        };
    }
    
    render() {
        return <form onSubmit={e => this.onSubmit(e)}>
            {this.state.messages}
            <TextField
                label="New Balance"
                prefix={CURRENCY_SYMBOL}
                value={this.state.newBalance}
                onGetErrorMessage={getRequiredCurrencyError}
                onChange={(e, newBalance?) => this.setState({ newBalance })}
                validateOnLoad={false}
            />
            <p style={({ textAlign: 'right' })}>
                <PrimaryButton type="submit" text="Save" />
            </p>
        </form>
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();

        const errors = [];

        const newBalanceError = getRequiredCurrencyError(this.state.newBalance);
        if(newBalanceError) {
            errors.push(newBalanceError);
        }

        if (errors.length > 0) {
            const messages = <MessageBar
                messageBarType={MessageBarType.error}
                isMultiline={true}
            >{errors.map(s => <Text key={s} block>{s}</Text>)}</MessageBar>;

            this.setState({ messages });
            return;
        }

        // clear messages
        this.setState({
            messages: undefined
        });

        const account = this.props.account;
        const newBalance = Currency.parse(this.state.newBalance!);
        const amount = newBalance.sub(account.balance);
        
        // do nothing if zero amount.
        if (amount.isZero()) {
            Log.debug(`No adjustment needed (${amount.toFormattedString()}) for account`, account);
            this.props.onComplete && this.props.onComplete();
            return;
        }

        Log.debug(`Adding adjustment transaction for ${amount.toFormattedString()} to account`, account);

        const transactionData: TransactionData = {
            accountId: account._id,
            date: new Date(),
            amount: amount,
            description: 'Manual balance adjustment',
            type: TransactionType.Adjustment,
            linkedTransactionIds: []
        };

        this.props.insertTransactions!([transactionData]).then(created => {
            Log.debug('Added adjustment transaction.', created);
            this.props.onComplete && this.props.onComplete();
        });
    }
}

export const AdjustBalance = connect(null, { insertTransactions })(Component);
import { Account } from '@/models/Account';
import { getAmountTransactionFlag, Transaction, TransactionFlag } from '@/models/Transaction';
import { adjustAccountBalance } from '@/renderer/store/actions/Account';
import { Currency, CURRENCY_SYMBOL } from '@/util/Currency';
import { getRequiredCurrencyError } from '@/util/ErrorGenerators';
import { unionFlags } from '@/util/Flags';
import { getIdentifier } from '@/util/Identifier';
import { Log } from '@/util/Logger';
import { MessageBar, MessageBarType, PrimaryButton, Text, TextField } from '@fluentui/react';
import * as React from "react";
import { connect } from 'react-redux';

export interface AdjustBalanceProps {
    account: Account;
    onComplete?: () => void;

    // store actions
    adjustAccountBalance?: (accountId: string, newBalance: Currency) => void;
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
            newBalance: this.props.account.balance.toInputString()
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
        
        this.props.adjustAccountBalance!(account._id, newBalance);
        this.props.onComplete && this.props.onComplete();
    }
}

export const AdjustBalance = connect(null, { adjustAccountBalance })(Component);
import { Account, AccountType } from '@/models/Account';
import { Currency, CURRENCY_SYMBOL } from '@/util/Currency';
import { filterOnlyAccountType, isValidCurrencyString, filterOnlyAccountTypeIn } from '@/util/Filters';
import { Log } from "@/util/Logger";
import { Dropdown, DropdownMenuItemType, Icon, IDropdownOption, mergeStyles, MessageBar, MessageBarType, PrimaryButton, Text, TextField } from '@fluentui/react';
import memoizeOne from 'memoize-one';
import * as React from "react";
import { connect } from 'react-redux';
import { CombinedState } from '../../store/store';
import { transferFunds } from '../../store/actions/Transaction';
import { AccountDropdown } from '../account/AccountDropdown';
import { getRequiredCurrencyError } from '@/util/ErrorGenerators';

export interface MoveMoneyProps {
    showFrom?: boolean;
    showTo?: boolean;
    fromId?: string;
    toId?: string;
    amount?: Currency;
    onComplete?: () => void;

    // mapped props from store
    accounts?: Record<string, Account>;

    // store actions
    transferFunds?: (amount: Currency, fromAccount: Account, toAccount: Account) => void;
}

interface State {
    fromId?: string;
    toId?: string;
    amount?: string;
    messages?: any;
}

const accountDropdownFilter = filterOnlyAccountTypeIn([AccountType.UserEnvelope, AccountType.PaymentEnvelope, AccountType.Unallocated]);

class Component extends React.Component<MoveMoneyProps, State> {
    
    constructor(props: MoveMoneyProps) {
        super(props);
        
        if (props.showFrom === false && !props.fromId) {
            throw new Error('Cannot set showFrom false without a fromId');
        }
        if (props.showTo === false && !props.toId) {
            throw new Error('Cannot set showTo false without a toId');
        }

        this.state = {
            fromId: this.props.fromId,
            toId: this.props.toId,
            amount: this.props.amount?.toString(),
            messages: undefined,
        };
    }

    render() {
        return <form onSubmit={e => this.onSubmit(e)}>
            {this.state.messages}
            {this.props.showFrom !== false && <AccountDropdown
                label="Move From"
                selectedKey={this.state.fromId}
                onChange={(e, option?) => this.setState({ fromId: option?.key as string })}
                placeholder="Take money from..."
                filter={accountDropdownFilter}
                showBalance
            />}
            {this.props.showTo !== false && <AccountDropdown
                label="Move To"
                selectedKey={this.state.toId}
                onChange={(e, option?) => this.setState({ toId: option?.key as string })}
                placeholder="Move money to..."
                filter={accountDropdownFilter}
                showBalance
            />}
            <TextField
                label="Amount"
                prefix={CURRENCY_SYMBOL}
                value={this.state.amount}
                onGetErrorMessage={getRequiredCurrencyError}
                onChange={(e, amount?) => this.setState({ amount })}
                validateOnLoad={false}
            />
            <p style={({ textAlign: 'right' })}>
                <PrimaryButton type="submit" text="Move" />
            </p>
        </form>;
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();

        const errors = [];
        
        const amountError = getRequiredCurrencyError(this.state.amount);
        if(amountError) {
            errors.push(amountError);
        }

        const fromId = (this.state.fromId!);
        const fromAccount = this.props.accounts![fromId];
        if (!fromAccount) {
            errors.push('Please select an account to move from.');
        }
        
        const toId = (this.state.toId!);
        const toAccount = this.props.accounts![toId];
        if (!toAccount) {
            errors.push('Please select an account to move to.');
        }
        
        if ((fromAccount || toAccount) && fromId === toId) {
            errors.push('Cannot transfer money to the same account.');
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

        // do the transfer
        const amount = Currency.parse(this.state.amount!);
        Log.debug('Transferring funds from', fromAccount, 'to', toAccount, amount);

        this.props.transferFunds!(amount, fromAccount, toAccount);
        Log.debug('Transfer complete.');
        this.props.onComplete && this.props.onComplete();
    }
}

const mapStateToProps = (state: CombinedState, ownProps: MoveMoneyProps): MoveMoneyProps => {
    return {
        ...ownProps,
        accounts: state.accounts.accounts,
    };
}

export const MoveMoney = connect(mapStateToProps, { transferFunds })(Component);
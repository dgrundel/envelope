import * as React from "react";
import { CombinedState } from '../store/store';
import { connect } from 'react-redux';
import { Currency, CURRENCY_SYMBOL } from '@/util/Currency';
import { Text, TextField, Dropdown, IDropdownOption, DropdownMenuItemType, PrimaryButton, Icon, mergeStyles, MessageBar, MessageBarType } from '@fluentui/react';
import { isValidCurrencyString, isBlank, filterOnlyAccountType } from '@/util/Filters';
import { Account, AccountType } from '@/models/Account';
import { Log } from "@/util/Logger";

export interface MoveMoneyProps {
    showFrom?: boolean;
    showTo?: boolean;
    fromId?: string;
    toId?: string;
    amount?: Currency;

    accounts?: Record<string, Account>;
    unallocatedAccount?: Account;
    paymentEnvelopes?: Account[];
    userEnvelopes?: Account[];
}

interface State {
    fromId?: string;
    toId?: string;
    amount?: string;
    messages?: any;
}

const iconStyle = mergeStyles({
    verticalAlign: 'middle',
    marginRight: '1ex'
});

const onRenderOption = (option: IDropdownOption): JSX.Element => {
    const icon = option.data && option.data.icon;
    return <div>
        {icon && <Icon iconName={icon} className={iconStyle} aria-hidden="true" title={icon} />}
        <span>{option.text}</span>
    </div>;
};

class Component extends React.Component<MoveMoneyProps, State> {
    private dropDownChoices: IDropdownOption[];
    private readonly initialState: State;

    constructor(props: MoveMoneyProps) {
        super(props);
        
        this.initialState = {
            fromId: this.props.fromId,
            toId: this.props.toId,
            amount: props.amount?.toString(),
            messages: undefined,
        };
        
        this.state = this.initialState;

        if (props.showFrom === false && !props.fromId) {
            throw new Error('Cannot set showFrom false without a fromId');
        }
        if (props.showTo === false && !props.toId) {
            throw new Error('Cannot set showTo false without a toId');
        }

        this.dropDownChoices = [
            { key: (this.props.unallocatedAccount!)._id, text: (this.props.unallocatedAccount!).name.trim(), data: { icon: 'Money' } },
            { key: 'divider_1', text: '-', itemType: DropdownMenuItemType.Divider },
        ];

        if (this.props.userEnvelopes && this.props.userEnvelopes.length > 0) {
            this.dropDownChoices = this.dropDownChoices.concat(
                { key: 'myEnvelopesHeader', text: 'My Envelopes', itemType: DropdownMenuItemType.Header },
                this.props.userEnvelopes.map(envelope => ({ key: envelope._id, text: envelope.name, data: { icon: 'Mail' } }))
            )
        }
        
        if (this.props.paymentEnvelopes && this.props.paymentEnvelopes.length > 0) {
            this.dropDownChoices = this.dropDownChoices.concat(
                { key: 'paymentEnvelopesHeader', text: 'Payment Envelopes', itemType: DropdownMenuItemType.Header },
                this.props.paymentEnvelopes.map(envelope => ({ key: envelope._id, text: envelope.name, data: { icon: 'PaymentCard' } }))
            );
        }
    }

    render() {
        return <form onSubmit={e => this.onSubmit(e)}>
            {this.state.messages}
            {this.props.showFrom !== false && <Dropdown
                label="Move From"
                selectedKey={this.state.fromId}
                onChange={(e, option?) => this.setState({ fromId: option?.key as string })}
                placeholder="Take money from..."
                options={this.dropDownChoices}
                onRenderOption={onRenderOption}
            />}
            {this.props.showTo !== false && <Dropdown
                label="Move To"
                selectedKey={this.state.toId}
                onChange={(e, option?) => this.setState({ toId: option?.key as string })}
                placeholder="Move money to..."
                options={this.dropDownChoices}
                onRenderOption={onRenderOption}
            />}
            <TextField
                label="Amount"
                prefix={CURRENCY_SYMBOL}
                value={this.state.amount}
                onGetErrorMessage={this.getAmountErrorMessage}
                onChange={(e, amount?) => this.setState({ amount })}
                validateOnLoad={false}
            />
            <p style={({ textAlign: 'right' })}>
                <PrimaryButton type="submit" text="Move" />
            </p>
        </form>;
    }

    getAmountErrorMessage(value?: string): string {
        return isValidCurrencyString(value)
            ? ''
            : 'Hmm, that doesn\'t look like a number.';
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();

        const errors = [];
        if(!isValidCurrencyString(this.state.amount)) {
            errors.push('Please enter a valid amount.');
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

        // do the transfer
        const amount = Currency.parse(this.state.amount!);
        Log.debug('Transfer funds from', fromAccount, 'to', toAccount, amount)

        // reset the form
        this.setState(this.initialState);
    }
}

const mapStateToProps = (state: CombinedState, ownProps: MoveMoneyProps): MoveMoneyProps => {
    const allAccounts = state.accounts.sortedIds.map(id => state.accounts.accounts[id]);
    const unallocatedId = state.accounts.unallocatedId;
    return {
        ...ownProps,
        accounts: state.accounts.accounts,
        userEnvelopes: allAccounts.filter(filterOnlyAccountType(AccountType.UserEnvelope)),
        paymentEnvelopes: allAccounts.filter(filterOnlyAccountType(AccountType.PaymentEnvelope)),
        unallocatedAccount: unallocatedId ? state.accounts.accounts[unallocatedId] : undefined
    };
}

export const MoveMoney = connect(mapStateToProps, {})(Component);
import * as React from "react";
import { CombinedState } from '../store/store';
import { connect } from 'react-redux';
import { Currency, CURRENCY_SYMBOL } from '@/util/Currency';
import { TextField, Dropdown, IDropdownOption, DropdownMenuItemType, PrimaryButton, Icon, mergeStyles } from '@fluentui/react';
import { isValidCurrencyString, isBlank, filterOnlyAccountType } from '@/util/Filters';
import { Account, AccountType } from '@/models/Account';

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

    constructor(props: MoveMoneyProps) {
        super(props);
        this.state = {
            ...props,
            amount: props.amount?.toString()
        };

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
                errorMessage={(isBlank(this.state.amount) || isValidCurrencyString(this.state.amount)) ? '' : 'Hmm, that doesn\'t look like a number.'}
                onChange={(e, amount?) => this.setState({ amount })}
            />
            <p style={({ textAlign: 'right' })}>
                <PrimaryButton type="submit" text="Move" />
            </p>
        </form>;
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
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
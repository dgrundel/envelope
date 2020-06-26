import * as React from "react";
import { CombinedState } from '../store/store';
import { connect } from 'react-redux';
import { Currency, CURRENCY_SYMBOL } from '@/util/Currency';
import { TextField, Dropdown, IDropdownOption, DropdownMenuItemType } from '@fluentui/react';
import { isValidCurrencyString, isBlank, filterOnlyAccountType } from '@/util/Filters';
import { Account, AccountType } from '@/models/Account';

export interface MoveMoneyProps {
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

class Component extends React.Component<MoveMoneyProps, State> {
    private readonly dropDownChoices: IDropdownOption[];

    constructor(props: MoveMoneyProps) {
        super(props);
        this.state = {
            ...props,
            amount: props.amount?.toString()
        };

        this.dropDownChoices = [
            { key: (this.props.unallocatedAccount!)._id, text: (this.props.unallocatedAccount!).name },
            { key: 'divider_1', text: '-', itemType: DropdownMenuItemType.Divider },
        ].concat(
            { key: 'myEnvelopesHeader', text: 'My Envelopes', itemType: DropdownMenuItemType.Header },
            (this.props.userEnvelopes!).map(envelope => ({ key: envelope._id, text: envelope.name }))
        ).concat(
            { key: 'paymentEnvelopesHeader', text: 'Payment Envelopes', itemType: DropdownMenuItemType.Header },
            (this.props.paymentEnvelopes!).map(envelope => ({ key: envelope._id, text: envelope.name }))
        );
    }

    render() {
        return <>
            <Dropdown
                label="Move From"
                selectedKey={this.state.fromId}
                onChange={(e, option?) => this.setState({ fromId: option?.key as string })}
                placeholder="Take money from..."
                options={this.dropDownChoices}
            />
            <Dropdown
                label="Move To"
                selectedKey={this.state.toId}
                onChange={(e, option?) => this.setState({ toId: option?.key as string })}
                placeholder="Add money to..."
                options={this.dropDownChoices}
            />
            <TextField
                label="Amount"
                prefix={CURRENCY_SYMBOL}
                value={this.state.amount}
                errorMessage={(isBlank(this.state.amount) || isValidCurrencyString(this.state.amount)) ? '' : 'Hmm, that doesn\'t look like a number.'}
                onChange={(e, amount?) => this.setState({ amount })}
            />
        </>;
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
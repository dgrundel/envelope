import { Account } from '@/models/Account';
import { Transaction, TransactionData, getAccountAmountTransactionFlag } from '@/models/Transaction';
import { addLinkedTransaction } from '@/renderer/store/actions/Transaction';
import { Currency, CURRENCY_SYMBOL } from '@/util/Currency';
import { chainErrorGenerators, ErrorGenerator, maxCurrencyErrorGenerator, minCurrencyErrorGenerator } from '@/util/ErrorGenerators';
import { filterOnlyAssignableAccounts } from '@/util/Filters';
import { Log } from '@/util/Logger';
import { MessageBar, MessageBarType, PrimaryButton, Text, TextField } from '@fluentui/react';
import * as React from "react";
import { connect } from 'react-redux';
import { CombinedState } from '../../store/store';
import { AccountDropdown } from '../account/AccountDropdown';

export interface AddLinksProps {
    linkTo: Transaction;
    unlinkedBalance: Currency;
    onComplete?: () => void;

    // mapped props from store
    accounts?: Record<string, Account>;

    // store actions
    addLinkedTransaction?: (transaction: TransactionData, linkTo: Transaction) => Promise<[Transaction, Transaction]>;
}

interface State {
    messages?: any;

    // form fields
    envelopeId?: string;
    amount?: string;
}

class Component extends React.Component<AddLinksProps, State> {
    amountErrorGenerator: ErrorGenerator;
    
    constructor(props: AddLinksProps) {
        super(props);

        const maxValue = this.props.unlinkedBalance.getAbsolute();

        this.amountErrorGenerator = chainErrorGenerators(
            minCurrencyErrorGenerator(Currency.ZERO),
            maxCurrencyErrorGenerator(maxValue, true)
        )
        this.state = {
            amount: maxValue.toString()
        };
    }
    
    render() {
        return <form onSubmit={e => this.onSubmit(e)}>
            {this.state.messages}
            <AccountDropdown
                label="Envelope"
                selectedKey={this.state.envelopeId}
                onChange={(e, option?) => this.setState({ envelopeId: option?.key as string })}
                placeholder="Select an envelope"
                filter={filterOnlyAssignableAccounts}
            />
            <TextField
                label="Amount"
                prefix={CURRENCY_SYMBOL}
                value={this.state.amount}
                onGetErrorMessage={this.amountErrorGenerator}
                onChange={(e, amount?) => this.setState({ amount })}
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

        const amountError = this.amountErrorGenerator(this.state.amount);
        if(amountError) {
            errors.push(amountError);
        }

        const envelope = this.props.accounts![this.state.envelopeId!];
        if (!envelope) {
            errors.push('Please select an envelope.');
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

        // the user will always enter a positive value, but it may
        // need to be converted to a negative value if the original
        // transaction is a negative amount
        const inputAmount = Currency.parse(this.state.amount!);
        const invert = this.props.unlinkedBalance.isNegative();
        const amount = invert ? inputAmount.getInverse() : inputAmount;

        Log.debug(`Linking ${amount.toFormattedString} of transaction`, this.props.linkTo, 'to envelope', envelope);

        const transactionData: TransactionData = {
            flags: getAccountAmountTransactionFlag(envelope, amount),
            accountId: envelope._id,
            date: new Date(),
            amount: amount,
            description: `Linked from ${this.props.linkTo._id}`,
            linkedTransactionIds: []
        };

        this.props.addLinkedTransaction!(transactionData, this.props.linkTo).then(createdAndUpdated => {
            Log.debug('Added linked transaction.', createdAndUpdated);
            this.props.onComplete && this.props.onComplete();
        });
    }
}

const mapStateToProps = (state: CombinedState, ownProps: AddLinksProps): AddLinksProps => {
    return {
        ...ownProps,
        accounts: state.accounts.accounts,
    };
}

export const AddLinks = connect(mapStateToProps, { addLinkedTransaction })(Component);
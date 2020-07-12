import { CombinedState } from '@/renderer/store/store';
import { isBlank } from "@/util/Filters";
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { ImportWizardStepProps, rowsToTransactions } from "../ImportWizardFactory";
import { TextField } from '@fluentui/react';
import { CURRENCY_SYMBOL, Currency } from '@/util/Currency';
import { getRequiredCurrencyError } from '@/util/ErrorGenerators';
import { Transaction } from '@/models/Transaction';

export interface ReconcileBalanceProps extends ImportWizardStepProps {
    selectedAccount?: Account;
}

const calcBalance = (state: ReconcileBalanceProps): Currency => {
    const rowsToImport = state.selectedForImport
        ? state.selectedForImport.map(i => state.rows[i])
        : state.rows;

    const rowsAsTransactions = rowsToTransactions(
        rowsToImport, 
        state.invertTransactions, 
        state.dateColumn!,
        state.amountColumn!,
        state.descriptionColumns!,
        state.selectedAccount!,
    );
    
    const sum = rowsAsTransactions.reduce((sum: Currency, t: Transaction) => {
        return sum.add(t.amount);
    }, state.selectedAccount!.balance);

    return sum;
}

class Component extends React.Component<ReconcileBalanceProps> {
    constructor(props: ReconcileBalanceProps) {
        super(props);

        if (!props.updatedBalance) {
            const updatedBalance = calcBalance(props).toInputString();
            props.setState({ updatedBalance });
        }

        props.setStepValidator(this.validateState);
    }

    validateState(state: ImportWizardStepProps) {
        return getRequiredCurrencyError(state.updatedBalance);
    }
    
    render() {
        const account = this.props.selectedAccount!;

        return <div>
            <h3>Is this the current balance of {account.name}?</h3>

            <p>If this doesn't match your current balance, please enter the correct amount.</p>

            <TextField
                label="Current Balance"
                prefix={CURRENCY_SYMBOL}
                value={this.props.updatedBalance}
                onGetErrorMessage={getRequiredCurrencyError}
                onChange={(e, updatedBalance?) => this.props.setState({ updatedBalance })}
                validateOnLoad={false}
            />
        </div>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: ReconcileBalanceProps): ReconcileBalanceProps => {
    const accountId = ownProps.accountId!;
    const selectedAccount = state.accounts.accounts[accountId];
    return {
        ...ownProps,
        selectedAccount,
    };
}

export const ReconcileBalance = connect(mapStateToProps, {})(Component);
import { CombinedState } from '@/renderer/store/store';
import { filterOnlyImportableAccounts, isBlank } from "@/util/Filters";
import { ChoiceGroup } from '@fluentui/react';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { ImportWizardStepProps, rowsToTransactions } from "./ImportWizard2";
import { TransactionData } from '@/models/Transaction';
import { Log } from '@/util/Logger';

export interface InvertAmountsSelectProps extends ImportWizardStepProps {
    accountMap?: Record<string, Account>;
}

interface State {

}

class Component extends React.Component<InvertAmountsSelectProps, State> {
    constructor(props: InvertAmountsSelectProps) {
        super(props);

        this.state = {};

        props.setStepValidator(this.validateState);
    }

    validateState(state: ImportWizardStepProps) {
        // if (isBlank(state.accountId)) {
            // return 'Please select an account.';
        // }
    }
    
    render() {
        const selectedAccount = this.props.accountMap![this.props.accountId!];
        const transactions: TransactionData[] = rowsToTransactions(
            this.props.rows, 
            false, 
            this.props.dateColumn!,
            this.props.amountColumn!,
            this.props.descriptionColumns!,
            this.props.accountId!
        );

        let transaction = transactions.find(transaction => !transaction.amount.isNegative());
        let hasPositive = !!transaction;
        if (!hasPositive) {
            // if we didn't find a positive transaction, grab a negative one.
            transaction = transactions.find(transaction => transaction.amount.isNegative());
        }

        if (!transaction) {
            Log.debug('No non-zero transactions present.', transactions);
            api.nextStep();
            return null;
        }

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const state = api.getState();
            state.invertTransactions = value === 'true';
            api.updateState(state);
        };

        let expectedDescription;
        let invertedDescription;
        if (hasPositive) {
            if (account.type === AccountType.CreditCard) {
                // expect positive transactions on a credit card to be a payment
                expectedDescription = 'purchase, fee, or other charge';
                invertedDescription = 'payment or credit';
            } else {
                // expect positive transactions on checking/savings to be a deposit
                expectedDescription = 'deposit or credit';
                invertedDescription = 'purchase, bill payment, fee, or other type of debit';
            }
        } else {
            // expect negative transactions on credit card/checking/savings to be a purchase or fee
            if (account.type === AccountType.CreditCard) {
                expectedDescription = 'payment or credit';
                invertedDescription = 'purchase, fee, or other charge';
            } else {
                expectedDescription = 'purchase, bill payment, fee, or other type of debit';
                invertedDescription = 'deposit or credit';
            }
        }

        return <div>
            <h3>Is this a <strong>{expectedDescription}</strong>?</h3>
            <p>To be sure your transactions are imported correctly, we need to understand
                how positive and negative values should be handled.</p>

            <table className="offset-table">
                <tbody>
                    <tr>
                        <th>Date</th>
                        <td>{transaction.date.toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <th>Amount</th>
                        <td>{transaction.amount.toFormattedString()}</td>
                    </tr>
                    <tr>
                        <th>Description</th>
                        <td>{transaction.description}</td>
                    </tr>
                </tbody>
            </table>

            <RowSelect
                type="radio"
                options={[{
                    value: 'false', // false means we leave amounts as-is.
                    label: <>
                        <strong>Yes</strong>, this is a {expectedDescription}.
                    </>
                },{
                    value: 'true', // true means we need to invert the amounts (positive <=> negative)
                    label: <>
                        <strong>No</strong>, this is a {invertedDescription}.
                    </>
                }]}
                onChange={onChange}
                value={state.invertTransactions.toString()}
            />
        </div>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: InvertAmountsSelectProps): InvertAmountsSelectProps => {
    return {
        ...ownProps,
        accountMap: state.accounts.accounts
    };
}

export const InvertAmountsSelect = connect(mapStateToProps, {})(Component);
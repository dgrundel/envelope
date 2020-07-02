import { TransactionData } from '@/models/Transaction';
import { CombinedState } from '@/renderer/store/store';
import { Log } from '@/util/Logger';
import { ChoiceGroup } from '@fluentui/react';
import { Account, AccountType } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { ImportWizardStepProps, rowsToTransactions } from "../ImportWizardFactory";

export interface InvertAmountsSelectProps extends ImportWizardStepProps {
    selectedAccount?: Account;
}

const CREDIT_CARD_PURCHASE_DESC = 'purchase, fee, or other charge';
const CREDIT_CARD_PAYMENT_DESC = 'payment or credit';
const BANK_ACCOUNT_DEPOSIT_DESC = 'deposit or credit';
const BANK_ACCOUNT_PURCHASE_DESC = 'purchase, bill payment, fee, or other type of debit';

class Component extends React.Component<InvertAmountsSelectProps> {
    private readonly sampleTransaction: TransactionData | undefined;

    constructor(props: InvertAmountsSelectProps) {
        super(props);

        this.state = {};

        const rowsAsTransactions: TransactionData[] = rowsToTransactions(
            this.props.rows, 
            this.props.invertTransactions, 
            this.props.dateColumn!,
            this.props.amountColumn!,
            this.props.descriptionColumns!,
            this.props.accountId!
        );

        // find a sample positive transaction
        let transaction = rowsAsTransactions.find(transaction => !transaction.amount.isNegative());
        let hasPositive = !!transaction;
        if (!hasPositive) {
            // if we didn't find a positive transaction, grab a negative one.
            transaction = rowsAsTransactions.find(transaction => transaction.amount.isNegative());
        }

        if (!transaction) {
            // No non-zero transactions in the import.
            // This is fine, we can skip this step since we can't invert zero.
            Log.debug('No non-zero transactions present.', rowsAsTransactions);
            props.nextStep();
        }

        this.sampleTransaction = transaction;
    }
    
    render() {
        if (!this.sampleTransaction) {
            return null;
        }

        const account = this.props.selectedAccount!;
        const transaction = this.sampleTransaction;

        let expectedDescription;
        let invertedDescription;
        if (transaction.amount.isPositive()) {
            if (account.type === AccountType.CreditCard) {
                // expect positive transactions on a credit card to be a payment
                expectedDescription = CREDIT_CARD_PURCHASE_DESC;
                invertedDescription = CREDIT_CARD_PAYMENT_DESC;
            } else {
                // expect positive transactions on checking/savings to be a deposit
                expectedDescription = BANK_ACCOUNT_DEPOSIT_DESC;
                invertedDescription = BANK_ACCOUNT_PURCHASE_DESC;
            }
        } else {
            // expect negative transactions on credit card/checking/savings to be a purchase or fee
            if (account.type === AccountType.CreditCard) {
                expectedDescription = CREDIT_CARD_PAYMENT_DESC;
                invertedDescription = CREDIT_CARD_PURCHASE_DESC;
            } else {
                expectedDescription = BANK_ACCOUNT_PURCHASE_DESC;
                invertedDescription = BANK_ACCOUNT_DEPOSIT_DESC;
            }
        }

        const options = [{
            key: 'false', // false means we leave amounts as-is.
            text: `Yes, this is a ${expectedDescription}.`,
        },{
            key: 'true', // true means we need to invert the amounts (positive <=> negative)
            text: `No, this is a ${invertedDescription}.`,
        }];

        return <div>
            <h3>Is this a <strong>{expectedDescription}</strong>?</h3>
            <p>To be sure your transactions are imported correctly, we need to understand
                how positive and negative values should be handled.</p>

            <table className="offset-table" style={({ width: '60vw' })}>
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

            <ChoiceGroup 
                selectedKey={this.props.invertTransactions ? 'true' : 'false'} 
                options={options}
                onChange={(e, option) => this.props.setState({
                    invertTransactions: option?.key === 'true',
                })}
            />
        </div>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: InvertAmountsSelectProps): InvertAmountsSelectProps => {
    const id = ownProps.accountId;
    const selectedAccount = id ? state.accounts.accounts[id] : undefined;

    return {
        ...ownProps,
        selectedAccount,
    };
}

export const InvertAmountsSelect = connect(mapStateToProps, {})(Component);
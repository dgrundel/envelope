import { Transaction, TransactionFlag } from '@/models/Transaction';
import { CombinedState } from "@/renderer/store/store";
import { Log } from '@/util/Logger';
import * as React from "react";
import { connect } from "react-redux";
import { createWizard, WizardStepApi } from "../../uiElements/WizardFactory";
import { TransactionFlagSelect } from './steps/TransactionFlagSelect';
import { intersectFlags, unionFlags } from '@/util/Flags';
import { LinkedAccountSelect } from './steps/LinkedAccountSelect';
import { LinkedTransactionSelect } from './steps/LinkedTransactionSelect';

export interface LinkWizardState {
    transaction: Transaction;
    accountAmountTypeFlag: TransactionFlag;

    selectedTransactionFlag?: TransactionFlag;
    selectedAccountId?: string;
    linkedTransactionId?: string;
}

export type LinkWizardStepProps = LinkWizardState & WizardStepApi<LinkWizardState>;

export const createLinkWizard = (transaction: Transaction) => {

    const accountAmountTypeFlag = intersectFlags(
        transaction.flags,
        unionFlags(
            TransactionFlag.BankCredit,
            TransactionFlag.BankDebit,
            TransactionFlag.CreditAccountCredit,
            TransactionFlag.CreditAccountDebit
        )
    );

    interface Props {
        // mapped from store

        // store actions
    }

    class Component extends React.Component<Props> {
        InnerComponent: () => JSX.Element;
        
        constructor(props: Props) {
            super(props);

            this.InnerComponent = createWizard(
                {
                    title: 'Reconcile transaction',
                    onFinish: this.onFinish.bind(this),
                },
                {
                    transaction,
                    accountAmountTypeFlag,
                },
                [
                    TransactionFlagSelect,
                    LinkedAccountSelect,
                    LinkedTransactionSelect,
                ]
            );
        }

        onFinish(state: LinkWizardState) {
            Log.debug('Link Wizard Finish', state);

            if (state.accountAmountTypeFlag === TransactionFlag.BankCredit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    // A transfer from another account
                    TransactionFlag.Transfer

                } else {
                    // A deposit, refund, or other income
                    TransactionFlag.None
                }

            } else if (state.accountAmountTypeFlag === TransactionFlag.BankDebit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    // A transfer to another account
                    TransactionFlag.Transfer

                } else {
                    // A purchase, fee, outgoing payment, or other account withdrawl
                    TransactionFlag.None
                }

            } else if (state.accountAmountTypeFlag === TransactionFlag.CreditAccountCredit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    // A payment from a checking or other account
                    TransactionFlag.Transfer

                } else {
                    // A refund, promotional credit, or other type of credit
                    TransactionFlag.None
                }

            } else if (state.accountAmountTypeFlag === TransactionFlag.CreditAccountDebit) {
                // A credit card purchase
                TransactionFlag.None
                
            } else {
                throw new Error(`Unrecognized accountAmountTypeFlag: ${state.accountAmountTypeFlag}`);
            }
        }

        render() {
            return <this.InnerComponent/>;
        }
    }

    const mapStateToProps = (state: CombinedState, ownProps: Props): Props => {
        return {
            ...ownProps,
        };
    }

    return connect(mapStateToProps, { })(Component);
}
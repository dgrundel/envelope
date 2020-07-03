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
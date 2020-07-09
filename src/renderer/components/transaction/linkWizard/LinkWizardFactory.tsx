import { findAmountTransactionFlag, Transaction, TransactionFlag } from '@/models/Transaction';
import { addLinkedTransactionForBankTransfer, addReconcileTransaction, addTransactionFlags, addLinkedTransactionForBankDeposit, addLinkedTransactionForBankDebit, reconcileTransactionForCreditCardPaymentFromBank, addLinkedTransactionForCreditCardRefund, addLinkedTransactionForCreditCardPurchase } from '@/renderer/store/actions/Transaction';
import { CombinedState } from "@/renderer/store/store";
import { unionFlags } from '@/util/Flags';
import { Log } from '@/util/Logger';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from "react-redux";
import { createWizard, WizardStepApi } from "../../uiElements/WizardFactory";
import { LinkedAccountSelect } from './steps/LinkedAccountSelect';
import { RelatedTransactionSelect } from './steps/RelatedTransactionSelect';
import { TransactionFlagSelect } from './steps/TransactionFlagSelect';

export interface LinkWizardState {
    transaction: Transaction;
    amountTypeFlag: TransactionFlag;

    selectedTransactionFlag?: TransactionFlag;
    relatedAccountId?: string;
    relatedTransaction?: Transaction;
}

export type LinkWizardStepProps = LinkWizardState & WizardStepApi<LinkWizardState>;

export const createLinkWizard = (transaction: Transaction) => {

    interface Props {
        // mapped from store
        accounts?: Record<string, Account>;

        // store actions
        addLinkedTransactionForBankTransfer?: (fromTransaction: Transaction, toTransaction: Transaction) => void;
        addLinkedTransactionForBankDeposit?: (t: Transaction, envelope: Account) => void;
        addLinkedTransactionForBankDebit?: (t: Transaction, envelope: Account) => void;
        reconcileTransactionForCreditCardPaymentFromBank?: (t: Transaction) => void;
        addLinkedTransactionForCreditCardRefund?: (t: Transaction, envelope: Account) => void;
        addLinkedTransactionForCreditCardPurchase?: (t: Transaction, envelope: Account) => void;
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
                    amountTypeFlag: findAmountTransactionFlag(transaction),
                },
                [
                    TransactionFlagSelect,
                    LinkedAccountSelect,
                    RelatedTransactionSelect,
                ]
            );
        }

        onFinish(state: LinkWizardState) {
            Log.debug('Link Wizard Finish', state);

            if (state.amountTypeFlag === TransactionFlag.BankCredit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    // A transfer from another account
                    // TransactionFlag.BankCredit
                    // TransactionFlag.Transfer
                    this.props.addLinkedTransactionForBankTransfer!(
                        state.relatedTransaction!,
                        state.transaction, 
                    );

                } else {
                    // A deposit, refund, or other income
                    // TransactionFlag.BankCredit
                    // TransactionFlag.None
                    const envelope = this.props.accounts![state.relatedAccountId!];
                    this.props.addLinkedTransactionForBankDeposit!(state.transaction, envelope);
                }

            } else if (state.amountTypeFlag === TransactionFlag.BankDebit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    // A transfer to another account
                    // TransactionFlag.BankDebit
                    // TransactionFlag.Transfer
                    this.props.addLinkedTransactionForBankTransfer!(
                        state.transaction, 
                        state.relatedTransaction!,
                    );

                } else {
                    // A purchase, fee, outgoing payment, or other account withdrawl
                    // TransactionFlag.BankDebit
                    // TransactionFlag.None
                    const envelope = this.props.accounts![state.relatedAccountId!];
                    this.props.addLinkedTransactionForBankDebit!(state.transaction, envelope);
                }

            } else if (state.amountTypeFlag === TransactionFlag.CreditAccountCredit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    // A payment from a checking or other account
                    // TransactionFlag.CreditAccountCredit
                    // TransactionFlag.Transfer
                    this.props.reconcileTransactionForCreditCardPaymentFromBank!(state.transaction);

                } else {
                    // A refund, promotional credit, or other type of credit
                    // TransactionFlag.CreditAccountCredit
                    // TransactionFlag.None
                    const envelope = this.props.accounts![state.relatedAccountId!];
                    this.props.addLinkedTransactionForCreditCardRefund!(state.transaction, envelope);
                }

            } else if (state.amountTypeFlag === TransactionFlag.CreditAccountDebit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    throw new Error('TransactionFlag.CreditAccountDebit and TransactionFlag.Transfer are incompatible.');
                }
                
                // A credit card purchase
                // TransactionFlag.CreditAccountDebit
                // TransactionFlag.None
                const envelope = this.props.accounts![state.relatedAccountId!];
                this.props.addLinkedTransactionForCreditCardPurchase!(state.transaction, envelope);
                
            } else {
                throw new Error(`Unrecognized accountAmountTypeFlag: ${state.amountTypeFlag}`);
            }
        }

        render() {
            return <this.InnerComponent/>;
        }
    }

    const mapStateToProps = (state: CombinedState, ownProps: Props): Props => {
        return {
            ...ownProps,
            accounts: state.accounts.accounts,
        };
    }

    const mappedActions = {
        addLinkedTransactionForBankTransfer,
        addLinkedTransactionForBankDeposit,
        addLinkedTransactionForBankDebit,
        reconcileTransactionForCreditCardPaymentFromBank,
        addLinkedTransactionForCreditCardRefund,
        addLinkedTransactionForCreditCardPurchase,
    };

    return connect(mapStateToProps, mappedActions)(Component);
}
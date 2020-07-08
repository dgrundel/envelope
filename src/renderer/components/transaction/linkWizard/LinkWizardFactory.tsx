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
import { addTransactionFlags, linkExistingTransactions, addTransaction } from '@/renderer/store/actions/Transaction';
import { Account } from '@models/Account';
import { nanoid } from 'nanoid';

export interface LinkWizardState {
    transaction: Transaction;
    accountAmountTypeFlag: TransactionFlag;

    selectedTransactionFlag?: TransactionFlag;
    selectedAccountId?: string;
    linkedTransaction?: Transaction;
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
        accounts?: Record<string, Account>;

        // store actions
        addTransaction?: (transaction: Transaction, linkTo?: Transaction) => void;
        addTransactionFlags?: (transaction: Transaction, flags: TransactionFlag) => void;
        linkExistingTransactions?: (transactions: Transaction[]) => void;
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
                    // TransactionFlag.BankCredit
                    // TransactionFlag.Transfer
                    this.props.linkExistingTransactions!([
                        state.transaction, 
                        state.linkedTransaction!
                    ]);
                    const flags = unionFlags(
                        TransactionFlag.Transfer,
                        TransactionFlag.Reconciled
                    );
                    this.props.addTransactionFlags!(state.transaction, flags);
                    this.props.addTransactionFlags!(state.linkedTransaction!, flags);

                } else {
                    // A deposit, refund, or other income
                    // TransactionFlag.BankCredit
                    // TransactionFlag.None
                    const envelope = this.props.accounts![state.selectedAccountId!];
                    const linkedTransaction: Transaction = {
                        _id: nanoid(),
                        date: new Date(),
                        accountId: envelope._id,
                        amount: state.transaction.amount.getInverse(),
                        description: state.transaction.description,
                        linkedTransactionIds: [],
                        flags: TransactionFlag.Reconciled,
                    };
                    this.props.addTransaction!(linkedTransaction, state.transaction);
                    this.props.addTransactionFlags!(state.transaction, TransactionFlag.Reconciled);
                }

            } else if (state.accountAmountTypeFlag === TransactionFlag.BankDebit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    // A transfer to another account
                    // TransactionFlag.BankDebit
                    // TransactionFlag.Transfer
                    this.props.linkExistingTransactions!([
                        state.transaction, 
                        state.linkedTransaction!
                    ]);
                    const flags = unionFlags(
                        TransactionFlag.Transfer,
                        TransactionFlag.Reconciled
                    );
                    this.props.addTransactionFlags!(state.transaction, flags);
                    this.props.addTransactionFlags!(state.linkedTransaction!, flags);

                } else {
                    // A purchase, fee, outgoing payment, or other account withdrawl
                    // TransactionFlag.BankDebit
                    // TransactionFlag.None
                    const envelope = this.props.accounts![state.selectedAccountId!];
                    const linkedTransaction: Transaction = {
                        _id: nanoid(),
                        date: new Date(),
                        accountId: envelope._id,
                        amount: state.transaction.amount.getInverse(),
                        description: state.transaction.description,
                        linkedTransactionIds: [],
                        flags: TransactionFlag.Reconciled,
                    };
                    this.props.addTransaction!(linkedTransaction, state.transaction);
                    this.props.addTransactionFlags!(state.transaction, TransactionFlag.Reconciled);
                }

            } else if (state.accountAmountTypeFlag === TransactionFlag.CreditAccountCredit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    // A payment from a checking or other account
                    // TransactionFlag.CreditAccountCredit
                    // TransactionFlag.Transfer
                    this.props.addTransactionFlags!(state.transaction, unionFlags(
                        TransactionFlag.Transfer,
                        TransactionFlag.Reconciled,
                    ));

                } else {
                    // A refund, promotional credit, or other type of credit
                    // TransactionFlag.CreditAccountCredit
                    // TransactionFlag.None
                    const envelope = this.props.accounts![state.selectedAccountId!];
                    const linkedTransaction: Transaction = {
                        _id: nanoid(),
                        date: new Date(),
                        accountId: envelope._id,
                        // amount is the same as the original transaction 
                        // because credit cards are reversed
                        amount: state.transaction.amount,
                        description: state.transaction.description,
                        linkedTransactionIds: [],
                        flags: TransactionFlag.Reconciled,
                    };
                    this.props.addTransaction!(linkedTransaction, state.transaction);
                    this.props.addTransactionFlags!(state.transaction, TransactionFlag.Reconciled);
                }

            } else if (state.accountAmountTypeFlag === TransactionFlag.CreditAccountDebit) {
                if (state.selectedTransactionFlag === TransactionFlag.Transfer) {
                    throw new Error('TransactionFlag.CreditAccountDebit and TransactionFlag.Transfer are incompatible.');
                }
                
                // A credit card purchase
                // TransactionFlag.CreditAccountDebit
                // TransactionFlag.None
                const envelope = this.props.accounts![state.selectedAccountId!];
                const linkedTransaction: Transaction = {
                    _id: nanoid(),
                    date: new Date(),
                    accountId: envelope._id,
                    // amount is the same as the original transaction 
                    // because credit cards are reversed
                    amount: state.transaction.amount,
                    description: state.transaction.description,
                    linkedTransactionIds: [],
                    flags: TransactionFlag.Reconciled,
                };
                this.props.addTransaction!(linkedTransaction, state.transaction);
                this.props.addTransactionFlags!(state.transaction, TransactionFlag.Reconciled);
                
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
            accounts: state.accounts.accounts,
        };
    }

    const mappedActions = {
        addTransaction,
        addTransactionFlags,
        linkExistingTransactions,
    };

    return connect(mapStateToProps, mappedActions)(Component);
}
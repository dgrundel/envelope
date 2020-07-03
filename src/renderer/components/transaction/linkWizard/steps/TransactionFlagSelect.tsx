import { CombinedState } from '@/renderer/store/store';
import { filterOnlyImportableAccounts, isBlank } from "@/util/Filters";
import { ChoiceGroup, IChoiceGroupOption, Separator } from '@fluentui/react';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { LinkWizardStepProps } from '../LinkWizardFactory';
import { TransactionFlag } from '@/models/Transaction';
import { TransactionCard } from '../../TransactionCard';
import { LinkWizardStepFrame } from '../LinkWizardStepFrame';

type TransactionFlagChoiceOption = IChoiceGroupOption & { flag: TransactionFlag };

class Component extends React.Component<LinkWizardStepProps> {
    private readonly options: TransactionFlagChoiceOption[];

    constructor(props: LinkWizardStepProps) {
        super(props);

        switch(props.accountAmountTypeFlag) {
            case TransactionFlag.BankCredit:
                this.options = [{
                    key: TransactionFlag.None.toString(),
                    text: 'A deposit, refund, or other income',
                    flag: TransactionFlag.None,
                },{
                    key: TransactionFlag.Transfer.toString(),
                    text: 'A transfer from another account',
                    flag: TransactionFlag.Transfer,
                }];
                break;
            case TransactionFlag.BankDebit:
                this.options = [{
                    key: TransactionFlag.None.toString(),
                    text: 'A purchase, fee, outgoing payment, or other account withdrawl',
                    flag: TransactionFlag.None,
                },{
                    key: TransactionFlag.Transfer.toString(),
                    text: 'A transfer to another account',
                    flag: TransactionFlag.Transfer,
                }];
                break;
            case TransactionFlag.CreditAccountCredit:
                this.options = [{
                    key: TransactionFlag.Transfer.toString(),
                    text: 'A payment from a checking or other account',
                    flag: TransactionFlag.Transfer,
                },{
                    key: TransactionFlag.None.toString(),
                    text: 'A refund, promotional credit, or other type of credit',
                    flag: TransactionFlag.None,
                }];
                break;
            case TransactionFlag.CreditAccountDebit:
                this.options = [];
                break;
        }

        if (this.options.length === 0) {
            props.setState({
                selectedTransactionFlag: TransactionFlag.None,
            })
            props.nextStep();
        } else {
            props.setStepValidator(this.validateState);
        }
    }

    validateState(state: LinkWizardStepProps) {
        if (typeof state.selectedTransactionFlag === 'undefined') {
            return 'Please select an option.';
        }
    }
    
    render() {
        return <LinkWizardStepFrame transaction={this.props.transaction}>
            <ChoiceGroup 
                label="What kind of transaction is this?" 
                selectedKey={this.props.selectedTransactionFlag?.toString()}
                options={this.options}
                onChange={(e, option: TransactionFlagChoiceOption) => this.props.setState({
                    selectedTransactionFlag: option.flag
                })}
            />
        </LinkWizardStepFrame>;
    }
}

export const TransactionFlagSelect = Component;
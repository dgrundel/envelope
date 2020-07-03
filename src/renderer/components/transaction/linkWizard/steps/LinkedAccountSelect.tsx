import { Account } from '@/models/Account';
import { TransactionFlag } from '@/models/Transaction';
import { AccountDropdown } from '@/renderer/components/account/AccountDropdown';
import { filterOnlyAssignableAccounts, filterOnlyDepositAccounts, isBlank } from '@/util/Filters';
import { IDropdownOption, Separator } from '@fluentui/react';
import * as React from "react";
import { LinkWizardStepProps } from '../LinkWizardFactory';
import { TransactionCard } from '../../TransactionCard';

class Component extends React.Component<LinkWizardStepProps> {
    private readonly accountFilter: (account: Account) => boolean;
    private readonly inputLabel: string;

    constructor(props: LinkWizardStepProps) {
        super(props);

        this.accountFilter = props.selectedTransactionFlag === TransactionFlag.Transfer
            ? (account: Account) => account._id !== this.props.transaction.accountId
                && filterOnlyDepositAccounts(account)
            : (account: Account) => account._id !== this.props.transaction.accountId
                && filterOnlyAssignableAccounts(account);

        if (props.selectedTransactionFlag === TransactionFlag.Transfer) {
            switch(this.props.accountAmountTypeFlag) {
                case TransactionFlag.BankCredit:
                case TransactionFlag.CreditAccountCredit:
                    this.inputLabel = 'From which account was the money transferred?';
                    break;
                case TransactionFlag.BankDebit:
                    this.inputLabel = 'To which account was the money transferred?';
                    break;
            }
        } else {
            this.inputLabel = 'Which envelope should be used for this transaction?';
        }

        props.setStepValidator(this.validateState);
    }

    validateState(state: LinkWizardStepProps) {
        if (isBlank(state.selectedAccountId)) {
            return 'Please select an option.';
        }
    }
    
    render() {
        const onChange = (e: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
            const selectedAccountId = option?.key as string;
            this.props.setState({
                selectedAccountId
            });
        };

        return <>
            <TransactionCard transaction={this.props.transaction}/>
            <Separator/>
            <AccountDropdown
                label={this.inputLabel}
                onChange={onChange}
                filter={this.accountFilter}
            />
        </>;
    }
}

export const LinkedAccountSelect = Component;
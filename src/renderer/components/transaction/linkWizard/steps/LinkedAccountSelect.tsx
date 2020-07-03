import { Account } from '@/models/Account';
import { TransactionFlag } from '@/models/Transaction';
import { AccountDropdown } from '@/renderer/components/account/AccountDropdown';
import { filterOnlyAssignableAccounts, filterOnlyDepositAccounts, isBlank } from '@/util/Filters';
import { IDropdownOption, Separator, MessageBar, MessageBarType } from '@fluentui/react';
import * as React from "react";
import { LinkWizardStepProps } from '../LinkWizardFactory';
import { TransactionCard } from '../../TransactionCard';
import { LinkWizardStepFrame } from '../LinkWizardStepFrame';

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
            return state.selectedTransactionFlag === TransactionFlag.Transfer
                ? 'Please select an account.'
                : 'Please select an envelope.';
        }
    }

    getNoAccountsError() {
        const message = this.props.selectedTransactionFlag === TransactionFlag.Transfer
            ? 'There are no eligible accounts for this transfer. Perhaps you need to create one?'
            : 'There are no usable envelopes for this transaction. Perhaps you need to create one?';

        return <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
            {message} 
        </MessageBar>;
    }
    
    render() {
        const onChange = (e: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
            const selectedAccountId = option?.key as string;
            this.props.setState({
                selectedAccountId
            });
        };

        return <LinkWizardStepFrame transaction={this.props.transaction}>
            <AccountDropdown
                label={this.inputLabel}
                onChange={onChange}
                onRenderEmptyList={() => this.getNoAccountsError()}
                filter={this.accountFilter}
            />
        </LinkWizardStepFrame>;
    }
}

export const LinkedAccountSelect = Component;
import { CombinedState } from '@/renderer/store/store';
import { filterOnlyImportableAccounts, isBlank } from "@/util/Filters";
import { ChoiceGroup } from '@fluentui/react';
import { Account } from '@models/Account';
import * as React from "react";
import { connect } from 'react-redux';
import { ImportWizardStepProps } from "./ImportWizard2";

export interface AccountSelectProps extends ImportWizardStepProps {
    importableAccounts?: Account[];
}

interface State {

}

class Component extends React.Component<AccountSelectProps, State> {
    constructor(props: AccountSelectProps) {
        super(props);

        this.state = {};

        props.setStepValidator(this.validateState);
    }

    validateState(state: ImportWizardStepProps) {
        if (isBlank(state.accountId)) {
            return 'Please select an account.';
        }
    }
    
    render() {
        return <div>
            <ChoiceGroup 
                label="Account" 
                selectedKey={this.props.accountId} 
                options={this.props.importableAccounts!.map(account => ({
                    key: account._id,
                    text: account.name
                }))}
                onChange={(e, option) => this.props.setState({
                    accountId: option?.key,
                })}
            />
        </div>;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: AccountSelectProps): AccountSelectProps => {
    return {
        ...ownProps,
        importableAccounts: state.accounts.sortedIds
            .map(id => state.accounts.accounts[id])
            .filter(filterOnlyImportableAccounts)
    };
}

export const AccountSelect = connect(mapStateToProps, {})(Component);
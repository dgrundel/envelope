import { Currency } from "@/util/Currency";
import { chainErrorGenerators, getRequiredCurrencyError, requiredAccountTypeErrorGenerator, requiredStringErrorGenerator } from '@/util/ErrorGenerators';
import { isNotBlank } from '@/util/Filters';
import { ChoiceGroup, MessageBar, MessageBarType, PrimaryButton, Text, TextField } from '@fluentui/react';
import { AccountType, getAccountTypeLabel, getBankAccountTypes } from '@models/Account';
import memoizeOne from 'memoize-one';
import * as React from "react";
import { connect } from "react-redux";
import { createBankAccount } from "../../store/actions/Account";
import { Layout } from '../uiElements/Layout';

export interface AccountCreateProps {
    // mapped from state
    existingAccountNames?: string[];

    // mapped actions
    createBankAccount?: (name: string, type: AccountType, balance: Currency) => void;
}

export interface AccountCreateState {
    name?: string;
    accountType?: AccountType;
    balance?: string;
    messages?: any;
}

const ALLOWED_ACCOUNT_TYPES = getBankAccountTypes();
const accountTypeErrorGenerator = requiredAccountTypeErrorGenerator(ALLOWED_ACCOUNT_TYPES);

class Component extends React.Component<AccountCreateProps, AccountCreateState> {

    constructor(props: AccountCreateProps) {
        super(props);

        this.state = {
            balance: '0.00',
        };

        this.getNameErrorGenerator = memoizeOne(this.getNameErrorGenerator);
    }

    getNameErrorGenerator(existingAccountNames: string[] = []) {
        return chainErrorGenerators(
            requiredStringErrorGenerator('Please enter a name for the account.'),
            requiredStringErrorGenerator(existingAccountNames, 'That name already exists.'),
        );
    }

    getBalanceErrorGenerator() {

    }

    render() {
        return <form onSubmit={e => this.onSubmit(e)}>
            {this.state.messages}
            <Layout split={2} noMargin>
                <ChoiceGroup 
                    name="type"
                    label="Account Type" 
                    selectedKey={this.state.accountType} 
                    options={ALLOWED_ACCOUNT_TYPES.map(key => ({
                        key,
                        text: getAccountTypeLabel(key)
                    }))}
                    onChange={(e, option) => this.setState({ accountType: option?.key as AccountType })}
                />
                <div>
                    <TextField
                        label="Name"
                        value={this.state.name}
                        onGetErrorMessage={this.getNameErrorGenerator(this.props.existingAccountNames)}
                        onChange={(e, name?) => this.setState({ name })}
                        validateOnLoad={false}
                    />
                    
                    <TextField
                        label="Current Balance"
                        value={this.state.balance}
                        onGetErrorMessage={getRequiredCurrencyError}
                        onChange={(e, balance?) => this.setState({ balance })}
                        validateOnLoad={false}
                    />
                </div>
            </Layout>
            <p style={({ textAlign: 'right' })}>
                <PrimaryButton type="submit" text="Save" />
            </p>
        </form>;
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        
        const errors = [
            this.getNameErrorGenerator(this.props.existingAccountNames)(this.state.name),
            accountTypeErrorGenerator(this.state.accountType),
            getRequiredCurrencyError(this.state.balance),
        ].filter(isNotBlank);

        if (errors.length > 0) {
            const messages = <MessageBar
                messageBarType={MessageBarType.error}
                isMultiline={true}
            >{errors.map(s => <Text key={s} block>{s}</Text>)}</MessageBar>;

            this.setState({ messages });
            return;
        }

        const accountName = this.state.name!;
        const accountType = this.state.accountType!;
        const balance = Currency.parse(this.state.balance!).or(Currency.ZERO);
        
        this.props.createBankAccount!(accountName, accountType, balance);

        // clear state
        this.setState({
            name: '',
            accountType: undefined,
            balance: '0.00',
            messages: undefined,
        });
    }
}

export const AccountCreate = connect(null, { createBankAccount })(Component);
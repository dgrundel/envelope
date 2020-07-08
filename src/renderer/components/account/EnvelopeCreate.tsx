import { Account } from '@/models/Account';
import { CombinedState } from '@/renderer/store/store';
import { ErrorGenerator, requiredStringErrorGenerator, chainErrorGenerators, uniqueStringErrorGenerator } from '@/util/ErrorGenerators';
import { MessageBar, MessageBarType, PrimaryButton, Text, TextField } from '@fluentui/react';
import * as React from "react";
import { connect } from "react-redux";
import { createEnvelope } from "../../store/actions/Account";
import memoizeOne from 'memoize-one';

export interface EnvelopeCreateProps {
    // mapped from state
    existingAccountNames?: string[];
    
    // store actions
    createEnvelope?: (name: string) => any;
}

export interface EnvelopeCreateState {
    name?: string;
    messages?: any;
}

class Component extends React.Component<EnvelopeCreateProps, EnvelopeCreateState> {

    constructor(props: EnvelopeCreateProps) {
        super(props);

        this.state = {};

        this.getNameErrorGenerator = memoizeOne(this.getNameErrorGenerator);
    }

    getNameErrorGenerator(existingAccountNames: string[] = []) {
        return chainErrorGenerators(
            requiredStringErrorGenerator('Please enter a name for the envelope.'),
            uniqueStringErrorGenerator(existingAccountNames, 'That name already exists.'),
        );
    }

    render() {
        return <form onSubmit={e => this.onSubmit(e)}>
            <TextField
                label="Name"
                value={this.state.name}
                onGetErrorMessage={this.getNameErrorGenerator(this.props.existingAccountNames)}
                onChange={(e, name?) => this.setState({ name })}
                validateOnLoad={false}
            />
            <p style={({ textAlign: 'right' })}>
                <PrimaryButton type="submit" text="Save" />
            </p>
        </form>;
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();

        const nameError = this.getNameErrorGenerator(this.props.existingAccountNames)(this.state.name);

        if (nameError) {
            const messages = <MessageBar
                messageBarType={MessageBarType.error}
                isMultiline={true}
            >
                <Text key="nameError" block>{nameError}</Text>
            </MessageBar>;

            this.setState({ messages });
            return;
        }

        // clear messages
        this.setState({
            name: undefined,
            messages: undefined
        });

        this.props.createEnvelope!(this.state.name!);
    }
}

const mapStateToProps = (state: CombinedState, ownProps: EnvelopeCreateProps): EnvelopeCreateProps => {
    return {
        ...ownProps,
        existingAccountNames: state.accounts.sortedIds.map(id => state.accounts.accounts[id].name),
    };
}

export const EnvelopeCreate = connect(mapStateToProps, { createEnvelope })(Component);
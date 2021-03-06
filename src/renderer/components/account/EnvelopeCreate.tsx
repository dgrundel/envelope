import { CombinedState } from '@/renderer/store/store';
import { chainErrorGenerators, requiredStringErrorGenerator, uniqueStringErrorGenerator } from '@/util/ErrorGenerators';
import { MessageBar, MessageBarType, PrimaryButton, Text, TextField } from '@fluentui/react';
import memoizeOne from 'memoize-one';
import * as React from "react";
import { connect } from "react-redux";
import { createEnvelope } from "../../store/actions/Account";

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
            {this.state.messages}
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

        this.props.createEnvelope!(this.state.name!);

        // clear state
        this.setState({
            name: '',
            messages: undefined
        });
    }
}

const mapStateToProps = (state: CombinedState, ownProps: EnvelopeCreateProps): EnvelopeCreateProps => {
    return {
        ...ownProps,
        existingAccountNames: state.accounts.sortedIds.map(id => state.accounts.accounts[id].name),
    };
}

export const EnvelopeCreate = connect(mapStateToProps, { createEnvelope })(Component);
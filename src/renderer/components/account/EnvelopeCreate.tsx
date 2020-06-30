import { PrimaryButton, TextField } from '@fluentui/react';
import * as React from "react";
import { connect } from "react-redux";
import { createEnvelope } from "../../store/actions/Account";
import { CommonValidators, FieldValue, FormValidator } from '../../../util/FormValidator';

export interface EnvelopeCreateProps {
    createEnvelope?: (name: string) => Promise<void>;
}

export interface EnvelopeCreateState {
    values: Record<string, any>;
    errors: Record<string, string>;
}

const fieldValidators = [{
    name: 'name',
    validator: CommonValidators.required()
}];

class Component extends React.Component<EnvelopeCreateProps, EnvelopeCreateState> {
    private readonly validator: FormValidator;

    constructor(props: EnvelopeCreateProps) {
        super(props);

        this.validator = new FormValidator(fieldValidators, this.onFieldChange.bind(this));
        this.state = {
            values: {},
            errors: {}
        };
    }

    render() {
        return <form onSubmit={e => this.onSubmit(e)}>
            <TextField
                label="Name"
                value={this.state.values.name || ''}
                errorMessage={this.state.errors.name}
                onChange={(e, value?) => this.validator.setValue('name', value)}
            />
            <p style={({ textAlign: 'right' })}>
                <PrimaryButton type="submit" text="Save" />
            </p>
        </form>;
    }

    onFieldChange(fieldName: string, fieldValue: FieldValue) {
        const values = this.validator.values();
        const errors = this.validator.errors();
        this.setState({
            values,
            errors
        });
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        
        if (this.validator.allValid()) {
            const values = this.validator.values();
            
            this.props.createEnvelope && this.props.createEnvelope(values.name as string);

        } else {
            const errors = this.validator.errors();
            this.setState({
                errors
            });
        }
    }
}

export const EnvelopeCreate = connect(null, { createEnvelope })(Component);
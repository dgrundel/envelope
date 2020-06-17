import { Account, AccountDataStoreClient, AccountType } from "@/dataStore/impl/AccountDataStore";
import { Log } from "@/util/Logger";
import * as React from "react";
import { CommonValidators, FieldValue, FormValidator } from './FormValidator';

export interface FormContainerProps {
    children: any;
    validator: FormValidator;
    onSubmit: () => void;
    onError?: () => void;
    formErrors?: string[];
}

export interface FormContainerState {
    fieldValues: Record<string, any>;
    fieldErrors: Record<string, string>;
}

export class FormContainer extends React.Component<FormContainerProps, FormContainerState> {
    constructor(props: FormContainerProps) {
        super(props);

        props.validator.setChangeHandler(this.onFieldChange.bind(this));

        this.state = {
            fieldValues: {},
            fieldErrors: {}
        };
    }

    render() {
        return <form className="form-container" onSubmit={e => this.onSubmit(e)}>
            {this.renderFormErrors()}
            {this.props.children}
            <div className="form-container-footer">
                <button className="btn" type="submit">
                    Save
                </button>
            </div>
        </form>;
    }
    
    renderFormErrors() {
        const errors = this.props.formErrors || [];
        if (errors.length) {
            return <div className="form-container-errors">
                {errors.map(s => <p className="form-container-errors-error">{s}</p>)}
            </div>
        }
    }

    onFieldChange(fieldName: string, fieldValue: FieldValue) {
        const values = this.props.validator.values();
        const errors = this.props.validator.errors();
        this.setState({
            fieldValues: values,
            fieldErrors: errors
        });
    }

    onSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        
        const validator = this.props.validator;
        if (validator.allValid()) {
            this.props.onSubmit();
        } else {
            const errors = validator.errors();
            this.setState({
                fieldErrors: errors
            });
            if (this.props.onError) {
                this.props.onError();
            }
        }
    }
}
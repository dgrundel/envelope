import * as React from "react";
import { BaseModal, ModalApi, ModalButton, Modal } from '../Modal';
import { Log } from '@/util/Logger';

export interface WizardApi<S> {
    getState: () => S;
    updateState: (wizardState: S) => void;
}

export interface WizardStepValidationResult {
    valid: boolean;
    message?: any;
}

export interface WizardStep<S> {
    render: (state: S, api: WizardApi<S>) => any;
    validate: (state: S, api: WizardApi<S>) => WizardStepValidationResult;
}

export interface WizardProps<S> {
    modalApi: ModalApi;
    initialState: S;
    initialStep?: number;
    steps: WizardStep<S>[];
    onComplete: (wizardState: S) => void;
    onCancel?: (wizardState: S) => void;
    heading?: string;
}

export interface WizardInternalState<S> {
    step: number;
    wizardApi: WizardApi<S>;
    wizardState: S;
    renderer?: WizardStep<S>;
    message?: any;
}

export class Wizard<S> extends React.Component<WizardProps<S>, WizardInternalState<S>> implements Modal {

    constructor(props: WizardProps<S>) {
        super(props);

        if (props.steps.length === 0) {
            Log.error('No steps provided to Wizard.');
        }

        const step = props.initialStep || 0;

        this.state = {
            step: step,
            wizardApi: this.createWizardApi(),
            wizardState: props.initialState,
            renderer: props.steps[step],
        };
    }

    render() {
        const isFirstStep = this.state.step === 0;
        const isLastStep = this.state.step === this.props.steps.length - 1;

        const buttons: ModalButton[] = [{
            buttonText: 'Cancel',
            onClick: () => this.cancel(),
            className: isFirstStep ? '' : 'hide'
        },{
            buttonText: 'Back',
            onClick: () => this.back(),
            className: isFirstStep ? 'hide' : ''
        },{
            buttonText: 'Next',
            onClick: () => this.next(),
            className: isLastStep ? 'hide' : ''
        },{
            buttonText: 'Finish',
            onClick: () => this.finish(),
            className: isLastStep ? '' : 'hide'
        }];

        return <BaseModal heading={this.props.heading} buttons={buttons} closeButtonHandler={() => this.cancel()}>
            {this.state.message || ''}
            {this.state.renderer && this.state.renderer.render(this.state.wizardState, this.state.wizardApi)}
        </BaseModal>;
    }

    createWizardApi() {
        const getState = () => this.state.wizardState;
        const updateState = (wizardState: S) => this.setState({
            wizardState
        });
        
        return {
            getState: getState.bind(this),
            updateState: updateState.bind(this)
        }
    }

    stepTransition(fromStepIndex: number, toStepIndex: number) {
        const api = this.state.wizardApi;
        const fromStep = this.props.steps[fromStepIndex];

        if (!fromStep) {
            Log.error('fromStep: There is no step at index', fromStepIndex);
            return;
        }
        
        const validationResult = fromStep.validate(this.state.wizardState, api);
        this.setState({ message: validationResult.message });
        if (validationResult.valid) {
            this.renderStep(toStepIndex);
        } else {
            Log.debug('Wizard step validator error.', validationResult)
        }
    }

    renderStep(n: number) {
        const toStep = this.props.steps[n];

        if (!toStep) {
            Log.error('toStep: There is no step at index', n);
            return;
        }
        
        this.setState({
            step: n,
            renderer: toStep 
        });
    }

    cancel() {
        if (this.props.onCancel) {
            this.props.onCancel(this.state.wizardState);
        }
        this.props.modalApi.dismissModal();
    }

    back() {
        const current = this.state.step;
        this.stepTransition(current, current - 1);
    }

    next() {
        const current = this.state.step;
        this.stepTransition(current, current + 1);
    }

    finish() {
        const api = this.state.wizardApi;
        const current = this.state.step;
        const currentStep = this.props.steps[current];

        const validationResult = currentStep.validate(this.state.wizardState, api);
        this.setState({ message: validationResult.message });
        if (validationResult.valid) {
            this.props.onComplete(this.state.wizardState);
        } else {
            Log.debug('Final wizard step invalid.', validationResult);
        }
    }
}
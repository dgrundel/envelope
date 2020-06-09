import * as React from "react";
import { BaseModal, ModalApi, ModalButton, Modal } from '../Modal';
import { Log } from '@/util/Logger';

export interface WizardApi<S> {
    getState: () => S;
    updateState: (wizardState: S) => void;
}

export interface WizardStep<S> {
    render: (api: WizardApi<S>) => Promise<any>;
    validate: (api: WizardApi<S>) => Promise<void>;
}

export interface WizardProps<S> {
    modalApi: ModalApi;
    initialState: S;
    initialStep?: number;
    steps: WizardStep<S>[];
    onComplete: (wizardState: S) => void;
}

export interface WizardInternalState<S> {
    step: number;
    wizardApi: WizardApi<S>;
    wizardState: S;
    children?: any;
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
            wizardApi: {
                getState: (() => this.state.wizardState).bind(this),
                updateState: ((wizardState: S) => this.setState({
                    wizardState
                })).bind(this)
            },
            wizardState: props.initialState
        };

        this.renderStep(step);
    }

    render() {
        const isFirstStep = this.state.step === 0;
        const isLastStep = this.state.step === this.props.steps.length - 1;

        const buttons: ModalButton[] = [{
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

        return <BaseModal buttons={buttons}>
            {this.state.children || ''}
        </BaseModal>;
    }

    stepTransition(fromStepIndex: number, toStepIndex: number) {
        const api = this.state.wizardApi;
        const fromStep = this.props.steps[fromStepIndex];

        if (!fromStep) {
            Log.error(`fromStep: There is no step at index ${fromStepIndex}`);
            return;
        }
        
        fromStep.validate(api)
            .then(() => this.renderStep(toStepIndex))
            .catch(err => Log.debug(`Wizard step validator error: ${err}`));
    }

    renderStep(n: number) {
        const api = this.state.wizardApi;
        const toStep = this.props.steps[n];

        if (!toStep) {
            Log.error(`toStep: There is no step at index ${n}`);
            return;
        }
        
        toStep.render(api)
            .then(children => {
                Log.debug('Wizard step children (lol)', children);
                this.setState({
                    step: n,
                    children 
                });
            })
            .catch(err => Log.error(`Wizard step render error: ${err}`));
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

        currentStep.validate(api)
            .then(() => {
                this.props.onComplete(this.state.wizardState);
            });
    }
}
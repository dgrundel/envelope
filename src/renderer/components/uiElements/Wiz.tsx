import * as React from "react";
import { CombinedState } from '@/renderer/store/store';
import { connect } from 'react-redux';
import { BaseModal, ModalButton } from "./Modal";
import { toUnicode } from "punycode";
import { Log } from "@/util/Logger";
import { getAppContext } from "@/renderer/AppContext";

export type WizardStateValidator<P> = (state: P) => boolean | undefined | void;

export interface WizardStepApi<P> {
    setState: (state: P) => void;
    nextStep: () => void;
    prevStep: () => void;
}

export interface WizardProps<P> {
    title?: string;
    onCancel?: WizardStateValidator<P>;
    onFinish?: WizardStateValidator<P>;
}

interface InternalState {
    step: number;
}

export const createWizard = <P extends object>(props: WizardProps<P>, initialProps: P, ...steps: React.ComponentType<P & WizardStepApi<P>>[]) => {
    const WizardComponent = () => {
        const [stepState, setStepState] = React.useState<P>(initialProps);
        const [internalState, setInternalState] = React.useState<InternalState>({
            step: 0,
        });

        const isFirstStep = internalState.step === 0;
        const isLastStep = internalState.step === steps.length - 1;

        const setStep = (i: number) => {
            if (i < 0 || i >= steps.length) {
                throw new Error('Step index out of bounds.');
            }
            setInternalState({ step: i });
        }

        const nextStep = () => {
            setStep(internalState.step + 1);
        };
        
        const prevStep = () => {
            setStep(internalState.step - 1);
        };

        const cancel = () => {
            const handlerResult = props.onCancel && props.onCancel(stepState);
            if (handlerResult !== false) {
                getAppContext().modalApi.dismissModal();
            }
        };

        const finish = () => {
            const handlerResult = props.onFinish && props.onFinish(stepState);
            if (handlerResult !== false) {
                getAppContext().modalApi.dismissModal();
            }
        };

        const buttons: ModalButton[] = [{
            buttonText: 'Cancel',
            onClick: cancel,
            className: isFirstStep ? '' : 'hide'
        },{
            buttonText: 'Back',
            onClick: prevStep,
            className: isFirstStep ? 'hide' : ''
        },{
            buttonText: 'Next',
            onClick: nextStep,
            className: isLastStep ? 'hide' : ''
        },{
            buttonText: 'Finish',
            onClick: finish,
            className: isLastStep ? '' : 'hide'
        }];

        const stepApi = {
            setState: setStepState,
            nextStep,
            prevStep,
        };

        const StepComponent = steps[internalState.step];

        return <BaseModal heading={props.title} buttons={buttons} closeButtonHandler={cancel}>
            <StepComponent {...stepState} {...stepApi} />
        </BaseModal>;
    }
    
    return WizardComponent;
};

interface TestWizProps {
    value: string;
}

export const TestWizard = createWizard(
    {
        title: 'Yer a wizard title!',
        onCancel: (state: TestWizProps) => {
            Log.debug('cancelled', state);
        },
        onFinish: (state: TestWizProps) => {
            Log.debug('finished', state);
        },
    },
    {
        value: 'test'
    }, 
    class Foo extends React.Component<TestWizProps & WizardStepApi<TestWizProps>> {
        render() {
            return <div>
                <p>Step 1: {this.props.value}</p>
                <input onChange={(e) => { this.props.setState({ value: e.target.value }) }} value={this.props.value} />
                <button onClick={() => this.props.nextStep()}>Next</button>
            </div>;
        }
    },
    class Bar extends React.Component<TestWizProps & WizardStepApi<TestWizProps>> {
        render() {
            return <div>
                <p>Step 2: {this.props.value}</p>
                <input onChange={(e) => { this.props.setState({ value: e.target.value }) }} value={this.props.value} />
                <button onClick={() => this.props.prevStep()}>Prev</button>
            </div>;
        }
    }
);
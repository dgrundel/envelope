import { getAppContext } from "@/renderer/AppContext";
import { Log } from "@/util/Logger";
import { MessageBar, MessageBarType } from "@fluentui/react";
import * as React from "react";
import { BaseModal, ModalButton } from "./Modal";
import { isNotBlank } from "@/util/Filters";

export type WizardStateValidatorResult = string | string[] | undefined | void;
export type WizardStateValidator<P> = (state: P) => WizardStateValidatorResult;

export interface WizardStepApi<P> {
    setStepValidator: (validator: WizardStateValidator<P>) => void;
    setState: <K extends keyof P>(state: Pick<P, K>) => void;
    nextStep: () => void;
    prevStep: () => void;
}

export interface WizardProps<P> {
    // modal title
    title?: string;
    // validator to run on cancel
    // returning an error message prevents dismissal
    onCancel?: WizardStateValidator<P>;
    // validator to run on finish
    // returning an error message prevents dismissal
    onFinish?: WizardStateValidator<P>;
    // run validators when clicking the "back" button
    // defaults to false
    // if true, returning an error prevents going backward
    validateOnStepBack?: boolean;
    // run validator for the current step when canceling
    // defaults to false
    // if true, returning an error in the step validator
    // for the current step prevents dismissal
    validateCurrentStepOnCancel?: boolean;
}

interface InternalState {
    step: number;
    errorMessages: string[];
}

const validate = <P extends object>(state: P, validator?: WizardStateValidator<P>): string[] => {
    const result = validator && validator(state);
    const asArray = result
        ? Array.isArray(result) ? result : [result]
        : [];
    return asArray.filter(isNotBlank);
};

export const createWizard = <P extends object>(props: WizardProps<P>, initialProps: P, steps: React.ComponentType<P & WizardStepApi<P>>[]) => {
    
    const stepValidators: WizardStateValidator<P>[] = [];
    
    const WizardComponent = () => {
        const [stepState, setStepState] = React.useState<P>(initialProps);
        const [internalState, setInternalState] = React.useState<InternalState>({
            step: 0,
            errorMessages: [],
        });

        const isFirstStep = internalState.step === 0;
        const isLastStep = internalState.step === steps.length - 1;

        const setStepValidator = (validator: WizardStateValidator<P>) => {
            stepValidators[internalState.step] = validator;
        };

        const setState = (updates: any) => {
            setStepState({
                ...stepState,
                ...updates
            });
        };

        const setStep = (i: number) => {
            if (i < 0 || i >= steps.length) {
                throw new Error('Step index out of bounds.');
            }
            setInternalState({
                ...internalState,
                errorMessages: [],
                step: i,
            });
        }

        const nextStep = () => {
            const errorMessages = validate(stepState, stepValidators[internalState.step]);
            if (errorMessages.length === 0) {
                setStep(internalState.step + 1);
            } else {
                setInternalState({
                    ...internalState,
                    errorMessages,
                })
            }
        };
        
        const prevStep = () => {
            // by default, do not validate when going backward
            const errorMessages = props.validateOnStepBack === true
                ? validate(stepState, stepValidators[internalState.step])
                : [];
            if (errorMessages.length === 0) {
                setStep(internalState.step - 1);
            } else {
                setInternalState({
                    ...internalState,
                    errorMessages,
                })
            }
        };

        const cancel = () => {
            let errorMessages = props.validateCurrentStepOnCancel === true
                ? validate(stepState, stepValidators[internalState.step])
                : [];
            
            // only run cancel error handler if the step handler was successful
            if (errorMessages.length === 0) {
                errorMessages = validate(stepState, props.onCancel);
            }

            if (errorMessages.length === 0) {
                getAppContext().modalApi.dismissModal();
            } else {
                setInternalState({
                    ...internalState,
                    errorMessages,
                })
            }
        };

        const finish = () => {
            let errorMessages = validate(stepState, stepValidators[internalState.step])
            
            // only run the finish validator if the step validates
            if (errorMessages.length === 0) {
                errorMessages = validate(stepState, props.onFinish);
            }
            
            if (errorMessages.length === 0) {
                getAppContext().modalApi.dismissModal();
            } else {
                setInternalState({
                    ...internalState,
                    errorMessages,
                })
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
            setStepValidator,
            setState,
            nextStep,
            prevStep,
        };

        const StepComponent = steps[internalState.step];

        return <BaseModal heading={props.title} buttons={buttons} closeButtonHandler={cancel}>
            {internalState.errorMessages.length > 0 && <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
                {internalState.errorMessages.map(message => <p key={message}>{message}</p>)}
            </MessageBar>}
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
    [
        class Foo extends React.Component<TestWizProps & WizardStepApi<TestWizProps>> {
            
            constructor(props: TestWizProps & WizardStepApi<TestWizProps>) {
                super(props);

                props.setStepValidator((s: TestWizProps) => {
                    if (s.value !== 'valid') {
                        return 'value must be "valid"';
                    }
                });
            }
            
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
    ]
);
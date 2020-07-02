import { getAppContext } from "@/renderer/AppContext";
import { Log } from "@/util/Logger";
import { MessageBar, MessageBarType } from "@fluentui/react";
import * as React from "react";
import { BaseModal, ModalButton } from "./Modal";
import { isNotBlank } from "@/util/Filters";

export type WizardStateValidatorResult = string | string[] | undefined | void;
export type WizardStateValidator<P> = (state: P) => WizardStateValidatorResult;

export interface WizardStepApi<P> {
    setState: <K extends keyof P>(state: Pick<P, K>) => void;
    nextStep: () => void;
    prevStep: () => void;
    cancel: () => void;
    finish: () => void;
    // pass in a validator that should be called before allowing
    // user to progres to next step (or finish)
    // should be called in constructor of component
    setStepValidator: (validator: WizardStateValidator<P>) => void;
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

interface InternalState<P> {
    step: number;
    errorMessages: string[];
    stepValidator?: WizardStateValidator<P>;
}

const validate = <P extends object>(state: P, validator?: WizardStateValidator<P>): string[] => {
    const result = validator && validator(state);
    const asArray = result
        ? Array.isArray(result) ? result : [result]
        : [];
    return asArray.filter(isNotBlank);
};

const createModalButtons = <P extends object>(currentStep: number, numSteps: number, stepApi: WizardStepApi<P>) => {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === numSteps - 1;
    const buttons: ModalButton[] = [{
        buttonText: 'Cancel',
        onClick: stepApi.cancel,
        className: isFirstStep ? '' : 'hide'
    }, {
        buttonText: 'Back',
        onClick: stepApi.prevStep,
        className: isFirstStep ? 'hide' : ''
    }, {
        buttonText: 'Next',
        onClick: stepApi.nextStep,
        className: isLastStep ? 'hide' : ''
    }, {
        buttonText: 'Finish',
        onClick: stepApi.finish,
        className: isLastStep ? '' : 'hide'
    }];
    return buttons;
};

export const createWizard = <P extends object>(props: WizardProps<P>, initialProps: P, steps: React.ComponentType<P & WizardStepApi<P>>[]) => {
    
    const WizardComponent = () => {
        const [stepState, setStepState] = React.useState<P>(initialProps);
        const [internalState, setInternalState] = React.useState<InternalState<P>>({
            step: 0,
            errorMessages: [],
        });

        const setStepValidator = (stepValidator: WizardStateValidator<P>) => {
            setInternalState({
                ...internalState,
                stepValidator
            });
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
            // any values that should be cleared between step transitions go here
            setInternalState({
                ...internalState,
                errorMessages: [],
                stepValidator: undefined,
                step: i,
            });
        }

        const nextStep = () => {
            const errorMessages = validate(stepState, internalState.stepValidator);
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
                ? validate(stepState, internalState.stepValidator)
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
                ? validate(stepState, internalState.stepValidator)
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
            let errorMessages = validate(stepState, internalState.stepValidator)
            
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

        const stepApi: WizardStepApi<P> = {
            setStepValidator,
            setState,
            nextStep,
            prevStep,
            cancel,
            finish
        };

        const buttons: ModalButton[] = createModalButtons(internalState.step, steps.length, stepApi);
        const StepComponent = steps[internalState.step];

        return <BaseModal heading={props.title} buttons={buttons} closeButtonHandler={stepApi.cancel}>
            {internalState.errorMessages.length > 0 && <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
                {internalState.errorMessages.map(message => <p key={message}>{message}</p>)}
            </MessageBar>}
            <StepComponent {...stepState} {...stepApi} />
        </BaseModal>;
    }
    
    return WizardComponent;
};

import * as React from "react";
import { CombinedState } from '@/renderer/store/store';
import { connect } from 'react-redux';
import { ImportWizardStepProps } from "./ImportWizard2";

interface State {

}

class Component extends React.Component<ImportWizardStepProps, State> {
    
    constructor(props: ImportWizardStepProps) {
        super(props);

        this.state = {};
    }
    
    render() {
        return null;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: ImportWizardStepProps): ImportWizardStepProps => {
    return {
        ...ownProps,
    };
}

export const AmountFieldSelect = connect(mapStateToProps, {})(Component);
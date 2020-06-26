import * as React from "react";
import { CombinedState } from '../store/store';
import { connect } from 'react-redux';

export interface __templateProps {
}

interface State {
}

class Component extends React.Component<__templateProps, State> {
    
    constructor(props: __templateProps) {
        super(props);

        this.state = {};
    }
    
    render() {
        throw new Error('__template');
        return null;
    }
}

const mapStateToProps = (state: CombinedState, ownProps: __templateProps): __templateProps => {
    throw new Error('__template');
    return {
        ...ownProps,
    };
}

export const __template = connect(mapStateToProps, {})(Component);
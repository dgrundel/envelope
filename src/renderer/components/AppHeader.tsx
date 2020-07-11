import * as React from "react";
import { connect } from 'react-redux';
import { Layout } from './uiElements/Layout';

export interface HeaderProps {
}

const envelopeIcon = require('@public/images/envelope-icon.svg');

class Component extends React.Component<HeaderProps, {}> {
    render() {
        return <div id="header">
            <Layout split={2} noMargin noGap>
                <div>
                    <span className="envelope-icon" dangerouslySetInnerHTML={({__html: envelopeIcon})} />
                    <h1 className="header-text">Envelope</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                </div>
            </Layout>
        </div>;
    }
}

const storeActions = {
};

export const AppHeader = connect(null, storeActions)(Component);
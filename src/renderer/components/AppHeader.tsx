import * as React from "react";
import { connect } from 'react-redux';
import { Layout } from './uiElements/Layout';
import { ActionButton } from '@fluentui/react';
import { Modal } from '../store/reducers/AppState';
import { setModal } from '../store/actions/AppState';
import { AppSettingsModal } from './AppSettingsModal';

export interface HeaderProps {
    // store actions
    setModal?: (modal: Modal) => void;
}

const envelopeIcon = require('@public/images/envelope-icon.svg');

class Component extends React.Component<HeaderProps, {}> {
    render() {
        // const showSettings = () => {
        //     this.props.setModal!(<AppSettingsModal/>);
        // };

        return <div id="header">
            <Layout split={2} noMargin noGap>
                <div>
                    <span className="envelope-icon" dangerouslySetInnerHTML={({__html: envelopeIcon})} />
                    <h1 className="header-text">Envelope</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {/* <ActionButton iconProps={{ iconName: 'Settings' }} onClick={showSettings}>
                        Settings
                    </ActionButton> */}
                </div>
            </Layout>
        </div>;
    }
}

// const mapStateToProps = (state: CombinedState, ownProps: HeaderProps): HeaderProps => {
//     return {
//         ...ownProps,
//     };
// };

const storeActions = {
    setModal,
};

export const AppHeader = connect(null, storeActions)(Component);
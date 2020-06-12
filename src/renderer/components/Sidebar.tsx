import * as React from "react";

import '@public/components/Sidebar.scss';
import { ImportDropTarget } from './import/ImportDropTarget';
import { AppPage, PageApi } from './App';
import { ModalApi } from './Modal';

export interface SidebarProps {
    modalApi: ModalApi;
    pageApi: PageApi;
}

export class Sidebar extends React.Component<SidebarProps, {}> {
    render() {
        return <div id="sidebar">
            <h4 className="sidebar-nav-header">Navigation Header</h4>
            <ul className="sidebar-nav">
                {this.renderNavLink(AppPage.Dashboard, 'Dashboard')}
                {this.renderNavLink(AppPage.Accounts, 'Accounts')}
                {this.renderNavLink(AppPage.Envelopes, 'Envelopes')}
                {this.renderNavLink(AppPage.Transactions, 'Transactions')}
            </ul>
            <ImportDropTarget modalApi={this.props.modalApi}/>
        </div>;
    }


    renderNavLink(page: AppPage, label: string) {
        const pageApi = this.props.pageApi;

        return <li className={pageApi.getActivePage() === page ? 'sidebar-nav-link-active' : ''} onClick={() => pageApi.setPage(page)}>{label}</li>;
    }
}
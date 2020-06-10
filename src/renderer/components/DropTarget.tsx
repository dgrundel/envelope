import '@public/components/DropTarget.scss';
import * as React from "react";

export interface DropTargetProps {
    children?: any;
    handler: (result: Promise<DataTransferItemList>) => void;
}

export interface DropTargetState {
    active: boolean;
}

export class DropTarget extends React.Component<DropTargetProps, DropTargetState> {

    constructor(props: DropTargetProps) {
        super(props);

        this.state = {
            active: false
        };
        this.drop = this.drop.bind(this);
    }

    render() {
        return <div className={`drop-target ${this.state.active ? 'drop-target-active': ''}`}
            onDragOver={e => this.dragOver(e)}
            onDragEnter={e => this.dragEnter(e)}
            onDragLeave={e => this.dragLeave(e)}
            onDrop={e => this.drop(e)}>
            {this.props.children || this.renderDefaultContent()}
        </div>;
    }

    renderDefaultContent() {
        return <p className="drop-target-default-content">
            <i className="pe-7s-upload drop-target-default-icon"></i>
            Drop files here.
        </p>
    }

    dragOver(e: React.DragEvent) {
        e.stopPropagation();
        e.preventDefault();

        this.setState({ active: true });
    }

    dragEnter(e: React.DragEvent) {
        e.stopPropagation();
        e.preventDefault();
        
        this.setState({ active: true });
    }

    dragLeave(e: React.DragEvent) {
        this.setState({ active: false });
    }

    drop(e: React.DragEvent) {
        e.stopPropagation();
        // e.preventDefault();

        this.setState({ active: false });

        this.props.handler(new Promise((resolve, reject) => {
            const items = e.dataTransfer.items;
            if (items) {
                resolve(items);
            } else {
                reject();
            }
        }));
    }
}
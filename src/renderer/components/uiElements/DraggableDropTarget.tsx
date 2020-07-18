import * as React from "react";
import { PLAIN_TEXT_MIME_TYPE, JSON_MIME_TYPE } from './Draggable';
import { debounce } from 'lodash';

export interface DraggableDropTargetProps {
    onDrop: (data: string | Record<string, string>) => void;
    onHoverStateChange?: (isHover: boolean) => void;
    dropEffect?: 'none' | 'copy' | 'move' | 'link';
    children: any;
}

const DEBOUNCE_INTERVAL = 50;
const DEBOUNCE_OPTS = {
    leading: true,
    trailing: true,
};

export const DraggableDropTarget = (props: DraggableDropTargetProps) => {
    let hoverState = false;
    const hoverChange = debounce((isHover: boolean) => {
        if (hoverState !== isHover) {
            hoverState = isHover;
            if (props.onHoverStateChange) {
                props.onHoverStateChange(isHover);
            }
        }
    }, DEBOUNCE_INTERVAL, DEBOUNCE_OPTS);

    const dragOver = (e: React.DragEvent) => {
        e.stopPropagation();
        e.preventDefault();

        hoverChange(true);
        e.dataTransfer.dropEffect = props.dropEffect || 'move';
    }

    const dragEnter = (e: React.DragEvent) => {
        e.stopPropagation();
        e.preventDefault();

        hoverChange(true);
    }

    const dragLeave = (e: React.DragEvent) => {
        hoverChange(false);
    }

    const drop = (e: React.DragEvent) => {
        e.stopPropagation();

        const text = e.dataTransfer.getData(PLAIN_TEXT_MIME_TYPE);
        const json = e.dataTransfer.getData(JSON_MIME_TYPE);
        if (text) {
            props.onDrop(text);
        } else if (json) {
            props.onDrop(JSON.parse(json));
        }
        hoverChange(false);
    }

    return <div onDragOver={dragOver} onDragEnter={dragEnter} onDragLeave={dragLeave} onDrop={drop}>
        {props.children}
    </div>;
};
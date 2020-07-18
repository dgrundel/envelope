import * as React from "react";
import { JSON_MIME_TYPE, PLAIN_TEXT_MIME_TYPE } from './Draggable';

export interface DraggableDropTargetProps {
    onDrop: (data: string | Record<string, string>) => void;
    onHoverStateChange?: (isHover: boolean) => void;
    dropEffect?: 'none' | 'copy' | 'move' | 'link';
    className?: string;
    style?: React.CSSProperties;
    children: any;
}

const noOp = () => {};

export const DraggableDropTarget = (props: DraggableDropTargetProps) => {
    const hoverChange = props.onHoverStateChange || noOp;

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

    const dragLeave = () => {
        hoverChange(false);
    }

    const mouseLeave = () => {
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

    return <div 
        onDragOver={dragOver} 
        onDragEnter={dragEnter} 
        onDragLeave={dragLeave} 
        onMouseLeave={mouseLeave}
        onDrop={drop} 
        className={props.className} 
        style={props.style}
    >
        {props.children}
    </div>;
};
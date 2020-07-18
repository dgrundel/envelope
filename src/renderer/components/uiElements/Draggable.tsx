import * as React from "react";
import { Log } from '@/util/Logger';
import { debounce } from 'lodash';

export interface DraggableProps {
    data: string | Record<string, string>;
    dropEffect?: 'none' | 'copy' | 'move' | 'link';
    onDragStateChange?: (isDrag: boolean) => void;
    children: any;
}

export const PLAIN_TEXT_MIME_TYPE = 'text/plain';
export const JSON_MIME_TYPE = 'application/json';

const DEBOUNCE_INTERVAL = 50;
const DEBOUNCE_OPTS = {
    leading: true,
    trailing: true,
};

export const Draggable = (props: DraggableProps) => {
    let dragState = false;
    const dragChange = debounce((isDrag: boolean) => {
        if (dragState !== isDrag) {
            dragState = isDrag;
            if (props.onDragStateChange) {
                props.onDragStateChange(isDrag);
            }
        }
    }, DEBOUNCE_INTERVAL, DEBOUNCE_OPTS);
    
    const dragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.dropEffect = props.dropEffect || 'move';

        if (typeof props.data === 'string') {
            e.dataTransfer.setData(PLAIN_TEXT_MIME_TYPE, props.data);
        } else {
            e.dataTransfer.setData(JSON_MIME_TYPE, JSON.stringify(props.data));
        }

        dragChange(true);
    };

    const dragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        dragChange(false);
    };
    
    return <div draggable={true} onDragStart={dragStart} onDragEnd={dragEnd}>
        {props.children}
    </div>;
};
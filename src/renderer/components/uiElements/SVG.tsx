import * as React from "react";

export interface SVGProps {
    html: string;
    className?: string;
}

export const SVG = (props: SVGProps) => {
    return <span dangerouslySetInnerHTML={({ __html: props.html })} {...props} />;
};
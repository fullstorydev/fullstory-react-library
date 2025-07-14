import React from "react";
import { createElementData, seperateProps } from "../../utils/helpers";
import { FullStoryImage } from "../../utils/types";

export const Element = (props: FullStoryImage): JSX.Element => {
    // create schema and data elements
    const data = props.name ? createElementData(props.elementData, props.name) : createElementData(props.elementData);

    // seperate default props from FS props
    const imageProps = seperateProps(props);

    return <div {...imageProps} {...data} />;
};

export default Image;

import React, { useEffect } from "react";
import { createElementData, createTimingName, seperateProps } from "../../utils/helpers";
import { FullStoryImage } from "../../utils/types";

export const Image = (props: FullStoryImage): JSX.Element => {
    // create the timing name
    const timing = createTimingName(props);

    // create schema and data elements
    const data = props.name ? createElementData(props.elementData, props.name) : createElementData(props.elementData);

    // seperate default props from FS props
    const imageProps = seperateProps(props);

    return <img {...({ elementtiming: timing } as any)} {...imageProps} {...data} />;
};

export default Image;

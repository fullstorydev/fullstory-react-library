import { Meta, StoryObj } from "@storybook/react";
import Button from "./Route";

// Export metadata with title
const meta: Meta<typeof Button> = {
    title: "SampleComponentLibrary/Button",
    component: Button
};
export default meta;

// create reusable Story type
type Story = StoryObj<typeof Button>;

// // export story
// export const Primary: Story = {
//     args: {
//         label: "Primary"
//     }
// };

// export const Secondary: Story = {
//     args: {
//         label: "Secondary"
//     }
// };

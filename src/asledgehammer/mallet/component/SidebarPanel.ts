import { Component, ComponentOptions } from "./Component";
import { SidebarPanelButton } from "./SidebarPanelButton";

export class SidebarPanel extends Component<SidebarPanelOptions> {

    constructor(options: SidebarPanelOptions) {
        super(options);
    }

    listen(): void {
        const { buttons } = this.options!;

        if (buttons && buttons.length) {
            for (const button of buttons) {
                button.listen();
            }
        }
    }

    protected onRender(): string {
        return '';
    }

};

export type SidebarPanelOptions = ComponentOptions & {
    buttons: SidebarPanelButton[] | null;
};
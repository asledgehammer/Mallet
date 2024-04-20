import { Component, ComponentOptions } from "./Component";
import { $get, html } from '../util';

export class SidebarPanelButton extends Component<SidebarPanelButtonOptions> {

    constructor(options: SidebarPanelButtonOptions) {
        super(options);
    }

    listen(): void {
        $get(this.id).on('click', () => {
            if (this.options && this.options.onclick) {
                this.options!.onclick();
            }
        });
    }

    protected onRender(): string {
        
        const { label } = this.options!;
        
        return html`
            <button class="btn btn-primary col-12 rounded-0">${label}</button>
        `;
    }

}

export type SidebarPanelButtonOptions = ComponentOptions & {
    onclick: (() => void) | null;
    label: string;
};
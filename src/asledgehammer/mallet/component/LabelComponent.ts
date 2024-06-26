import { html } from '../../rosetta/1.0/util';
import { Component, ComponentOptions } from './Component';

export class LabelComponent extends Component<LabelOptions> {
    constructor(options: LabelOptions) {
        super(options);
    }

    protected onRender(): string {
        return html``;
    }
}

export type LabelOptions = ComponentOptions & {
    description?: string;
    label?: string;
    placeholder?: string;
};

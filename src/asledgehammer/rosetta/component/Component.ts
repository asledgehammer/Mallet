import { css, html, randomString } from '../util';

export abstract class Component<O extends ComponentOptions> {
    readonly options?: O;

    readonly id: string;
    readonly classes: string[];
    readonly style: { [id: string]: any };
    readonly domType: string;

    constructor(options?: O) {
        this.options = options;

        /* (Parameter: string id) */
        if (this.options && this.options.id) {
            this.id = this.options.id;
        } else {
            this.id = `component-${randomString(8)}`;
        }

        /* (Parameter: string[] classes) */
        if (this.options && this.options.classes) {
            this.classes = this.options.classes;
        } else {
            this.classes = [];
        }

        /* (Parameter: {[id: string]: any} styles) */
        if (this.options && this.options.style) {
            this.style = this.options.style;
        } else {
            this.style = {};
        }

        /* (Parameter: string domType) */
        if (this.options && this.options.domType) {
            this.domType = this.options.domType;
        } else {
            this.domType = 'div';
        }
    }

    render(): string {
        const { id } = this;
        return html`<div id="${id}" ${this.buildClasses()} ${this.buildStyle()}>${this.onRender()}</div>`;
    }

    listen(): void {}

    protected buildClasses(): string {
        const { classes } = this;
        if (!classes.length) {
            return '';
        }

        return `class="${classes.join(' ')}"`;
    }

    protected buildStyle(): string {
        const keys = Object.keys(this.style);
        if (!keys.length) {
            return '';
        }

        let built = '';
        for (const key of keys) {
            built += `${key}: ${this.style[key]};`;
        }

        return `style="${built.trim()}"`;
    }

    protected abstract onRender(): string;
}

export type ComponentOptions = {
    id?: string;
    classes?: string[];
    style?: { [id: string]: any };
    domType?: string;
};

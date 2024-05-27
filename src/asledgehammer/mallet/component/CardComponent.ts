import { combine, html } from '../../rosetta/util';
import { Component, ComponentOptions } from './Component';

export class CardComponent<O extends CardOptions> extends Component<O> {
    constructor(options?: O) {
        super(combine<O>({ allowArrayDuplicates: false }, { classes: ['card', 'responsive-card', 'rounded-0', 'shadow-lg'] }, options));
    }

    protected onRender(): string {
        return html`${this.headerHTML()}${this.bodyHTML()}`;
    }

    headerHTML(): string {
        let htmlHeaderInner = this.onHeaderHTML();
        return htmlHeaderInner ? html`<div class="card-header">${htmlHeaderInner}</div>` : '';
    }

    onHeaderHTML(): string | undefined {
        return undefined;
    }

    bodyHTML(): string {
        let htmlBodyInner = this.onBodyHTML();
        return htmlBodyInner ? html`<div class="card-body">${htmlBodyInner}</div>` : '';
    }

    onBodyHTML(): string | undefined {
        return undefined;
    }

    footerHTML(): string {
        let htmlFooterInner = this.onFooterHTML();
        return htmlFooterInner ? html`<div class="card-footer">${htmlFooterInner}</div>` : '';
    }

    onFooterHTML(): string | undefined {
        return undefined;
    }
}

export type CardOptions = ComponentOptions & {};

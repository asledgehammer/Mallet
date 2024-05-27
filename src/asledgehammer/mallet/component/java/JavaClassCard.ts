import { App } from '../../../../app';
import { generateJavaClass } from '../../../rosetta/java/JavaGenerator';
import { RosettaJavaClass } from '../../../rosetta/java/RosettaJavaClass';
import { html } from '../../../rosetta/util';
import { CardOptions } from '../CardComponent';
import { JavaCard } from './JavaCard';

export class JavaClassCard extends JavaCard<JavaClassCardOptions> {

    onRenderPreview(): string {
        return generateJavaClass(this.options!.entity);
    }

    readonly idAuthors: string;
    readonly idNotes: string;
    readonly idPreview: string;
    readonly idInputExtends: string;

    constructor(app: App, options: JavaClassCardOptions) {
        super(app, options);

        this.idAuthors = `${this.id}-authors`;
        this.idNotes = `${this.id}-description`;
        this.idPreview = `${this.id}-preview`;
        this.idInputExtends = `${this.id}-input-extends`;
    }

    onHeaderHTML(): string | undefined {
        const { entity } = this.options!;
        return html` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow"><strong>Java Class</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${entity.name}</strong></h5> 
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {
        const { idInputExtends } = this;
        const entity = this.options!.entity!;
        const extendz = entity.extendz ? entity.extendz : '';
        return html`
            <div>
                ${this.renderNotes(this.idNotes)}
                <!-- Extends SuperClass -->
                <div class="mb-3" title="The super-class that the Java class extends.">
                    <label class="form-label" for="${idInputExtends}">Extends ${this.options!.entity.extendz}</label>
                </div>
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
    }

    listen(): void {
        super.listen();

        const { idNotes } = this;
        const { entity } = this.options!;

        this.listenNotes(entity, idNotes);
        this.listenPreview();
    }
}

export type JavaClassCardOptions = CardOptions & {
    entity: RosettaJavaClass;
};
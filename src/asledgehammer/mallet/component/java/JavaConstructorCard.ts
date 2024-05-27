import { App } from '../../../../app';
import { generateJavaConstructor } from '../../../rosetta/java/JavaGenerator';
import { RosettaJavaConstructor } from '../../../rosetta/java/RosettaJavaConstructor';
import { $get, html } from '../../../rosetta/util';
import { CardOptions } from '../CardComponent';
import { JavaCard } from './JavaCard';

export class JavaConstructorCard extends JavaCard<JavaConstructorCardOptions> {

    idNotes: string;
    idParamContainer: string;

    constructor(app: App, options: JavaConstructorCardOptions) {
        super(app, options);
        this.idNotes = `${this.id}-notes`;
        this.idParamContainer = `${this.id}-parameter-container`;
    }

    onRenderPreview(): string {
        if (!this.options) return '';
        const { entity } = this.options;
        const classEntity = this.app.catalog.selectedCard!.options!.entity;
        const className = classEntity.name;
        return generateJavaConstructor(className, [entity]);
    }

    onHeaderHTML(): string | undefined {
        const { entity } = this.options!;
        const classEntity = this.app.catalog.selectedCard!.options!.entity;
        const className = classEntity.name;

        let params = '';
        for (const param of entity.parameters) {
            params += `${param.name}, `;
        }
        if (params.length) params = params.substring(0, params.length - 2);
        let name = `${className}(${params})`;

        return html` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Java Constructor</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {
        const { idNotes, idParamContainer } = this;
        const { entity } = this.options!;
        return html`
            ${this.renderNotes(idNotes)}
            <hr>
            <div id="${idParamContainer}">
                ${this.renderParameters({ name: 'new', parameters: entity.parameters })}
            </div>
            <hr>
            ${this.renderPreview(false)}
        `;
    }

    listen(): void {
        super.listen();

        const { idNotes } = this;
        const { entity } = this.options!;
        this.listenNotes(entity, idNotes);
        this.listenParameters({ ...entity, name: 'new' }, 'constructor');
        this.listenPreview();
    }

    refreshParameters(): void {
        const { idParamContainer } = this;
        const { entity } = this.options!;
        const $paramContainer = $get(idParamContainer);
        $paramContainer.empty();
        $paramContainer.html(this.renderParameters({ name: 'new', parameters: entity.parameters }, true));
        this.listenParameters({ name: 'new', parameters: entity.parameters }, 'constructor');
    }
}

export type JavaConstructorCardOptions = CardOptions & {
    entity: RosettaJavaConstructor;
};
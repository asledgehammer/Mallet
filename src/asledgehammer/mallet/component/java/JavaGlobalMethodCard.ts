import { App } from '../../../../app';
import { generateGlobalJavaMethod, generateJavaMethod } from '../../../rosetta/1.0/java/JavaLuaGenerator2';
import { RosettaJavaMethod } from '../../../rosetta/1.0/java/RosettaJavaMethod';
import { javaMethodToTS } from '../../../rosetta/1.0/typescript/JavaTypeScriptGenerator';
import { $get, html } from '../../../rosetta/1.0/util';
import { CardOptions } from '../CardComponent';
import { CodeLanguage } from '../CodeLanguage';
import { JavaCard } from './JavaCard';

export class JavaGlobalMethodCard extends JavaCard<JavaGlobalMethodCardOptions> {

    idNotes: string;
    idReturnType: string;
    idReturnNotes: string;
    idBtnDelete: string;
    idBtnEdit: string;
    idParamContainer: string;

    constructor(app: App, options: JavaGlobalMethodCardOptions) {
        super(app, options);

        this.idNotes = `${this.id}-notes`;
        this.idReturnType = `${this.id}-return-type`;
        this.idReturnNotes = `${this.id}-return-notes`;
        this.idBtnDelete = `${this.id}-btn-delete`;
        this.idBtnEdit = `${this.id}-btn-edit`;
        this.idParamContainer = `${this.id}-parameter-container`;
    }

    onRenderPreview(language: CodeLanguage): string {
        if (!this.options) return '';
        switch (language) {
            case 'lua': {
                const { entity } = this.options;
                return generateGlobalJavaMethod(entity);
            }
            case 'typescript': {
                return javaMethodToTS(this.options!.entity, 0, 100);
            }
            case 'json': {
                return JSON.stringify(this.options!.entity.toJSON(), null, 2);
            }
        }
    }

    onHeaderHTML(): string | undefined {
        const { entity } = this.options!;

        let params = '';
        for (const param of entity.parameters) {
            params += `${param.name}, `;
        }
        if (params.length) params = params.substring(0, params.length - 2);

        let name = `_G.${entity.name}(${params})`;

        return html` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Global Java Method</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {

        const { idNotes, idParamContainer, idReturnType, idReturnNotes } = this;
        const { entity } = this.options!;

        return html`
            ${this.renderNotes(idNotes)}
            <hr>
            <div id="${idParamContainer}">
                ${this.renderParameters(entity)}
            </div>
            ${this.renderReturns(entity, idReturnType, idReturnNotes)}
            <hr>
            ${this.renderPreview(false)}
        `;
    }

    listen(): void {
        super.listen();

        const { app, idBtnDelete, idNotes, idReturnNotes } = this;
        const { entity } = this.options!;

        this.listenNotes(entity, idNotes);
        this.listenParameters(entity, 'global_method');
        this.listenReturns(entity, idReturnNotes);
        this.listenPreview();

        $get(idBtnDelete).on('click', () => {
            app.modalConfirm.show(() => {
                delete app.catalog.methods[entity.name];
                app.hideCard();
            }, `Delete Global Java Method ${entity.name}`);
        });
    }

    refreshParameters(): void {
        const { idParamContainer } = this;
        const { entity } = this.options!;
        const $paramContainer = $get(idParamContainer);
        $paramContainer.empty();
        $paramContainer.html(this.renderParameters(entity, true));
        this.listenParameters(entity, 'global_method');
    }
}

export type JavaGlobalMethodCardOptions = CardOptions & {
    entity: RosettaJavaMethod;
};

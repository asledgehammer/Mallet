import { App } from '../../../../app';
import { generateJavaField } from '../../../rosetta/java/JavaGenerator';
import { RosettaJavaClass } from '../../../rosetta/java/RosettaJavaClass';
import { RosettaJavaField } from '../../../rosetta/java/RosettaJavaField';
import { javaFieldToTS } from '../../../rosetta/typescript/JavaTypeScriptGenerator';
import { $get, html } from '../../../rosetta/util';
import { CardOptions } from '../CardComponent';
import { CodeLanguage } from '../CodeLanguage';
import { JavaCard } from './JavaCard';

export class JavaFieldCard extends JavaCard<JavaFieldCardOptions> {

    readonly idDefaultValue: string;
    readonly idNotes: string;
    readonly idType: string;
    readonly idBtnEdit: string;
    readonly idBtnDelete: string;

    constructor(app: App, options: JavaFieldCardOptions) {
        super(app, options);

        this.idDefaultValue = `${this.id}-default-value`;
        this.idNotes = `${this.id}-notes`;
        this.idType = `${this.id}-type`;
        this.idBtnEdit = `${this.id}-btn-edit`;
        this.idBtnDelete = `${this.id}-btn-delete`;
    }

    onRenderPreview(language: CodeLanguage): string {
        if (!this.options) return '';
        switch (language) {
            case 'lua': {
                const { entity } = this.options;
                return generateJavaField(entity);
            }
            case 'typescript': {
                return javaFieldToTS(this.options!.entity, 0, 100);
            }
            case 'json': {
                return JSON.stringify(this.options!.entity, null, 2);
            }
        }
    }

    onHeaderHTML(): string | undefined {
        const { idBtnEdit, idBtnDelete } = this;
        const { entity, isStatic } = this.options!;
        const javaClass = this.app.catalog.selectedCard?.options!.entity!;

        let name = `${javaClass.name}.${entity.name}`;
        if (isStatic) {
            name = html`<span class="fst-italic">${name}</span>`;
        }

        return html` 
            <div class="row">
            ${isStatic ?
                html`
                        <div class="col-auto ps-2 pe-0">
                            <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                                <strong>Static</strong>
                            </div>
                        </div>
                        `
                : ''
            }

                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Java Field</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {
        const { idNotes, idType } = this;
        const { entity } = this.options!;
        return html`
            <div>
                ${this.renderNotes(idNotes)}
                <hr>
                ${this.renderType(entity.name, entity.type.basic)}
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
    }

    listen(): void {
        super.listen();

        const { app, idBtnDelete, idBtnEdit, idNotes } = this;
        const { entity, isStatic } = this.options!;
        this.listenNotes(entity, idNotes);
        this.listenEdit(entity, idBtnEdit, isStatic ? 'edit_value' : 'edit_field', `Edit ${isStatic ? 'Value' : 'Field'} Name`);
        this.listenPreview();

        $get(idBtnDelete).on('click', () => {
            app.modalConfirm.show(() => {
                const clazz = app.catalog.selectedCard?.options!.entity! as RosettaJavaClass;
                delete clazz.fields[entity.name];
                app.showJavaClass(clazz);
                app.sidebar.itemTree.selectedID = undefined;
                app.sidebar.populateTrees();
            }, `Delete ${isStatic ? 'Value' : 'Field'} ${entity.name}`);
        })
    }
}

export type JavaFieldCardOptions = CardOptions & {
    entity: RosettaJavaField;
    isStatic: boolean;
};

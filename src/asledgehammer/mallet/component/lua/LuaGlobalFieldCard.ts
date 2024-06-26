import { App } from '../../../../app';
import { generateGlobalLuaField } from '../../../rosetta/1.0/lua/LuaLuaGenerator';
import { RosettaLuaField } from '../../../rosetta/1.0/lua/RosettaLuaField';
import { RosettaLuaTableField } from '../../../rosetta/1.0/lua/RosettaLuaTableField';
import { luaFieldToTS } from '../../../rosetta/1.0/typescript/LuaTypeScriptGenerator';
import { $get, html } from '../../../rosetta/1.0/util';
import { CardOptions } from '../CardComponent';
import { CodeLanguage } from '../CodeLanguage';
import { LuaCard } from './LuaCard';

export class LuaGlobalFieldCard extends LuaCard<LuaGlobalFieldCardOptions> {

    readonly idDefaultValue: string;
    readonly idNotes: string;
    readonly idType: string;
    readonly idBtnEdit: string;
    readonly idBtnDelete: string;

    constructor(app: App, options: LuaGlobalFieldCardOptions) {
        super(app, options);

        this.idDefaultValue = `${this.id}-default-value`;
        this.idNotes = `${this.id}-notes`;
        this.idType = `${this.id}-type`;
        this.idBtnEdit = `${this.id}-btn-edit`;
        this.idBtnDelete = `${this.id}-btn-delete`;
    }

    onRenderPreview(language: CodeLanguage): string {

        if (!this.options) return '';

        const { entity } = this.options;
        switch (language) {
            case 'lua': {
                return generateGlobalLuaField(entity);
            }
            case 'typescript': {
                return luaFieldToTS(entity, 0, 100);
            }
            case 'json': {
                return JSON.stringify(entity.toJSON(), null, 2);
            }
        }

    }

    onHeaderHTML(): string | undefined {
        const { idBtnEdit, idBtnDelete } = this;
        const { entity } = this.options!;

        let name = `_G.${entity.name}`;

        return html` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Global Lua Field</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
                <div style="position: absolute; top: 5px; width: 100%; height: 32px;">
                    <!-- Delete Button -->
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" title="Delete Global Lua Field">
                        <div class="btn-pane">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </button>
                    <!-- Edit Button -->
                    <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" title="Edit Name">
                        <div class="btn-pane">
                            <i class="fa-solid fa-pen"></i>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {
        const { idDefaultValue, idNotes, idType } = this;
        const { entity } = this.options!;
        return html`
            <div>
                ${this.renderNotes(idNotes)}
                ${this.renderDefaultValue(entity.defaultValue, idDefaultValue)}
                <hr>
                ${this.renderType(entity.name, entity.type, entity.nullable, idType)}
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
    }

    listen(): void {
        super.listen();

        const { app, idBtnDelete, idBtnEdit, idDefaultValue, idNotes, idType } = this;
        const { entity } = this.options!;
        this.listenNotes(entity, idNotes);
        this.listenDefaultValue(entity, idDefaultValue);
        this.listenType(entity, idType, idType);
        this.listenEdit(entity, idBtnEdit, 'edit_field', 'Edit Global Field Name', undefined, 'global_field');
        this.listenPreview();

        $get(idBtnDelete).on('click', () => {
            app.modalConfirm.show(() => {
                const entity = this.options!.entity!;
                delete app.catalog.fields[entity.name];
                app.hideCard();
            }, `Delete Global Lua Field ${entity.name}`);
        })
    }
}

export type LuaGlobalFieldCardOptions = CardOptions & {
    entity: RosettaLuaField | RosettaLuaTableField;
};

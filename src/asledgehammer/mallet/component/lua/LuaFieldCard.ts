import { App } from '../../../../app';
import { generateLuaField, generateLuaValue } from '../../../rosetta/lua/LuaLuaGenerator';
import { RosettaLuaClass } from '../../../rosetta/lua/RosettaLuaClass';
import { RosettaLuaField } from '../../../rosetta/lua/RosettaLuaField';
import { RosettaLuaTable } from '../../../rosetta/lua/RosettaLuaTable';
import { RosettaLuaTableField } from '../../../rosetta/lua/RosettaLuaTableField';
import { luaFieldToTS } from '../../../rosetta/typescript/LuaTypeScriptGenerator';
import { $get, html } from '../../../rosetta/util';
import { CardOptions } from '../CardComponent';
import { CodeLanguage } from '../CodeLanguage';
import { LuaCard } from './LuaCard';

export class LuaFieldCard extends LuaCard<LuaFieldCardOptions> {

    readonly idDefaultValue: string;
    readonly idNotes: string;
    readonly idType: string;
    readonly idBtnEdit: string;
    readonly idBtnDelete: string;

    constructor(app: App, options: LuaFieldCardOptions) {
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
                const { app } = this;
                const { entity, isStatic } = this.options;
                const { defaultValue } = entity;
                const name = app.catalog.selectedCard?.options?.entity.name!;

                if (isStatic) {
                    return `${generateLuaField(entity)}\n\n${generateLuaValue(name, entity)}`;
                }
                let s = generateLuaField(entity);
                if (defaultValue) {
                    s += `\n\n--- (Example of initialization of field) ---\nself.${entity.name} = ${defaultValue};`;
                }
                return s;
            }
            case 'typescript': {
                return luaFieldToTS(this.options!.entity, 0, 100);
            }
            case 'json': {
                return JSON.stringify(this.options!.entity.toJSON(), null, 2);
            }
        }

    }

    onHeaderHTML(): string | undefined {
        const { idBtnEdit, idBtnDelete } = this;
        const { entity, isStatic } = this.options!;
        const luaClass = this.app.catalog.selectedCard?.options!.entity!;

        let name = `${luaClass.name}.${entity.name}`;
        if (isStatic) {
            name = html`<span class="fst-italic">${name}</span>`;
        }

        return html` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Lua ${isStatic ? 'Property' : 'Field'}</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
                <div style="position: absolute; top: 5px; width: 100%; height: 32px;">
                    <!-- Delete Button -->
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" title="Delete ${isStatic ? 'Value' : 'Field'}">
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
        const { entity, isStatic } = this.options!;
        this.listenNotes(entity, idNotes);
        this.listenDefaultValue(entity, idDefaultValue);
        this.listenType(entity, idType, idType);
        this.listenEdit(entity, idBtnEdit, isStatic ? 'edit_value' : 'edit_field', `Edit ${isStatic ? 'Value' : 'Field'} Name`);
        this.listenPreview();

        $get(idBtnDelete).on('click', () => {
            app.modalConfirm.show(() => {
                const entity = this.options!.entity!;
                if (entity instanceof RosettaLuaField) {
                    const clazz = app.catalog.selected as RosettaLuaClass;
                    if (isStatic) {
                        delete clazz.values[entity.name];
                    } else {
                        delete clazz.fields[entity.name];
                    }
                    app.sidebar.itemTree.selectedID = undefined;
                    app.showLuaClass(clazz);
                } else if (entity instanceof RosettaLuaTableField) {
                    const table = app.catalog.selected as RosettaLuaTable;
                    delete table.fields[entity.name];
                    app.sidebar.itemTree.selectedID = undefined;
                    app.showLuaTable(table);
                }
            }, `Delete Field ${entity.name}`);
        })
    }
}

export type LuaFieldCardOptions = CardOptions & {
    entity: RosettaLuaField | RosettaLuaTableField;
    isStatic: boolean;
};

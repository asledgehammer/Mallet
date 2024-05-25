import { App } from '../../../../app';
import { generateLuaField, generateLuaValue } from '../../lua/LuaGenerator';
import { RosettaLuaField } from '../../lua/RosettaLuaField';
import { $get, html } from '../../util';
import { CardOptions } from '../CardComponent';
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

    onRenderPreview(): string {

        if (!this.options) return '';

        const { app } = this;
        const { entity, isStatic } = this.options;
        const { defaultValue } = entity;
        const name = app.active.selectedCard?.options?.entity.name!;

        if (isStatic) {
            return `${generateLuaField(entity)}\n\n${generateLuaValue(name, entity)}`;
        }
        let s = generateLuaField(entity);
        if (defaultValue) {
            s += `\n\n--- (Example of initialization of field) ---\nself.${entity.name} = ${defaultValue};`;
        }
        return s;
    }

    onHeaderHTML(): string | undefined {
        const { idBtnEdit, idBtnDelete } = this;
        const { entity, isStatic } = this.options!;
        const luaClass = this.app.active.selectedCard?.options!.entity!;

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
                ${this.renderType(entity.name, entity.type, idType)}
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
            app.askConfirm(() => {
                const clazz = app.active.selectedCard?.options!.entity!;
                if (isStatic) {
                    delete clazz.values[entity.name];
                } else {
                    delete clazz.fields[entity.name];
                }
                app.showClass(clazz);
                app.sidebar.selectedItemID = undefined;
                app.sidebar.populateTrees();
            }, `Delete ${isStatic ? 'Value' : 'Field'} ${entity.name}`);
        })
    }
}

export type LuaFieldCardOptions = CardOptions & {
    entity: RosettaLuaField;
    isStatic: boolean;
};

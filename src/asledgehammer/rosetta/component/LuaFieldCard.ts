import { App } from '../../../app';
import { generateLuaField, generateLuaValue } from '../lua/LuaGenerator';
import { RosettaLuaField } from '../lua/RosettaLuaField';
import { html } from '../util';
import { CardOptions } from './CardComponent';
import { LuaCard } from './LuaCard';

export class LuaFieldCard extends LuaCard<LuaFieldCardOptions> {

    readonly idDefaultValue: string;
    readonly idNotes: string;
    readonly idType: string;

    constructor(app: App, options: LuaFieldCardOptions) {
        super(app, options);

        this.idDefaultValue = `${this.id}-default-value`;
        this.idNotes = `${this.id}-notes`;
        this.idType = `${this.id}-type`;
    }

    onRenderPreview(): string {

        if (!this.options) return '';

        const { app } = this;
        const { entity, isStatic } = this.options;
        const { defaultValue } = entity;
        const name = app.card?.options?.entity.name!;

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
        const { entity, isStatic } = this.options!;

        let name = entity.name;
        if (isStatic) {
            name = html`<span class="fst-italic">${entity.name}</span>`;
        }

        return html` 
            <div class="row">
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-info px-2"><strong>Lua ${isStatic ? 'Property' : 'Field'}</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {

        const { idDefaultValue, idNotes, idType } = this;
        const { entity } = this.options!;

        return html`
            <div>
                ${this.renderNotes(entity.notes, idNotes)}
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

        const { idDefaultValue, idNotes, idType } = this;
        const { entity } = this.options!;

        this.listenNotes(entity, idNotes);
        this.listenDefaultValue(entity, idDefaultValue);
        this.listenType(entity, idType, idType);
    }
}

export type LuaFieldCardOptions = CardOptions & {
    entity: RosettaLuaField;
    isStatic: boolean;
};

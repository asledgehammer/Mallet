import { App } from '../../../../app';
import { generateLuaConstructor } from '../../../rosetta/1.0/lua/LuaLuaGenerator';
import { RosettaLuaConstructor } from '../../../rosetta/1.0/lua/RosettaLuaConstructor';
import { luaConstructorToTS } from '../../../rosetta/1.0/typescript/LuaTypeScriptGenerator';
import { $get, html } from '../../../rosetta/1.0/util';
import { CardOptions } from '../CardComponent';
import { CodeLanguage } from '../CodeLanguage';
import { LuaCard } from './LuaCard';

export class LuaConstructorCard extends LuaCard<LuaConstructorCardOptions> {

    idNotes: string;
    idParamContainer: string;

    constructor(app: App, options: LuaConstructorCardOptions) {
        super(app, options);
        this.idNotes = `${this.id}-notes`;
        this.idParamContainer = `${this.id}-parameter-container`;
    }

    onRenderPreview(language: CodeLanguage): string {
        if (!this.options) return '';
        switch (language) {
            case 'lua': {
                const { entity } = this.options;
                const classEntity = this.app.catalog.selectedCard!.options!.entity;
                return generateLuaConstructor(classEntity.name, entity);
            }
            case 'typescript': {
                return luaConstructorToTS(this.options!.entity, 0, 100);
            }
            case 'json': {
                return JSON.stringify(this.options!.entity.toJSON(), null, 2);
            }
        }
    }

    onHeaderHTML(): string | undefined {
        const classEntity = this.app.catalog.selectedCard!.options!.entity;
        const className = classEntity.name;
        const name = `${className}:new( )`;
        return html` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Lua Constructor</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
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

export type LuaConstructorCardOptions = CardOptions & {
    entity: RosettaLuaConstructor;
};

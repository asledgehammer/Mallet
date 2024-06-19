import { App } from '../../../../app';
import { generateLuaTable } from '../../../rosetta/lua/LuaLuaGenerator';
import { RosettaLuaTable } from '../../../rosetta/lua/RosettaLuaTable';
import { luaTableToTS } from '../../../rosetta/typescript/LuaTypeScriptGenerator';
import { $get, html } from '../../../rosetta/util';
import { CardOptions } from '../CardComponent';
import { CodeLanguage } from '../CodeLanguage';
import { LuaCard } from './LuaCard';

export class LuaTableCard extends LuaCard<LuaTableCardOptions> {

    onRenderPreview(language: CodeLanguage): string {
        if (!this.options) return '';
        switch (language) {
            case 'typescript':
                return luaTableToTS(this.options!.entity, true);
            case 'lua':
                return '--- @meta\n\n' + generateLuaTable(this.options!.entity);
            case 'json':
                return JSON.stringify(this.options!.entity.toJSON(), null, 2);
        }
    }

    readonly idAuthors: string;
    readonly idNotes: string;
    readonly idPreview: string;
    readonly idBtnEdit: string;
    readonly idCheckMutable: string;

    constructor(app: App, options: LuaTableCardOptions) {
        super(app, options);

        this.idAuthors = `${this.id}-authors`;
        this.idNotes = `${this.id}-description`;
        this.idPreview = `${this.id}-preview`;
        this.idBtnEdit = `${this.id}-edit`;
        this.idCheckMutable = `${this.id}-check-mutable`;
    }

    onHeaderHTML(): string | undefined {
        const { idBtnEdit } = this;
        const { entity } = this.options!;
        return html` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow"><strong>Lua Table</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${entity.name}</strong></h5> 
                </div>
                ${this.renderEdit(idBtnEdit)}
            </div>
        `;
    }

    onBodyHTML(): string | undefined {
        const { idCheckMutable } = this;
        const entity = this.options!.entity!;
        return html`
            <div>
                ${this.renderNotes(this.idNotes)}
                <!-- Mutable Flag -->
                <div class="mb-3 form-check" title="Allows Lua to add custom properties to the class.">
                    <input id="${idCheckMutable}" type="checkbox" class="form-check-input" id="exampleCheck1"${entity.mutable ? ' checked' : ''}>
                    <label class="form-check-label" for="${idCheckMutable}">Mutable</label>
                </div>
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
    }

    listen(): void {
        super.listen();

        const { idCheckMutable, idBtnEdit, idNotes } = this;
        const { entity } = this.options!;
        const _this = this;

        this.listenEdit(entity, idBtnEdit, 'edit_lua_table', 'Edit Lua Table', undefined, 'table');
        this.listenNotes(entity, idNotes);
        this.listenPreview();
        const $checkMutable = $get(idCheckMutable);
        $checkMutable.on('change', function () {
            entity.mutable = this.checked;
            _this.update();
            _this.app.renderCode();
        });
    }
}

export type LuaTableCardOptions = CardOptions & {
    entity: RosettaLuaTable;
};

import { App } from '../../../../app';
import { generateLuaClass } from '../../../rosetta/lua/LuaLuaGenerator';
import { RosettaLuaClass } from '../../../rosetta/lua/RosettaLuaClass';
import { luaClassToTS } from '../../../rosetta/typescript/LuaTypeScriptGenerator';
import { $get, html } from '../../../rosetta/util';
import { CardOptions } from '../CardComponent';
import { CodeLanguage } from '../CodeLanguage';
import { LuaCard } from './LuaCard';

export class LuaClassCard extends LuaCard<LuaClassCardOptions> {

    onRenderPreview(language: CodeLanguage): string {
        if (!this.options) return '';
        switch (language) {
            case 'typescript':
                return luaClassToTS(this.options!.entity, true);
            case 'lua':
                return '--- @meta\n\n' + generateLuaClass(this.options!.entity);
            case 'json':
                return JSON.stringify(this.options!.entity.toJSON(), null, 2);
        }
    }

    readonly idAuthors: string;
    readonly idNotes: string;
    readonly idPreview: string;
    readonly idBtnEdit: string;
    readonly idCheckMutable: string;
    readonly idInputExtends: string;

    constructor(app: App, options: LuaClassCardOptions) {
        super(app, options);

        this.idAuthors = `${this.id}-authors`;
        this.idNotes = `${this.id}-description`;
        this.idPreview = `${this.id}-preview`;
        this.idBtnEdit = `${this.id}-edit`;
        this.idCheckMutable = `${this.id}-check-mutable`;
        this.idInputExtends = `${this.id}-input-extends`;
    }

    onHeaderHTML(): string | undefined {
        const { idBtnEdit } = this;
        const { entity } = this.options!;
        return html` 
            <div class="row">
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow"><strong>Lua Class</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${entity.name}</strong></h5> 
                </div>
                ${this.renderEdit(idBtnEdit)}
            </div>
        `;
    }

    onBodyHTML(): string | undefined {
        const { idCheckMutable, idInputExtends } = this;
        const entity = this.options!.entity!;
        const extendz = entity.extendz ? entity.extendz : '';
        return html`
            <div>
                ${this.renderNotes(this.idNotes)}
                <!-- Extends SuperClass -->
                <div class="mb-3" title="The super-class that the Lua class extends.">
                    <label class="form-label" for="${idInputExtends}">Extends</label>
                    <input id="${idInputExtends}" class="form-control responsive-input mt-2" type="text" style="" value="${extendz}" />
                </div>
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

        const { idInputExtends, idCheckMutable, idBtnEdit, idNotes } = this;
        const { entity } = this.options!;
        const _this = this;

        this.listenEdit(entity, idBtnEdit, 'edit_lua_class', 'Edit Lua Class', undefined, 'class');
        this.listenNotes(entity, idNotes);
        this.listenPreview();
        const $checkMutable = $get(idCheckMutable);
        $checkMutable.on('change', function () {
            entity.mutable = this.checked;
            _this.update();
            _this.app.renderCode();
        });

        const $inputExtends = $get(idInputExtends);
        $inputExtends.on('input', function () {
            entity.extendz = this.value;
            _this.update();
            _this.app.renderCode();
        });
    }
}

export type LuaClassCardOptions = CardOptions & {
    entity: RosettaLuaClass;
};

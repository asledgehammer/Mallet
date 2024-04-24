import { App } from '../../../app';
import { generateLuaClass } from '../lua/LuaGenerator';
import { RosettaLuaClass } from '../lua/RosettaLuaClass';
import { $get, html } from '../util';
import { CardOptions } from './CardComponent';
import { LuaCard } from './LuaCard';

export class LuaClassCard extends LuaCard<LuaClassCardOptions> {

    onRenderPreview(): string {
        return generateLuaClass(this.options!.entity);
    }

    readonly idAuthors: string;
    readonly idNotes: string;
    readonly idPreview: string;
    readonly idBtnEdit: string;
    readonly idCheckMutable: string;

    constructor(app: App, options: LuaClassCardOptions) {
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
        const { idCheckMutable } = this;
        return html`
            <div>
                ${this.renderNotes(this.idNotes)}
                <div class="mb-3 form-check" title="Allows Lua to add custom properties to the class.">
                    <input id="${idCheckMutable}" type="checkbox" class="form-check-input" id="exampleCheck1">
                    <label class="form-check-label" for="exampleCheck1">Mutable</label>
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

        this.listenEdit(entity, idBtnEdit, 'edit_class', 'Edit Lua Class');
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

export type LuaClassCardOptions = CardOptions & {
    entity: RosettaLuaClass;
};

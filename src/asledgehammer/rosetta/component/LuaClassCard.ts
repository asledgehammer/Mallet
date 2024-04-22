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

    constructor(app: App, options: LuaClassCardOptions) {
        super(app, options);

        this.idAuthors = `${this.id}-authors`;
        this.idNotes = `${this.id}-description`;
        this.idPreview = `${this.id}-preview`;
        this.idBtnEdit = `${this.id}-edit`;
    }

    onHeaderHTML(): string | undefined {
        const { entity } = this.options!;
        return html` 
            <div class="row">
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2"><strong>Lua Class</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${entity.name}</strong></h5> 
                </div>
                <div style="position: absolute; padding: 0; right: 0; top: 0">
                    <button id="${this.idBtnEdit}" class="btn btn-sm btn-primary float-end" style="position: relative; top: 5px; right: 5px;">Edit</button>
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {
        const { notes } = this.options!.entity;
        return html`
            <div>
                ${this.renderNotes(notes, this.idNotes)}
                <hr>
                ${this.renderPreview(false)}
            </div>
        `;
    }

    listen(): void {
        super.listen();

        const { idBtnEdit, idNotes } = this;
        const { entity } = this.options!;

        this.listenNotes(entity, idNotes);

        $get(idBtnEdit).on('click', () => {

            const { modalName, $btnName, $titleName, $inputName } = this.app.sidebar.itemTree;

            $titleName.html('Edit Lua Class');
            $btnName.html('Edit');
            $btnName.removeClass('btn-success');
            $btnName.addClass('btn-primary');
            $inputName.val(entity.name);
            this.app.sidebar.itemTree.nameMode = 'edit_class';
            modalName.show();
        });
    }
}

export type LuaClassCardOptions = CardOptions & {
    entity: RosettaLuaClass;
};

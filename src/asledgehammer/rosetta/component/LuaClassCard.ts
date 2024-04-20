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

    constructor(app: App, options: LuaClassCardOptions) {
        super(app, options);

        this.idAuthors = `${this.id}-authors`;
        this.idNotes = `${this.id}-description`;
        this.idPreview = `${this.id}-preview`;
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
            </div>
        `;
    }

    onBodyHTML(): string | undefined {
        const { notes } = this.options!.entity;
        return html`
            <div>
                ${this.renderNotes(notes, this.idNotes)}
                ${this.renderPreview(false)}
            </div>
        `;
    }

    listen(): void {
        super.listen();

        const { idNotes } = this;
        const { entity } = this.options!;

        this.listenNotes(entity, idNotes);
    }
}

export type LuaClassCardOptions = CardOptions & {
    entity: RosettaLuaClass;
};

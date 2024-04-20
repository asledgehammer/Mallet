import { App } from '../../../app';
import { generateLuaMethod } from '../lua/LuaGenerator';
import { RosettaLuaFunction } from '../lua/RosettaLuaFunction';
import { $get, html } from '../util';
import { CardOptions } from './CardComponent';
import { LuaCard } from './LuaCard';

export class LuaFunctionCard extends LuaCard<LuaFunctionCardOptions> {

    idNotes: string;
    idReturnType: string;
    idReturnNotes: string;

    constructor(app: App, options: LuaFunctionCardOptions) {
        super(app, options);

        this.idNotes = `${this.id}-notes`;
        this.idReturnType = `${this.id}-return-type`;
        this.idReturnNotes = `${this.id}-return-notes`;
    }

    onRenderPreview(): string {
        return generateLuaMethod(this.app.card!.options!.entity, this.options!.entity);
    }

    onHeaderHTML(): string | undefined {
        const { entity, isStatic } = this.options!;
        return html` 
            <div class="row">
                <div class="col-auto ps-2 pe-2">
                    <div class="responsive-badge px-2"><strong>Lua Method</strong></div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${entity.name}</strong></h5> 
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {

        const { idNotes, idReturnType, idReturnNotes } = this;
        const { entity } = this.options!;

        return html`
            ${this.renderNotes(entity.notes, idNotes)}
            
                ${this.renderParameters(entity)}
                ${this.renderReturns(entity, idReturnType, idReturnNotes)}
                ${this.renderPreview(false)}
            
        `;
    }

    listen(): void {
        super.listen();

        const { idNotes, idReturnType, idReturnNotes } = this;
        const { entity } = this.options!;

        this.listenNotes(entity, idNotes);
        this.listenParameters(entity);
        this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);
    }
}

export type LuaFunctionCardOptions = CardOptions & {
    entity: RosettaLuaFunction;
    isStatic: boolean;
};

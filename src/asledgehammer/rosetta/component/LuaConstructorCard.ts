import { App } from '../../../app';
import { generateLuaConstructor, generateLuaMethod } from '../lua/LuaGenerator';
import { RosettaLuaConstructor } from '../lua/RosettaLuaConstructor';
import { html } from '../util';
import { CardOptions } from './CardComponent';
import { LuaCard } from './LuaCard';

export class LuaConstructorCard extends LuaCard<LuaConstructorCardOptions> {

    idNotes: string;

    constructor(app: App, options: LuaConstructorCardOptions) {
        super(app, options);

        this.idNotes = `${this.id}-notes`;
    }

    onRenderPreview(): string {

        if (!this.options) return '';

        const { entity } = this.options;
        const classEntity = this.app.card!.options!.entity;
        const className = classEntity.name;

        return generateLuaConstructor(className, entity);
    }

    onHeaderHTML(): string | undefined {
        const classEntity = this.app.card!.options!.entity;
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

        const { idNotes } = this;
        const { entity } = this.options!;

        return html`
            ${this.renderNotes(idNotes)}
            <hr>
            ${this.renderParameters({ name: 'new', parameters: entity.parameters })}
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
    }
}

export type LuaConstructorCardOptions = CardOptions & {
    entity: RosettaLuaConstructor;
};

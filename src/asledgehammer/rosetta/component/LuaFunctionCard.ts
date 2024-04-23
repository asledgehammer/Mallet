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
    idBtnDelete: string;
    idBtnEdit: string;

    constructor(app: App, options: LuaFunctionCardOptions) {
        super(app, options);

        this.idNotes = `${this.id}-notes`;
        this.idReturnType = `${this.id}-return-type`;
        this.idReturnNotes = `${this.id}-return-notes`;
        this.idBtnDelete = `${this.id}-btn-delete`;
        this.idBtnEdit = `${this.id}-btn-edit`;
    }

    onRenderPreview(): string {

        if (!this.options) return '';

        const { entity } = this.options;
        const classEntity = this.app.card!.options!.entity;
        const className = classEntity.name;

        return generateLuaMethod(className, entity);
    }

    onHeaderHTML(): string | undefined {
        const { idBtnDelete, idBtnEdit } = this;
        const { entity, isStatic } = this.options!;
        const classEntity = this.app.card!.options!.entity;
        const className = classEntity.name;

        let name = `${className}${isStatic ? '.' : ':'}${entity.name}( )`;
        if (isStatic) {
            name = html`<span class="fst-italic">${name}</span>`;
        }

        return html` 
            <div class="row">

                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Lua ${isStatic ? 'Function' : 'Method'}</strong>
                    </div>
                </div>
                
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
                <div style="position: absolute; top: 5px; width: 100%; height: 32px;">
                    <!-- Delete Button -->
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-icon-btn text-danger float-end ms-1">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <!-- Edit Button -->
                    <button id="${idBtnEdit}" class="btn btn-sm responsive-icon-btn float-end">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {

        const { idNotes, idReturnType, idReturnNotes } = this;
        const { entity } = this.options!;

        return html`
            ${this.renderNotes(entity.notes, idNotes)}
            <hr>
            ${this.renderParameters(entity)}
            ${this.renderReturns(entity, idReturnType, idReturnNotes)}
            <hr>
            ${this.renderPreview(false)}
        `;
    }

    listen(): void {
        super.listen();

        const { app, idBtnDelete, idBtnEdit, idNotes, idReturnType, idReturnNotes } = this;
        const { entity, isStatic } = this.options!;

        this.listenEdit(entity, idBtnEdit, isStatic ? 'edit_function' : 'edit_method', `Edit Lua ${isStatic ? 'Function' : 'Method'}`);
        this.listenNotes(entity, idNotes);
        this.listenParameters(entity, isStatic ? 'function' : 'method');
        this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);

        $get(idBtnDelete).on('click', () => {
            app.sidebar.itemTree.askConfirm(`Delete ${isStatic ? 'Function' : 'Method'} ${entity.name}`, () => {
                const clazz = app.card?.options!.entity!;
                if (isStatic) {
                    delete clazz.functions[entity.name];
                } else {
                    delete clazz.methods[entity.name];
                }
                app.showClass(clazz);
                app.sidebar.itemTree.populate();
            });
        })

    }
}

export type LuaFunctionCardOptions = CardOptions & {
    entity: RosettaLuaFunction;
    isStatic: boolean;
};

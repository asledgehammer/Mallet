import { App } from '../../../../app';
import { generateLuaMethod } from '../../lua/LuaGenerator';
import { RosettaLuaClass } from '../../lua/RosettaLuaClass';
import { RosettaLuaFunction } from '../../lua/RosettaLuaFunction';
import { $get, html } from '../../util';
import { CardOptions } from '../CardComponent';
import { LuaCard } from './LuaCard';

export class LuaFunctionCard extends LuaCard<LuaFunctionCardOptions> {

    idNotes: string;
    idReturnType: string;
    idReturnNotes: string;
    idBtnDelete: string;
    idBtnEdit: string;
    idParamContainer: string;

    constructor(app: App, options: LuaFunctionCardOptions) {
        super(app, options);

        this.idNotes = `${this.id}-notes`;
        this.idReturnType = `${this.id}-return-type`;
        this.idReturnNotes = `${this.id}-return-notes`;
        this.idBtnDelete = `${this.id}-btn-delete`;
        this.idBtnEdit = `${this.id}-btn-edit`;
        this.idParamContainer = `${this.id}-parameter-container`;
    }

    onRenderPreview(): string {

        if (!this.options) return '';

        const { entity } = this.options;
        const classEntity = this.app.active.selectedCard!.options!.entity;
        const className = classEntity.name;

        return generateLuaMethod(className, entity);
    }

    onHeaderHTML(): string | undefined {
        const { idBtnDelete, idBtnEdit } = this;
        const { entity, isStatic } = this.options!;
        const classEntity = this.app.active.selectedCard!.options!.entity;
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
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" title="Delete ${isStatic ? 'Function' : 'Method'}">
                        <div class="btn-pane">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </button>
                    <!-- Edit Button -->
                    <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" title="Edit Name">
                        <div class="btn-pane">
                            <i class="fa-solid fa-pen"></i>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {

        const { idNotes, idParamContainer, idReturnType, idReturnNotes } = this;
        const { entity } = this.options!;

        return html`
            ${this.renderNotes(idNotes)}
            <hr>
            <div id="${idParamContainer}">
                ${this.renderParameters(entity)}
            </div>
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
        this.listenPreview();

        $get(idBtnDelete).on('click', () => {
            app.askConfirm(() => {
                const clazz = app.active.selectedCard?.options!.entity! as RosettaLuaClass;
                if (isStatic) {
                    delete clazz.functions[entity.name];
                } else {
                    delete clazz.methods[entity.name];
                }
                app.showLuaClass(clazz);
                app.sidebar.itemTree.selectedID = undefined;
                app.sidebar.populateTrees();
            }, `Delete ${isStatic ? 'Function' : 'Method'} ${entity.name}`);
        });
    }

    refreshParameters(): void {
        const { idParamContainer } = this;
        const { entity, isStatic } = this.options!;
        const $paramContainer = $get(idParamContainer);
        $paramContainer.empty();
        $paramContainer.html(this.renderParameters(entity, true));
        this.listenParameters(entity, isStatic ? 'function' : 'method');
    }
}

export type LuaFunctionCardOptions = CardOptions & {
    entity: RosettaLuaFunction;
    isStatic: boolean;
};

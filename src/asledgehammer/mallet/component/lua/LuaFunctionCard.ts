import { App } from '../../../../app';
import { generateLuaFunction } from '../../../rosetta/lua/LuaLuaGenerator';
import { RosettaLuaClass } from '../../../rosetta/lua/RosettaLuaClass';
import { RosettaLuaFunction } from '../../../rosetta/lua/RosettaLuaFunction';
import { RosettaLuaTable } from '../../../rosetta/lua/RosettaLuaTable';
import { luaFunctionToTS } from '../../../rosetta/typescript/LuaTypeScriptGenerator';
import { $get, html } from '../../../rosetta/util';
import { CardOptions } from '../CardComponent';
import { CodeLanguage } from '../CodeLanguage';
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

    onRenderPreview(language: CodeLanguage): string {
        if (!this.options) return '';
        switch (language) {
            case 'lua': {
                const { entity } = this.options;
                
                const classEntity = this.app.catalog.selectedCard!.options!.entity;
                const className = classEntity.name;
                return generateLuaFunction(className, ':', entity);
            }
            case 'typescript': {
                return luaFunctionToTS(this.options!.entity, 0, 100);
            }
            case 'json': {
                return JSON.stringify(this.options!.entity.toJSON(), null, 2);
            }
        }
    }

    onHeaderHTML(): string | undefined {
        const { idBtnDelete, idBtnEdit } = this;
        const { entity, isStatic } = this.options!;
        const classEntity = this.app.catalog.selectedCard!.options!.entity;
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

        this.listenEdit(entity, idBtnEdit, isStatic ? 'edit_function' : 'edit_method', `Edit Lua ${isStatic ? 'Function' : 'Method'}`, undefined, 'function');
        this.listenNotes(entity, idNotes);
        this.listenParameters(entity, isStatic ? 'function' : 'method');
        this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);
        this.listenPreview();

        $get(idBtnDelete).on('click', () => {
            app.modalConfirm.show(() => {
                const entity = this.options!.entity!;

                // Global function.
                if(app.sidebar.objTree.globalSelected) {
                    delete app.catalog.functions[entity.name];
                    app.hideCard();
                    return;
                }

                const selected = this.app.catalog.selected;
                if (selected instanceof RosettaLuaClass) {
                    if (isStatic) {
                        delete selected.functions[entity.name];
                    } else {
                        delete selected.methods[entity.name];
                    }
                    app.sidebar.itemTree.selectedID = undefined;
                    app.showLuaClass(selected);
                } else if (selected instanceof RosettaLuaTable) {
                    delete selected.functions[entity.name];
                    app.sidebar.itemTree.selectedID = undefined;
                    app.showLuaTable(selected);
                }

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

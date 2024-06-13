import { App } from '../../../../app';
import { generateGlobalLuaFunction } from '../../../rosetta/lua/LuaLuaGenerator';
import { RosettaLuaFunction } from '../../../rosetta/lua/RosettaLuaFunction';
import { luaFunctionToTS } from '../../../rosetta/typescript/LuaTypeScriptGenerator';
import { $get, html } from '../../../rosetta/util';
import { CodeLanguage } from '../CodeLanguage';
import { LuaCard } from './LuaCard';

export class LuaGlobalFunctionCard extends LuaCard<LuaGlobalFunctionCardOptions> {

    idNotes: string;
    idReturnType: string;
    idReturnNotes: string;
    idBtnDelete: string;
    idBtnEdit: string;
    idParamContainer: string;

    constructor(app: App, options: LuaGlobalFunctionCardOptions) {
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
                return generateGlobalLuaFunction(entity);
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
        const { entity } = this.options!;

        let name = `_G.${entity.name}( )`;

        return html` 
            <div class="row">

                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Global Lua Function</strong>
                    </div>
                </div>
                
                <div class="col-auto p-0">
                    <h5 class="card-text"><strong>${name}</strong></h5> 
                </div>
                <div style="position: absolute; top: 5px; width: 100%; height: 32px;">
                    <!-- Delete Button -->
                    <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" title="Delete Function">
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
        const { entity } = this.options!;

        this.listenEdit(entity, idBtnEdit, 'edit_function', `Edit Global Lua Function`);
        this.listenNotes(entity, idNotes);
        this.listenParameters(entity, 'function');
        this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);
        this.listenPreview();

        $get(idBtnDelete).on('click', () => {
            app.modalConfirm.show(() => {
                const entity = this.options!.entity!;
                delete app.catalog.functions[entity.name];
                app.hideCard();
                return;
            }, `Delete Global Lua Function ${entity.name}`);
        });
    }

    refreshParameters(): void {
        const { idParamContainer } = this;
        const { entity } = this.options!;
        const $paramContainer = $get(idParamContainer);
        $paramContainer.empty();
        $paramContainer.html(this.renderParameters(entity, true));
        this.listenParameters(entity, 'function');
    }
}

export type LuaGlobalFunctionCardOptions = {
    entity: RosettaLuaFunction;
};

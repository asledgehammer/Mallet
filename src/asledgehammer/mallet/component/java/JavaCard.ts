import hljs = require('highlight.js');
import { App } from "../../../../app";
import { CardComponent } from "../CardComponent";
import { ComponentOptions } from "../Component";
import { NameModeType } from "../NameModeType";
import { createDeltaEditor } from "../../../Delta";
import { $get, html } from '../../../rosetta/1.0/util';
import { RosettaJavaParameter } from '../../../rosetta/1.0/java/RosettaJavaParameter';
import { RosettaJavaReturns } from '../../../rosetta/1.0/java/RosettaJavaReturns';
import { RosettaEntity } from '../../../rosetta/1.0/RosettaEntity';
import { RosettaJavaMethod } from '../../../rosetta/1.0/java/RosettaJavaMethod';
import { RosettaJavaConstructor } from '../../../rosetta/1.0/java/RosettaJavaConstructor';
import { CodeLanguage } from '../CodeLanguage';
import { RosettaJavaType } from '../../../rosetta/1.0/java/RosettaJavaType';

export abstract class JavaCard<O extends JavaCardOptions> extends CardComponent<O> {

    readonly app: App;
    readonly idPreview: string;
    readonly idPreviewCode: string;
    readonly idBtnPreviewCopy: string;
    readonly idBtnLanguageLua: string;
    readonly idBtnLanguageTypeScript: string;
    readonly idBtnLanguageJSON: string;
    languageMode: CodeLanguage = 'lua';

    constructor(app: App, options: O) {
        super(options);
        this.app = app;
        this.idPreview = `${this.id}-preview`;
        this.idPreviewCode = `${this.id}-preview-code`;
        this.idBtnPreviewCopy = `${this.id}-preview-copy-btn`;
        this.idBtnLanguageLua = `${this.id}-btn-language-lua`;
        this.idBtnLanguageTypeScript = `${this.id}-btn-language-typescript`;
        this.idBtnLanguageJSON = `${this.id}-btn-language-json`;
    }

    listenEdit(entity: { name: string }, idBtnEdit: string, mode: NameModeType, title: string, nameSelected: string | undefined = undefined) {
        $get(idBtnEdit).on('click', () => {
            const { modalName, $btnName, $titleName, $inputName } = this.app.modalName;

            $titleName.html(title);

            if (mode === 'edit_parameter'
                || mode === 'edit_lua_class'
                || mode === 'edit_lua_table'
                || mode === 'edit_field'
                || mode === 'edit_function'
                || mode === 'edit_method'
                || mode === 'edit_value'
            ) {
                $btnName.html('Edit');
                $btnName.removeClass('btn-success');
                $btnName.addClass('btn-primary');
            } else {
                $btnName.html('Create');
                $btnName.addClass('btn-success');
                $btnName.removeClass('btn-primary');
            }

            $inputName.val(entity.name);
            this.app.modalName.nameMode = mode;

            if (!nameSelected) nameSelected = entity.name;
            this.app.modalName.nameSelected = nameSelected;
            this.app.modalName.show(true);
        });
    }

    renderEdit(idBtnEdit: string): string {
        return html`
            <!-- Edit Button -->
            <div style="position: absolute; padding: 0; right: 0; top: 0">
                <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" style="position: relative; top: 5px; right: 5px;" title="Edit Name">
                    <div class="btn-pane" style="width: 30px; height: 30px;">
                        <i class="fa-solid fa-pen"></i>
                    </div>
                </button>
            </div>
        `;
    }

    listenNotes(entity: { notes: string | undefined }, idNotes: string): void {
        createDeltaEditor(idNotes, entity.notes!, (markdown: string) => {
            while (markdown.endsWith('\n')) markdown = markdown.substring(0, markdown.length - 1);
            entity.notes = markdown;
            this.update();
            this.app.renderCode();
        });
    }

    renderNotes(idNotes: string): string {
        return html`
            <div class="mb-3">
                <label for="${idNotes}" class="form-label mb-2">Description</label>
                <div id="${idNotes}" style="background-color: #222;"></div>
            </div>
        `;
    }

    listenDefaultValue(entity: { defaultValue: string | undefined }, idDefaultValue: string) {
        const $defaultValue = $get(idDefaultValue);
        $defaultValue.on('input', () => {
            entity.defaultValue = $defaultValue.val();
            this.update();
            this.app.renderCode();
        });
    }

    renderDefaultValue(defaultValue: string | undefined, idDefaultValue: string): string {
        if (!defaultValue) defaultValue = '';
        return html`
            <div class="mb-3">
                <label for="${idDefaultValue}" class="form-label mb-2">Default Value</label>
                <textarea id="${idDefaultValue}" class="form-control responsive-input mt-1" spellcheck="false">${defaultValue}</textarea>
            </div>
        `;
    }

    listenParameters(entity: RosettaJavaMethod | RosettaJavaConstructor, type: 'constructor' | 'method' | 'global_method'): void {
        const { parameters } = entity;
        const name = entity instanceof RosettaJavaConstructor ? 'new' : entity.name;

        for (let index = 0; index < parameters.length; index++) {
            const param = parameters[index];
            const idParamNotes = `${name}-parameter-${param.name}-notes`;
            const idBtnEdit = `${name}-parameter-${param.name}-edit`;

            createDeltaEditor(idParamNotes, param.notes!, (markdown: string) => {
                while (markdown.endsWith('\n')) markdown = markdown.substring(0, markdown.length - 1);
                param.notes = markdown;
                this.update();
                this.app.renderCode();
            });

            $get(idBtnEdit).on('click', () => {
                const { $btnName, $titleName, $inputName } = this.app.modalName;
                $titleName.html('Edit Parameter Name');
                $btnName.html('Edit');
                $btnName.removeClass('btn-success');
                $btnName.addClass('btn-primary');
                if (type === 'constructor') {
                    this.app.modalName.javaConstructor = entity as any;
                } else if (type === 'method') {
                    this.app.modalName.javaMethod = entity as any;
                } else if (type === 'global_method') {
                    this.app.modalName.globalJavaMethod = entity as any;
                }
                $inputName.val(param.name);

                this.app.modalName.javaParameter = param;
                this.app.modalName.nameMode = 'edit_parameter';
                this.app.modalName.nameSelected = param.name;
                this.app.modalName.javaCallback = (nameNew: string) => {
                    $(`#${name}_${index}_name`).html(nameNew);
                };
                this.app.modalName.show(true);
            });

            this.listenType(param);
        }
    }

    renderParameters(entity: { name: string, parameters: RosettaJavaParameter[] }, show: boolean = false): string {
        const { parameters } = entity;
        const idAccordion = `${entity.name}-parameters-accordion`;
        let htmlParams = '';

        if (parameters && parameters.length) {
            for (let index = 0; index < parameters.length; index++) {
                const param = parameters[index];
                const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
                const idCollapse = `${entity.name}-parameter-${param.name}-collapse`;
                const idBtnEdit = `${entity.name}-parameter-${param.name}-edit`;
                htmlParams += html`
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" style="position: relative" id="headingTwo">
                        <div class="p-2" style="position: relative;">
                            <button class="border-0 accordion-button collapsed rounded-0 p-0 text-white" style="background-color: transparent !important" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge border border-1 border-light-half desaturate shadow px-2 me-2" style="display: inline;"><strong>${param.type.basic}</strong></div>
                                <h6 id="${entity.name}_${index}_name" class="font-monospace mb-1">${param.name}</h6>
                            </button>
                        </div>
                        <div style="position: absolute; height: 32px; top: 5px; right: 2rem; z-index: 4;">
                            <!-- Edit Button -->
                            <button id="${idBtnEdit}" class="btn btn-sm responsive-btn float-end" style="z-index: 4">
                                <div class="btn-pane"> 
                                    <i class="fa-solid fa-pen"></i>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div id="${idCollapse}" class="accordion-collapse collapse rounded-0" aria-labelledby="headingTwo" data-bs-parent="#${idAccordion}">
                        <div class="accordion-body bg-dark" style="position: relative;">
                            
                                ${this.renderType(param)}

                            <!-- Notes -->
                            <div class="mb-3">
                                <label for="${idParamNotes}" class="form-label">Description</label>
                                <div id="${idParamNotes}"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }
        } else {
            htmlParams += html`<h6 class="font-monospace mb-1">(None)</h6>`
        }

        return html`
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idAccordion}" aria-expanded="true" aria-controls="${idAccordion}">
                        <strong>Parameters</strong>
                    </button>
                </div>
                <div id="${idAccordion}" class="card-body p-2 mb-0 collapse${show ? ' show' : ''}">
                    <div class="accordion rounded-0">
                        ${htmlParams}
                    </div>
                </div>
            </div>
        `;
    }

    update() {
        const { idPreviewCode } = this;
        const $pre = $get(idPreviewCode);

        $pre.empty();

        let text = this.onRenderPreview(this.languageMode);
        if (text.endsWith('\n')) text = text.substring(0, text.length - 1);

        // @ts-ignore
        const highlightedCode = hljs.default.highlightAuto(text, [this.languageMode]).value;

        $pre.append(highlightedCode);
    }

    listenPreview() {
        const { idBtnPreviewCopy, idBtnLanguageLua, idBtnLanguageTypeScript, idBtnLanguageJSON } = this;

        // Copy the code.
        $get(idBtnPreviewCopy).on('click', (event) => {
            event.stopPropagation();
            navigator.clipboard.writeText(this.onRenderPreview(this.languageMode));
        });

        $get(idBtnLanguageLua).on('click', () => {
            this.languageMode = 'lua';
            this.update();
        });

        $get(idBtnLanguageTypeScript).on('click', () => {
            this.languageMode = 'typescript';
            this.update();
        });


        $get(idBtnLanguageJSON).on('click', () => {
            this.languageMode = 'json';
            this.update();
        });
    }

    renderPreview(show: boolean): string {
        const { idPreview, idPreviewCode, idBtnPreviewCopy, idBtnLanguageLua, idBtnLanguageTypeScript, idBtnLanguageJSON } = this;
        return html`
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idPreview}" aria-expanded="true" aria-controls="${idPreview}">
                        <strong>Preview</strong>
                    </button>

                    <!-- Copy Button -->
                    <button id="${idBtnPreviewCopy}" class="btn btn-sm responsive-btn" style="z-index: 4; position: absolute; top: 5px; right: 5px;" title="Copy Code">
                        <div class="btn-pane"> 
                            <i class="fa-solid fa-copy"></i>
                        </div>
                    </button>
                </div>
                <div id="${idPreview}" class="card-body mb-0 p-0 collapse${show ? ' show' : ''}" style="position: relative;">
                    <div class="p-2">
                        <button id="${idBtnLanguageLua}" class="btn btn-sm btn-primary" title="View Lua Code">Lua</button>
                        <button id="${idBtnLanguageTypeScript}" class="btn btn-sm btn-primary" title="View Lua Code">TypeScript</button>
                        <button id="${idBtnLanguageJSON}" class="btn btn-sm btn-primary" title="View Lua Code">Rosetta JSON</button>
                    </div>
                    <pre id="${idPreviewCode}" class="w-100 h-100 p-2 m-0" style="background-color: #111; overflow: scroll; max-height: 512px;"></pre>
                </div>
            </div>
        `;
    }

    listenReturns(entity: { returns: RosettaJavaReturns }, idReturnNotes: string): void {
        createDeltaEditor(idReturnNotes, entity.returns.notes!, (markdown: string) => {
            while (markdown.endsWith('\n')) markdown = markdown.substring(0, markdown.length - 1);
            entity.returns.notes = markdown;
            this.update();
            this.app.renderCode();
        });
        this.listenType({ name: 'returns', type: entity.returns.type });
    }

    renderReturns(entity: { name: string, returns: RosettaJavaReturns }, idReturnType: string, idReturnNotes: string, show: boolean = false): string {

        const { returns } = entity;
        let { notes } = returns;
        if (!notes) notes = '';

        const idCard = `${entity.name}-returns-card`;

        return html`
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idCard}" aria-expanded="true" aria-controls="${idCard}">
                        <strong>Returns</strong>
                    </button>
                </div>
                <div id="${idCard}" class="card-body mb-0 collapse${show ? ' show' : ''}">
                    <!-- Return Type -->
                    <div class="mb-3">
                        <label for="${idReturnType}" class="form-label">Type: ${returns.type.basic}</label>
                    </div>
                    ${this.renderType({ name: 'returns', type: entity.returns.type })}
                    <!-- Return Notes -->
                    <div>
                        <label for="${idReturnNotes}" class="form-label">Description</label>
                        <div id="${idReturnNotes}" style="background-color: #222 !important;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    listenType(entity: { name: string, type: RosettaJavaType }): void {

        // Don't let the user change the nullability.
        if (!entity.type.isNullPossible()) return;

        const _this = this;
        const idNullable = `${entity.name}-nullable`;

        /* (Nullable CheckBox) */
        $get(idNullable).on('change', function () {
            entity.type.nullable = this.checked;
            _this.update();
            _this.app.renderCode();
        });

    }

    renderType(entity: { name: string, type: RosettaJavaType }): string {

        const idNullable = `${entity.name}-nullable`;

        // Don't let the user change the nullable status.
        if (!entity.type.isNullPossible()) return '';

        return html`
            <!-- Nullable Flag -->
            <div class="mb-3">
                <div class="col-auto">
                    <input id="${idNullable}" type="checkbox" class="form-check-input" ${entity.type.nullable ? ' checked' : ''}>
                    <label class="form-check-label" for="${idNullable}">Nullable</label>
                </div>
            </div>
        `;
    }

    abstract onRenderPreview(language: CodeLanguage): string;

    static renderTypeSelect(idSelect: string, label: string = '', value: string = 'any', margin: boolean): string {

        // Determine if custom field should show.
        let style = '';
        let customInputValue = value;
        value = value.trim();
        switch (value.toLowerCase()) {
            // Here the reference stays valid.
            case 'custom':
                style = '';
                customInputValue = value;
                break;
            // Erase custom definition here.
            case 'void':
            case 'any':
            case 'nil':
            case 'boolean':
            case 'number':
            case 'string':
                style = 'display: none';
                customInputValue = '';
                break;
            // Everything else gets shoved into the custom value.
            default:
                customInputValue = value;
                value = 'custom';
                style = '';

        }

        return html`
            <div class="${margin ? 'mb-2' : ''}">

                <!-- Type Selection List -->
                <select id="${idSelect}" class="form-select responsive-select" aria-label="${label}">
                    <option value="any"  ${value === 'any' ? 'selected' : ''}><strong>Any</strong></option>
                    <option value="void"  ${value === 'void' ? 'selected' : ''}><strong>Void</strong></option>
                    <option value="nil"  ${value === 'nil' ? 'selected' : ''}><strong>Nil</strong></option>
                    <option value="boolean"  ${value === 'boolean' ? 'selected' : ''}><strong>Boolean</strong></option>
                    <option value="number" ${value === 'number' ? 'selected' : ''}><strong>Number</strong></option>
                    <option value="string"  ${value === 'string' ? 'selected' : ''}><strong>String</strong></option>
                    <option value="custom" ${value === 'custom' ? 'selected' : ''}><strong>Custom</strong></option>
                </select>
                
                <!-- Manual Input for Custom Type -->
                <input id="${idSelect}-custom-input" class="form-control responsive-input mt-2" type="text" style="${style}" value="${customInputValue}" />
            
            </div>
        `;
    }

    static getTypeIcon(type: string): string {

        switch (type.toLocaleLowerCase().trim()) {

            case 'class': return 'fa-solid fa-box-archive text-light mx-2 desaturate';

            case 'constructor': return 'fa-solid fa-copyright text-light mx-2 desaturate';

            case 'nil': return 'fa-solid fa-ban fa-danger mx-2 desaturate';

            case 'void': return 'fa-solid fa-xmark mx-2 desaturate';

            case 'number': return 'fa-solid fa-hashtag text-warning mx-2 desaturate';

            case 'string': return 'fa-solid fa-quote-left text-light mx-2 desaturate';

            case 'boolean': return 'fa-solid fa-flag text-info mx-2 desaturate';

            // Uknown or other.
            case 'any': return 'fa-solid fa-question text-danger mx-2 desaturate';

            // Objects
            default: return 'fa-solid fa-box text-success mx-2 desaturate';
        }
    }
}

export type JavaCardOptions = ComponentOptions & {
    entity: RosettaEntity;
};

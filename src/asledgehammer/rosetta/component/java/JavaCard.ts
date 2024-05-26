import hljs = require('highlight.js');
import { App } from "../../../../app";
import { RosettaEntity } from "../../RosettaEntity";
import { $get, html } from "../../util";
import { CardComponent } from "../CardComponent";
import { ComponentOptions } from "../Component";
import { NameModeType } from "../NameModeType";
import { createDeltaEditor } from "../../../Delta";
import { RosettaJavaParameter } from '../../java/RosettaJavaParameter';
import { RosettaJavaReturns } from '../../java/RosettaJavaReturns';

export abstract class JavaCard<O extends JavaCardOptions> extends CardComponent<O> {

    readonly app: App;
    readonly idPreview: string;
    readonly idPreviewCode: string;
    readonly idBtnPreviewCopy: string;

    constructor(app: App, options: O) {
        super(options);
        this.app = app;
        this.idPreview = `${this.id}-preview`;
        this.idPreviewCode = `${this.id}-preview-code`;
        this.idBtnPreviewCopy = `${this.id}-preview-copy-btn`;
    }

    listenEdit(entity: { name: string }, idBtnEdit: string, mode: NameModeType, title: string, nameSelected: string | undefined = undefined) {
        $get(idBtnEdit).on('click', () => {
            const { modalName, $btnName, $titleName, $inputName } = this.app;

            $titleName.html(title);

            if (mode === 'edit_class' || mode === 'edit_field' || mode === 'edit_function' || mode === 'edit_method' || mode === 'edit_value') {
                $btnName.html('Edit');
                $btnName.removeClass('btn-success');
                $btnName.addClass('btn-primary');
            } else {
                $btnName.html('Create');
                $btnName.addClass('btn-success');
                $btnName.removeClass('btn-primary');
            }

            $inputName.val(entity.name);
            this.app.nameMode = mode;

            if (!nameSelected) nameSelected = entity.name;
            this.app.nameSelected = nameSelected;
            modalName.show();
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

    listenParameters(entity: { name: string, parameters: RosettaJavaParameter[] }, type: 'constructor' | 'function' | 'method'): void {
        const { parameters } = entity;

        for (const param of parameters) {

            const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
            const idBtnEdit = `${entity.name}-parameter-${param.name}-edit`;
            const idBtnDelete = `${entity.name}-parameter-${param.name}-delete`;

            createDeltaEditor(idParamNotes, param.notes!, (markdown: string) => {
                param.notes = markdown;
                this.update();
                this.app.renderCode();
            });

            $get(idBtnDelete).on('click', () => {
                this.app.askConfirm(() => {
                    entity.parameters.splice(entity.parameters.indexOf(param), 1);
                    this.update();

                    // Implicit check for refreshability for parameters.
                    if((this as any).refreshParameters) (this as any).refreshParameters();

                }, `Delete Parameter ${param.name}?`);
            });

            this.listenEdit({ name: param.name }, idBtnEdit, 'edit_parameter', 'Edit Parameter Name', `${entity.name}-${param.name}`);
        }
        const idBtnAdd = `btn-${entity.name}-parameter-add`;
        $get(idBtnAdd).on('click', () => {
            const { modalName, $inputName, $titleName } = this.app;
            this.app.nameMode = 'new_parameter';
            this.app.nameSelected = `${type}-${entity.name}`;
            $titleName.html('Add Parameter');
            $inputName.val('');
            modalName.show();
        });
    }

    renderParameters(entity: { name: string, parameters: RosettaJavaParameter[] }, show: boolean = false): string {
        const { parameters } = entity;
        const idAccordion = `${entity.name}-parameters-accordion`;
        let htmlParams = '';
        for (const param of parameters) {
            const idParamType = `${entity.name}-parameter-${param.name}-type`;
            const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
            const idCollapse = `${entity.name}-parameter-${param.name}-collapse`;
            const idBtnEdit = `${entity.name}-parameter-${param.name}-edit`;
            const idBtnDelete = `${entity.name}-parameter-${param.name}-delete`;
            htmlParams += html`
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" style="position: relative" id="headingTwo">
                        <div class="p-2" style="position: relative;">
                            <button class="border-0 accordion-button collapsed rounded-0 p-0 text-white" style="background-color: transparent !important" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge border border-1 border-light-half desaturate shadow px-2 me-2" style="display: inline;"><strong>${param.type}</strong></div>
                                <h6 class="font-monospace mb-1">${param.name}</h6>
                            </button>
                        </div>
                        <div style="position: absolute; height: 32px; top: 5px; right: 2rem; z-index: 4;">
                            <!-- Delete Button -->
                            <button id="${idBtnDelete}" class="btn btn-sm responsive-btn float-end ms-1" style="z-index: 4">
                                <div class="btn-pane">
                                    <i class="fa-solid fa-xmark"></i>
                                </div>
                            </button>
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
                            <!-- Type -->
                            <div class="mb-3">
                                <label for="${idParamType}" class="form-label">Type</label>
                                <!-- TODO: Might need to style. -->
                                <select disabled>
                                    <option selected>${param.type.basic}</option>
                                </select>
                            </div>
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

        const idBtnAdd = `btn-${entity.name}-parameter-add`;

        return html`
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idAccordion}" aria-expanded="true" aria-controls="${idAccordion}">
                        <strong>Parameters</strong>
                    </button>
                    <div style="position: absolute; height: 32px; top: 5px; right: 5px; z-index: 4;">
                        <!-- Add Button -->
                        <button id="${idBtnAdd}" class="btn btn-sm responsive-btn float-end ms-1">
                            <div class="btn-pane">
                               <i class="fa-solid fa-plus"></i>
                            </div>
                        </button>
                    </div>
                </div>
                <div id="${idAccordion}" class="card-body mb-0 collapse${show ? ' show' : ''}">
                    <div class="accordion rounded-0">
                        ${htmlParams}
                    </div>
                    <!-- <div class="mt-3" style="position: relative; width: 100%; height: 32px;"></div> -->
                </div>
            </div>
        `;
    }

    update() {
        const { idPreviewCode } = this;
        const $pre = $get(idPreviewCode);

        $pre.empty();

        let text = this.onRenderPreview();
        if (text.endsWith('\n')) text = text.substring(0, text.length - 1);

        // @ts-ignore
        const highlightedCode = hljs.default.highlightAuto(text, ['lua']).value;

        $pre.append(highlightedCode);
    }

    listenPreview() {
        const { idBtnPreviewCopy } = this;

        // Copy the code.
        $get(idBtnPreviewCopy).on('click', (event) => {
            event.stopPropagation();
            navigator.clipboard.writeText(this.onRenderPreview());
        });
    }

    renderPreview(show: boolean): string {
        const { idPreview, idPreviewCode, idBtnPreviewCopy } = this;
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
                <div id="${idPreview}" class="card-body mb-0 p-0 collapse${show ? ' show' : ''}" style="position: relative; max-height: 512px">
                    <pre id="${idPreviewCode}" class="w-100 h-100 p-4 m-0" style="background-color: #111; overflow: scroll; max-height: 512px;"></pre>
                </div>
            </div>
        `;
    }

    listenReturns(entity: { returns: RosettaJavaReturns }, idReturnType: string, idReturnNotes: string, idSelect: string): void {
        createDeltaEditor(idReturnNotes, entity.returns.notes!, (markdown: string) => {
            entity.returns.notes = markdown;
            this.update();
            this.app.renderCode();
        });
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
                        <label for="${idReturnType}" class="form-label">Type</label>
                        <!-- TODO: Might need to style. -->
                        <select disabled>
                            <option selected>${returns.type.basic}</option>
                        </select>
                    </div>

                    <!-- Return Notes -->
                    <div>
                        <label for="${idReturnNotes}" class="form-label">Description</label>
                        <div id="${idReturnNotes}" style="background-color: #222 !important;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    listenType(entity: { name: string, type: string }, idType: string, idSelect: string): void {

        const $select = $get(idType);
        const $customInput = $get(`${idSelect}-custom-input`);
        $select.on('change', (value) => {
            entity.type = value.target.value;
            if (entity.type === 'custom') {
                $customInput.show();
                // We default to 'any' for an undefined custom value.
                entity.type = 'any';
            } else {
                $customInput.hide();
                $customInput.val(''); // Clear custom field.
            }
            this.update();
            this.app.renderCode();
        });

        $customInput.on('input', () => {
            const val = $customInput.val();
            if (val === '') {
                entity.type = 'any';
            } else {
                entity.type = val;
            }
            this.update();
            this.app.renderCode();
        });

        $customInput.on('focusout', () => {
            const value = $customInput.val().trim();
            switch (value.toLowerCase()) {
                // Here the reference stays valid.
                case 'custom':
                    break;
                // Here the reference converts to its select option.
                case 'void':
                case 'any':
                case 'nil':
                case 'boolean':
                case 'number':
                case 'string':
                    entity.type = value;
                    $select.val(value);
                    $customInput.hide();
                    $customInput.val(''); // Clear custom field.
                    this.update();
                    this.app.renderCode();
                    break;
            }
        });
    }

    renderType(name: string, type: string, idReturnType: string): string {

        const idTypeCard = `${name}-type-card`;

        return html`
            <div class="card responsive-subcard">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idTypeCard}" aria-expanded="true" aria-controls="${idTypeCard}">
                        Type
                    </button>   
                </div>
                <div id="${idTypeCard}" class="card-body collapse show">
                    <div>
                        <label for="${idReturnType}" class="form-label">Type</label>
                        ${JavaCard.renderTypeSelect(idReturnType, 'The return type.', type, false)}
                    </div>
                </div>
            </div>
        `;
    }

    abstract onRenderPreview(): string;

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

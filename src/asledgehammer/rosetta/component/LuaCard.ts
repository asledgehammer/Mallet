import { App } from "../../../app";
import { RosettaEntity } from "../RosettaEntity";
import { RosettaLuaParameter } from "../lua/RosettaLuaParameter";
import { RosettaLuaReturns } from "../lua/RosettaLuaReturns";
import { $get, html } from "../util";
import { CardComponent } from "./CardComponent";
import { ComponentOptions } from "./Component";

export abstract class LuaCard<O extends LuaCardOptions> extends CardComponent<O> {

    readonly app: App;
    readonly idPreview: string;

    constructor(app: App, options: O) {
        super(options);
        this.app = app;

        this.idPreview = `${this.id}-preview`;
    }

    listenNotes(entity: { notes: string | undefined }, idNotes: string): void {
        const $description = $get(idNotes);
        $description.on('input', () => {
            entity.notes = $description.val();
            this.app.renderCode();
        });
    }

    renderNotes(notes: string | undefined, idNotes: string): string {
        if (!notes) notes = '';
        return html`
            <div class="mb-3">
                <label for="${idNotes}" class="form-label mb-2">Description</label>
                <textarea id="${idNotes}" class="form-control responsive-input mt-1" spellcheck="false">${notes}</textarea>
            </div>
        `;
    }

    listenParameters(entity: { name: string, parameters: RosettaLuaParameter[] }): void {
        const { parameters } = entity;

        for (const param of parameters) {

            const idParamType = `${entity.name}-parameter-${param.name}-type`;
            const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
            const $description = $get(idParamNotes);
            $description.on('input', () => {
                param.notes = $description.val();
                this.app.renderCode();
            });

            const $select = $get(idParamType);
            const $customInput = $get(`${idParamType}-custom-input`);
            $select.on('change', (value) => {
                param.type = value.target.value;
                if (param.type === 'custom') {
                    $customInput.show();
                } else {
                    $customInput.hide();
                    $customInput.val(''); // Clear custom field.
                }
                this.app.renderCode();
            });

            // When the custom field is changed, set this as the type.
            $customInput.on('input', () => {
                param.type = $customInput.val();
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
                        param.type = value;
                        $select.val(value);
                        $customInput.hide();
                        $customInput.val(''); // Clear custom field.
                        this.app.renderCode();
                        break;
                }
            });
        }
    }

    renderParameters2(entity: { name: string, parameters: RosettaLuaParameter[] }): string {
        const { parameters } = entity;
        const idAccordion = `${entity.name}-parameters-accordion`;
        let htmlParams = '';

        for (const param of parameters) {

            const idParamType = `${entity.name}-parameter-${param.name}-type`;
            const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
            const idCollapse = `${entity.name}-parameter-${param.name}-collapse`;

            htmlParams += html`
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" id="headingTwo">
                        
                        <div class="p-2">
                            
                            <button class="border-0 accordion-button collapsed rounded-0 p-0" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge px-2 me-2" style="display: inline;"><strong>${param.type}</strong></div>
                                <h6 class="font-monospace mb-1">${param.name}</h6>
                            </button>
                        </div>
                    <!-- <button class="accordion-button collapsed rounded-0" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}"><h6 class="font-monospace mb-1"><span class="text-warning bg-dark rounded-pill px-2">${param.type}</span> ${param.name}</h6></button> -->
                    </div>
                    <div id="${idCollapse}" class="accordion-collapse collapse rounded-0" aria-labelledby="headingTwo" data-bs-parent="#${idAccordion}">
                        <div class="accordion-body bg-secondary">
                            <!-- Type -->
                            <div class="mb-3">
                                <label for="${idParamType}" class="form-label">Type</label>
                                ${LuaCard.renderTypeSelect(idParamType, 'The return type.', param.type, true)}
                            </div>

                            <!-- Notes -->
                            <div class="mb-3">
                                <label for="${idParamNotes}" class="form-label">Description</label>
                                <textarea id="${idParamNotes}" class="form-control responsive-input" spellcheck="false">${param.notes}</textarea>
                            </div>    
                        </div>
                    </div>
                </div>
            `;
        }

        return html`
        <h6 class="mb-2">Parameters</h6>
        <div class="accordion rounded-0 mb-4" id="${idAccordion}">
            ${htmlParams}
        </div>
            
        `;
    }

    renderParameters(entity: { name: string, parameters: RosettaLuaParameter[] }, show: boolean = false): string {
        const { parameters } = entity;
        const idAccordion = `${entity.name}-parameters-accordion`;
        let htmlParams = '';

        for (const param of parameters) {

            const idParamType = `${entity.name}-parameter-${param.name}-type`;
            const idParamNotes = `${entity.name}-parameter-${param.name}-notes`;
            const idCollapse = `${entity.name}-parameter-${param.name}-collapse`;

            htmlParams += html`
                <div class="accordion-item rounded-0">
                    <div class="accordion-header" id="headingTwo">
                        
                        <div class="p-2">
                            
                            <button class="border-0 accordion-button collapsed rounded-0 p-0 text-white" style="background-color: transparent !important" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}">
                                <div class="col-auto responsive-badge px-2 me-2" style="display: inline;"><strong>${param.type}</strong></div>
                                <h6 class="font-monospace mb-1">${param.name}</h6>
                            </button>
                        </div>
                    <!-- <button class="accordion-button collapsed rounded-0" type="button" data-bs-toggle="collapse" data-bs-target="#${idCollapse}" aria-expanded="false" aria-controls="${idCollapse}"><h6 class="font-monospace mb-1"><span class="text-warning bg-dark rounded-pill px-2">${param.type}</span> ${param.name}</h6></button> -->
                    </div>
                    <div id="${idCollapse}" class="accordion-collapse collapse rounded-0" aria-labelledby="headingTwo" data-bs-parent="#${idAccordion}">
                        <div class="accordion-body bg-dark">
                            <!-- Type -->
                            <div class="mb-3">
                                <label for="${idParamType}" class="form-label">Type</label>
                                ${LuaCard.renderTypeSelect(idParamType, 'The return type.', param.type, true)}
                            </div>

                            <!-- Notes -->
                            <div class="mb-3">
                                <label for="${idParamNotes}" class="form-label">Description</label>
                                <textarea id="${idParamNotes}" class="form-control responsive-input" spellcheck="false">${param.notes}</textarea>
                            </div>    
                        </div>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idAccordion}" aria-expanded="true" aria-controls="${idAccordion}">
                        <strong>Parameters</strong>
                    </button>
                </div>
                <div id="${idAccordion}" class="card-body mb-0 collapse${show ? ' show' : ''}">
                    <div class="accordion rounded-0">
                        ${htmlParams}
                    </div>
                </div>
            </div>
        `;
    }

    update() {
        const { idPreview } = this;
        const $card = $get(idPreview);

        $card.empty();

        let text = this.onRenderPreview();
        if (text.endsWith('\n')) text = text.substring(0, text.length - 1);

        // @ts-ignore
        const highlightedCode = hljs.highlight(text, { language: 'lua' }).value;

        $card.append(highlightedCode);
    }

    renderPreview(show: boolean): string {
        const { idPreview } = this;
        return html`
            <div class="card responsive-subcard mt-3">
                <div class="card-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idPreview}" aria-expanded="true" aria-controls="${idPreview}">
                        <strong>Preview</strong>
                    </button>
                </div>
                <pre id="${idPreview}" class="card-body mb-0 collapse${show ? ' show' : ''}" style="max-height: 512px"></pre>
            </div>
        `;
    }

    listenReturns(entity: { returns: RosettaLuaReturns }, idReturnType: string, idReturnNotes: string, idSelect: string): void {
        const { returns } = entity;

        const $description = $get(idReturnNotes);
        $description.on('input', () => {
            returns.notes = $description.val();
            this.app.renderCode();
        });

        const $select = $get(idReturnType);
        const $customInput = $get(`${idSelect}-custom-input`);
        $select.on('change', (value) => {
            returns.type = value.target.value;
            if (returns.type === 'custom') {
                $customInput.show();
            } else {
                $customInput.hide();
                $customInput.val(''); // Clear custom field.
            }
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
                    returns.type = value;
                    $select.val(value);
                    $customInput.hide();
                    $customInput.val(''); // Clear custom field.
                    this.app.renderCode();
                    break;
            }
        });
    }

    renderReturns(entity: { name: string, returns: RosettaLuaReturns }, idReturnType: string, idReturnNotes: string, show: boolean = false): string {
        
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
                        ${LuaCard.renderTypeSelect(idReturnType, 'The return type.', returns.type, true)}
                    </div>

                    <!-- Return Notes -->
                    <div>
                        <label for="${idReturnNotes}" class="form-label">Description</label>
                        <textarea id="${idReturnNotes}" class="form-control responsive-input" spellcheck="false">${notes}</textarea>
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

            case 'class': return 'fa-solid fa-box-archive text-light mx-2';

            case 'constructor': return 'fa-solid fa-copyright text-light mx-2';

            case 'nil': return 'fa-solid fa-ban fa-danger mx-2';

            case 'void': return 'fa-solid fa-xmark mx-2';

            case 'number': return 'fa-solid fa-hashtag text-warning mx-2';

            case 'string': return 'fa-solid fa-quote-left text-light mx-2';

            case 'boolean': return 'fa-solid fa-flag text-info mx-2';

            // Uknown or other.
            case 'any': return 'fa-solid fa-question text-danger mx-2';

            // Objects
            default: return 'fa-solid fa-box text-success mx-2';
        }
    }
}

export type LuaCardOptions = ComponentOptions & {
    entity: RosettaEntity;
};
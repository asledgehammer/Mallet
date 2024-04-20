import { App } from '../../../app';
import { generateLuaField } from '../lua/LuaGenerator';
import { RosettaLuaField } from '../lua/RosettaLuaField';
import { $get, html } from '../util';
import { CardOptions } from './CardComponent';
import { LuaCard } from './LuaCard';

export class LuaFieldCard extends LuaCard<LuaFieldCardOptions> {

    idNotes: string;
    idType: string;

    constructor(app: App, options: LuaFieldCardOptions) {
        super(app, options);

        this.idNotes = `${this.id}-notes`;
        this.idType = `${this.id}-type`;
    }

    onRenderPreview(): string {
        return generateLuaField(this.options!.entity);
    }

    onHeaderHTML(): string | undefined {
        const { entity, isStatic } = this.options!;
        return html` 
            <div class="row">
                <div class="col-auto ps-2 pe-3">
                    <div class="badge text-bg-success">Lua ${isStatic ? 'Function' : 'Method'}</div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text">${entity.name}</h5> 
                </div>
            </div>
        `;
    }

    onBodyHTML(): string | undefined {

        const { idNotes, idType } = this;
        const { entity } = this.options!;

        return html`
            <div>
                ${this.renderNotes(entity.notes, idNotes)}

                <hr>

                ${this.renderType(entity.name, entity.type, idType)}

                <hr>
                
                ${this.renderPreview(false)}
            </div>
        `;
    }

    listen(): void {
        super.listen();

        const { idNotes, idType } = this;
        const { entity } = this.options!;

        this.listenNotes(entity, idNotes);
        this.listenType(entity, idType, idType);
    }

    listenType(entity: { name: string, type: string }, idType: string, idSelect: string): void {

        const $select = $get(idType);
        const $customInput = $get(`${idSelect}-custom-input`);
        $select.on('change', (value) => {
            entity.type = value.target.value;
            if (entity.type === 'custom') {
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
                    entity.type = value;
                    $select.val(value);
                    $customInput.hide();
                    $customInput.val(''); // Clear custom field.
                    this.app.renderCode();
                    break;
            }
        });
    }

    renderType(name: string, type: string, idReturnType: string): string {

        const idTypeCard = `${name}-type-card`;

        return html`
            <div class="card border border-1 border-800 rounded-0 bg-secondary">
                <div class="card-header bg-dark" style="cursor: pointer; background-color: var(--bs-accordion-btn-bg);">
                    <!-- <h6 class="mb-0">Returns</h6> -->
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${idTypeCard}" aria-expanded="true" aria-controls="${idTypeCard}">
                        Returns
                    </button>   
                </div>
                <div id="${idTypeCard}" class="card-body collapse show">
                    <!-- Return Type -->
                    <div>
                        <label for="${idReturnType}" class="form-label">Type</label>
                        ${LuaCard.renderTypeSelect(idReturnType, 'The return type.', type, false)}
                    </div>
                </div>
            </div>
        `;
    }
}

export type LuaFieldCardOptions = CardOptions & {
    entity: RosettaLuaField;
    isStatic: boolean;
};

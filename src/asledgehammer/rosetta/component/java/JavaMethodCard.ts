import { App } from '../../../../app';
import { generateJavaMethod } from '../../java/JavaGenerator';
import { RosettaJavaClass } from '../../java/RosettaJavaClass';
import { RosettaJavaMethod } from '../../java/RosettaJavaMethod';
import { RosettaJavaMethodCluster } from '../../java/RosettaJavaMethodCluster';
import { $get, html } from '../../util';
import { CardOptions } from '../CardComponent';
import { JavaCard } from './JavaCard';

export class JavaMethodCard extends JavaCard<JavaMethodCardOptions> {

    idNotes: string;
    idReturnType: string;
    idReturnNotes: string;
    idBtnDelete: string;
    idBtnEdit: string;
    idParamContainer: string;

    constructor(app: App, options: JavaMethodCardOptions) {
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

        const cluster = new RosettaJavaMethodCluster(entity.name);
        cluster.add(entity);

        return generateJavaMethod(className, cluster);
    }

    onHeaderHTML(): string | undefined {
        const { entity, isStatic } = this.options!;
        const classEntity = this.app.active.selectedCard!.options!.entity;
        const className = classEntity.name;

        let params = '';
        for (const param of entity.parameters) {
            params += `${param.name}, `;
        }
        if (params.length) params = params.substring(0, params.length - 2);

        let name = `${className}${isStatic ? '.' : ':'}${entity.name}(${params})`;
        if (isStatic) {
            name = html`<span class="fst-italic">${name}</span>`;
        }

        return html` 
            <div class="row">

            ${isStatic ?
                html`
                        <div class="col-auto ps-2 pe-0">
                            <div class="text-bg-primary px-2 border border-1 border-light-half desaturate shadow">
                                <strong>Static</strong>
                            </div>
                        </div>
                        `
                : ''
            }
                <!-- Visual Category Badge -->
                <div class="col-auto ps-2 pe-2">
                    <div class="text-bg-success px-2 border border-1 border-light-half desaturate shadow">
                        <strong>Java Method</strong>
                    </div>
                </div>
                <div class="col-auto p-0">
                    <h5 class="card-text font-monospace" style="position: relative; top: 1px;"><strong>${name}</strong></h5> 
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

        const { app, idBtnDelete, idNotes, idReturnType, idReturnNotes } = this;
        const { entity, isStatic } = this.options!;

        this.listenNotes(entity, idNotes);
        this.listenParameters(entity, 'method');
        this.listenReturns(entity, idReturnType, idReturnNotes, idReturnType);
        this.listenPreview();

        $get(idBtnDelete).on('click', () => {
            app.askConfirm(() => {
                const clazz = app.active.selectedCard?.options!.entity! as RosettaJavaClass;
                delete clazz.methods[entity.name];
                app.showJavaClass(clazz);
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

export type JavaMethodCardOptions = CardOptions & {
    entity: RosettaJavaMethod;
    isStatic: boolean;
};

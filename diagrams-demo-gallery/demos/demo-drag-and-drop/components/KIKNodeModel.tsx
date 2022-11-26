import { NodeModel, DefaultPortModel, DefaultNodeModel, DefaultNodeWidget } from '@projectstorm/react-diagrams';
import { BaseModelOptions } from '@projectstorm/react-canvas-core';
import { AbstractReactFactory, GenerateWidgetEvent } from '@projectstorm/react-canvas-core';
import { DiagramEngine } from '@projectstorm/react-diagrams'
import React from 'react';

export enum RQTypes {
    Model = 'Model',
    Form = 'Form',
    Converter = 'Converter'
}
export interface RQProperty {
    name: string;
    id: string;
}
export interface RQNodeModelOptions extends BaseModelOptions {
    color?: string;
    model?: string;
    properties?: RQProperty[];
    rqType?: RQTypes;
}
export class RQFactory extends AbstractReactFactory<RQNodeModel, DiagramEngine> {
    constructor() {
        super('rq-model');
    }

    generateModel(): RQNodeModel {
        return new RQNodeModel();

    }

    generateReactWidget(event: GenerateWidgetEvent<RQNodeModel>): JSX.Element {
        return <DefaultNodeWidget node={event.model} engine={this.engine} />;
    }
}

export class RQNodeModel extends DefaultNodeModel {
    color?: string;
    model?: string;
    properties?: RQProperty[];
    rqType?: RQTypes;

    constructor(options: RQNodeModelOptions = {}) {
        super({
            type: 'rq-model',
            ...options,
        });
        this.model = options.model || '';
        this.properties = options.properties || [];
        this.rqType = options.rqType || RQTypes.Model;
        this.color = options.color || '#ff0000';

        switch (this.rqType) {
            case RQTypes.Model:
                this.properties.map(prop => {
                    this.addPort(
                        new DefaultPortModel({
                            in: false,
                            name: prop.name
                        })
                    );
                });
                break;
            case RQTypes.Form:
                this.properties.map(prop => {
                    this.addPort(
                        new DefaultPortModel({
                            in: true,
                            name: prop.name
                        })
                    );
                });
                break;
            case RQTypes.Converter:
                this.properties = [{ id: 'in', name: 'in' }, { id: 'out', name: 'out' }];
                this.addInPort('in');
                this.addOutPort('out');
                break;
        }
    }
    getInPort(): DefaultPortModel {
        return this.portsIn[0]
    }
    getOutPort(): DefaultPortModel {
        return this.portsOut[0]
    }
    serialize() {
        return {
            ...super.serialize(),
            model: this.model,
            properties: this.properties,
            rqType: this.rqType,
            color: this.color
        };
    }

    deserialize(event: any): void {
        super.deserialize(event);
        this.color = event.data.color;
        this.model = event.data.model;
        this.properties = event.data.properties;
        this.rqType = event.data.rqType;
    }
}
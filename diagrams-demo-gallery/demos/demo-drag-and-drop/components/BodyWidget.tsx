import * as React from 'react';
import * as _ from 'lodash';
import { TrayWidget } from './TrayWidget';
import { Application } from '../Application';
import { TrayItemWidget } from './TrayItemWidget';
import { DefaultNodeModel } from '@projectstorm/react-diagrams';
import { CanvasWidget } from '@projectstorm/react-canvas-core';
import { DemoCanvasWidget } from '../../helpers/DemoCanvasWidget';
import styled from '@emotion/styled';
import models from '../data/models';
import forms from '../data/forms';
import { RQNodeModel, RQTypes } from './KIKNodeModel';

export interface BodyWidgetProps {
	app: Application;
	onDeserialize: (str: string) => void
}

namespace S {
	export const Body = styled.div`
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		min-height: 100%;
	`;

	export const Header = styled.div`
		display: flex;
		background: rgb(30, 30, 30);
		flex-grow: 0;
		flex-shrink: 0;
		color: white;
		font-family: Helvetica, Arial, sans-serif;
		padding: 10px;
		align-items: center;
	`;

	export const Content = styled.div`
		display: flex;
		flex-grow: 1;
	`;

	export const Layer = styled.div`
		position: relative;
		flex-grow: 1;
	`;
}
function fallbackCopyTextToClipboard(text) {
	var textArea = document.createElement("textarea");
	textArea.value = text;

	// Avoid scrolling to bottom
	textArea.style.top = "0";
	textArea.style.left = "0";
	textArea.style.position = "fixed";

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		var successful = document.execCommand('copy');
		var msg = successful ? 'successful' : 'unsuccessful';
		console.log('Fallback: Copying text command was ' + msg);
	} catch (err) {
		console.error('Fallback: Oops, unable to copy', err);
	}

	document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
	if (!navigator.clipboard) {
		fallbackCopyTextToClipboard(text);
		return;
	}
	navigator.clipboard.writeText(text).then(function () {
		console.log('Async: Copying to clipboard was successful!');
	}, function (err) {
		console.error('Async: Could not copy text: ', err);
	});
}

const MODEL = 'MODEL';
const FORM = 'FORM';
const CONVERTER = 'CONVERTER';
export class BodyWidget extends React.Component<BodyWidgetProps> {
	generateTrayItemWidgets() {
		let model_s = models.map(model => {
			return <TrayItemWidget
				key={model.model.id}
				model={{ type: MODEL, id: model.model.id, }}
				name={model.model.properties.uiName} color='#713E5A' />
		});

		let form_s = Object.keys(forms).map(key => {
			return <TrayItemWidget
				key={`${key}-${Math.random()}`}
				model={{ type: FORM, id: key, }}
				name={key} color='rgb(0,192,255)' />
		});

		let convert_s = [
			<TrayItemWidget
				key={`converter-${Math.random()}`}
				model={{ type: CONVERTER, }}
				name={CONVERTER} color='#CAFE48' />,
			<TrayItemWidget
				key={`date-${Math.random()}`}
				model={{ type: CONVERTER, name: 'convertToDate' }}
				name={'Date Convert'} color='#CAFE48' />
		]

		return [...convert_s, ...model_s, ...form_s];
	}
	render() {
		return (
			<S.Body>
				<S.Header>
					<div className="title">Form Map</div>
					<div className="title" style={{ padding: 5, margin: 3 }} onClick={() => {
						let res = this.props.app.getDiagramEngine().getModel().serialize();
						console.log(JSON.stringify(res, null, 4))
						copyTextToClipboard(JSON.stringify(res, null, 4));
					}}>Export</div>
					<div className="title" style={{ padding: 5, margin: 3 }} onClick={() => {
						let data = prompt('paste model');
						if (this.props.onDeserialize) {
							this.props.onDeserialize(data)
						}
					}}>Load</div>
				</S.Header>
				<S.Content>
					<TrayWidget>
						{this.generateTrayItemWidgets()}
					</TrayWidget>
					<S.Layer
						onDrop={(event) => {
							var data = JSON.parse(event.dataTransfer.getData('storm-diagram-node'));
							var nodesCount = _.keys(this.props.app.getDiagramEngine().getModel().getNodes()).length;

							var node: RQNodeModel = this.generateNode(data);
							var point = this.props.app.getDiagramEngine().getRelativeMousePoint(event);
							node.setPosition(point);
							this.props.app.getDiagramEngine().getModel().addNode(node);
							this.forceUpdate();
						}}
						onDragOver={(event) => {
							event.preventDefault();
						}}>
						<DemoCanvasWidget>
							<CanvasWidget engine={this.props.app.getDiagramEngine()} />
						</DemoCanvasWidget>
					</S.Layer>
				</S.Content>
			</S.Body>
		);
	}
	generateNode(data: any): RQNodeModel {
		let model = models.find(v => v.model.id === data.id);
		if (model) {
			let node = new RQNodeModel({
				name: model.model.properties.uiName,
				model: model.model.id,
				color: '#713E5A',
				properties: model.properties.map(prop => ({
					name: prop.properties.Label,
					id: toJavascriptName(prop.properties.codeName)
				})),
				rqType: RQTypes.Model
			});
			return node;
		}
		else if (forms[data.id]) {
			let node = new RQNodeModel({
				name: data.id,
				model: data.id,
				color: 'rgb(0,192,255)',
				properties: forms[data.id].map(prop => ({
					name: prop.id,
					id: prop.id
				})),
				rqType: RQTypes.Form
			});
			return node;
		}
		else if (data.type === CONVERTER) {
			let name = data.name || prompt('Conversion');
			let node = new RQNodeModel({
				name,
				model: name,
				color: '#CAFE48',
				rqType: RQTypes.Converter
			});

			return node;
		}
		return null;
	}
}

function toJavascriptName(str: string) {
	if (str[0]) {
		try {
			return str[0].toLowerCase() + str.substr(1);
		} catch (e) {
			console.log(str);
			console.log(str.length);
		}
	}
	return str;
};
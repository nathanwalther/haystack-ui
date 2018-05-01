/*
 * Copyright 2018 Expedia, Inc.
 *
 *         Licensed under the Apache License, Version 2.0 (the "License");
 *         you may not use this file except in compliance with the License.
 *         You may obtain a copy of the License at
 *
 *             http://www.apache.org/licenses/LICENSE-2.0
 *
 *         Unless required by applicable law or agreed to in writing, software
 *         distributed under the License is distributed on an "AS IS" BASIS,
 *         WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *         See the License for the specific language governing permissions and
 *         limitations under the License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { observer } from 'mobx-react';

import hashUtils from '../../../../utils/hashUtil';

const borderColors = [
    '#36A2EB',
    '#47db2d',
    '#4BC0C0',
    '#ff9f40',
    '#7d3cc0',
    '#3f30ad',
    '#687c44'
];
const backgroundColors = [
    '#D8ECFA',
    '#ddf4d9',
    '#DCF2F2',
    '#FFECDB',
    '#f3e3f9',
    '#d6d2f7',
    '#e4eada'
];

@observer
export default class LatencyCost extends React.Component {
    static propTypes = {
        store: PropTypes.object.isRequired
    };

    static toEnvironmentString(infrastructureProvider, infrastructureLocation) {
        return (infrastructureProvider || infrastructureLocation) ? `${infrastructureProvider} ${infrastructureLocation}` : 'NA';
    }

    static addEnvironmentInSingleTraceLatencyCost(rawEdges) {
        return rawEdges.map(edge => ({
            from: {
                ...edge.from,
                environment: LatencyCost.toEnvironmentString(edge.from.infrastructureProvider, edge.from.infrastructureLocation)
            },
            to: {
                ...edge.to,
                environment: LatencyCost.toEnvironmentString(edge.to.infrastructureProvider, edge.to.infrastructureLocation)
            },
            networkDelta: edge.networkDelta
        }));
    }

    static addEnvironmentInAggregatedAverageLatencyCost(rawEdges) {
        return rawEdges.map(edge => ({
            from: {
                ...edge.from,
                environment: LatencyCost.toEnvironmentString(edge.from.infrastructureProvider, edge.from.infrastructureLocation)
            },
            to: {
                ...edge.to,
                environment: LatencyCost.toEnvironmentString(edge.to.infrastructureProvider, edge.to.infrastructureLocation)
            },
            networkDelta: edge.networkDelta,
            count: edge.count
        }));
    }

    static getEnvironments(rawEdges) {
        const environments =
            _.uniqWith(
                _.flatten(rawEdges.map(edge =>
                    [
                        LatencyCost.toEnvironmentString(edge.to.infrastructureProvider, edge.to.infrastructureLocation),
                        LatencyCost.toEnvironmentString(edge.from.infrastructureProvider, edge.from.infrastructureLocation)
                    ])),
                _.isEqual
            );

        return environments.map((environment) => {
            if (environment === 'NA') {
                return {
                    environment: 'NA',
                    background: '#eee',
                    border: '#aaa'
                };
            }
            const index = Math.abs(hashUtils.calculateHash(environment)) % backgroundColors.length;

            return {
                environment,
                background: backgroundColors[index],
                border: borderColors[index]
            };
        }).sort((e1, e2) => e1.environment.localeCompare(e2.environment));
    }

    static createNodes(rawEdges, environmentList) {
        const allNodes = _.flatten(rawEdges.map((edge) => {
            const fromEnv = LatencyCost.toEnvironmentString(edge.from.infrastructureProvider, edge.from.infrastructureLocation);
            const fromServiceName = edge.from.serviceName;

            const toEnv = LatencyCost.toEnvironmentString(edge.to.infrastructureProvider, edge.to.infrastructureLocation);
            const toServiceName = edge.to.serviceName;

            return [{environment: fromEnv, name: fromServiceName}, {environment: toEnv, name: toServiceName}];
        }));

        const uniqueNodes = _.uniqWith(allNodes, _.isEqual);

        return uniqueNodes.map((node, index) => {
            const {environment, name} = node;
            const environmentWithColor = environmentList.find(en => en.environment === environment);

            return {
                ...node,
                id: index,
                label: `<b>${name}</b>\n${environment}`,
                color: {
                    background: environmentWithColor.background,
                    border: environmentWithColor.border,
                    hover: {
                        background: environmentWithColor.border,
                        border: environmentWithColor.border
                    }
                }
            };
        });
    }

    static createSingleTraceEdges(rawEdges, nodes) {
        const edges = [];
        rawEdges.forEach((rawEdge) => {
            const fromIndex = nodes.find(node => node.name === rawEdge.from.serviceName && node.environment === rawEdge.from.environment).id;
            const toIndex = nodes.find(node => node.name === rawEdge.to.serviceName && node.environment === rawEdge.to.environment).id;
            const networkDelta = rawEdge.networkDelta;
            const existingEdge = edges.findIndex(e => e.from === fromIndex && e.to === toIndex);
            if (existingEdge > -1) {
                if (edges[existingEdge] && networkDelta) {
                    edges[existingEdge].networkDelta += networkDelta;
                }
                edges[existingEdge].overlappingEdges += 1;
            } else {
                const isSameEnv = (rawEdge.from.environment === rawEdge.to.environment);
                edges.push({
                    from: fromIndex,
                    to: toIndex,
                    networkDelta,
                    overlappingEdges: 1,
                    color: {
                        color: isSameEnv ? '#333333' : '#dd0000',
                        hover: isSameEnv ? '#333333' : '#dd0000'
                    }
                });
            }
        });
        return LatencyCost.labelSingleTraceEdges(edges);
    }

    static createAggregatedEdges(rawEdges, nodes) {
        const edges = [];
        rawEdges.forEach((rawEdge) => {
            const fromIndex = nodes.find(node => node.name === rawEdge.from.serviceName && node.environment === rawEdge.from.environment).id;
            const toIndex = nodes.find(node => node.name === rawEdge.to.serviceName && node.environment === rawEdge.to.environment).id;
            const networkDelta = rawEdge.networkDelta;
            const count = rawEdge.count;
            const isSameEnv = (rawEdge.from.environment === rawEdge.to.environment);
            edges.push({
                from: fromIndex,
                to: toIndex,
                networkDelta,
                count,
                color: {
                    color: isSameEnv ? '#333333' : '#dd0000',
                    hover: isSameEnv ? '#333333' : '#dd0000'
                }
            });
        });
        return LatencyCost.labelAggregatedEdges(edges);
    }

    static labelSingleTraceEdges(edges) {
        return edges.map((edge) => {
            let label = '';
            if (edge.overlappingEdges > 1) {
                label = edge.networkDelta && `Avg ${Math.round(edge.networkDelta / edge.overlappingEdges)}ms,\n${edge.overlappingEdges} calls`;
            } else {
                label = edge.networkDelta && `${edge.networkDelta / edge.overlappingEdges}ms`;
            }
            return {
                ...edge,
                label
            };
        });
    }

    static labelAggregatedEdges(edges) {
        return edges.map((edge) => {
            const label = `Mean: ${edge.networkDelta}ms\nCount: ${edge.count}`;
            return {
                ...edge,
                label
            };
        });
    }

    static calculateLatencySummary(rawEdges) {
        let networkTime = 0;
        let networkTimeCrossDc = 0;
        let calls = 0;
        let measuredCalls = 0;
        let crossDcCalls = 0;
        let crossDcMeasuredCalls = 0;

        rawEdges.forEach((edge) => {
            const networkDelta = edge.networkDelta ? edge.networkDelta : 0;
            const isMeasured = (edge.networkDelta !== null && edge.networkDelta !== undefined);
            const isSameEnv = (edge.from.environment === edge.to.environment);

            calls += 1;
            if (isMeasured) measuredCalls += 1;
            networkTime += networkDelta;
            if (!isSameEnv) {
                crossDcCalls += 1;
                networkTimeCrossDc += networkDelta;
                if (isMeasured) crossDcMeasuredCalls += 1;
            }
        });

        return {
            networkTime,
            networkTimeCrossDc,
            calls,
            measuredCalls,
            crossDcCalls,
            crossDcMeasuredCalls
        };
    }

    constructor(props) {
        super(props);
        
        this.latencyCost = this.props.store.latencyCost.latencyCost;
        this.latencyCostTrends = this.props.store.latencyCost.latencyCostTrends;

        const latencyCostWithEnvironment = LatencyCost.addEnvironmentInSingleTraceLatencyCost(this.latencyCost);
        const environmentList = LatencyCost.getEnvironments(latencyCostWithEnvironment);

        this.state = {
            latencyCostWithEnvironment,
            environmentList,
            showTrends: false
        };

        this.renderGraph = this.renderGraph.bind(this);
        this.toggleTrends = this.toggleTrends.bind(this);
    }

    componentDidMount() {
        this.renderGraph();
    }

    toggleTrends() {
        if (this.state.showTrends) {
            const latencyCostWithEnvironment = LatencyCost.addEnvironmentInSingleTraceLatencyCost(this.latencyCost);
            const environmentList = LatencyCost.getEnvironments(latencyCostWithEnvironment);

            this.setState({latencyCostWithEnvironment, environmentList, showTrends: false}, () => {
                this.renderGraph();
            });
        } else {
            const latencyCostWithEnvironment = LatencyCost.addEnvironmentInAggregatedAverageLatencyCost(this.latencyCostTrends);
            const environmentList = LatencyCost.getEnvironments(latencyCostWithEnvironment);

            this.setState({latencyCostWithEnvironment, environmentList, showTrends: true}, () => {
                this.renderGraph();
            });
        }
    }

    renderGraph() {
        const {latencyCostWithEnvironment, environmentList, showTrends} = this.state;

        const nodes = LatencyCost.createNodes(latencyCostWithEnvironment, environmentList);
        const edges = showTrends ? LatencyCost.createAggregatedEdges(latencyCostWithEnvironment, nodes) : LatencyCost.createSingleTraceEdges(latencyCostWithEnvironment, nodes);
        const data = {nodes, edges};
        const container = this.graphContainer;
        const options = {
            autoResize: true,
            layout: {
                hierarchical: {
                    enabled: true,
                    sortMethod: 'directed',
                    levelSeparation: 140
                }
            },
            interaction: {
                selectable: false,
                zoomView: false,
                dragView: false,
                hover: true
            },
            nodes: {
                shape: 'box',
                margin: {
                    left: 10,
                    right: 10,
                    bottom: 10
                },
                font: {
                    multi: true,
                    face: 'Titillium Web',
                    size: 12,
                    bold: {
                        size: 14
                    }
                }
            },
            edges: {
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 0.5
                    }
                },
                hoverWidth: 0.5,
                font: {
                    background: '#ffffff',
                    face: 'Titillium Web',
                    size: 15
                },
                color: {
                    color: '#333333'
                }
            },
            physics: {
                hierarchicalRepulsion: {
                    nodeDistance: 180
                }
            }
        };

        // eslint-disable-next-line no-undef
        return new vis.Network(container, data, options);
    }

    render() {
        const {latencyCostWithEnvironment, environmentList, showTrends} = this.state;
        const summary = LatencyCost.calculateLatencySummary(latencyCostWithEnvironment);

        const LatencySummary = () =>
            (<div className="well well-sm">
                <table className="latency-summary">
                    <tbody>
                    <tr>
                        <td>Network time</td>
                        <td>
                            {
                                !showTrends ?
                                <div>
                                    <span className="latency-summary__primary-info">{summary.networkTime}ms</span>
                                    <span>({summary.measuredCalls} measured out of {summary.calls} calls)</span>
                                </div> :
                                <span className="latency-summary__primary-info">Mean: {summary.networkTime}</span>
                            }
                        </td>
                    </tr>
                    <tr>
                        <td>Network time cross datacenters</td>
                        <td>
                            {
                                !showTrends ?
                                    <div>
                                        <span className="latency-summary__primary-info">{summary.networkTimeCrossDc}ms</span>
                                        <span>({summary.crossDcMeasuredCalls} measured out of {summary.crossDcCalls} calls)</span>
                                    </div> :
                                    <span className="latency-summary__primary-info">Mean: {summary.networkTime}</span>
                            }
                        </td>
                    </tr>
                    <tr>
                        <td>Datacenters involved</td>
                        <td>
                            <span className="latency-summary__primary-info">{environmentList.length}</span>
                            <span>
                            {
                                environmentList && environmentList.map(
                                    environment => (
                                        <span
                                            key={Math.random()}
                                            className="dc-marker"
                                            style={{backgroundColor: environment.background, borderColor: environment.border }}
                                        >
                                            {environment.environment}
                                        </span>))
                            }
                            </span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>);

        return (
            <article>
                <LatencySummary />
                <button
                    onClick={this.toggleTrends}
                    className={showTrends ? 'btn btn-primary' : 'btn btn-default'}
                >
                    {showTrends ? 'Show Single Trace Latency' : 'Show Aggregated Average Latency'}
                </button>
                <div ref={(node) => { this.graphContainer = node; }} style={{ height: '600px' }}/>
                <ul>
                    <li>Edges represent network calls, <b>edge value is network latency for the call</b>, or average network latency if there were multiple calls between services</li>
                    <li>Red edges represent cross datacenter calls</li>
                    <li>Nodes represent a service(in a datacenter) calls</li>
                    <li>Network delta value are best estimates</li>
                </ul>
            </article>
        );
    }
}

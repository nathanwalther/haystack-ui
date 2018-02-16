/*
 * Copyright 2017 Expedia, Inc.
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
import {observer} from 'mobx-react';

import ServiceOperationTrendRow from './serviceOperationTrendRow';


@observer
export default class LatencyCost extends React.Component {
    static propTypes = {
        timelineSpans: PropTypes.array.isRequired
    };

    render() {
        const {timelineSpans} = this.props;

        const serviceOperationList = _.uniqWith(timelineSpans.map(span => ({
            serviceName: span.serviceName,
            operationName: span.operationName
        })),
        _.isEqual);

        return (
            <article>
                <table className="trace-trend-table">
                    <thead className="trace-trend-table_header">
                        <th width="40" className="trace-trend-table_cell">Operation</th>
                        <th width="20" className="trace-trend-table_cell">Count</th>
                        <th width="20" className="trace-trend-table_cell">Duration</th>
                        <th width="20" className="trace-trend-table_cell">Success %</th>
                    </thead>
                    <tbody>
                    {
                        serviceOperationList.map(serviceOp => (
                            <ServiceOperationTrendRow serviceName={serviceOp.serviceName} operationName={serviceOp.operationName} />
                        ))
                    }
                    </tbody>
                </table>
            </article>
        );
    }
}

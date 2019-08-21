/*
 * Copyright 2019 Expedia Group
 *
 *         Licensed under the Apache License, Version 2.0 (the 'License');
 *         you may not use this file except in compliance with the License.
 *         You may obtain a copy of the License at
 *
 *             http://www.apache.org/licenses/LICENSE-2.0
 *
 *         Unless required by applicable law or agreed to in writing, software
 *         distributed under the License is distributed on an 'AS IS' BASIS,
 *         WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *         See the License for the specific language governing permissions and
 *         limitations under the License.
 */

const Q = require('q');

const fetcher = require('./fetcher');
const extractor = require('./graphDataExtractor');

const connector = {};

function fetchServiceInsights(serviceName, startTime, endTime, limit, relationship) {
    const relationshipFilter = relationship ? relationship.split(',') : [];
    return fetcher(serviceName)
        .fetch(serviceName, startTime, endTime, limit)
        .then((data) => extractor.extractNodesAndLinks(data, relationshipFilter));
}

connector.getServiceInsightsForService = (serviceName, startTime, endTime, limit, relationship) =>
    Q.fcall(() => fetchServiceInsights(serviceName, startTime, endTime, limit, relationship));

module.exports = connector;

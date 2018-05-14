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

import axios from 'axios';
import {action, observable} from 'mobx';
import {fromPromise} from 'mobx-utils';

import {toDurationMicroseconds} from '../utils/presets';
import {toQueryUrlString} from '../../../utils/queryParser';
import {ErrorHandlingStore} from '../../../stores/errorHandlingStore';

export function formatResults(results) {
    return results.map((result) => {
        const flattenedResult = {...result};
        flattenedResult.rootUrl = result.root.url;
        flattenedResult.rootOperation = `${result.root.serviceName}: ${result.root.operationName}`;
        flattenedResult.rootError = result.root.error;
        flattenedResult.operationDuration = result.queriedOperation && result.queriedOperation.duration;
        flattenedResult.operationError = result.queriedOperation && result.queriedOperation.error;
        flattenedResult.operationDurationPercent = result.queriedOperation && result.queriedOperation.durationPercent;
        flattenedResult.serviceDuration = result.queriedService.duration;
        flattenedResult.serviceDurationPercent = result.queriedService.durationPercent;

        return flattenedResult;
    });
}

export class TracesSearchStore extends ErrorHandlingStore {
    @observable traceResultsPromiseState = { case: ({empty}) => empty() };
    @observable timelinePromiseState = null;
    @observable searchQuery = null;
    @observable searchResults = [];
    @observable timelineResults = {};

    @action fetchSearchResults(query) {
        const formattedQuery = query;
        if (!query.startTime) formattedQuery.startTime = ((Date.now() * 1000) - toDurationMicroseconds(query.timePreset));
        if (!query.endTime) formattedQuery.endTime = Date.now() * 1000;
        if (query.operationName === 'all') formattedQuery.operationName = null;

        const queryUrlString = toQueryUrlString({...formattedQuery,
            serviceName: decodeURIComponent(formattedQuery.serviceName),
            operationName: formattedQuery.operationName === 'all',
            startTime: formattedQuery.startTime,
            endTime: formattedQuery.endTime,
            timePreset: null
        });
        console.log(queryUrlString)
        this.fetchTraceResults(queryUrlString);
        this.fetchTimeline(queryUrlString);

        this.searchQuery = formattedQuery;
    }

    @action fetchTraceResults(queryUrlString) {
        this.traceResultsPromiseState = fromPromise(
            axios
                .get(`/api/traces?${queryUrlString}`)
                .then((result) => {
                    this.searchResults = formatResults(result.data);
                })
                .catch((result) => {
                    this.searchResults = [];
                    TracesSearchStore.handleError(result);
                })
        );
    }

    @action fetchTimeline(queryUrlString) {
        this.timelinePromiseState = fromPromise(
            axios
                .get(`/api/traces/timeline?${queryUrlString}`)
                .then((result) => {
                    this.timelineResults = result.data;
                })
                .catch((result) => {
                    this.timelineResults = [];
                    TracesSearchStore.handleError(result);
                })
        );
    }
}

export default new TracesSearchStore();

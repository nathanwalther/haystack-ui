/*
 * Copyright 2017 Expedia, Inc.
 *
 *       Licensed under the Apache License, Version 2.0 (the "License");
 *       you may not use this file except in compliance with the License.
 *       You may obtain a copy of the License at
 *
 *           http://www.apache.org/licenses/LICENSE-2.0
 *
 *       Unless required by applicable law or agreed to in writing, software
 *       distributed under the License is distributed on an "AS IS" BASIS,
 *       WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *       See the License for the specific language governing permissions and
 *       limitations under the License.
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import HomeSearchBox from './homeSearchBox';
import './home.less';
import WorkInProgress from '../common/workInProgress';

const Home = ({history}) => (
    <article>
        <HomeSearchBox history={history}/>
        <article className="container home-panel">
            <section className="row">
                <WorkInProgress/>
            </section>
        </article>
    </article>
);

Home.propTypes = {
    history: PropTypes.object.isRequired
};

export default Home;

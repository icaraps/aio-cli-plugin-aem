/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ~ Copyright 2022 Adobe
 ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");
 ~ you may not use this file except in compliance with the License.
 ~ You may obtain a copy of the License at
 ~
 ~     http://www.apache.org/licenses/LICENSE-2.0
 ~
 ~ Unless required by applicable law or agreed to in writing, software
 ~ distributed under the License is distributed on an "AS IS" BASIS,
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ~ See the License for the specific language governing permissions and
 ~ limitations under the License.
 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

require('dotenv').config();
const { flags } = require('@oclif/command');
const axios = require('axios').default;

const BaseCommand = require("../../../base-command");

class SetRootCommand extends BaseCommand {
    async doRun(args) {
        const { flags, argv } = args;

        const { host, user, imsToken, pass, spaVersion } = flags;
        const ROOT_PATH = argv[0];

        // Get application url
        const url = `https://${process.env.AIO_runtime_namespace}.adobeio-static.net/api/v1/web/actions/pages`;
        this.log(`Deployed application is located at ${url}.`);

        // Define form payload based on SPA editor version
        const params = new URLSearchParams();
        if (spaVersion === '2.0') {
            params.append('./remoteURL', url);
        } else {
            params.append('./remoteSPAUrl', url);
        }

        const axiosOptions = {
            method: 'POST',
            url: `${host}${ROOT_PATH}/_jcr_content`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: params.toString(),
        };

        // Apply AEM authentication
        if (imsToken) {
            this.log('Login via IMS');
            axiosOptions.url = axiosOptions.url + '?configid=ims';
            axiosOptions.headers['authorization'] = `Bearer ${imsToken}`;
        } else {
            this.log(`Login as local user ${user}.`);
            axiosOptions.auth = {
                username: user,
                password: pass
            }
        }

        // Update property on AEM root page
        const response = await axios(axiosOptions);

        if (response.status !== 200) {
            this.error('There was an error when updating the AEM page.');
        }

        this.log(`AEM root page "${ROOT_PATH}" was updated with the deployed application URL.`);
    }
}

SetRootCommand.flags = Object.assign({}, BaseCommand.flags, {
    host: flags.string({
        char: 'h',
        description: 'AEM hostname',
        default: 'http://localhost:4502'
    }),
    user: flags.string({
        char: 'u',
        description: 'AEM username. Please provide either username and password or an IMS token.',
        default: 'admin'
    }),
    pass: flags.string({
        char: 'p',
        description: 'AEM password',
        default: 'admin'
    }),
    imsToken: flags.string({
        char: 'i',
        description: 'IMS Token. Please provide either username and password or an IMS token.',
        env: 'IMS_TOKEN'
    }),
    spaVersion: flags.string({
        char: 's',
        description: 'Version of the SPA editor. Supported values are: 1.5 and 2.0',
        default: '1.5',
    })
});

SetRootCommand.args = [{
    name: 'root_page',
    required: true,
    description: `Path to the root page of your AEM project.`
}];

SetRootCommand.strict = false;

SetRootCommand.description = `Updates the remote SPA configuration property of your AEM project to the 
location your SPA is deployed to. This will only work if you used aio to 
bootstrap and deploy your SPA.

Authentication to AEM can be done either via IMS or username and password. Either
provide the values as flags or use the IMS_TOKEN environment variable.

Please also specify the version of the SPA / Universal Editor your project is using.
The version can be derived from the main page component you are using.

spa-project-core/components/remotepagenext -> Version 1.5
spa-project-core/components/page -> Version 2.0`;

SetRootCommand.examples = [
    '$ aio aem:spa-set-root -s 1.5 /content/wknd/us/en',
    '$ aio aem:spa-set-root -u admin -p admin -h http://localhost:4502 -s 2.0 /content/wknd/us/en',
    '$ aio aem:spa-set-root -i IMS_TOKEN -h https://author.adobeaemcloud.com/ /content/wknd/us/en'
];

SetRootCommand.aliases = [
    'aem:spa:set-root'
];

module.exports = SetRootCommand;

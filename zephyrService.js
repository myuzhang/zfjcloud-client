const jwt = require('json-web-token');
const request = require('request');
const syncRequest = require('sync-request');
const crypto = require('crypto');

module.exports = class Zephyr {
        constructor(accessKey, secretKey, user) {
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.user = user;

        this.cloudUrl = 'https://prod-api.zephyr4jiracloud.com/connect';
        this.cloudApiUrl = `${this.cloudUrl}/public/rest/api/1.0`
    }

    // The method is from https://github.com/nickguimond/ZAPI under MIT
    callZapiCloud(isAsync, method, apiUrl, contentType, body) {
        const hash = crypto.createHash('sha256');
        const iat = new Date().getTime();
        const exp = iat + 3600;
        const BASE_URL = this.cloudUrl;
        let RELATIVE_PATH = apiUrl.split(BASE_URL)[1].split('?')[0];
        let QUERY_STRING = apiUrl.split(BASE_URL)[1].split('?')[1];
        let CANONICAL_PATH;
        if (QUERY_STRING) {
            CANONICAL_PATH = `${method}&${RELATIVE_PATH}&${QUERY_STRING}`;
        } else {
            CANONICAL_PATH = `${method}&${RELATIVE_PATH}&`;
        }
    
        hash.update(CANONICAL_PATH);
        let encodedQsh = hash.digest('hex');
    
        let payload = {
            'sub': this.user,
            'qsh': encodedQsh,
            'iss': this.accessKey,
            'iat': iat,
            'exp': exp
        };
    
        let token = jwt.encode(this.secretKey, payload, 'HS256', function(err, token) {
            if (err) { console.error(err.name, err.message); }
            else { return token; }
        });

        if (isAsync === true) {
            let options = {
                method: method,
                'url': apiUrl,
                headers: {
                    'zapiAccessKey': this.accessKey,
                    'Authorization': 'JWT ' + token,
                    'Content-Type': contentType
                },
                json: body
            };
        
            let result = this.getRequestPromise(false, options);
            return result;
        } else {
            let options = {
                headers: {
                    'zapiAccessKey': this.accessKey,
                    'Authorization': 'JWT ' + token,
                    'Content-Type': contentType
                },
                body: body
            }
    
            var res = syncRequest(method, apiUrl, options);
            return JSON.parse(res.getBody('utf8'));
        }
    }

    getRequestPromise(debug, params) {
        return new Promise(function(resolve, reject) {
            request(params, function(error, response, body) {
                if (error) return reject(error);
                if (debug) {
                    console.log(params);
                    console.log(body);
                }
                resolve(body);
            });
        }).catch(function(e) { console.log(`An error had occured with the api call: "${e}"`); });
    }

    getAllCycles(jiraProjectId, jiraProjectVersion) {
        return this.callZapiCloud(false, 'GET', `${this.cloudApiUrl}/cycles/search?expand=executionSummaries&projectId=${jiraProjectId}&versionId=${jiraProjectVersion}`, 'text/plain');
    }

    getAllExecutionsByIssue(issueId, jiraProjectId) {
        let offset = 0;
        let allExecutions = [];
        let executions = this.callZapiCloud(false, 'GET', `${this.cloudApiUrl}/executions?issueId=${issueId}&offset=${offset}&projectId=${jiraProjectId}`, 'text/plain')
        if (executions.totalCount > 0) {
            var totalCount = executions.totalCount;
            var maxAllowed = executions.maxAllowed;
            allExecutions = executions.executions;
        }

        for (offset = maxAllowed; offset < totalCount; offset += maxAllowed) {
            executions = this.callZapiCloud(false, 'GET', `${this.cloudApiUrl}/executions?issueId=${issueId}&offset=${offset}&projectId=${jiraProjectId}`, 'text/plain')
            allExecutions = allExecutions.concat(executions.executions);
        }

        return allExecutions
    }

    getAllExecutionsByIssueInVersion(issueId, versionId, jiraProjectId) {
        return this.getAllExecutionsByIssue(issueId, jiraProjectId).filter(e => e.execution.versionId == versionId);
    }

    updateExecution(executionId, cycleId, jiraProjectId, versionId, issueId, testStatus) {
        return this.callZapiCloud(true, 'PUT', `${this.cloudApiUrl}/execution/${executionId}`, 'application/json', { 'status': { 'id': testStatus }, 'projectId': jiraProjectId, 'issueId': issueId, 'cycleId': cycleId, 'versionId': versionId });
    }
}
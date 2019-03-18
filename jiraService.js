const syncRequest = require('sync-request');

module.exports = class Jira {
    constructor(auth, projectName) {
        this.auth = auth;
        this.projectName = projectName;
        this.project = this.getProject();
        this.versions = this.getVersions();
    }

    callJiraApiSync(source, method, payload) {
        let options = {
            headers: {
                'Authorization': `Basic ${this.auth}`,
                'Content-Type': 'application/json'
            },
            body: payload
        };
    
        var res = syncRequest(method, 'https://csrconnect.atlassian.net/rest/api/2/' + source, options);
        return JSON.parse(res.getBody('utf8'));
    }

    getProject() {
        return this.callJiraApiSync('project/' + this.projectName, 'GET');
    }

    getVersions() {
        return this.callJiraApiSync(`project/${this.project.key}/version?maxResults=500&orderBy=-sequence`, 'GET');
    }

    getVersion(versionName) {
        let relatedVersions = this.versions.values.filter(e => e.name == versionName);
        if (relatedVersions.length === 0) {
            throw Error(`${versionName} is not found.`);
        } else if (relatedVersions.length > 1) {
            throw Error(`${versionName} is found more than one in Zephyr, best practise is to make it unique.`);
        } else {
            return relatedVersions[0];
        }
    }

    getIssue(issueName){
        return this.callJiraApiSync(`issue/${issueName}`, 'GET'); 
    }
}
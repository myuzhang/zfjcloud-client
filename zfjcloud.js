const Jira = require('./jiraService');
const Zephyr = require('./zephyrService');

module.exports = class ZfjCloud {
    constructor(settings) {
        this.jira = new Jira(settings.jira.apiUrl, settings.jira.auth, settings.projectName);
        this.zephyr = new Zephyr(settings.zephyr.accessKey, settings.zephyr.secretKey, settings.zephyr.user);
    }

    // Test status:
    // Inconclusive = -1,
    // Passed = 1,
    // Failed = 2,
    // InProgress = 3
    updateExecutionResult(versionName, testCaseName, testResult) {
        let issue = this.jira.getIssue(testCaseName);

        let version = this.jira.getVersion(versionName);

        let executions = this.zephyr.getAllExecutionsByIssueInVersion(issue.id, version.id, this.jira.project.id);
        if(executions.length > 0) {
            for(let i = 0; i < executions.length; i++) {
                let execution = executions[i].execution;
                this.zephyr.updateExecution(execution.id, execution.cycleId, execution.projectId, version.id, issue.id, testResult);
            }
        }
    }
}
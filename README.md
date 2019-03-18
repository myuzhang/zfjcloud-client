# zfjcloud-client
The zfjcloud-client is a simple wrapper to call Zephyr and Jira cloud based APIs.

## Note
Currently we only have a method - update test result.
If you need more methods, please shot your requirements to me. Or you refer to https://github.com/nickguimond/ZAPI which has implemented many methods calling Zephyr Apis.

## How to use
**1. Install nmp package:**
```
npm i zfjcloud-client
```

**2. Require the package:**
```
const ZfjCloud = require('zfjcloud-client');
```

**3. Setup the settings, it requires Jira and Zephyr credential:**
```
const settings = {
    jira: {
        url: 'https://yourCompany.atlassian.net'
        auth: '==yourAuthentication=='        
    },
    zephyr: {
        accessKey: 'yourZephyrAccessKey',
        secretKey: 'yourZephyrSecreKey',
        user: 'yourZephyrUserName'
    },
    projectName: 'jiraProjectName'
}
```

**4. Create ZfjCloud object:**
```
const cloud = new ZfjCloud(settings);
```

**5. Update test result by passing the version name and test name and test result (passed is 1 and failed is 2):**
```
cloud.updateExecutionResult('1.0.0', 'MZ-1234', 1);
```
*The above method will update all executions with the same issue name in the version.*

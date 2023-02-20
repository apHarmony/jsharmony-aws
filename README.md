# =============
# jsharmony-aws
# =============

AWS integration for jsharmony projects

## Installation

npm install jsharmony-aws --save

## Initial Configuration

Add to your config file
```
var jsHarmonyAWS = require('jsharmony-aws');

....

  jsh.AddModule(new jsHarmonyAWS());

  var configAWS = config.modules['jsHarmonyAWS'];
  if (configAWS) {
    configAWS.region = '.............';
    configAWS.credentials.accessKeyId = '.............';
    configAWS.credentials.secretAccessKey = '.............';
  }
```

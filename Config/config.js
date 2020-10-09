
var HtmlReporter = require('protractor-beautiful-reporter');

exports.config = {
specs:['./../Actual code/Addtopic.js'],
    
allScriptsTimeout: 1200000,
getPageTimeout: 1200000,
jasmineNodeOpts: {
  defaultTimeoutInterval: 1200000,
},
capabilities: {
  'browserName': 'chrome',
  'shardTestFiles': true,
  'maxInstances': 1,
  'chromeOptions': {
  'args': ['--disable-notifications'],
  }
},

params:
{
  time:4000,
  longtime:5000,
  long:5000
},
onPrepare: function() {
  browser.waitForAngularEnabled(false);
  browser.driver.manage().window().maximize();
  jasmine.getEnv().addReporter(new HtmlReporter({ 
    baseDirectory: 'tmp/screenshots',
    preserveDirectory: false, 
  baseDirectory: 'report',
  preserveDirectory: true,
  screenshotsSubfolder: 'images',
  jsonsSubfolder: 'jsons'
  , docTitle: 'Member portal report' 
  }).getJasmine2Reporter());
  }

}

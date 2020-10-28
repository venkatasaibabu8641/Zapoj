var datacode = require('../Sources/Excutexlcode.js');
var first = require('../Complexe code/Tc.js');
const { browser } = require('protractor');

describe('Task manager card CED operations', function () {
        
    it ('User login to the application', function () {

        first.getUrl(datacode.url);
        first.userName(datacode.userName);
        first.password(datacode.password);
        first.loginclick();
    });
    it ('Select the grp and board',function(){
        first.leftgrpname();
        first.clickontaskmanager();
        first.clickonviewalllink();
        first.selectboard();
    })
    it ('Create list and Card',function(){
        first.createlist();
        first.enterlistname();
        first.clickforcreatelist();
    })






})
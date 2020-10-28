var datacode = require('./../Sources/Excutexlcode.js');
var first = require('./../Complexe code/Tc.js');


const { ExpectedConditions, element, browser } = require('protractor');



describe('Announcement channel Right panel functionality', function () {
        
    it ('User login to the application', function () {

        first.getUrl(datacode.url);
        first.userName(datacode.userName);
        first.password(datacode.password);
        first.loginclick();
    });


})

var first = require('./../Commoncode/Uc.js');



it ('User login to the application', function () {

    first.getUrl(datacode.url);
    first.userName(datacode.userName);
    first.password(datacode.password);
    first.loginclick();
    //first.groupclick();
});

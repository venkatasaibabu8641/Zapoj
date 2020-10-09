var datacode = require('../Sources/Excutexlcode.js');
var first = require('../Complexe code/Tc.js');
const { browser } = require('protractor');

describe('Team Calender Functionality', function () {
        
    it ('User login to the application', function () {

        first.getUrl(datacode.url);
        first.userName(datacode.userName);
        first.password(datacode.password);
        first.loginclick();
    });
    it('Select Team',function(){
        first.leftgrpname();
    })
    it('Calender functionlaity',function(){
        first.Menubarcalenderclick();
        first.selectdateincalender();
        first.entercalendername();
    });
    it('Creating a meeting',function(){
        
        first.selectroomsize();
        first.membersselectingformeeting();
        first.createbutton();
        
    })






































})
var datacode = require('../Sources/Excutexlcode.js');
var first = require('../Complexe code/Tc.js');
const { browser } = require('protractor');

describe('One-to-One Maps Functionality', function () {
        
    it ('User login to the application', function () {

        first.getUrl(datacode.url);
        first.userName(datacode.userName);
        first.password(datacode.password);
        first.loginclick();
    });
    it('serach and user click', function (){
        //first.leftgrpname();
        //first.leftchannelname();
       first.pickuserinleftpanel();
       first.clickonmapsicon();       
    }); 
    it('Compare the weather rightpanel and maps right panel',function(){
        //first.groupinnerclick();
        //first.getlocationfromrightpanel();
        //first.closerightpanel();
        first.clickonweatherinmaps();
        //first.getlocationfrommapsrightpanel();
        //expect(first.getlocationfromrightpanel()).toContain(first.getlocationfrommapsrightpanel());
        first.clickonnext24housr();
        first.clickonweekly();
        first.closerightpanel();
    });
    /*it('Location and members route map',function(){
        first.clickonmenubardirection();
        //first.directionfrom();
        //first.keyboardactionsfrom();
        //first.directionto();
        //first.keyboardactionsfrom();
        first.clickonmembersradionutton();
        first.entermembername();
        first.frommemberselectinmembersearch();
        first.entermembernameintoTofield();    
        first.tomemberselectinmemberssearch();
        first.clickonSearchbutton();
        first.closerightpanel();
        first.clearsearchresult();    
    });    */
    it('Members and Teams search',function(){
        first.clickonmenubarmemberandteamsearch();
        first.entermemberandteamsearch();
        first.selectingmemberinMemberandTeamsearch();
        first.keyboardactionsfrom();
        first.clearsearchresult();
    });
    it('Location search',function(){
        first.clickonmenubarlocationsearch();
        first.enterlocation();
        first.keyboardactionsfrom();
    });























})   
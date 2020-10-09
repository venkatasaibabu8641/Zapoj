var datacode = require('../Sources/Excutexlcode.js');
var first = require('../Complexe code/Tc.js');
const { browser } = require('protractor');

describe('Chat thread Right panel functionality', function () {
        
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
});
    it('Enter the text and send it',function(){
        first.searchbar("Saibabu");
        first.clicksend();
});
    it('click on the thread and compare',function() {
        first.mousehover();
        first.threadclick();
        first.threadsearch("Hello");
        first.threadsendclick();
    });
    
    it('Compare edit message',function(){
    expect(first.threadmessagecompare()).toContain("Hello");
        first.threadmousehover();
        first.threadmessageeditclick();
        first.entereditmessage();
        first.enterclickthread();
    expect(first.threadmessagecompare()).toContain("Helloedit");
   
});
    it('Enter url',function(){
        first.threadsearch("www.facebook.com");
        first.threadsendclick();
        //first.threadurlclick();
        //expect(browser.driver.getCurrentUrl()).toContain("https://www.facebook.com/");
    });

    // it("should close the second tab and return to the first tab", function() {
    //     browser.getAllWindowHandles().then(function (handles) {
    //         expect(browser.driver.getUrl()).toContain("https://www.facebook.com/");
    //         browser.driver.sleep(3000);
    //         browser.driver.close();
    //         browser.switchTo().window(handles[1]);
    //     });
   // });

    it('Image upload and download',function(){
        first.uploadDocFileinthread();
        first.threadimagepreview();
        first.previewclose();
        first.mousehoveronfile();
        first.threadimagedownload();
});                                     
    it('Send Emoji',function(){
        first.threademoij();
        first.selectthreademoji();
        first.threadsendclick();
    expect(element(by.css(".icon-ng2_em_hourglass")).isPresent());
});
    it('Snippet send',function(){    
        first.sinneptclick();
        first.threadtext();
        first.sharesnnipetbutton();
    expect(first.snippetmessagecompare()).toContain("This is snippet");
});
    it('Edit snippet',function(){
        first.snippetmousehover();
        first.snippetmessageeditclick();
        first.snippeteditsendmessage();
        first.updatesnippetbutton();
     expect(first.snippetmessagecompare()).toContain("This is snippetedit");
        first.logout();
});


})


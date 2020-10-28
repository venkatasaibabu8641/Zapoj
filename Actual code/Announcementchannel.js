
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
    it ('Create channel click',function(){

        first.createchannel();
        first.channelname();
        first.channeldescription();
        first.announcementbuttonclick();
        first.enterletterinsearch();
        first.searchmembers();
      
        //first.selectallmemberscheckbox();
        first.createchannelbuttonclick();
        first.leftchannelname();

    });

    it ('Checking the Private Channel name', function()  {
        
        if(first.comparinggrpnames())
        {
                expect("channelnamesame").toBe("channelnamesame");
                first.leftchannelname();
        }
        else
        {
            expect("channelnamenotsame").toBe("channelnamesame");
            first.logout();
        }

    });
        it ("Checking the rightside panel opened or not in channel",function() {

            if (first.comparinrightgrpnames())
        {
                expect("rightsidechannelnamesame").toBe("rightsidechannelnamesame");
                first.groupinnerclick();
        }
        else
        {
            expect("rightsidechannelnamenotsame").toBe("rightsidechannelnamesame");
            first.logout();
        }

     });
        it ("Checking the Channelname,members count,Created-by,Created-on in Channel profile Tab",function() {
              
            expect(first.channelnameinrightpanel()).toContain(first.getrightpanelchannelname());
            expect(first.announcementrightpanelchannelname()).toContain("Automationchannelannouncement")
            expect(first.headermembercount()).toContain(first.announcementrightpanelmemberscount());
            expect(first.announcementrightpanelcreatedby()).toContain("Padma Bollu");
            expect(first.announcementrightpanelcreateddate()).toContain("2020");
     });
        it ("Channel members Tab",function() {

            first.rightpgroup();
            expect(first.headermembercount()).toContain(first.rightgroupcount());

        });
        it ("Upload file functionlaity of Shared file Tab", function() {
            
            first.uploadDocFile();
            first.closerightpanel();
        });

        it ("Delete file functionality of shared file tab",function() {

            browser.driver.sleep(6000);
            first.groupinnerclick();
            first.sharefileclick();
            first.mousehoveronfile();
            first.options();
            first.deletefile();
            first.closerightpanel();
            first.groupinnerclick();
            first.sharefileclick();
            expect(element(by.xpath("//a[.='images37.jpg']")).isPresent());       
        });

    
        it("Pinned message functionlaity of pinnedmessage Tab",function() {
        first.searchbar();
        first.clicksend();
        first.mousehover();
        first.options();
        first.pinmessageoptions();
        first.groupinnerclick();
        first.pinmessageclick();
        expect(element(by.css(".rightbar-msg")).getText()).toBe("india");
// // // // //-------- for unpinned fuctionlaity--------------------/////
        first.mousehoverpinmessage();
        first.clickOnpinnedmessagesDeleteOption(); 
        first.closerightpanel();
        first.groupinnerclick();
        first.pinmessageclick();
        expect(element(by.cssContainingText('.mb-0.rightbar-msg', "ppf")).isPresent());

    });
    
        it ('Right panel close and logout',function(){

            first.closerightpanel();
            first.logout();
        });
                
                
    
})















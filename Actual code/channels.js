
var datacode = require('./../Sources/Excutexlcode.js');
var first = require('./../Complexe code/Tc.js');


const { ExpectedConditions, element, browser } = require('protractor');



describe('Public channel Right panel functionality', function () {
        
    it ('User login to the application', function () {

        first.getUrl(datacode.url);
        first.userName(datacode.userName);
        first.password(datacode.password);
        first.loginclick();
        //first.searchusernameclick();

    });   
    it ('Create channel click',function(){

        first.createchannel();
        first.channelname();
        first.channeldescription();
        first.generalchannelrbuttonclick();
        first.enterletterinsearch();
        first.searchmembers();
      
        //first.selectallmemberscheckbox(); for selecte the checkbox for all members
        first.createchannelbuttonclick();

    });
    // it('Search mebers print',function(){
    //     expect(first.selectedmembernames()).toEqual("ukhefjkeh");
    // })
    

    it ('Checking the Channel name', function()  {

        if(first.comparinggrpnames())
        {
                expect("channelnamesame").toBe("channelnamesame");
                first.leftchannelname();
               //first.instanceclick();

        }
        else
        {
            expect("channelnamenotsame").toBe("channelnamesame");
            first.logout();
        }

    });
        it ("Checking the rightside panel opened or not",function() {

            
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
           // expect(first.channeltypeinrightpanel()).toContain("Public")
            expect(first.headermembercount()).toContain(first.channelmembercountinrightpanel());
            expect(first.createdbychannel()).toContain("Venpallapati"); 
            expect(first.createdondate()).toContain("2020");
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
            expect(element(by.xpath("//a[.='images37.jpg']")).isPresent()).toBe(false);       
         });

    
        it ("Pinned message functionlaity of pinnedmessage Tab",function() {
        first.searchbar();
        first.clicksend();
        first.mousehover();
        first.options();
        first.pinmessageoptions();
        first.groupinnerclick();
        first.pinmessageclick();
        expect(element(by.css(".rightbar-msg")).getText()).toBe("ppf");

// // // // //-------- for unpinned fuctionlaity--------------------/////
        first.mousehoverpinmessage();
        first.clickOnpinnedmessagesDeleteOption(); 
        //driver.refresh();
        first.closerightpanel();
        first.groupinnerclick();
        first.pinmessageclick();
        expect(element(by.cssContainingText('.mb-0.rightbar-msg', "ppf")).isPresent()).toBe(false);

        });
    
        it ('Right panel close and logout',function(){

            first.closerightpanel();
            first.logout();
        });
                
            
    
})















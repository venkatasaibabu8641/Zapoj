
var datacode = require('./../Sources/Excutexlcode.js');
var first = require('./../Complexe code/Tc.js');
//var common = require('./../Commoncode/Uc.js')
const { ExpectedConditions, element, browser } = require('protractor');



describe('Team Right panel functionality', function () {

    it ('User login to the application', function () {

        first.getUrl(datacode.url);
        first.userName(datacode.userName);
        first.password(datacode.password);
        first.loginclick();
        //first.groupclick();
    });

    it ('Checking the Team name', function()  {

        

        if(first.comparinggrpnames())
        {
                expect("groupnamesame").toBe("groupnamesame");
                first.leftgrpname();

        }
        else
        {
            expect("groupnamenotsame").toBe("groupnamesame");
            first.logout();
        }

    });
        it ("Checking the rightside panel opened or not",function() {

            
            if (first.comparinrightgrpnames())
        {
                expect("rightsidegroupnamesame").toBe("rightsidegroupnamesame");
                first.groupinnerclick();
        }
        else
        {
            expect("rightsidegroupnamenotsame").toBe("rightsidegroupnamesame");
            first.logout();
        }

     });
    

        it ("Checking the groupname,members count,Email,Created-by,Created-on in Group profile Tab",function() {
            
            
            expect(first.headermembercount()).toContain(first.rightpmembercount());
            expect(first.email()).toContain("@");
            expect(first.date()).toContain("2020");

     });

        it ("Group members Tab",function() {

            first.rightpgroup();
            expect(first.headermembercount()).toContain(first.rightgroupcount());

        });
    it ("In List of Topic Tab",function(){
       
        first.topicclick();
        first.topiccount();
        expect(first.headertopicscount()).toContain(first.topiccount());

    });

        it ("Upload file functionlaity of Share file Tab", function() {
            // browser.driver.sleep(15000);
            first.uploadDocFile();
            
            first.closerightpanel();
            
           // first.closerightpanel();
            //expect(first.fetchfilename()).toContain("images32.jpg");
            //first.groupinnerclick();
        });

        it ("Delete file functionality of share file tab",function() {

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

            
            

        //     // first.mousehoveronfile();
        //     // first.options();
        //     // first.deletefile();
        //     // first.sharefileclick();
         });

    
        it ("Pinned message functionlaity of pinnedmessage Tab",function() {
        //browser.driver.sleep(15000);
       
        first.searchbar();
        first.clicksend();
        first.mousehover();
        first.options();
        first.pinmessageoptions();
        first.groupinnerclick();
        first.pinmessageclick();
        expect(element(by.xpath("//p[contains(@class,'mb-0 rightbar-msg')]")).getText()).toBe("india");

// // // //-------- for unpinned fuctionlaity--------------------/////
        first.mousehoverpinmessage();
        first.clickOnpinnedmessagesDeleteOption();
        //first.options();
        //first.unpinnedmessage();
        first.closerightpanel();
        first.groupinnerclick();
        first.pinmessageclick();
        expect(element(by.cssContainingText('.mb-0.rightbar-msg', "india")).isPresent());

        });
    
        it ('Right panel close and logout',function(){

            first.closerightpanel();
            first.logout();
        });


    
});



















        

    







        

       
        
    

    

   
   
    
    

   

   


var datacode = require('./../Sources/Excutexlcode.js');
var first = require('./../Complexe code/Backend.js');
//const { ExpectedConditions, browser } = require('protractor');



describe('Login test case', function () {

    it ('User login to the application', function () {

        first.getUrl(datacode.url);
        first.userName(datacode.userName);
        first.password(datacode.password);
        first.loginclick();

    });

    it ('Click on the group link and pinned message', function()  {

        first.groupclick();
       
        first.searchbar();
        first.clicksend();
        first.mousehover();
        first.options();
        first.pinmessageoptions();
        first.groupinnerclick();
        first.pinmessageclick();
        expect(element(by.css(".rightbar-msg")).getText()).toBe("ppf");
        

        
    });

    it('Team profile', function()  {

        first.groupinnerclick();
       // expect(first.teamname()).toBe("Protractor");
       expect(first.checkgroupname()).toBe("groupnamesame");
        expect(first.createduseremail()).toContain("@");
      expect(first.createdondate()).toContain("2020");
    });

    // it('Group members', function(){
    //     //groups members pending
    //     first.rightpgroup();
    //     expect(first.displaygrp()).toBe("Onetoone Chat");
    // });

    it('List of topic', function(){

        first.topicclick();
        expect(first.validatetopic()).toBe("Newautomation");
    });
    
    it('Shared fiels',function(){

        first.sharefileclick();
        expect(first.validateimage()).toBe("filefound")
        first.uploadDocFile();
    });

    it('pinned messages',function(){
        //first.closerightpanel();
        first.pinmessageclick();
        //expect(first.validatepinnedmessage()).toBe("messageispinned");
        first.mousehover();
        first.options();
        first.unpinnedmessage();
        first.closerightpanel();
        first.groupinnerclick();
        first.pinmessageclick();
        expect(element(by.css(".rightbar-msg")).isPresent());
        
   });

//    it ('Right panel and logout',function(){

//         first.closerightpanel();
//         first.logout();
//    })
        



//expect(first.membercount()).toBe("memberscountsame");
         // first.uploadclick();
        //expect(first.countvalidate()).toEqual(10);
        //expect(first.createduseremail()).toContain("@");
        //var path = require('path');

//         it('should upload a file', function() 
// {
//         var fileToUpload = '/images32.jpg',
//         absolutePath = path.resolve(__dirname, fileToUpload);

//             first.searchbar().sendKeys(absolutePath);    
//             element(by.css("path[d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z']")).click();
// });  
        browser.driver.sleep(3000);
        element(by.className('custom-input')).sendKeys("ppf");
        browser.driver.sleep(3000);
        element(by.css(".send-btn")).click();
        browser.driver.sleep(3000);
        element(by.cssContainingText('.contentjustify', 'ppf')).click();
        browser.driver.sleep(3000);
        
        element(by.css(".fa-ellipsis-v")).click();
        browser.driver.sleep(3000);
        element(by.xpath("//a[contains(.,'Pin Message')]")).click();
        element(by.css(".send-btn")).click();
        
        //browser.actions().mouseMove(element(by.css(".calling-background"))).perform();
        //first.moreoptions();
        
       //expect(first.checkgroupname()).toBe("Group name same")
       
        expect(first.teamname()).toBe("Protractor");
        expect(first.membercount()).toBe("4");
        expect(first.createduseremail()).toBe(".com");    
        expect(first.createdondate()).toBe("Wed Jul 08 2020");    
        first.rightpgroup();
        expect(first.displaygrp()).toBe("Onetoone Chat");
        first.topicclick();
        expect(first.validatetopic()).toBe("Newautomation");
        first.sharefileclick();
        expect(first.socketvalidate()).toBe("4k-Laptop-Wallpapers.Jpg");
        first.securefilesclick();
        expect(first.securefilevalidate()).toBe(false);
        first.pinmessageclick();
        expect(first.pinmsgvalidate()).toBe("Automation");
        //first.workspace();
        //first.workspacesearch(datacode.workspacesearch);
        first.logout(); 



})


    
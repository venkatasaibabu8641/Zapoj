
const { browser, element } = require('protractor');
const { lstat } = require('fs');
const { lookupService } = require('dns');
const { format } = require('path');
const { protractor } = require('protractor/built/ptor');

function sleep()
{
 browser.driver.sleep(6000);
}
  

function Grouprightpanle() {
    this.checkleftgrpname;
    this.checkheadgrpname;
    this.checkrightpanelgrpname;
    this.countgrp;
    this.checktopicrightpanelname;
    this.checktopicname;
    
    this.getUrl = function (Url) {
      browser.get(Url);
      sleep();
    }
  
    this.userName = function (Userid) {
      element(by.id('Username')).sendKeys(Userid);
      sleep();
    }
    this.password = function (Password) {
      element(by.id('Password')).sendKeys(Password);
      sleep();
    }

    this.loginclick = function () {
        element(by.buttonText('Login')).click();
        sleep();
    }
//------channel left name xpath----------------------------------------------------//
    this.leftchannelname = function()
    {
      sleep();
       element.all(by.css(".channel-list li")).last().click();
      //b.element(by.tagName("a")).click();
      sleep();
      element.all(by.css(".channel-list li")).last().click();
      sleep();
    }
//-----------------------------------------------------//
      this.leftgrpname = function()
      {
        sleep();
        let b = element.all(by.css(".memberList.group-list.list-unstyled li")).last();
        b.element(by.css('span[class="user-name"]')).click();
      }

      this.comparegrpname = function(){
        sleep();
        let b = element.all(by.css(".memberList.group-list.list-unstyled li")).last();
        this.checkleftgrpname = b.element(by.css('span[class="user-name"]')).getText();

      }
      this.comareheadergrpname = function(){
        sleep();
        this.checkheadgrpname = element(by.xpath("//h4[@class='media-heading pointer']")).getText();
      }
        this.groupinnerclick = function(){
        
          element(by.xpath("//h4[@class='media-heading pointer']")).click();
          sleep();
  
        }
      
  
      this.comparinggrpnames = function(){
        sleep();
        if(this.checkleftgrpname==this.checkheadgrpname)
        {
            return true;
        }
        else
        {
            return false;
        }
      }
      this.getrightpanelgrpname = function(){
        this.checkrightpanelgrpname = element(by.css(".word-break")).getText();

      }
      this.comparinrightgrpnames = function(){
        sleep();
        if(this.checkheadgrpname==this.checkrightpanelgrpname)
        {
            return true;
        }
        else
        {
            return false;
        }
      }

      this.email = function(){
        let a=element(by.css(".tab-pane.active")).all(by.css('.profile-table div')).get(6);
        let b = a.element(by.className("people-count")).getText();
        return b;
      }

      this.date = function(){
        let a=element(by.css(".tab-pane.active")).all(by.css('.profile-table div')).get(9);
        let b = a.element(by.className("people-count")).getText();
        return b;
      }
      
      this.searchbar = function(){
        sleep();
        element(by.className('custom-input')).sendKeys("india");
        sleep();
      }
      this.clicksend = function(){
        element(by.css(".send-btn")).click();
        sleep();
      }
        this.mousehover = function(){
          element(by.cssContainingText('.contentjustify', 'india')).click();
          sleep();
        }
      this.options = function(){
        element(by.css(".fa-ellipsis-v")).click();
        sleep();
      }
      this.pinmessageoptions = function(){
        element(by.xpath("//a[contains(.,'Pin Message')]")).click();
        sleep();
      }
      this.teamname = function(){
        sleep(); 
        return element(by.xpath("//div[@class='profile-table']//span[contains(.,'Protractor')]")).getText();
        
      }
      this.checkgroupname = function(){

      if (element(by.className("media-heading pointer")).getText().toString()==element(by.css("div.profile-table > div:nth-of-type(1) .people-count")).getText().toString())
      {
          return "groupnamesame"
      }
      else
      {
        return "groupnamenotsame"
      }

    }

       this.membercount = function(){
           sleep(); 
      //   return element(by.xpath("//div[@class='profile-table']//span[.='4']")).getText();
      // }

      if (element(by.xpath("//small[.='4 People']")).getText().toString()==element(by.css("div.profile-table > div:nth-of-type(2) .people-count")).getText().toString())
      {
        return "memberscountsame"

      }
      else
      {
        return "memberscountnotsame"
      }
    }


      this.headermembercount = function(){
        sleep();
        return element(by.xpath("//p[@class='text-muted m-0']/small[1]")).getText();
      }

      this.rightpmembercount = function(){
        sleep();
        let a=element(by.css(".tab-pane.active")).all(by.css('.profile-table div')).get(3);
        let b = a.element(by.className('people-count')).getText();
        return b;

      }

//---------------------For topics-----------------
     

      this.topicclick = function(){
        element(by.css("a[title='List of Topic']")).click();
        sleep();
      }

      this.topiccount = function(){
        sleep();
        sleep();
        let a = element(by.css("#topic")).all(by.css('.unstyle-list.workspace-member li')).count();
        //console.log(a)
        //let a = element(by.css('div[class="topic-list-container"]')).all(by.css('.unstyle-list.workspace-member li')).count();
        return a;

      }
      this.headertopicscount = function(){
        sleep();
        return element(by.css("a.text-muted")).getText();
      } 
     
    
      
      //Right panel close
      this.closerightpanel = function(){
        sleep();
        element.all(by.css(".nav.nav-pills.nav-stacked li")).first().click();        //element(by.css("i.fa-close")).click();
       // element(by.xpath("//i[@class='fa fa-close']")).click();
       //element(by.css("a[title='close']")).click();
        sleep();
      }

      this.teamname = function(){
        sleep(); 
        return element(by.xpath("//div[@class='profile-table']//span[contains(.,'Protractor')]")).getText();
        
      }
      this.membercount = function(){
        sleep(); 
        return element(by.xpath("//div[@class='profile-table']//span[.='4']")).getText(); 
      }

      


//Group functionality in the right panel-------------------------------------------//
        
      this.rightpgroup = function(){
           element(by.css("a[title='Group Members']")).click();
           sleep();
       }

       this.rightgroupcount = function(){
         sleep()
         let a = element(by.css(".unstyle-list.workspace-member")).all(by.css('.unstyle-list.workspace-member li')).count();
        return a;
      }

        this.displaygrp = function(){ 
          sleep(); 
          return element(by.xpath("//a[contains(text(),'Onetoone chat')]")).getText();
          
        };

      this.topicclick = function(){
        element(by.css("a[title='List of Topic']")).click();
        sleep();
      };
      
//------------------------------------------code for Socket files--------------------------------------------
      // sleep();
      this.sharefileclick = function(){
        //element(by.xpath("//a[@href='#files']")).click();
        element(by.css("a[title='Shared Files']")).click();
        sleep();
      };

      this.uploadDocFile = function () {
        sleep();
        var path = require('path'),
        uploadInput = element(by.css('input[placeholder="Upload file"]'));
        fileToUpload = __dirname + "/../Sources/images37.jpg",
        absolutePath = path.resolve(__dirname, fileToUpload);
        uploadInput.sendKeys(absolutePath);
        sleep();
      }

      this.checkfile = function(){
        sleep();
        element(by.xpath("//a[.='images37.jpg']"));
      }

      // this.identifythefile = function(){
      //   element(by.xpath("//ul[@class='media-list']/li[21]//p[@class='img-file-des']"))
      // }
      this.mousehoveronfile = function()
      {
        browser.actions().mouseMove(element(by.xpath("//a[contains(@href,'images37.jpg')]"))).perform();
        sleep();
      }
      this.deletefile = function(){
        sleep();
        element(by.xpath("//a[contains(.,'Delete Message')]")).click();
        sleep();
      }
     


      

// Paths for pinned message------------------------code-----------------------------------------------//
      
      this.pinmessageclick = function(){
        element(by.css("a[title='Pin Message']")).click();
        sleep();
      };
  
    
    this.mousehoverpinmessage = function(){
      browser.actions().mouseMove(element(by.cssContainingText('.mb-0.rightbar-msg', 'india'))).perform();
      sleep();
    }

    this.clickOnpinnedmessagesDeleteOption = function()
    {
    sleep();
    let last = element.all(by.css('.unstyle-list.workspace-member.pinned-list li')).last();
    last.element(by.tagName('i')).click();
    sleep();

    }

    this.logout = function(){
      sleep();
      var button = element(by.className('media-object img-circle user-profile-pic-md profile-image'));
      sleep();
      button.click();
      sleep();  
      
    };


//-------------------------- for Public channel functionlaity In Channel profile ----------------//

this.searchusernameclick = function(){
  sleep();
  element(by.css("#userIdvenpallapati")).click();
  sleep();
}

this.createchannel = function(){
  sleep();
  element(by.xpath("//div[@id='leftscroll']/h4[1]//i[@class='fa fa-plus-circle leftscroll-opt-btn']")).click();
  sleep();
}
this.channelname = function(){
  sleep();
  element(by.id("channelName")).sendKeys("Automationchannelannouncement");
  sleep();
}
this.channeldescription = function(){
  element(by.css("[name='channePurpose']")).sendKeys("test purpose")
  sleep();
}
this.generalchannelrbuttonclick = function(){
  element(by.id("generalRadio")).click();

  sleep();
}
this.selectallmemberscheckbox = function(){
  element(by.css(".checkbox-checkmark")).click();
  sleep();
}
this.createchannelbuttonclick = function(){
  sleep();
  element(by.css(".btn.btn-primary.mr-15")).click();
  sleep();
}
this.enterletterinsearch = function(){
  sleep();
  element(by.css("#inputEmail")).sendKeys("a");
  sleep();
}
  this.selectedmembernames = function()
  {
    let a;
    sleep();
    element.all(by.css(".unstyle-list.new-assignee-list.mb-10.edit-channel-list li")).each(function(element, index) {

      //element.all(by.css(".unstyle-list.new-assignee-list.mb-10.edit-channel-list li")).get(index).getText().then(function (text) {
      //  console.log(text);
      //  console.log(index);
      //  if(index<=2){
      //       a =a+text
      //       console.log(a);
      //  }
      //  else{
      //    break;
      //  }
     // expect(element.get(index).getText()).toBe("2114")
      //console.log(index);

      element.getText().then(function(text)
      {
          console.log(text);
      }) 
      return a;
  })

}
this.searchmembers = function(){
  sleep();
  element.all(by.css(".unstyle-list.new-assignee-list.mb-10.edit-channel-list li")).get(0).click();
  element.all(by.css(".unstyle-list.new-assignee-list.mb-10.edit-channel-list li")).get(1).click();
  element.all(by.css(".unstyle-list.new-assignee-list.mb-10.edit-channel-list li")).get(2).click();
 sleep();
}

this.channelnameinrightpanel = function(){
  let a=element(by.css(".tab-pane.active")).all(by.css('.profile-table div')).get(0);
  let b= a.element(by.className('people-count')).getText();
  return b;
}
this.channeltypeinrightpanel = function(){
  let a=element(by.css(".tab-pane.active")).all(by.css('.profile-table div')).get(3);
    let b = a.element(by.className('people-count')).getText();
    return b;
}
this.channelmembercountinrightpanel = function(){
  let a=element(by.css(".tab-pane.active")).all(by.css('.profile-table div')).get(6);
    let b=a.element(by.className('people-count')).getText();
    return b;
}
this.createdbychannel = function(){
  let a=element(by.css(".tab-pane.active")).all(by.css('.profile-table div')).get(9);
    let b = a.element(by.className('people-count')).getText();
    return b;
}
this.channelheadername = function(){
  sleep();
  element(by.xpath("//h4[@class='media-heading pointer']")).getText();
}
this.createdondate = function(){
  let a=element(by.css(".tab-pane.active")).all(by.css('.profile-table div')).last();
    let b = a.element(by.className('people-count')).getText();
    return b;
}
this.getrightpanelchannelname = function(){
  sleep();
 return element(by.xpath("//h4[@class='media-heading pointer']")).getText(); 
}
this.pickchannle = function(){
  sleep();
  element(by.xpath("//ul[@class='memberList channel-list list-unstyled']//li[2]//a")).click();
  sleep();
}

//--------------------------------For Private channel Functionality-----------------------//
  this.privatebuttonclick = function(){
    element(by.xpath("//div[@class='modal-dialog modal-lg']//div[@class='col-sm-12']/div[2]//span[@class='checkmark']")).click();
    sleep();
  }






//--------- For Announcement channel functionlaity--------------------------/////////
this.announcementbuttonclick = function(){
  element(by.xpath("//div[@class='modal-dialog modal-lg']//div[@class='modal-body']//div[2]//span[@class='checkmark']")).click();
  sleep();
}
this.announcementrightpanelchannelname = function(){
  sleep();
  return element(by.xpath("(//div[@class='profile-table']//span)[1]")).getText();
}
this.announcementrightpanelmemberscount = function(){
  sleep();
  return element(by.xpath("(//div[@class='profile-table']//span)[2]")).getText();
}
this.announcementrightpanelcreatedby = function(){
  sleep();
  return element(by.xpath("(//div[@class='profile-table']//span)[3]")).getText();
}
this.announcementrightpanelcreateddate = function(){
  sleep();
  return element(by.xpath("(//div[@class='profile-table']//span)[4]")).getText();
}


//-------------------------------------------------------------------//
this.instanceclick = function(){
   element.all(by.css(".memberList.list-unstyled.member-only li")).last().click();
}

  

//--------------Chat thread rightpanel-------------------------------------------//

this.pickuserinleftpanel = function() {
  sleep();
  element(by.xpath("//ul[@class='memberList list-unstyled member-only']//span[@id='userId0']")).click();
  
}
this.threadclick = function() {
  element(by.xpath("//div[@class='btn-group btn-group-sm  chatOptions chatoptiondropdown']/button[1]")).click();
  sleep();
}
this.threadsearch = function(text){
  element(by.id("thread")).sendKeys(text);
}
this.threadsendclick = function(){
  sleep();
  element(by.xpath("//div[@class='tab-content']//div[@class='btmBar']//span[@class='input-group-addon no-bdr-left send-btn bg-white']")).click();
}
this.uploadDocFileinthread = function () {
  sleep();
  var path = require('path'),
  uploadInput = element(by.xpath("//div[@class='tab-content']//div[@class='btmBar']//span[3]//input"));
  fileToUpload = __dirname + "/../Sources/images37.jpg",
  absolutePath = path.resolve(__dirname, fileToUpload);
  uploadInput.sendKeys(absolutePath);
  sleep();
}
this.threadimagepreview = function(){ 
  sleep();
  element(by.xpath("//span[@class='img-type-file d-block p-relative']//img")).click();
  sleep();
}
this.previewclose = function(){
  element(by.css(".close.cls-btn")).click();
}
this.threadimagedownload = function(){
  sleep();
  //browser.actions().mouseMove(element(by.xpath("//span[@class='img-type-file d-block p-relative']//img"))).perform();
  //element(by.xpath("//span[@class='img-type-file d-block p-relative']//li")).click();
  element(by.xpath("//span[@class='download-link pointer']")).click();

  sleep();
}
this.threademoij = function(){
  element(by.xpath("//div[@class='tab-content']//div[@class='btmBar']//span[2]")).click();
  sleep();
}
this.selectthreademoji = function(){
  sleep();
  element(by.css(".icon-ng2_em_hourglass")).click();
  
}
this.sinneptclick = function(){
  element(by.xpath("//div[@class='tab-content']//div[@class='btmBar']//span[1]")).click();
  sleep();
}
this.threadtext = function(){
  element(by.className('ace_text-input')).sendKeys("This is snippet");
  sleep();
}
this.sharesnnipetbutton = function(){
  element(by.xpath("//button[.='Share Snippet']")).click();
  sleep();
}
this.updatesnippetbutton = function(){
  element(by.xpath("//button[.='Update Snippet']")).click();
  sleep();
}
this.snippetmessagecompare = function(){
  sleep();
 return element(by.xpath("//div[@class='ace_layer ace_text-layer']//div")).getText();
}
this.snippetmousehover = function(){
  sleep();
 browser.actions().mouseMove(element(by.xpath("//div[@class='ace_layer ace_text-layer']//div"))).perform();
  sleep();
}
this.snippetmessageeditclick = function(){
  sleep();
 element(by.xpath("//div[@class='new-msg']//li[5]//i[@class='fa fa-pencil text-muted align-center pointer']")).click();
  sleep();
}
this.snippeteditsendmessage = function(){
  element(by.xpath("//div[@class='snipet-body']//textarea")).sendKeys("edit");
  sleep();
}
this.threadmousehover = function(){
  element(by.cssContainingText('.contentjustify', 'Hello')).click();
  sleep();
}
this.threadmessagecompare = function(){
  sleep();
 return element(by.xpath("//span[@class='d-block p-relative break-word']//span[@class='contentjustify']//span")).getText();
}

this.threadmessageeditclick = function(){
  sleep();
  element(by.css("div.new-msg li:nth-of-type(1) span:nth-of-type(2) i:nth-of-type(1)")).click();
  sleep();
}
this.entereditmessage = function(){
  sleep();
  element(by.name('replyMessage')).sendKeys("edit");
}
this.enterclickthread = function(){
  sleep();
element(by.name('replyMessage')).sendKeys(protractor.Key.ENTER);   
}
this.threadurlclick = function(){
  sleep();
  element(by.xpath("//span[@class='d-block p-relative break-word']//a")).click();
  sleep();
}
this.compareurl = function(){
  sleep();
  return browser.getCurrentUrl().getText();
}


//------------------------------------------Add topics functionality-----------------------------------------------//
this.opttopicclick = function(){
  element(by.xpath("//a[contains(.,'Create Topic')]")).click();
  sleep();
}
this.entertopicname = function(text){
  element(by.css("#topicname")).sendKeys(text);
}
this.searchmembersfortopic = function(){
  sleep();
  element(by.css(".instant-list-container")).all(by.css(".unstyle-list.new-assignee-list.mb-10 li")).get(0).click();
  element(by.css(".instant-list-container")).all(by.css(".unstyle-list.new-assignee-list.mb-10 li")).get(1).click();
  element(by.css(".instant-list-container")).all(by.css(".unstyle-list.new-assignee-list.mb-10 li")).get(2).click();
  sleep();
}
this.createtopicbuttonclick = function(){
  element(by.xpath("//button[contains(.,'Create Topic')]")).click();
  sleep();
}
this.createbuttononthepopup = function(){
  element(by.xpath("//button[.='Create']")).click();
  sleep();
}
this.opentopicbyclick =function(){
  element(by.xpath("//a[.='Thistopic']")).click();
  sleep();
}
this.topicsearchbar = function(text){
  element(by.id("topic")).sendKeys(text);
  sleep();
}
this.topicsendclick = function(){
  element(by.xpath("//div[@class='rightbar-body right-inside-body topic-chat-body ']//span[4]")).click();
  sleep();
}
this.topicedit = function(){
  sleep();
  element(by.xpath("//i[@class='fa fa-pencil text-muted edit-icon align-center pointer']")).click();
  sleep();
}
this.topicmessagecompare = function(){
  sleep();
 return element(by.xpath("//div[@class='new-msg']//span[@class='contentjustify']//span")).getText();
}
this.topicurlclick = function(){
  sleep();
  element.all(by.css(".mb-0.rightbar-msg.p-relative p")).last().click();
  sleep();
}
this.attherateuserclick = function(){
  sleep();
  element(by.xpath("//div[@class='mention-member-list']//li[@class='pointer ']//span//a")).click();
}
this.topicsnippeteditclick = function(){
  sleep();
  element(by.xpath("//ul[@class='unstyle-list workspace-member topic-conversation']/li[5]//i[@class='fa fa-pencil text-muted edit-icon align-center pointer']")).click();
  //let last = element.all(by.css('.unstyle-list.workspace-member.topic-conversation li')).get(5);
  //last.element(by.css('i[class="fa fa-pencil text-muted edit-icon align-center pointer"]')).click();  
}
this.topicmembersnavtab = function(){
  sleep();
  element(by.xpath("//ul[@class='nav nav-pills nav-stacked']//i[@class='fa fa-users']")).click();
}
this.listoftopicsclick = function(){
  sleep();
  element(by.xpath("//ul[@class='nav nav-pills nav-stacked']//i[@class='fa fa-pencil']")).click();
}
this.gettopicrightpanelheader = function(){
  sleep();
  this.checktopicrightpanelname = element(by.xpath("//h3[@class='capitalize flex-1']")).getText();
}
this.gettopicname =function(){
  sleep();
 this.checktopicname = element(by.xpath("//a[.='Thistopic']")).click();
}
this.comparintopicnames = function(){
  sleep();
  if(this.checktopicname==this.checktopicrightpanelname)
  {
      return true;
  }
  else
  {
      return false;
  }
}
this.topicimagepreview = function(){
  sleep();
  element(by.xpath("//span[@class='img-type-file']//img")).click();
  sleep();
}
this.topicimagedownload = function(){
  sleep();
  element(by.xpath("//span[@class='img-type-file']//p")).click();
}
this.addtopiclistcount = function(){
  sleep();
 let a = element(by.css("div.topic-list-container")).all(by.css(".d-flex li")).count();
 return a;
}
//----------------------One to One Maps Functionlaity-------------------------------------//
this.clickonmapsicon = function(){
  sleep();
  element(by.css("ul.navbar-nav.navbar-right.service-nav>li>a[title='Navigation']")).click();
  sleep();
  sleep();
}
this.getlocationfromrightpanel = function(){
  sleep();
 let a = element(by.xpath("(//div[@class='col-lg-4 col-md-5 col-sm-5 right-sidebar p-0 right-sidebar1']//span[@class='people-count'])[4]")).getText();
 return a;
}
this.clickonweatherinmaps = function(){
  sleep();
  element(by.xpath("//div[@class='btn-group pull-left']//button//i[@class='fa fa-snowflake-o']")).click();
}
this.getlocationfrommapsrightpanel = function(){
  sleep();
 let b = element(by.xpath("//div[@class='flex-1 ml-5']//span[@class='group-name d-block']")).getText();
 return b;
}
this.clickonnext24housr = function(){
  sleep();
  element(by.xpath("//button[contains(text(),'Next 24 Hours')]")).click();
  sleep();
}
this.clickonweekly = function(){
  sleep();
 element(by.xpath("//button[contains(text(),'Weekly')]")).click();
 sleep();
}
this.clickonmenubardirection = function(){
  sleep();
  element(by.xpath("//div[@class='btn-group pull-left']//button//i[@class='fa fa-location-arrow']")).click();
}
this.directionfrom = function(){
  sleep();
  element(by.css("#search_from")).sendKeys("vijayawada");
  sleep()
;  //element(by.css("#search_from")).sendKeys(protractor.Key.SHIFT).sendKeys(protractor.Key.ENTER).perform();
  //browser.actions().keyDown(Protractor.Key.SHIFT).perform();
  //browser.actions().sendKeys(protractor.Key.ENTER).perform();
}
this.directionto = function(){
  sleep();
  element(by.css("#search_to")).sendKeys("guntur");
}
this.keyboardactionsfrom = function(){
  sleep();
  // var arrowdown =browser.actions().sendKeys(protractor.Key.ARROW_DOWN);
  // arrowdown.perform();
  // var enter = browser.actions().sendKeys(protractor.Key.ENTER);
  // enter.perform();
  element(by.xpath("//div[@class='pac-container pac-logo']/div[1]/span[3]")).click();
  sleep();
}
this.clickonmembersradionutton = function(){
  sleep();
  element(by.css("#users")).click();
}
this.entermembername = function(){
  sleep();
  element(by.css("#search_from")).sendKeys("rakesh kondabala");
}
this.frommemberselectinmembersearch = function(){
  sleep();
  element.all(by.css(".mb-0.list-unstyled.member-seach-list.list-group li")).get(0).click();
  sleep();
}
this.entermembernameintoTofield = function(){
  sleep();
  element(by.css("#search_to")).sendKeys("venkata");
}
this.tomemberselectinmemberssearch = function(){
  sleep();
  element.all(by.css(".mb-0.list-unstyled.member-seach-list.list-group li")).get(0).click();
  sleep();
}
this.clickonSearchbutton = function(){
  sleep();
  element(by.css("button.btn.btn-primary.btn-sm.link")).click();
  sleep();
  sleep();
}
this.clearsearchresult = function(){
  sleep();
  element(by.css("i.fa.fa-eraser")).click();
  sleep();
}

this.clickonmenubarmemberandteamsearch = function(){
  sleep();
  element(by.css("button>i.fa.fa-users")).click();
}
this.entermemberandteamsearch = function(){
  sleep();
  element(by.css("#User")).sendKeys("nagaraju shaku");
}
this.selectingmemberinMemberandTeamsearch = function(){
  sleep();
  element.all(by.css(".unstyle-list.new-assignee-list.mb-10 li")).get(0).click();
  sleep();
}
this.clickonmenubarlocationsearch = function(){
  sleep();
  element(by.css("button>i.fa.fa-map-marker")).click();
}
this.enterlocation = function(){
  sleep();
  element(by.css("#loc")).sendKeys("guntur")
  sleep();
}
//----------------------------------------Calender Functionality------------------------------//
this.Menubarcalenderclick = function(){
  sleep();
  element(by.css(".hidden-xs>ul.nav.navbar-nav.navbar-right.service-nav>li:nth-child(4)>a")).click();
}
this.selectdateincalender = function(){
  sleep();
  element(by.xpath("//td[@class='fc-day fc-widget-content fc-thu fc-today ']")).click();
  sleep();
}
this.entercalendername = function(){
  sleep();
  sleep();
  element(by.css(".ng-touched.ng-dirty.ng-invalid.form-control.formInputs.focusNone.ng-touched.ng-dirty.ng-invalid#channelName")).sendKeys("Automation script calender");
  sleep();
}
this.selectroomsize = function(){
  sleep();
  element(by.css(".radion-btn-conatiner.radio-inline.control-label.text-capitalize.mb-0>small")).click();
  sleep();
}
this.membersselectingformeeting = function(){
  sleep();
  let a = element.all(by.css(".list-unstyled.media-list.topic-new-user-list li")).get(0);
  let b = a.element()


  // element.all(by.css(".list-unstyled.media-list.topic-new-user-list li")).get(1).click();
  // element.all(by.css(".list-unstyled.media-list.topic-new-user-list li")).get(2).click();
  // element.all(by.css(".list-unstyled.media-list.topic-new-user-list li")).get(3).click();
  sleep();
}
this.createbutton = function(){
  sleep();
  element(by.xpath("//span[@class='ng-star-inserted']")).click();
  sleep();
}

//-----------------------instant chat unctionality--------------------------//
this.createplusbuttonclick = function(){
  sleep();
  element(by.css("a[title='Add New Instant Group'] > .fa")).click();

}
this.enteravalueforselectingusersininstance = function(){
  sleep();
  element(by.css("#Usera")).sendKeys("testing");
}
this.selectingmembersforinstants = function(){
  sleep();
  element(by.css(".instant-list-container")).all(by.css(".unstyle-list.new-assignee-list.mb-10 li")).get(0).click();
  element(by.css(".instant-list-container")).all(by.css(".unstyle-list.new-assignee-list.mb-10 li")).get(1).click();
  element(by.css(".instant-list-container")).all(by.css(".unstyle-list.new-assignee-list.mb-10 li")).get(2).click();
}
this.clickonsavebuttonforinstance = function(){
  sleep();
  element(by.css("div.share-popup-footer>button.btn-primary")).click();
}



///----------------------Task manager card create and Edit----------//
this.clickontaskmanager = function(){
  sleep();
  element(by.css("ul.nav.navbar-nav.navbar-right.service-nav>li[title='Task Manager']")).click();
  sleep();
}
this.clickonviewalllink = function(){
  sleep();
  element(by.xpath("//a[.='View All Boards']")).click();
  sleep();
}
this.selectboard = function(){
  sleep();
  element(by.xpath("//aadhya-task-page[1]/aadhya-dynamic-modal[@class='medium-popup board-list-modal']//span[.='new kanban 12 test']")).click();
  sleep();
}
this.createlist = function(){
  sleep();
  element(by.css(".fa-plus-circle.fa.fa-3x.text-primary")).click();
}
this.enterlistname = function(){
  sleep();
  element(by.css(".form-group.p-15.mb-0>input")).sendKeys("Newautomationlist");

}
this.clickforcreatelist = function(){
  sleep();
  element(by.xpath("//button[@class='btn btn-primary']")).click();
  sleep();
}






};




  module.exports = new Grouprightpanle()

      // this.securefilesclick = function(){
      //   element(by.xpath("//a[contains(text(),'Secure Files')]")).click();
      //   sleep();
      // };
      // this.workspace = function (){
      //   element(by.css("a[title='Workspace Directory']")).click();
        
      //   sleep();
      // }
  
      // this.workspacesearch = function (){
      //   element(by.id('search-users ')).sendKeys(workspacename);
      //   sleep();
      //   window.close();
     // }

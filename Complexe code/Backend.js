//const { element, browser } = require("protractor");

function sleep()
{
 browser.driver.sleep(5000);
}
function Login() {
    
    this.getUrl = function (Url) {
      browser.get(Url);
      sleep();
    };
  
    this.userName = function (Userid) {
      element(by.id('Username')).sendKeys(Userid);
      sleep();
    };
    this.password = function (Password) {
      element(by.id('Password')).sendKeys(Password);
      sleep();
    };

    this.loginclick = function () {
        element(by.buttonText('Login')).click();
        sleep();
    };
      this.groupclick = function(){
        sleep(); 
       var teamclick = element(by.xpath("//a//span[contains(text(),'Protractor')]"));
       //sleep();
       teamclick.click();
       sleep();
      };

      this.groupinnerclick = function(){
        element(by.className('media-heading pointer')).click();
        sleep();
      };
      this.searchbar = function(){
        sleep();
        element(by.className('custom-input')).sendKeys("ppf");
        sleep();
      };
      this.clicksend = function(){
        element(by.css(".send-btn")).click();
        sleep();
      };
        this.mousehover = function(){
          element(by.cssContainingText('.contentjustify', 'ppf')).click();
          sleep();
        };
      this.options = function(){
        element(by.css(".fa-ellipsis-v")).click();
        sleep();
      };
      this.pinmessageoptions = function(){
        element(by.xpath("//a[contains(.,'Pin Message')]")).click();
        sleep();
      };
      this.teamname = function(){
        sleep(); 
        return element(by.xpath("//div[@class='profile-table']//span[contains(.,'Protractor')]")).getText();
        
      };
      this.checkgroupname = function(){

      if (element(by.className("media-heading pointer")).getText().toString()==element(by.css("div.profile-table > div:nth-of-type(1) .people-count")).getText().toString())
      {
          return "groupnamesame"
      }
      else
      {
        return "groupnamenotsame"
      }

    };

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
    };

      this.createduseremail = function(){
        sleep(); 

        return element(by.css('element(by.css("div.profile-table > div:nth-of-type(3) .people-count"))')).getText();
        
      };

      this.topicclick = function(){
        element(by.css("a[title='List of Topic']")).click();
        sleep();
      };
      this.countvalidate = function(){
        return  element.all(by.className("d-flex pointer")).count();
        // var b = a/2;
        // return b;
      };

      


      this.validatetopic = function(){
        sleep(); 
        return element(by.xpath("//div[@id='topic']//a[.='Newautomation']")).getText();
        
      };
      this.uploadDocFile = function () {
        var path = require('path'),
        uploadInput = element(by.css('input[placeholder="Upload file"]'));
        fileToUpload = __dirname + "/../Sources/images32.jpg",
        absolutePath = path.resolve(__dirname, fileToUpload);
        uploadInput.sendKeys(absolutePath);
        browser.driver.sleep(8000)
        
        }
      //Right panel close
      this.closerightpanel = function(){
        element(by.css("i.fa-close")).click();
        sleep
      }

      this.teamname = function(){
        sleep(); 
        return element(by.xpath("//div[@class='profile-table']//span[contains(.,'Protractor')]")).getText();
        
      }
      this.membercount = function(){
        sleep(); 
        return element(by.xpath("//div[@class='profile-table']//span[.='4']")).getText(); 
      }

        this.createdondate = function(){
          sleep(); 
          return element(by.xpath("//span[contains(text(),'Wed Jul 08 2020')]")).getText();
        }
      
      this.rightpgroup = function(){
           element(by.css("a[title='Group Members']")).click();
           sleep();
       }
        this.displaygrp = function(){
          sleep(); 
          return element(by.xpath("//a[contains(text(),'Onetoone chat')]")).getText();
          
        };

      this.topicclick = function(){
        element(by.css("a[title='List of Topic']")).click();
        sleep();
      };
      this.validatetopic = function(){
        sleep(); 
        return element(by.xpath("//div[@id='topic']//a[.='Newautomation']")).getText();
        
      };

      this.sharefileclick = function(){
        element(by.css("a[title='Shared Files']")).click();
        sleep();
      };
        this.validateimage = function(){

          if (element(by.css("ul.media-list > li:nth-of-type(17) p:nth-of-type(1)")).getText()==element(by.css("span[title='images32.jpg'] > [_ngcontent-c9]")).getText())
        {
            return "filefound"
        }
        else
        {
          return "filenotfound"
        }

        };

        this.uploadclick = function(){
          
          element(by.css("label.pointer > [height='20']")).click();
          sleep();

        };



      this.socketvalidate = function(){
        sleep(); 
        return element(by.xpath("//a[contains(text(),'4k-laptop-wallpapers.jpg')]")).getText();
        
      };
      this.securefilesclick = function(){
        element(by.xpath("//a[contains(text(),'Secure Files')]")).click();
        sleep();
      };
      this.securefilevalidate = function(){
        sleep();
       return element(by.xpath("//a[contains(text(),'Sai.Png')]")).isPresent();
       
      };
      this.pinmessageclick = function(){
        element(by.css("a[title='Pin Message']")).click();
        sleep();
      };
      this.pinmsgvalidate = function(){
        sleep();
        return element(by.xpath("//p[contains(text(),'Automation')]")).getText();
        
      };

      this.validatepinnedmessage = function(){

      if (element(by.css("ul.media-list > li:nth-of-type(15) span:nth-of-type(1) > span:nth-of-type(1)")).getText()==element(by.xpath("//p[@class='mb-0 rightbar-msg']")).getText())     
      {
            return "messageispinned"
      }
      else
      {
        return "messagenotpinned"
      }
    
    };

    this.unpinnedmessage = function()
    {
      element(by.xpath("//a[contains(.,'Unpin Message')]")).click();
      sleep();
    };
    this.workspace = function (){
      element(by.css("a[title='Workspace Directory']")).click();
      
      sleep();
    }

    this.workspacesearch = function (){
      element(by.id('search-users ')).sendKeys(workspacename);
      sleep();
      window.close();
    }

    this.logout = function(){
      sleep();
      var button = element(by.className('media-object img-circle user-profile-pic-md profile-image'));
      sleep();
      button.click();
      sleep();  
      
    };



};
module.exports = new Login()
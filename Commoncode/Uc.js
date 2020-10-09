function Login() {
    this.checkleftgrpname;
    this.checkheadgrpname;
    this.checkrightpanelgrpname;
    this.countgrp;
    
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
}
module.exports = new Login();
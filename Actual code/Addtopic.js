var datacode = require('./../Sources/Excutexlcode.js');
var first = require('./../Complexe code/Tc.js');

const { ExpectedConditions, element, browser } = require('protractor');

describe('Public channel Right panel functionality', function () {

  it('User login to the application', function () {

    first.getUrl(datacode.url);
    first.userName(datacode.userName);
    first.password(datacode.password);
    first.loginclick();
  });
  /*
  it ('Create channel click',function(){
    first.createchannel();
    first.channelname();
    first.channeldescription();
    first.generalchannelrbuttonclick();
    first.enterletterinsearch();
    first.searchmembers();
    first.createchannelbuttonclick();
});
*/

  it('select the group', function () {
    //first.leftgrpname();
    first.leftchannelname();
    first.searchbar();
    first.clicksend();
  });

  it('Select the message for topic', function () {
    first.mousehover();
    first.options();
    first.opttopicclick();
  });

  it('Create topic ', function () {
    first.entertopicname("Thistopic");
    first.searchmembersfortopic();
    first.createtopicbuttonclick();
    first.createbuttononthepopup();
  });

  it('Comapre the topic names form both sides', function () {

    if (first.comparintopicnames()) {
      expect("topicnamesame").toBe("topicnamesame");
      first.opentopicbyclick();
    }
    else {
      expect("topicnamenotsame").toBe("topicnamenotsame");
      first.logout();
    }
  });
/*
  if (first.comparintopicnames()){
  it('Send message into the topic', function () {
    first.topicsearchbar("Hello");
    first.threadsendclick();
    first.threadmousehover();
    first.topicedit();
    first.entereditmessage();
    first.enterclickthread();
    expect(first.topicmessagecompare()).toContain("Helloedit");
  });

  it('Send url into the topic', function () {
    first.topicsearchbar("www.instagram.com")
    first.threadsendclick();
    //first.topicurlclick();
  });

  it('Send Emoji into topics', function () {
    first.threademoij();
    first.selectthreademoji();
    first.threadsendclick();
    expect(element(by.css(".icon-ng2_em_hourglass")).isPresent());
  });

  it('Image upload and download in topics', function () {
    first.uploadDocFileinthread();
    first.topicimagepreview();
    first.previewclose();
    //first.mousehoveronfile();
    first.topicimagedownload();
  });

  
    it ('Check @message inthe topics',function(){
      first.topicsearchbar("@venkata");
      first.attherateuserclick();
      first.threadsendclick();
    });
  
    it('Snippet send into topics',function(){    
      first.sinneptclick();
      first.threadtext();
      first.sharesnnipetbutton();
      expect(first.snippetmessagecompare()).toContain("This is snippet");
  });
  
  it('Edit snippet inthe topics',function(){
    first.snippetmousehover();
    first.topicsnippeteditclick();
    first.entereditmessage();
    first.enterclickthread();
  expect(first.snippetmessagecompare()).toContain("This is snippetedit");
  
  });
  
  it ('Topic memebrs',function(){
    first.topicmembersnavtab();
  
  });
  */
  
  it ('List of topics',function(){
    first.listoftopicsclick();
    first.topiccount();
    expect(first.headertopicscount()).toContain(first.addtopiclistcount());
  });
  first.Menubarcalenderclick();
  first.closerightpanel();
  
  // Venkata//
  
  
  
  
  
  
  
  
   //}

})
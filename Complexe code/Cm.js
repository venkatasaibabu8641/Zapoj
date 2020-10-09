
this.leftchannelname = function()
{
  sleep();
  let b = element.all(by.css(".memberList.channel-list.list-unstyled li")).last();
  b.element(by.css('span[class="user-name"]')).click();
}

this.comparechannelpname = function()
{
    sleep();
    let b = element.all(by.css(".memberList.group-list.list-unstyled li")).last();
    return b.element(by.css('span[class="user-name"]')).getText();

}

this.comareheaderchannelname = function()
  {
    sleep();
    return element(by.xpath("//h4[@class='media-heading pointer']")).getText();
    }

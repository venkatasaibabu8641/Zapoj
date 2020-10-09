var path = require('path'),
fileToUpload = __dirname + "/Testdevzapoj.xlsx",
absolutePath = path.resolve(__dirname, fileToUpload);

var xlsx = require('xlsx');
var workbook = xlsx.readFile(fileToUpload);
var worksheet = workbook.Sheets['dev'];
var data= xlsx.utils.sheet_to_json(worksheet);


function sources()
{
    
this.url=data[0].Data;          // application url
this.userName=data[1].Data;     // user name
this.password=data[2].Data;     // password
//this.name=data[3].Data;         // workspace entername

}

module.exports = new sources();
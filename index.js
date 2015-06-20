var fs = require('fs');
var request = require('superagent');
var cheerio = require('cheerio');

/*
 * request to base-100 ~ base-999.html
 */
var BASE = 'http://www.319papago.idv.tw/lifeinfo/localgov/localgov-';
var FIRST_ID = 100;
var LAST_ID = 999;
var requestCount = LAST_ID - FIRST_ID;
var END = '.html';

var collection = {};

for(var id = FIRST_ID; id < LAST_ID; id++) {

  (function(i) {
  var url = BASE + i + END;
  request
    .get(url)
    .end(function(err, res) {
      
      if(!--requestCount) {
        writeJSON(collection);
      }
      if(err) {
        console.log('(' + i + ') _Fail_ NOT EXIST');
        return;
      }

      var $ = cheerio.load(res.text);

      var county = $('table table h2').text().slice(0,3);
      var dataTable = $('table table table')[2];

      // init the collection, prevent to overwrite it.
      if(typeof collection[county] === 'undefined') {
        collection[county] = {};
      };

      $(dataTable).filter(function(){ 

        // get the second tr's td
        var data = $(this).children().eq(1).children();
        
        var districtName = data.eq(0).text();
        var districtInfo = {
          phone: data.eq(1).text(),
          address: data.eq(3).text()
        };

        collection[county][districtName] = districtInfo;
        console.log('(' + i + ') _add__ ', districtName);

      });

    });
  })(id);
}

function writeJSON(json) {
  console.log('writing to address.json ...');
  fs.writeFile('address.json', JSON.stringify(json, null, 4), function(err) {
    console.log('DONE!')
  })
}


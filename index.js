var fs = require('fs');
var request = require('superagent');
var cheerio = require('cheerio');

/*
 * request to base-100 ~ base-999.html
 */
var BASE = 'http://www.319papago.idv.tw/lifeinfo/localgov/localgov-';
var FIRST_ID = 100;
var LAST_ID = 999;
var END = '.html';

var workers = 10;
var totalRequest = LAST_ID - FIRST_ID;
var requestChunk = Math.round(totalRequest / workers);

var collection = {};
var startId = FIRST_ID;


for(var w = 1; w <= workers; w++) {

  (function(worker) {
    
    var endId = startId + worker * requestChunk;
    
    setTimeout(function() {

      /*
      console.log('worker : ', worker);
      console.log('startId: ', startId);
      console.log('endId  : ', endId);
      */

      for(var id = startId; id < endId + 1 ; id++) {
        (function(i) {

          var url = BASE + i + END;
          
          request.get(url).end(function(err, res) {
            if(err) {
              console.log('(' + i + ') _Fail_');
              return;
            }

            var $ = cheerio.load(res.text);
            getDistrictDetails($, i);

          });

          startId++;

        })(id);
      }

    }, 75);
  })(w);
}


function getDistrictDetails($, index) {

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
    console.log('(' + index + ') _add__ ', districtName);

    // end of all requests
    if(!--totalRequest) {
      writeJSON(collection);
    }

  });
}

function writeJSON(json) {
  console.log('writing to address.json ...');
  fs.writeFile('address.json', JSON.stringify(json, null, 4), function(err) {
    console.log('DONE!')
  })
}


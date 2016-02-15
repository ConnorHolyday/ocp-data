/* Take a CSV with initial data for the 'OC Status' and generate a
 * the basic json files for it
 */
'use strict';

var _ = require('lodash');
var csv = require('csv');
var fs = require('fs-extra');

var exportDir = './export';

function checkEmpty(value) {
  if (value === "") {
    return undefined;
  } else {
    return value;
  }
};

var parser = csv.parse({columns:true}, function(err, data){
  for (var i in data) {
    if (data[i].iso) {
      var countryJSON = {
        iso: data[i].iso.toLowerCase(),
        name: data[i].country_simple,
        full_name: data[i].country,
        meta: {},
        results: {
          godi_score: checkEmpty(data[i].godi_score),
          godi_link: checkEmpty(data[i].godi_link),
          innovations: [{
            innovation_description: checkEmpty(data[i].innovation_description),
            innovation_link: checkEmpty(data[i].innovation_link)
          }],
          ocds_historic_data: checkEmpty(data[i].ocds_historic_data),
          ocds_ongoing_data: checkEmpty(data[i].ocds_ongoing_data),
          ocds_implementation: checkEmpty(data[i].ocds_implementation),
          websites: [{
            website_link: checkEmpty(data[i].website_link),
            publisher: checkEmpty(data[i].publisher)
          }],
          ogp_commitments: [{
            ogp_commitment: checkEmpty(data[i].ogp_commitment),
            ogp_commitment_link: checkEmpty(data[i].ogp_commitment_link)
          }],
          citizen_monitoring: checkEmpty(data[i].citizen_monitoring),
          commitment_oil_mining: checkEmpty(data[i].commitment_oil_mining),
          commitment_oil_mining_link: checkEmpty(data[i].commitment_oil_mining_link),
          disclosure_oil_mining: checkEmpty(data[i].disclosure_oil_mining),
          disclosure_oil_mining_link: checkEmpty(data[i].disclosure_oil_mining_link)
        }
      }
      fs.writeFile(`${exportDir}/${data[i].iso.toLowerCase()}.json`,JSON.stringify(countryJSON));
    }
  }
});

fs.emptyDir(exportDir, function (err) {
  if (err) return console.log(err);
})

fs.createReadStream('./oc-status-initial-data.csv').pipe(parser);
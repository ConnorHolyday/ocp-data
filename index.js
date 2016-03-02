/**
 * This script takes raw OCP data and processes it into something that can be
 * used more easily by other applications.
 */
'use strict';

var _ = require('lodash');
var async = require('async');
var fs = require('fs-extra');

var sourceDir = './data/oc-status';
var targetDir = './dist/oc-status';

var mapData = require('./lib/ne_50m_admin_0_countries_topo.json');
var tableData = {
  meta: {
    display: [
      {
        key: 'country',
        value: 'Country'
      },
      {
        key: 'ocds_data',
        value: 'Publishing OCDS data'
      },
      {
        key: 'ocds_implementation',
        value: 'OCDS implementation'
      },
      {
        key: 'ogp_commitment',
        value: 'Relevant OGP commitment'
      }
    ]
  },
  data: []
};

var output = {
  merged: {
    data: [],
    file: '_all.json'
  },
  index: {
    data: {},
    file: '_index.json'
  },
  map: {
    data: mapData,
    file: '_map.json'
  },
  table: {
    data: tableData,
    file: '_table.json'
  }
};

function processOCDS (countryData) {
  if (countryData.results.ocds_historic_data && countryData.results.ocds_ongoing_data) {
    return 'Historic and ongoing';
  } else if (countryData.results.ocds_historic_data) {
    return 'Historic';
  } else if (countryData.results.ocds_ongoing_data) {
    return 'Ongoing';
  } else {
    return 'No';
  }
}

function prepTableData (countryData) {
  var d = {
    country: countryData.name,
    ocds_data: processOCDS(countryData),
    ocds_implementation: countryData.results.ocds_implementation ? 'Yes' : 'No'
  };
  if (countryData.results.ogp_commitments[0]) {
    d.ogp_commitment = countryData.results.ogp_commitments[0].ogp_commitment !== '' || null ? 'Yes' : 'No';
  }
  return d;
}

async.waterfall([
  function (callback) {
    // Write the original data files
    fs.copy(sourceDir, targetDir, function (err) {
      callback(err);
    });
  },
  function (callback) {
    // Process the data
    fs.readdir(sourceDir, function (err, list) {
      for (var f in list) {
        if (list[f] !== '_index.json') {
          var jsonData = JSON.parse(fs.readFileSync(`${sourceDir}/${list[f]}`));

          // Add an indication if the country has any data reported
          // False values on booleans count as no data
          jsonData.results.has_data = !(_.every(_.map(jsonData.results), _.isEmpty));

          var i = _.findIndex(output.map.data.objects.ne_50m_admin_0_countries.geometries, function (o) { return o.properties.iso_a2.toLowerCase() === jsonData.iso; });
          if (i !== -1) {
            _.merge(output.map.data.objects.ne_50m_admin_0_countries.geometries[i].properties, jsonData.results);
          }

          output.index.data[list[f]] = {name: jsonData.name};
          output.table.data.data.push(prepTableData(jsonData));
          output.merged.data.push(jsonData);
        }
      }
      callback(err, output);
    });
  },
  function (output, callback) {
    var tasks = [];
    _.forEach(output, function (f) {
      tasks.push(function (cb) {
        fs.writeFile(`${targetDir}/${f.file}`, JSON.stringify(f.data), function (err) {
          cb(err);
        });
      });
    });
    async.parallel(tasks, callback);
  }
], function (err) {
  if (err) console.error(err.message);
  console.log('Success, all data processed and ready to serve beautiful things.');
});

import express from 'express';
import bodyParser from 'body-parser';
import request from 'request';
const app = express();
import jsdom from "jsdom";
import http from "http";
import qs from 'querystring';
import natural from 'natural';
import htmlToJson from "html-to-json";


app.set('port', (process.env.PORT || 5001))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

// index
app.get('/foodtruck', (req, res) => {

  if(req.query.day)
  var day = req.query.day;
  else
  var day = "today";

  if(req.query.day)
  var time = req.query.time;
  else
  var time = "lunch";

  if(req.query.address)
  var address = req.query.address;
  else
  var address = "Paris-France";

  if(req.query.tag)
  const tag = req.query.tag;

  if(req.query.distance)
  var distance = req.query.distance;
  else
  var distance = 5000;

  getFoodtruck(res, day, time, address, tag, distance);

})

function displayResult(result, res)
{
  res.contentType('application/json');
  res.send(JSON.stringify(result));
  //res.write(result[0]);
}

function cleanArray(actual) {
  const newArray = new Array();
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}

function getTags(string, tag) {
  string = string.replace(/[, ]+$/, '');
  const test = string.split(',');
  for (i = 0; i < test.length; i++){
    if(natural.JaroWinklerDistance(test[i], tag) > 0.8){
      return true;
    }
  }
  return false;
}

function getFoodtruck(res, day, time, address, tag, distance, callback) {

  let items = new Array();//I feel like I want to save my results in an array
  console.log("day :", day, " time : ", time, " address :", address, "tag :", tag, " distance :", distance);
  if(tag)
  var uri = `http://tttruck.com/find/${day}/${time}/${address}?tag=${tag}`;
  else
  var uri = `http://tttruck.com/find/${day}/${time}/${address}`;
  console.log("uri : ", uri);
  request({uri}, (err, response, body) => {

    //Just a basic error check
    if(err && response.statusCode !== 200){console.log('Request error.');}
    //Send the body param as the HTML code we will parse in jsdom
    //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
    jsdom.env({
      html: body,
      scripts: ['http://code.jquery.com/jquery-1.10.2.min.js'],
      done(err, window) {
        //Use jQuery just as in a regular HTML page
        const $ = window.jQuery;
        const $body = $('body');
        const $restaurant = $body.find('li.restaurant');
        const i = 0;
        $restaurant.each( (i, item) => {

          if(parseInt($(item).attr('data-distance'), 10) <= distance)
          {
            if(tag && getTags($(item).attr('data-tags'), tag))
            {
              var adresses = $(item).find('p:first-of-type');
              var span0 = $(adresses);

              tmp = span0.text().replace(/\s\s/g, '');
              adresse = tmp.substring(10);
              while(adresse[0] == "0" || adresse[0] == " " || adresse[0] == ",")
              adresse = adresse.substring(1);

              items[i] = {
                image:   $(item).attr('data-cover'),
                name:   $(item).attr('data-name'),
                tags:     $(item).attr('data-tags'),
                latitude:  $(item).attr('data-latitude'),
                longitude:  $(item).attr('data-longitude'),
                distance:   $(item).attr('data-distance'),
                open:  $(item).attr('data-open'),
                starttime:  $(item).attr('data-starttime'),
                endtime:   $(item).attr('data-endtime'),
                adresse
              };
            }
            else {
              var adresses = $(item).find('p:first-of-type');
              var span0 = $(adresses);

              tmp = span0.text().replace(/\s\s/g, '');
              adresse = tmp.substring(10);
              while(adresse[0] == "0" || adresse[0] == " " || adresse[0] == ",")
              adresse = adresse.substring(1);

              items[i] = {
                image:   $(item).attr('data-cover'),
                name:   $(item).attr('data-name'),
                tags:     $(item).attr('data-tags'),
                latitude:  $(item).attr('data-latitude'),
                longitude:  $(item).attr('data-longitude'),
                distance:   $(item).attr('data-distance'),
                open:  $(item).attr('data-open'),
                starttime:  $(item).attr('data-starttime'),
                endtime:   $(item).attr('data-endtime'),
                adresse
              };
            }

          }
        });

        items = cleanArray(items);
        console.log(items);

        displayResult(items, res);
      }
    });
  });

}

export {getFoodtruck};

// spin spin sugar
app.listen(app.get('port'), () => {
  console.log('running on port', app.get('port'))
})


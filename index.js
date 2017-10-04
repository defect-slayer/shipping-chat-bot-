'use strict';

/**
 * This sample demonstrates an implementation of the Lex Code Hook Interface
 * in order to serve a sample bot which manages reservations for hotel rooms and car rentals.
 * Bot, Intent, and Slot models which are compatible with this sample can be found in the Lex Console
 * as part of the 'BookTrip' template.
 *
 * For instructions on how to set up and test this bot, as well as additional samples,
 *  visit the Lex Getting Started documentation.
 */

// --------------- Helpers that build all of the responses -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function confirmIntent(sessionAttributes, intentName, slots, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName,
            slots,
            message,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    console.log('callback called')
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

function buildValidationResult(isValid, violatedSlot, messageContent) {
    return {
        isValid,
        violatedSlot,
        message: {contentType: 'PlainText', content: messageContent},
    };
}

function shipPackage(intentRequest, callback){
    const toZipCode = intentRequest.currentIntent.slots.zipCode;
    const pkgSize = intentRequest.currentIntent.slots.boxSize;
    const pkgWeight = intentRequest.currentIntent.slots.pkgWeight;
    
    getToken(toZipCode,pkgSize,pkgWeight,intentRequest, callback);
    
}

function getToken(toZipCode,pkgSize,pkgWeight,intentRequest, callback){
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var http = require('http');
    var options = {
        host: 'foundation-dev.horizon.pitneycloud.com',
        path: '/api/v1/user/auth/guam?clientid=2856109e-ca67-4aa8-bf34-8877bc0502e9&Content-Type=application%2Fjson',
        method: 'POST',
        body: '{"username": "gb.test031301@mailinator.com","password": "PbTest123$"}',
        headers: {'Authorization': 'Basic cWEtdXNlcjoxcTJ3M2U0cg=='}
    };

     var reqPost = http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        var json;
        
        callForLabel(toZipCode,pkgSize,pkgWeight,intentRequest, res.headers.authtoken,sessionAttributes, callback)
    //         callback(close(sessionAttributes, 'Fulfilled',
    // { contentType:'PlainText', content:'token : token.....' + res.headers.authtoken }));
        
    });
    
    reqPost.write('{"username": "gb.test031301@mailinator.com","password": "PbTest123$"}');
    reqPost.end();
}

function callForLabel(toZipCode,pkgSize,pkgWeight,intentRequest, token,sessionAttributes, callback){
    var jsonObject = JSON.stringify({
    "cultureCode": "en-GB",
    "recipient": {
        "company": "Pitney",
        "fullName": "Test1 Testovich1",
        "streetLine1": "37 Executive Dr",
        "city": "Danbury",
        "state": "CT",
        "postalCode": ""+toZipCode+"",
        "isoCountry": "GB",
        "verified": true,
        "type": "Recipient",
       
        "email": "",
        "residential": false
    },
    "sender": {
        "company": "Smith Ventures, LLC",
        "fullName": "displayed",
        "streetLine1": "9999 Boulevard Cave",
        "city": "Montreal",
        "state": "QC",
        "postalCode": "CM19 5BD",
        "isoCountry": "GB",
        "verified": true,
        "type": "Sender"
       
    },
    "inductionPostalCode": "CM19 5BD",
    "dateOfShipment": "2017-05-19T10:40:57.159Z",
    "dateOfShipmentTimeZone": "GMT+05:30",
    "mailClass": "2DA",
    "packageDetails": {
        "packageId": "PKG",
        "lengthMeters": 0.15,
        "widthMeters": 0.15,
        "heightMeters": 0.15,
        "girthMeters": null,
        "weightKilos": 4,
        "packageDisplayId": "LP"
    },
    
    "labelDetails": {
        "hidePostage": true,
        "labelSize": "s8x11",
        "printReceipt": false
    },
    "totalPackageCharge": "29.24",
    "stealth": null,
    "memo": "",
    "customMessage": null,
    "deliveryNotificationEmails": [],
    "printNotificationEmails": [],
    "includeAndHideSuggestedTrackingService": true,
    "notDeliveredOption": null,
    "dimensionUnits": "METRIC",
    "weightUnits": "METRIC",
    "customInfo": {
        "eelpfc": null,
        "exportReason": "documents",
        "licenseNumber": null,
        "certificateNumber": null,
        "fromCustomsReference": null,
        "invoiceNumber": null
    },
    "packageContent": [{
        "quantity": 1,
        "originCountry": "CA",
        "currencyCode": "CAD",
        "itemWeightKilos": 3,
        "description": "dasdsa",
        "value": 5,
        "originStateProvince": "AB"
    }]
    });
    
    
    
    var http = require('http');
    var options = {
        host: 'shipping-dev.horizon.pitneycloud.com',
        path: '/api/v3/pfw/shipping-label',
        method: 'POST',
        
        headers: {'Authorization': 'Basic cWEtdXNlcjoxcTJ3M2U0cg==', 'authToken':token, 'Content-Type': 'application/json'}
    };

     var reqPost = http.request(options, function(res) {
        var str = ''; 
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        var json;
        res.on('data', function (chunk) {
            str += chunk;
        });
        res.on('end', function () {
            //console.log(str);
            var jsonObj = JSON.parse(str);
            callback(close(sessionAttributes, 'Fulfilled',
            { contentType:'PlainText', content:'Total charge : '+ jsonObj.totalPackageCharge + ' Print Label : ' + jsonObj.labelUrl }));
        });
        
        
            
        
    });
    
    reqPost.write(jsonObject);
    reqPost.end();
    
    
}

/**
 * Performs dialog management and fulfillment for booking a hotel.
 *
 * Beyond fulfillment, the implementation for this intent demonstrates the following:
 *   1) Use of elicitSlot in slot validation and re-prompting
 *   2) Use of sessionAttributes to pass information that can be used to guide conversation
 */
function trackPackage(intentRequest, callback) {
    const packageId = intentRequest.currentIntent.slots.packageId;
    var carrier = 'fedex';
    if(packageId.startsWith('94')){
       carrier ='usps'; 
    }
    var trackResp;
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var http = require('http');
    var options = {
        host: 'shipping-dev.horizon.pitneycloud.com',
        path: '/api/v1/'+carrier+'/tracking/'+packageId,
        method: 'GET'
    };

    http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        var json;
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            json = JSON.parse(chunk);
            console.log(json.deliveryDate);
            var trackingUrl = getUrl(carrier, packageId);
            callback(close(sessionAttributes, 'Fulfilled',
    { contentType:'PlainText', content: JSON.stringify('{Status of Your Package :  ' + json.trackingDetailsList[0].scanDescription +
    ', Date :' + json.trackingDetailsList[0].eventDate + ', City :' + json.trackingDetailsList[0].city +' '+ trackingUrl+'}',null,4)  }));
        });
    }).end();

};

function getUrl(carrier, trackingId){
  if(carrier.toUpperCase()==="USPS"){
     return 'tracking URL : https://tools.usps.com/go/TrackConfirmAction?tRef=fullpage&tLc=2&text28777=&tLabels='+trackingId+'%2C'; 
  }else{
      return 'tracking URL : https://www.fedex.com/apps/fedextrack/?tracknumbers='+trackingId+'&language=en&cntry_code=in';
  }  
};

// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    // console.log(JSON.stringify(intentRequest, null, 2));
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'tracking') {
        return trackPackage(intentRequest, callback);
    } else if (intentName === 'shipment') {
        return shipPackage(intentRequest, callback);
    }
    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

function loggingCallback(response, originalCallback) {
    // console.log(JSON.stringify(response, null, 2));
    originalCallback(null, response);
}

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) =>
{
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name, alias and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired source.
         */
        /*
         if (event.bot.name != 'BookTrip') {
         callback('Invalid Bot Name');
         }
         */
        dispatch(event, (response) => loggingCallback(response, callback)
    )
        ;
    } catch (err) {
        callback(err);
    }
}
;

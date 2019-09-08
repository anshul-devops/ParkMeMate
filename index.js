
  exports.handler = async (event) => {
    // TODO implement
    console.log("event" , event);
    
    var response;
    var streetName;
    var data = require('./data.json');
    //var image = require('./logo.jpg');
    const location = data.results[0].geometry.location;
    
    if(event.currentIntent.slots.street == null & event.currentIntent.slots.distance_frome_me == null)
     {
         var response = { 
                        "sessionAttributes":event.sessionAttributes,
                        dialogAction: {
                                            type: "ElicitSlot",
                                            intentName:event.currentIntent.name,
                                            slots:event.currentIntent.slots,
                                            slotToElicit:"street",
                                            message:{contentType: 'PlainText', content: "Hey, Where do you want to park? "}
                                    }
                    }
     } else if(event.currentIntent.slots.street != null & event.currentIntent.slots.distance_from_me == null) 
     {
         
         response = { 
                        "sessionAttributes":event.sessionAttributes,
                        dialogAction: {
                                            type: "ElicitSlot",
                                            intentName:event.currentIntent.name,
                                            slots:event.currentIntent.slots,
                                            slotToElicit:"distance_from_me",
                                            message:{contentType: 'PlainText', content: "How far do you want to park? "},
                                            responseCard:{"contentType":"application/vnd.amazonaws.card.generic","genericAttachments":
                                            [{"title":"Distance from me","buttons":[{"text":"within 100 meters","value":"0.1"},
                                            {"text":"within 500 meters","value":"0.5"},{"text":"within 1Km","value":"1"},
                                            {"text":"More than 1Km","value":"1.01"}]}]}
                                    }
                    }           
     }  else if(event.currentIntent.slots.street != null 
     & event.currentIntent.slots.distance_from_me != null
     & event.currentIntent.slots.parking_duration == null) 
     {
         response = { 
                        "sessionAttributes":event.sessionAttributes,
                        dialogAction: {
                                            type: "ElicitSlot",
                                            intentName:event.currentIntent.name,
                                            slots:event.currentIntent.slots,
                                            slotToElicit:"parking_duration",
                                            message:{contentType: 'PlainText', content: "For how much time?"},
                                            responseCard:{"contentType":"application/vnd.amazonaws.card.generic","genericAttachments":
                                            [{"title":"Parking Time","buttons":[{"text":"1/2P","value":"1/2P"},
                                            {"text":"1P","value":"1P"},{"text":"2P","value":"2P"},
                                            {"text":"3P","value":"3P"},{"text":"4P","value":"4P"}]}]}
                                    }
                    }           
     } else if(event.currentIntent.slots.street != null 
     & event.currentIntent.slots.distance_from_me != null
     & event.currentIntent.slots.parking_duration != null
     & event.currentIntent.slots.is_priority_parking == null) 
     {
         response = { 
                        "sessionAttributes":event.sessionAttributes,
                        dialogAction: {
                                            type: "ElicitSlot",
                                            intentName:event.currentIntent.name,
                                            slots:event.currentIntent.slots,
                                            slotToElicit:"is_priority_parking",
                                            message:{contentType: 'PlainText', content: "Are you looking for Priority Parking?"},
                                            responseCard:{"contentType":"application/vnd.amazonaws.card.generic","genericAttachments":
                                            [{"title":"Choose from below","buttons":[{"text":"Yes","value":"Yes"},
                                            {"text":"No","value":"No"}]}]}
                                    }
                    }           
     }
     else {
         console.log("else");
        var receivedBaysDetails = calculateDistancesandReturnPossibileRange(location);
        var requestedParkingType = event.currentIntent.slots.parking_duration;
        console.log("requestedParkingType returned", requestedParkingType);
        var priorityParkingRequiredFlag = event.currentIntent.slots.is_priority_parking;
        console.log("priorityParkingRequiredFlag returned", priorityParkingRequiredFlag);
        var locations = getBaysWithAllowedPermit(receivedBaysDetails, requestedParkingType, priorityParkingRequiredFlag);
        console.log("locations returned", locations);
        
        var url1 = "http://maps.google.com/maps?q=" + locations[0].latitude + ',' + locations[0].longitude;
        var url2 = "http://maps.google.com/maps?q=" + locations[1].latitude + ',' + locations[1].longitude;
        var url3 = "http://maps.google.com/maps?q=" + locations[2].latitude + ',' + locations[2].longitude;
        response = { 
                        "sessionAttributes":event.sessionAttributes,
                        dialogAction: {
                                            type: "Close",
                                            fulfillmentState:"Fulfilled",
                                            message:{contentType: 'PlainText', content: "Choose from Options"},
											"responseCard": {
                                            "contentType": "application/vnd.amazonaws.card.generic",
                                            "genericAttachments": 
                                            [{
                                                'title': 'Parking 1',
                                                'attachmentLinkUrl': url1,
                                                'imageUrl': "http://pluspng.com/img-png/google-maps-png-google-maps-icon-1600.png"
                                            },
                                            {
                                                'title': 'Parking 2',
                                                'attachmentLinkUrl': url2,
                                                'imageUrl': "http://pluspng.com/img-png/google-maps-png-google-maps-icon-1600.png"
                                            },
                                            {
                                                'title': 'Parking 3',
                                                'attachmentLinkUrl': url3,
                                                'imageUrl': "http://pluspng.com/img-png/google-maps-png-google-maps-icon-1600.png"
                                            }]
                                            }
                                        }
                    } 
     }              
    
    return Promise.resolve(response);
    
};

function calculateDistancesandReturnPossibileRange(currentlocation){
          var data = require('./sensorsData.json');
          var size = data.data;
          var response = {
              details: []
          };
          size.forEach(element => {
              var bayId = element[8];
              var latitude= element[12];
              var longitude = element[13];
              var possiblelocations = { lat:latitude, lng: longitude };
              var n = arePointsNear(currentlocation, possiblelocations, 1);
              if(n== true){
                  response.details.push({ 
                  "bayId" : bayId,
                  "latitude"  : latitude,
                  "longitude" : longitude 
                  });
              }
              else{
                  // no match found
              }
          });
          return response;
          }
  
  function arePointsNear(checkPoint, centerPoint, km) {
      var ky = 40000 / 360;
      var kx = Math.cos(Math.PI * centerPoint.lat / 180.0) * ky;
      var dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
      var dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
      return Math.sqrt(dx * dx + dy * dy) <= km;
  }
  

function getBaysWithAllowedPermit(receivedBaysDetails, requestedParkingType, priorityParkingRequiredFlag){
    console.log("Input received ", receivedBaysDetails);
    var receivedBays = receivedBaysDetails.details;
    var dataRecords = require('./bayId_Information.json');
    var finalAvailableBays = [];

    for (var bay of  receivedBays){
        for(var record of dataRecords.data) {
            if( record[8] == bay.bayId) {
                if(record[64].match(requestedParkingType) != null){

                    if(priorityParkingRequiredFlag == "Yes" && (record[16]!= null && record[16]!= '0')){
                        finalAvailableBays.push(bay);

                    } else if(priorityParkingRequiredFlag == "No" && (record[16]== null || record[16]== '0')) {
                        finalAvailableBays.push(bay);
                    }
                    continue;
                }
            }
        }
    }

    finalAvailableBays = finalAvailableBays.slice(0,3);
    return finalAvailableBays;
}

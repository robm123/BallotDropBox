
//var icon = "http://path/to/icon.png"; possibly style icon
var json = "DropBoxLocations.json";

var origin;
var destination;
var encodedOrigin;

var encodedLink;
var lat;
var lng ;
let autocomplete;
var inputAddress;

let infowindow;
let map;

var dropBoxList = [];
let dropBox= {};
var address;
let addressMarker;

let dropBoxMarkers = [];
let pollingLocationMarkers = [];
let earlyVotingMarkers = [];

function reloadThePage()
{
  location.reload();
}


function initAutocomplete() {

  var myStyles =[
      {
          featureType: "poi.business",
          elementType: "labels",
          stylers: [
                { visibility: "off" }
          ]
      }
  ];
  
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 38.916691, lng: -77.035373 }, 
    zoom: 9,
    mapTypeId: "roadmap",
    clickableIcons: false,
    styles: myStyles,
  });
  
  infowindow = new google.maps.InfoWindow();

  addressMarker = new google.maps.Marker({map});

    // Create the search box and link it to the UI element.
  const input = document.getElementById("pac-input");
 
  var options = {
    types: ['address'],
    componentRestrictions: {country: ["us"]}
  };

  autocomplete = new google.maps.places.Autocomplete(input,options);
  autocomplete.setFields(["address_components", "geometry","formatted_address"]);
  pressedEnterKey(input);
  autocomplete.addListener("place_changed", onPlaceChanged);
}
  
/*  there will most likely be geometry found but
    the civic info api NEEDS A FULL ADDRESS to work
*/
async function onPlaceChanged() {
  
  //close info window- clear markers
  let msg;
  infowindow.close();
  clearMarkers();
  addressMarker.setVisible(false);
  const place = autocomplete.getPlace();

  console.log("place");
  console.log(place);

  //debugger;############################
  let address = place.formatted_address;
  let results = await lookup(address);
  console.log("JSON response variables");
  console.log(Object.getOwnPropertyNames(results));

  let properties = Object.getOwnPropertyNames(results);

  //move page down 
  var elmnt = document.getElementById("copyright");
  elmnt.scrollIntoView();

  if (!place.geometry) {
    msg = "Please select a complete address from the list"
    window.alert(msg);

  } else if (place.geometry && !('dropOffLocations' in results) && !('earlyVoteSites' in results) && !('pollingLocations' in results)) {
    
    map.panTo(place.geometry.location);
    map.setZoom(12);
    addressMarker.setPosition(place.geometry.location);
    addressMarker.setVisible(true);
    addressMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-pushpin.png');
    msg = "Unforunately your location does not contain any informaiton\nPlease check back later"; 
    setTimeout(function() { alert(msg); }, 700);

    //debugger;
  } else {
    console.log("ENTERED");
    map.panTo(place.geometry.location);
    map.setZoom(12);

    //creates a pin from  users address input
    //const addressMarker = new google.maps.Marker({map});
    addressMarker.setPosition(place.geometry.location);
    addressMarker.setVisible(true);
    addressMarker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-pushpin.png');

    search(address,results);
    //search for drop boxes near the address 
    //###############1########################
    //return;

  }


} 

async function search(address,results) {
  //clear markers
  //populate marker object
  //listener for click on marker

  //may not always recieve a JSON object, see lookup(address)
  //check status 
  
  let usersAddress = address;



  

  
  
  //##############2#############################
  let dropBoxLocations = findDropBoxLocations(results);
  displayDropBoxes(dropBoxLocations,usersAddress);


  

  console.log("response")
  console.log(results);
  //console.log("drop box list Array");
  //console.log(dropBoxList);

  let pollingLocations = await findPollingLocations(results);
  displayPollingLocations(pollingLocations, usersAddress);


  //##MUST CLEAR MARKERS! arrays etc 
  let earlyVotingLocations = findEarlyVoteLocations(results);
  displayEarlyVoting(earlyVotingLocations,usersAddress);

  //check if it returned an empty array!!


}

function bindInfoWindow(marker, map, infowindow, details, destination,address,origin) {
  let link;
  let information;
  let encodedOrigin; 

  google.maps.event.addListener(marker, 'click', function() {
    
    link = "https://www.google.com/maps/dir/?api=1&origin=" + origin + "&destination=" + destination + "&travelmode=driving";
    information = details + "<br>" + "<a target='_blank' href='"+ link +"' >"+ address +"</a>" + "<br>";
    infowindow.setContent(information);
    infowindow.open(map, marker);
  });
}

function clearMarkers() {
  //clears dropbox markers
  for (let i = 0; i < dropBoxMarkers.length; i++) {
    if (dropBoxMarkers[i]) {
      dropBoxMarkers[i].setMap(null);
    }
  }
  dropBoxMarkers = [];
  //clears polling location markers
  for (let i = 0; i < pollingLocationMarkers.length; i++) {
    if (pollingLocationMarkers[i]) {
      pollingLocationMarkers[i].setMap(null);
    }
  }
  pollingLocationMarkers = [];

  for (let i = 0; i < earlyVotingMarkers.length; i++) {
    if (earlyVotingMarkers[i]) {
      earlyVotingMarkers[i].setMap(null);
    }
  }
  earlyVotingMarkers = [];
}

function showInfoWindow(){
  var link;
  var information;
  //const marker = this;
  const marker = this;
  //encodedOrigin = encodeURIComponent(address);
  //link = "https://www.google.com/maps/dir/?api=1&origin=" + encodedOrigin + "&destination=" + strDestination + "&travelmode=driving";
  //information = details + "<br>" + "<a target='_blank' href='"+ link +"' >"+ address +"</a>" + "<br>";
  
  //infowindow.setContent(information);
  infowindow.open(map, marker);

}

function load(){
  gapi.client.setApiKey('AIzaSyCR7YFB3ozjPmlWLNdy0dI09qUXeniY2Ew');
}

//return new Promise((resolve, reject) => {
//})
  
async function lookup(address) {
  return new Promise((resolve, reject) => {
      let results;
      let electionID = 7000;
      let encodedAddress = encodeURIComponent(address);
      let url = 'https://content.googleapis.com/civicinfo/v2/voterinfo?'
                + 'electionId=' + electionID
                + '&address=' + encodedAddress
                + '&key=AIzaSyCR7YFB3ozjPmlWLNdy0dI09qUXeniY2Ew';
      //it may not always return a proper response
      //must verify response is ok....
      fetch(url)
        .then(res => res.json())
        .then(response => resolve(response));
  /*
    console.log("inside lookup");
    var electionId = 7000;
    var req = gapi.client.request({
        'path' : '/civicinfo/v2/voterinfo',
        'params' : {'electionId' : electionId, 'address' : address}
    });
    console.log("before callback");
    await req.execute(callback);
    console.log("after callback");
    //console.log(results);
  */
  })
}


function findDropBoxLocations(response) {
  //create my own dataset;possibly create own API then fill in blank with web crawler
  let dropBoxLocations = [];

  if('dropOffLocations' in response){
    for(let i = 0;i < response.dropOffLocations.length;i++){
      
      let item = response.dropOffLocations[i];

      let addressComponent  = item.address;

      let location = getKeyValue(addressComponent,'locationName');
      let address = getKeyValue(addressComponent,'line1');
      let city = getKeyValue(addressComponent,'city');
      let county = getCounty(response);
      let state = getKeyValue(addressComponent,'state');
      let zip = getKeyValue(addressComponent,'zip');
      //check if LAT AND LNG FOUND IF NOT THEN GEOCODE
      let latitude = getKeyValue(item, 'latitude');
      let longitude = getKeyValue(item,'longitude');
      let description = getKeyValue(item,'notes');
      let hours = getKeyValue(item, 'pollingHours');

      //verify that response contains the data your looking for. SOME DATA IS MISSING!!!!!!!!
      //'notes' in results.dropOffLocations[i] ? notes = item.notes: notes = "no info yet"; 

      dropBoxLocations.push({
        "type" : "Drop Box",
        "location" : location,
        "street" : address,
        "city" : city,
        "county" : county,
        "state" : state,
        "zip" : zip,
        "latitude" : latitude,
        "longitude" : longitude,
        "description" : description,
        "hours" : hours 
      })
    }
    return dropBoxLocations;
  } else {
      //returns empty array if no drop box locations found
      return dropBoxLocations;
    }
}

function findEarlyVoteLocations(response) {

  let earlyVotingLocations = [];

  if('earlyVoteSites' in response){
    
    for(let i = 0;i < response.earlyVoteSites.length;i++) {

      let item = response.earlyVoteSites[i];
      let addressComponent = item.address;
      let location = getKeyValue(addressComponent,'locationName');
      let address = getKeyValue(addressComponent,'line1');
      let city = getKeyValue(addressComponent,'city');
      let county = getCounty(response);
      let state = getKeyValue(addressComponent,'state');
      let zip = getKeyValue(addressComponent,'zip');
      //CHECK TO SEE IF LAT && LNG FOUND OR MUST GEOCODE #############################
      let latitude = getKeyValue(item, 'latitude');
      let longitude = getKeyValue(item,'longitude');
      //DOES NOT CONTAIN A notes KEY.. description : "NotApplicable"###################
      let description = getKeyValue(item,'notes');
      let hours = getKeyValue(item, 'pollingHours');

      earlyVotingLocations.push({
        "type" : "Early Voting Site",
        "location" : location,
        "street" : address,
        "city" : city,
        "state" : state,
        "zip" : zip,
        "county" : county,
        "latitude" : latitude,
        "longitude" : longitude,
        "description" : description,
        "start" : item.startDate,
        "end" : item.endDate,
        "hours" : item.pollingHours
      })
    }
    return earlyVotingLocations;
  }
  else{
    //no info found
    /*
    let msg = "NotApplicable";
    earlyVotingLocations.push({
      "type" : "Early Voting Site",
      "location" : msg,
      "street" : msg,
      "city" : msg,
      "state" : msg,
      "zip" : msg,
      "county" : msg,
      "latitude" : msg,
      "longitude" : msg,
      "start" : msg,
      "end" : msg,
      "hours" : msg
    })
    */
    //returns an empty array if nothing found
    return earlyVotingLocations;
  }
}

async function findPollingLocations(response) {

  let pollingLocations = [];

  if('pollingLocations' in response) {

    for(let i = 0;i < response.pollingLocations.length;i++) {

      let item = response.pollingLocations[i];
      let addressComponent = item.address;
      let location = getKeyValue(addressComponent,'locationName');
      let address = getKeyValue(addressComponent,'line1');
      let city = getKeyValue(addressComponent,'city');
      let county = getCounty(response);
      let state = getKeyValue(addressComponent,'state');
      let zip = getKeyValue(addressComponent,'zip');
      let latitude = getKeyValue(item, 'latitude');
      let longitude = getKeyValue(item,'longitude');
      let description = getKeyValue(item,'notes');
      let hours = getKeyValue(item, 'pollingHours');

      //find out if polling locations and drop boxes are in the exact same position
      //if true then it adjusts the polling location
      //!('latitude' in item && 'longitude' in item)
      if(latitude == "NotApplicable" && longitude == "NotApplicable") {
        //this will be using a fetch call, and waits for the response
        //the reponse will not always be 200, MUST IMPLEMENT different response handling
        let address = item.address.line1 + " " + item.address.city + ", " + item.address.state;
        let geoCodeRespose = await getGeoCode(address);
        console.log("Geocode Response");
        console.log(geoCodeRespose)
        latitude = geoCodeRespose.results[0].geometry.location.lat;
        longitude = geoCodeRespose.results[0].geometry.location.lng;



        async function getGeoCode(address){
          return new Promise((resolve, reject) => {
            let encodedAddress = encodeURIComponent(address);
            let url = 'https://maps.googleapis.com/maps/api/geocode/json?'
                      + 'address=' + encodedAddress
                      + '&key=AIzaSyAl7ZldzhZeDOnPjJEIPlevPebXJOd0DRA';
          
            fetch(url)
              .then(res => res.json())
              .then(response => resolve(response));
          })
        }
      }

      pollingLocations.push({
        "type" : "Polling Location",
        "location" : location,
        "street" : address,
        "city" : city,
        "state" : state,
        "zip" : zip,
        "county" : county,
        "latitude" : latitude,
        "longitude" : longitude,
        "description" : description,
        "hours" : hours
      })
    }
    return pollingLocations;
  }
  else{
    //no Polling locations found
    /*
    let msg = "NotApplicable";
    pollingLocations.push({
      "type" : "Polling Location",
      "location" : msg,
      "street" : msg,
      "city" : msg,
      "state" : msg,
      "zip" : msg,
      "county" : msg,
      "latitude" : msg,
      "longitude" : msg,
      "hours" : msg
    })
    */
    //returns an empty array if no polling locations found
    return pollingLocations;
  }
}

function displayDropBoxes(dropBoxLocations,origin) {

    let list = dropBoxLocations;

    let encodedDestination;
    let encodedOrigin;
    let details;
    let address;


    for(var i = 0; i < list.length;i++) {
      var latLng = new google.maps.LatLng(list[i].latitude, list[i].longitude);
      dropBoxMarkers[i] = new google.maps.Marker({
          position: latLng,
          map : map
      });
      let description = list[i].description;
      //remove info before the first ; => drop box open date 
      //let desc = description.substring(description.indexOf(";") + 1);
      encodedOrigin = encodeURIComponent(origin);
      encodedDestination = list[i].latitude + "%2c" + list[i].longitude;
      details = list[i].type + "<br>" + list[i].county + "<br>" + list[i].location + "<br>" + description;
      address = list[i].street + " " + list[i].city + ", " + list[i].state ;
      //google.maps.event.addListener(markers[i], "click", showInfoWindow);
      bindInfoWindow(dropBoxMarkers[i], map, infowindow, details, encodedDestination,address,encodedOrigin);  
    }
}

function displayEarlyVoting(earlyVotingLocations,origin) {

  let list = earlyVotingLocations;

  let encodedDestination;
  let encodedOrigin;
  let details;
  let address;

  for(var i = 0; i < list.length;i++) {
    
    let lat = list[i].latitude;
    let lng = list[i].longitude;
    var latLng = new google.maps.LatLng(lat,lng);

    //check position against dropboxes
    for(let j = 0; j < dropBoxMarkers.length; j++) {

      //check against polling location markers
      //if markers are the exact positon it adjusts it a bit to prevent overlapping
      for(let k = 0; k < pollingLocationMarkers.length; k++) {
        
        let poll = pollingLocationMarkers[k];
        let position = poll.getPosition();

        if(latLng.equals(position)) {
          let newLat = lat + (0.2 -.3) / 1500;
          let newLng = lng + (0.2 -.4) / 1500;
          latLng = new google.maps.LatLng(newLat, newLng);
        }
      } 
      let box = dropBoxMarkers[j];
      let position = box.getPosition();

      if(latLng.equals(position)) {
        let newLat = lat + (0.2 -.3) / 1500;
        let newLng = lng + (0.2 -.4) / 1500;
        latLng = new google.maps.LatLng(newLat, newLng);
      }
    }

    earlyVotingMarkers[i] = new google.maps.Marker({
        position: latLng,
        map : map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
    });
    
    //########pollingLocations has no description key############
   //let description = list[i].description;
   //############ remove before ; not important at the moment 
   //remove info before the first ; => drop box open date 
   //let desc = description.substring(description.indexOf(";") + 1);
    encodedOrigin = encodeURIComponent(origin);
    encodedDestination = list[i].latitude + "%2c" + list[i].longitude;
    details = list[i].type + "<br>" + list[i].county + "<br>" + list[i].location + "<br>" + list[i].hours;
    address = list[i].street + " " + list[i].city + ", " + list[i].state;
    //google.maps.event.addListener(markers[i], "click", showInfoWindow);
    bindInfoWindow(earlyVotingMarkers[i], map, infowindow, details, encodedDestination,address,encodedOrigin);  
  }
}

function displayPollingLocations(pollingLocations, origin) {
  //console.log("hello");
  let list = pollingLocations;

  let encodedDestination;
  let encodedOrigin;
  let details;
  let address;
  //console.log(list.length);
  for(let i = 0; i < list.length;i++) {
    
    let lat = list[i].latitude;
    let lng = list[i].longitude;
    let latLng = new google.maps.LatLng(lat,lng);
    //console.log(latLng);
    //console.log(earlyVotingMarkers.length);
    //console.log("bye");

    //check against drop box locations
    for(let j = 0; j < dropBoxMarkers.length; j++) {

      let box = dropBoxMarkers[j];
      let position = box.getPosition();

      if(latLng.equals(position)) {
        let newLat = lat + (0.3 -.3) / 1500;
        let newLng = lng + (0.0 +.3) / 1500;
        latLng = new google.maps.LatLng(newLat, newLng);
      }
    }

    pollingLocationMarkers[i] = new google.maps.Marker({
        position: latLng,
        map : map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png'
    });
    //########pollingLocations has no description key############
   //let description = list[i].description;
   //remove info before the first ; => drop box open date 
   //let desc = description.substring(description.indexOf(";") + 1);
    encodedOrigin = encodeURIComponent(origin);
    encodedDestination = list[i].latitude + "%2c" + list[i].longitude;
    details = list[i].type + "<br>" + list[i].county + "<br>" + list[i].location + "<br>" + list[i].hours;
    address = list[i].street + " " + list[i].city + ", " + list[i].state ;

    //google.maps.event.addListener(markers[i], "click", showInfoWindow);
    bindInfoWindow(pollingLocationMarkers[i], map, infowindow, details, encodedDestination,address,encodedOrigin);  
  }

}



//check if keys exist in reponse


function getKeyValue(component, key){
    let value;
    if(component.hasOwnProperty(key)){
      value = component[key];
      return value;
    }else {
      value = "NotApplicable";
      //console.log("here" + value);
      return value;
    }
}

//SOMETIMES STATE DOES NOT HAVE COUNTY.....THEN GEOCODE THE LAT AND LNG TO GET COUNTY!!!!!!
function getCounty(results) {
  //## did the response change?? 
  //## proper way to get county is this---- results.state[0].local_jurisdiction.name
  //##
  if(results.hasOwnProperty('state')) {
    if(results.state[0].hasOwnProperty('local_jurisdiction')) {
      if(results.state[0].local_jurisdiction.hasOwnProperty('name')) {
        county = results.state[0].local_jurisdiction.name;
        return county;
      }
      else {
        county = "NotApplicable";
        return county;
      }
    }
    else {
      county = "NotApplicable";
      return county;
    }  
  }
  else {
    county = "NotApplicable"
    return county;
  }
}


function pressedEnterKey(input) {
  /* Store original event listener */
  const addEventListener = input.addEventListener;

  const addEventListenerWrapper = (type, listener) => {
    if (type === 'keydown') {
      /* Store existing listener function */
      const _listener = listener
      listener = (event) => {
        /* Simulate a 'down arrow' keypress if no address has been selected */
        const suggestionSelected = document.getElementsByClassName('pac-item-selected').length
        if (event.key === 'Enter' && !suggestionSelected) {
          const e = new KeyboardEvent('keydown', { 
            key: 'ArrowDown', 
            code: 'ArrowDown', 
            keyCode: 40, 
          })
          _listener.apply(input, [e])
        }
        _listener.apply(input, [event])
      }
    }
    addEventListener.apply(input, [type, listener])
  }
  input.addEventListener = addEventListenerWrapper;
}
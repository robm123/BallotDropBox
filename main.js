
function reloadThePage()
{
  location.reload();
}

var map;
//var icon = "http://path/to/icon.png"; possibly style icon
var json = "DropBoxLocations.json";
var infowindow;
var origin;
var destination;
var encodedOrigin;
var encodedDestination;
var encodedLink;
var lat;
var lng ;
let autocomplete;

function initAutocomplete() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 38.916691, lng: -77.035373 }, 
    zoom: 9,
    mapTypeId: "roadmap",
  });

  origin = document.getElementById("pac-input").value;
  var infowindow = new google.maps.InfoWindow();


  //reads in data from JSON file
  $.getJSON(json, function(json1) {
    $.each(json1.DropBoxes, function(key, data){
  
      var latLng = new google.maps.LatLng(data.lat, data.lng);
      var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        // icon: icon,
        title: data.title
      });

      encodedDestination = data.lat + "%2c" + data.lng;
      var details = data.title + ", " + data.county + "<br>" + data.location + "<br>" + data.description;
      var addr = data.address;
      bindInfoWindow(marker, map, infowindow, details, encodedDestination,addr);
    });
  }); 
  
  //-----


  origin = document.getElementById("pac-input").value;
  // Create the search box and link it to the UI element.
  const input = document.getElementById("pac-input");
  
  var options = {
    types: ['address'],
    componentRestrictions: {country: ["us"]}
  };
  

  //create the autocomplete object and specity waht we return
  //as you can see from above i only want it to return U.S> based addresses
  autocomplete = new google.maps.places.Autocomplete(input,options);
  //autocomplete.setComponentRestrictions({'country': ['us']});

  //i think this is redundant, im setting the which actual feilds to return.
  //the address components is an object that returns all address info such as street number., county,neigborhood, state, etc
  //geomtry is like a place such as chichago, illionis , southside chicago, parlin(its not a townn but a distrcit/neihgborhood i think), NJ
  autocomplete.setFields(["address_components", "geometry","formatted_address"]);
 
  //const infowindow = new google.maps.InfoWindow();
 
 //may remove , might be to cluttery
 //this is a pop showing the address on the pin the user typed
  const infowindowContent = document.getElementById("infowindow-content");
  infowindow.setContent(infowindowContent);
  
 
  const marker = new google.maps.Marker({
    map,
    anchorPoint: new google.maps.Point(0, -29),
  });

  //this is where the magic happens place = autocomplete.getplace() returns an json object thing
  //it contains alot of info pertaining to the address the user selected. im having trouble finding an exmaple fromthe documentaton
  //it contains nested objects and nested arrays of info
  //
  //
  autocomplete.addListener("place_changed", () => {
    infowindow.close();
    marker.setVisible(false);
    const place = autocomplete.getPlace();

    var p = place.formatted_address;

    var o;
    var xx;

    // you can see whtat its returnin in the conosle 
    for(var i = 0; i < place.address_components.length; i++){
      o = place.address_components[i].types[0];
      xx = place.address_components[i].long_name;
      console.log(">>>>>" + o + "  " + xx);
    }

    //lookup('41 southwood dr. old bridge NJ', renderResults);
    //console.log("--->" + place.address_components[0]);

    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }
    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17); // Why 17? Because it looks good.
    }
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);
    marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-pushpin.png')
    
    let address = "";
    if (place.address_components) {
      address = [
        (place.address_components[0] &&
          place.address_components[0].short_name) ||
          "",
        (place.address_components[1] &&
          place.address_components[1].short_name) ||
          "",
        (place.address_components[2] &&
          place.address_components[2].short_name) ||
          "",
      ].join(" ");
    }

    console.log("address: " + address);

    //infowindowContent.children["place-icon"].src = place.icon;
    //infowindowContent.children["place-name"].textContent = place.name;
    //const place = autocomplete.getPlace();

    // i was trying to figure out what it was returning
    //the JSON it returned was difficult to understand because i didnt know the actual keys
    //i couldnt find it in the documentation
    var streetNumber = place.address_components[0].long_name;
    var streetName = place.address_components[1].long_name;
    var town = place.address_components[2].long_name; 
    var state = place.address_components[5].long_name;
    var str = streetNumber + " " + streetName + " " + town + "," + state;
    encodedOrigin = encodeURIComponent(str);
    // broken--- new user address doesnt visually update
    //infowindowContent.children["place-address"].textContent = address;
    //infowindow.open(map, marker);
  });
  google.maps.event.addDomListener(window, 'load', initAutocomplete);
}

function bindInfoWindow(marker, map, infowindow, strDescription, strDestination,address) {
  var link;
  var information;
   
  //this is for the pop up window when u click on the pin 
  google.maps.event.addListener(marker, 'click', function() {
    link = "https://www.google.com/maps/dir/?api=1&origin=" + encodedOrigin + "&destination=" + strDestination + "&travelmode=driving";
    information = strDescription + "<br>" + "<a target='_blank' href='"+ link +"' >"+ address +"</a>" + "<br>";
    infowindow.setContent(information);
    infowindow.open(map, marker);
  });
}

// so what im doing here is calling that civic info api 
// im not done yet but im trying to build my own api from this function that will happen later 
// with using ur crawler to populate the gaps
// that api key is for the civic info api
//
//
/////////Functions to create dropbox location data set//////////////////////////////
/**
 * Initialize the API client and make a request.
 */
function load() {
  console.log("herrr")
  gapi.client.setApiKey('AIzaSyCR7YFB3ozjPmlWLNdy0dI09qUXeniY2Ew');
  //lookup(origin, renderResults);
}

/**
 * Build and execute request to look up voter info for provided address.
 * @param {string} address Address for which to fetch voter info.
 * @param {function(Object)} callback Function which takes the
 *     response object as a parameter.
 */
 function lookup(address, callback) {
 /**
   * Election ID for which to fetch voter info.
   * @type {number}
   */
  var electionId = 7000;

  /**
   * Request object for given parameters.
   * @type {gapi.client.HttpRequest}
   */
  var req = gapi.client.request({
      'path' : '/civicinfo/v2/voterinfo',
      'params' : {'electionId' : electionId, 'address' : address}
  });

  req.execute(callback);
} 

/**
 * Render results in the DOM.
 * @param {Object} response Response object returned by the API.
 * @param {Object} rawResponse Raw response from the API.
 */
function renderResults(response, rawResponse) {
  /*
  var el = document.getElementById('results');
  if (!response || response.error) {
    el.appendChild(document.createTextNode(
        'Error while trying to fetch polling place'));
    return;
  }*/

  if(!response || response.error) {
    window.alert("Error while trying to fetch polling place");
  }
  //response.earlyVoteSites
  //response.dropOffLocations
  //response.pollingLocations

  'dropOffLocations' in response  ? console.log('yay detected') : console.log('nope not found')

  console.log(response.dropOffLocations[0].address.locationName);

  var dropBoxList = [];
  var dropBox= {};

  for(var i in response.dropOffLocations){
    
    var item = response.dropOffLocations[i];

    dropBoxList.push({
      "type" : "DropBox",
      "location" : item.address.locationName,
      "address" : item.address.line1,
      "city" : item.address.city,
      "state" : item.address.state,
      "zip" : item.address.zip,
      "latitude" : item.latitude,
      "longitude" : item.longitude,
      "description" : item.notes,
      "hours" : item.pollingHours 
    });
  }
  console.log(dropBoxList);
  //---------end of civic info api------------
}








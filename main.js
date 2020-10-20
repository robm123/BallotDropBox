
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
	
	origin = document.getElementById("pac-input").value;
  // Create the search box and link it to the UI element.
  const input = document.getElementById("pac-input");

  var options = {
    types: ['address'],
    componentRestrictions: {country: ["us"]}
  };
  autocomplete = new google.maps.places.Autocomplete(input,options);
  //autocomplete.setComponentRestrictions({'country': ['us']});

  autocomplete.setFields(["address_components", "geometry"]);
 
  //const infowindow = new google.maps.InfoWindow();
 
 //may remove , might be to cluttery
  const infowindowContent = document.getElementById("infowindow-content");
  infowindow.setContent(infowindowContent);
  
  const marker = new google.maps.Marker({
    map,
    anchorPoint: new google.maps.Point(0, -29),
  });

  autocomplete.addListener("place_changed", () => {
    infowindow.close();
    marker.setVisible(false);
    const place = autocomplete.getPlace();

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
    //infowindowContent.children["place-icon"].src = place.icon;
    //infowindowContent.children["place-name"].textContent = place.name;
    //const place = autocomplete.getPlace();
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
	 
	google.maps.event.addListener(marker, 'click', function() {
		link = "https://www.google.com/maps/dir/?api=1&origin=" + encodedOrigin + "&destination=" + strDestination + "&travelmode=driving";
		information = strDescription + "<br>" + "<a target='_blank' href='"+ link +"' >"+ address +"</a>" + "<br>";
		infowindow.setContent(information);
		infowindow.open(map, marker);
	});
}

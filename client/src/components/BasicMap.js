import React, { useEffect, useRef, useState } from 'react'
import { FeatureGroup, MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'

function BasicMap() {
    const noTilesDisplayedOnMap = {
      "type":"FeatureCollection",
      "features":[],
    };
    
    const initialPosition = [12.91621054954953, 77.65186499781416]; // initial position of map
    const zoomLevel = 9;
    const colorDraw= "red"; // colour of AOI shapes
    let preLoadedStaticTilesJSON;
    const geoDataRefLayer = useRef(null);
    const [intersectingTilesToBeDisplayedOnMap,setintersectingTilesToBeDisplayedOnMap] = useState(noTilesDisplayedOnMap);
    const featureGroupRef = useRef(null);
    

    const updateAOIandIntersectingtiles = async (AOIGeoJSONObject) => {
      var intersectingTilesFeatureArray = [];
      // if (e.layerType === 'circle') {
      //   console.log("circle center, radius =", e.layer.getLatLng(), e.layer.getRadius())
      // } else {
        // polygon & rectangle
      console.log('d=',preLoadedStaticTilesJSON);
      console.log("polygon coordinates =",JSON.stringify(AOIGeoJSONObject)); // array of LatLng objects
      var response
      try{    
        const AOIgeometry={AOIGeoJSONObject}
        response = await fetch("http://localhost:5000/intersect",{
          method:"PUT",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify(AOIgeometry)
        })
        const data = await response.json();
        intersectingTilesFeatureArray.push(data)
      }
      catch(e){
        console.error(e.message)
      }
      
      console.log(intersectingTilesFeatureArray);
        //setIntersectingTilesDisplayedOnMap(intersectingTiles);
      //} // marker or lines, etc.
      setintersectingTilesToBeDisplayedOnMap(intersectingTilesFeatureArray);
    }

    const onAOICreated = async(e) => {
      //console.log(geodata);
      updateAOIandIntersectingtiles(e.layer.toGeoJSON());
    }

    const onAOIEdited = (e) => {
      //console.log(geodata);
      updateAOIandIntersectingtiles(e.layers.toGeoJSON().features[0]);
    }

    const onAOIDeleted = () => {
      setintersectingTilesToBeDisplayedOnMap(noTilesDisplayedOnMap);
    }

    const checkAndRemoveExistingAOI=(featureGroupReference)=>{ // Checks if AOI already exists, if it does remove the old one
      const drawnItems = featureGroupReference.current._layers;
        //console.log(featureGroupReference);
        if (Object.keys(drawnItems).length > 1) {
            Object.keys(drawnItems).forEach((layerid, index) => {
                //console.log(layerid,index)
                if (index > 0) return;
                const layer = drawnItems[layerid];
                featureGroupReference.current.removeLayer(layer);
            });
            //console.log(drawnItems);
        }
    }

    useEffect(() => { // re-renders geoJSON and AOI
      if (geoDataRefLayer.current) {
        geoDataRefLayer.current.clearLayers().addData(intersectingTilesToBeDisplayedOnMap);
        checkAndRemoveExistingAOI(featureGroupRef);
      }
    }, [intersectingTilesToBeDisplayedOnMap])

    useEffect(() => { // Fetch static tiles on initialization
      const fetchJSONDataUsingAPI = async()=>{
        try{
            const response = await fetch("http://localhost:5000/read");
            const JSONObject = await response.json();
            preLoadedStaticTilesJSON=JSONObject;
        }
        catch(err){
            console.error(err.message);
        }
      }
      fetchJSONDataUsingAPI();
    },[]);

    
  return (
    <MapContainer center={initialPosition} zoom={zoomLevel} style={{width: "100%", height: "100vh"}}>
        <FeatureGroup
        ref={featureGroupRef}        
        >
            <EditControl 
            position='topright' 
            onCreated={onAOICreated}
            onDeleted={onAOIDeleted}
            onEdited={onAOIEdited}
            draw={{ // initialize only polygon and rectangle. 
              polygon: {
                allowIntersection: true,
                shapeOptions: { color: colorDraw },
              },
              rectangle: {
                allowIntersection: true,
                shapeOptions: { color: colorDraw },
              },
              polyline: false,
              circle: false,
              circlemarker: false,
              marker: false,
            }}
            edit={{ // keeps the edit colours red as well 
              selectedPathOptions: {
                color: colorDraw,
                fillColor: colorDraw,
              },
              shapeOptions: { color: colorDraw },
            }}/>          
        </FeatureGroup>
        <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON ref={geoDataRefLayer} data={intersectingTilesToBeDisplayedOnMap} /> 
  </MapContainer>
  )
}

export default BasicMap
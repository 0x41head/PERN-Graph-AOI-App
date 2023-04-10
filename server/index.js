const express = require("express");
const app = express();
const pool = require("./db")
const cors = require("cors");
const jsonData = require('./JSONData/staticGeoDataTiles.json')
var dataInsertedBoolean = false

const retryFunction=(functionToRetry)=>{
    var retry = 10;
    while(retry){
        try { 
            functionToRetry();
            break;
        }
        catch (err) {
            if (retry>0){
                retry=retry-1;
                console.log(retry+ " retries left")
            }
            else{
                console.log(err.message)
            }
        }
    }

};

const connectToDB = async () => {
    await pool.connect();
};

const populateTable = async () => {
    
    if (!dataInsertedBoolean){
        const allData = await pool.query("SELECT * FROM post_gis_geo_data");
        if(allData.rowCount>0){
            dataInsertedBoolean = true;
            console.log ("Data Already inserted");
            return ;
        }
        else{
            //console.log(jsonData);
            for (var i=0;i<jsonData.features.length;i++){
                var PolygonDescription = jsonData.features[i];
                console.log(PolygonDescription)
                const newData = pool.query("INSERT INTO post_gis_geo_data(polygon) VALUES(ST_GeomFromGeoJSON($1)) ",[PolygonDescription.geometry]);
            }
            console.log ("Data Insertion Successful");
            return ;
            
        }
    }
    else{
        console.log ("Data Already inserted");
        return ;
    }
    
};

retryFunction(connectToDB);
retryFunction(populateTable);

//MIDDLEWARE
app.use(cors());
app.use(express.json());

//ROUTES

//READ ALL TABLE ROWS AND FOMRAT AS GEOJSON
app.post("/read",async(req,res)=>{
    try{
        const allData = await pool.query("SELECT * FROM post_gis_geo_data;",);
    }catch(err){
        console.error(err.message);
    }
})

//CHECKS FOR INTERSECTION BETWEEN AOI and Static tiles
app.put("/intersect",async(req,res)=>{
    try{
        const AOIpolygon = req.body.AOIGeoJSONObject.geometry;
        console.log(AOIpolygon);
        var formattedGeoJSONdata={};
        formattedGeoJSONdata.type="FeatureCollection"
        formattedGeoJSONdata.features=[]
        
        const allData = await pool.query("SELECT ST_AsGeoJSON(polygon) FROM post_gis_geo_data WHERE ST_Intersects(polygon,ST_GeomFromGeoJSON($1));",[AOIpolygon]);
        for (var i=0;i<allData.rows.length;i++){
            formattedGeoJSONdata.features.push(JSON.parse(allData.rows[i].st_asgeojson));
        }
        res.json(formattedGeoJSONdata)
    }catch(err){
        console.error(err.message);
    }
})



// LISTEN ON PORT 5000
app.listen(5000, ()=>{
    console.log("Server started on port 5000");
})
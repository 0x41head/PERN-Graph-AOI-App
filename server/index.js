const express = require("express");
const app = express();
const pool = require("./db")
const cors = require("cors");
const jsonData = require('./JSONData/staticGeoDataTiles.json')
var dataInserted = false

const connectToDB = async () => {
    var retry = 5;
    while(retry){
        try {
            await pool.connect();
            break;
        } catch (err) {
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

const populateTable =  () => {
    if (!dataInserted)
    {
        try{
            const allData = pool.query("SELECT * FROM geo_data");
            if(allData.rowCount>0){
                dataInserted = true;
                console.log ("Data Already inserted");
                return ;
            }
            else{
                //console.log(jsonData);
                for (var i=0;i<jsonData.features.length;i++){
                    var PolygonDescription = jsonData.features[i];
                    //console.log(PolygonDescription)
                    const newData = pool.query("INSERT INTO geo_data(geoddatajson) VALUES($1) ",[PolygonDescription]);
                }
                console.log ("Data Insertion Successful");
                return ;
                
            }
            
        }catch(err){
            console.error(err.message);
        }
    }
    else{
        console.log ("Data Already inserted");
        return ;
    }
    
};

connectToDB();
populateTable();

//MIDDLEWARE
app.use(cors());
app.use(express.json());

//ROUTES

//READ ALL TABLE ROWS AND FOMRAT AS GEOJSON
app.get("/read",async(req,res)=>{
    try{
        var formattedGeoJSONdata={};
        formattedGeoJSONdata.type="FeatureCollection"
        formattedGeoJSONdata.features=[]
        
        const allData = await pool.query("SELECT geoddatajson FROM geo_data");
        for (var i=0;i<allData.rows.length;i++){
            formattedGeoJSONdata.features.push(allData.rows[i].geoddatajson);
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
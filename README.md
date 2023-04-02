# PERN-Graph-AOI-App

Docker command to build the image
```
docker-compose up --build -d
```

Docker will host the React Frontend on http://localhost:3000/

In case the frontend loads and shows an error, stop and delete the docker and then restart.
```
docker stop $(docker ps -a -q) && docker rm $(docker ps -a -q)    
docker-compose up --build -d
```

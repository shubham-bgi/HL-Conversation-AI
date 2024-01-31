Requirement - Docker, node v20

# Start milvus server
```bash
$  docker compose -f ./high_level_BE/docker-compose.yml up
```
Acess Milvus - http://localhost:8000/

# Setup collection and BE
```bash
$  cd high_level_BE && npm run setup 
```

# Start BE Server
```bash
$  npm run start 
```

# Setup FE
```bash
$ cd high_level_FE && npm i
```

# Start FE
```bash
$ npm run serve
```

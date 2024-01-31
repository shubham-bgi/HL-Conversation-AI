# Conversation AI
It crawls data from a provided web URL, vectorizes the crawled data, after which you can submit queries to retrieve and visualize relevant information.

# Requirements
* Docker - https://www.docker.com/products/docker-desktop/
* node v20 - https://nodejs.org/en/download

# Setup
```bash
# Start milvus server
# Acess Milvus - http://localhost:8000/
docker compose -f ./high_level_BE/docker-compose.yml up

# Start BE
cd high_level_BE && npm run setup 
npm run start 

# Start FE
$ cd high_level_FE && npm i
$ npm run serve
```

# Project Structure high_level_BE
Contains a nest application that serves the BE application. Source folder contains
* migrations - Migrations is one time inital setup to set our collection.
* modules - Have three modules webpage, milvus, embedding.
 1. Webpage Module - Crawls and queries webpages.
 2. Milvus Module - Stores and retire data from milvus.
 3. Embedding Module - Reponsible to fetch embeddings.

# Project Structure high_level_FE
# Conversation AI
It crawls data from a provided web URL, vectorizes the crawled data, after which you can submit queries to retrieve and visualize relevant information.

# Requirements
* Docker - https://www.docker.com/products/docker-desktop/
* node v20 - https://nodejs.org/en/download

# Setup
1. Start milvus server acess Milvus - http://localhost:8000/
```bash
docker compose -f ./high_level_BE/docker-compose.yml up
```
2. New terminal - Setup BE
```bash
cd high_level_BE && npm run setup 
```
3. Same terminal - Start BE
```bash
npm run start 
```
4. New terminal - Setup FE
```bash
$ cd high_level_FE && npm i
```
```bash
# Start FE
$ npm run serve
```

# Project Structure high_level_BE
Contains a nest application that serves the BE application. Source folder contains
* migrations - Migrations is one time inital setup to set our collection.
* modules - Have three modules webpage, milvus, embedding.
 - Webpage Module - Crawls and queries webpages. 
 - Milvus Module - Stores and retire data from milvus.
 - Embedding Module - Reponsible to fetch embeddings.

# Project Structure high_level_FE
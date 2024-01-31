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
3. Start BE
```bash
npm run start 
```
4. New terminal - Setup FE
```bash
cd high_level_FE && npm i
```
5. Start FE
```bash
npm run serve
```

# Project Structure BE
Contains a nest application that serves the BE application. Source folder contains
* migrations - Migrations is one time inital setup to set our collection.
* modules - Have three modules webpage, milvus, embedding.
* Webpage Module - Crawls and queries webpages. 
* Milvus Module - Stores and retire data from milvus.
* Embedding Module - Reponsible to fetch embeddings.

# Project Structure FE

# API Design
* POST Webpage API - Accepts a body that have url field to on which application crawl data on.
```bash
curl -X 'POST' \
  'http://localhost:3100/webpage-api/webpage' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "url": "https://en.wikipedia.org/wiki/Node.js"
}'
```
* GET Webpage API - Queries relavent webpages on the string provided in query parameter.
```bash
curl -X 'GET' \
  'http://localhost:3100/webpage-api/webpage?query=What%20is%20node%3F' \
  -H 'accept: */*'
```
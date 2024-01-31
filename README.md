# Conversation AI
It crawls data from a provided web URL, vectorizes the crawled data, after which you can submit queries to retrieve and visualize relevant information.

# Requirements
* [Docker](https://www.docker.com/products/docker-desktop/)
* [node v20](https://nodejs.org/en/download)

# Setup
* Setup Video - https://www.youtube.com/watch?v=cCJLJWvn2iE
1. Start milvus server, [GUI](http://localhost:8000/)
```bash
docker compose -f ./high_level_BE/docker-compose.yml up
```
2. New terminal - Setup BE
```bash
cd high_level_BE && npm run setup 
```
3. Start BE,  [Swagger link](http://localhost:3100/webpage-api/api)
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
I have committed env file for easy setup.

# Project Structure BE
Contains a nest application that serves the BE application. Source folder contains
* migrations - Migrations contains files to set our collection in DB, it is a one time setup.
* Modules - Three modules:
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

# Why milvus DB?
Milvus is open source vector DB. It is horizontaly scalable and can an handle massive scale vector data.
It is popular and go to choice among top companies. It also provide GUI interface Attu.

# DB Design
Webpage Collection, contain following fields
* id - uuid string to uniquly identify each row
* link - string that contains the url of the webpage data was crawled from.
* text - A text chunk from the webpage on which we formed the vector.
* vector - This is the vector of the text chunk
It has idx_default index on vector field for quick retrieval of data.

# Why Hugging face for embeddings?
Hugging face provides benchmark on top embedding models world wide. It is free to use and you can also experiment between different models. Hugging face env variables.
* HF_ACCESS_TOKEN - hugging face access token, you can [create access token for free](https://huggingface.co/settings/tokens)
* USE_HF - set to 'true' to use hugging face, set it to 'false' and it will start using tensorflow setence transformer, but might need to change collection vector size to 512.
* HF_MODEL - Model of your choice, please make sure it is a sentence transformer model example vaue "BAAI/bge-large-en-v1.5"


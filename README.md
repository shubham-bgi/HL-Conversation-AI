# Conversation AI
It crawls data from a provided web URL, vectorizes the crawled data, after which you can submit queries to retrieve and visualize relevant information.

# Live Application
* FE - https://hl-conversation-ai-hytr.vercel.app/
* BE - https://convo-ai-udga.onrender.com/webpage-api/api (Use '%iP0T04=U3Ku' for pass in POST request)

# Requirements
* [Docker](https://www.docker.com/products/docker-desktop/)
* [node v20](https://nodejs.org/en/download)
* [Chrome](https://www.google.com/intl/en_in/chrome/)

# Setup
* Setup Video - https://www.youtube.com/watch?v=cCJLJWvn2iE
1. Start milvus server, after starting you can use [GUI](http://localhost:8000/), this step can be skipped if using Cloud MILVUS, [switch milvus host to cloud](high_level_BE/.env)
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
Contains a NestJs application. Source folder contains:
* migrations - Migrations contains files to set our collection in DB, it is a one time setup.
* Modules - Three modules:
* Webpage Module - Crawls and queries webpages. 
* Milvus Module - Stores and retire data from milvus.
* Embedding Module - Reponsible to fetch embeddings.

# Project Structure FE
Contains a Vue application. Source Folder contains:
* Assets - Contains static assets for the site
* Components - Contains all Vue components. Each component is a seperate file. SearchPage.vue component is the main component using the others.
* Styles - Contains global or shared styles. Single global.css serve the whole project.

# API Design
* POST Webpage API - Accepts a body that have url field. Starts crawling on that webpage asynchronously.
```bash
curl -X 'POST' \
  'http://localhost:3100/webpage-api/webpage' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "url": "https://en.wikipedia.org/wiki/Node.js",
  "pass": "%iP0T04=U3Ku"
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
* HF_ACCESS_TOKEN - hugging face access token, you can [create your access token for free](https://huggingface.co/settings/tokens)
* USE_HF - set to 'true' to use hugging face, set it to 'false' and it will start using tensorflow setence transformer, but will need to change collection vector size to 512.
* HF_MODEL - [Hugging face Model](https://huggingface.co/models?search=sentence-transformers) of your choice,  make sure it is a sentence transformer model. Also match collection vector size to the model dimensions. Example value "BAAI/bge-large-en-v1.5"

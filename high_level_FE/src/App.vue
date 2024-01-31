<template>
  <title>Conversation AI</title>

  <div class="search-page">
    <div class="title-search-container">
      <h1>Conversation AI</h1>
    </div>

    <div class="search-container">
      <input
        v-model="searchQuery"
        @keyup.enter="search"
        type="text"
        placeholder="Enter your search query"
      />
    </div>

    <loading-spinner v-if="loading" />

    <div v-else-if="searchResults.length > 0">
      <div
        class="item response"
        v-for="result in searchResults"
        :key="result.id"
      >
        <div>
          <p>{{ result.text }}</p>
          <br />
          <p>
            <!-- Source - -->
            <a :href="result.link" target="_blank" rel="noopener noreferrer">{{
              result.link
            }}</a>
          </p>
        </div>
      </div>
    </div>

    <div class="item error" v-else-if="errorMessage">
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner.vue";

export default {
  components: {
    LoadingSpinner, // Register the LoadingSpinner component
  },
  data() {
    return {
      searchQuery: "",
      searchResults: [],
      loading: false,
      errorMessage: "",
    };
  },
  methods: {
    async search() {
      try {
        this.loading = true;
        const res = await axios.get(
          `${process.env.VUE_APP_WEBPAGE_API}?queryString=${this.searchQuery}`
        );
        if (res.data.length) {
          this.searchResults = res.data;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        this.searchResults = [];
        this.errorMessage = "Error fetching data. Please try again.";
        this.scheduleHideErrorMessage();
      } finally {
        this.loading = false;
      }
    },
    scheduleHideErrorMessage() {
      setTimeout(() => {
        this.errorMessage = "";
      }, 3000);
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Montserrat&display=swap");

* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  font-family: "Montserrat", sans-serif;
}

body {
  padding: 20px;
  min-height: 100vh;
  background-color: rgb(234, 242, 255);
}

input {
  display: block;
  width: 350px;
  margin: 20px auto;
  padding: 10px 45px;
  background: white url("assets/search-icon.svg") no-repeat 15px center;
  background-size: 15px 15px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
}

.title-search-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

h1 {
  margin-right: 20px;
  font-size: 40px;
}

.item {
  width: 1000px;
  margin: 0 auto 10px auto;
  padding: 10px 20px;
  color: white;
  border-radius: 5px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px,
    rgba(0, 0, 0, 0.06) 0px 1px 2px 0px;
}

.response {
  background-color: rgb(97, 62, 252);
  cursor: pointer;
}

.error {
  width: 350px;
  background-color: tomato;
}
</style>

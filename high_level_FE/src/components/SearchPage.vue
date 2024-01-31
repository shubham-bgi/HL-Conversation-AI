<template>
  <div class="search-page">
    <SearchContainer v-model="searchQuery" @search="search" />
    <LoadingSpinner v-if="loading" />
    <SearchResults
      v-else-if="searchResults.length > 0"
      :searchResults="searchResults"
    />
    <ErrorContainer v-else-if="errorMessage" :errorMessage="errorMessage" />
  </div>
</template>

<script>
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner.vue";
import SearchContainer from "./SearchContainer.vue";
import SearchResults from "./SearchResults.vue";
import ErrorContainer from "./ErrorContainer.vue";

export default {
  components: {
    LoadingSpinner,
    SearchContainer,
    SearchResults,
    ErrorContainer,
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
        const url = `${process.env.VUE_APP_WEBPAGE_API}?query=${this.searchQuery}`;
        const res = await axios.get(url);
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
      }, 5000);
    },
  },
};
</script>

<style src="../styles/global.css" />

<template>
  <div class="search-page">
    <SearchContainer @search="search" />
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
import { ref } from "vue";

export default {
  name: "SearchPage",
  components: {
    LoadingSpinner,
    SearchContainer,
    SearchResults,
    ErrorContainer,
  },
  setup() {
    const searchResults = ref([]);
    const loading = ref(false);
    const errorMessage = ref("");
    const search = async (query) => {
      try {
        loading.value = true;
        const url = `${process.env.VUE_APP_WEBPAGE_API}?query=${query}`;
        const res = await axios.get(url, { timeout: 30000 });
        if (res.data.length) {
          searchResults.value = res.data;
        } else {
          throw new Error("No data found.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        searchResults.value = [];
        errorMessage.value = "Error fetching data. Please try again.";
        scheduleHideErrorMessage();
      } finally {
        loading.value = false;
      }
    };

    // Define the scheduleHideErrorMessage function
    const scheduleHideErrorMessage = () => {
      setTimeout(() => {
        errorMessage.value = "";
      }, 5000);
    };
    return {
      searchResults,
      loading,
      errorMessage,
      search,
    };
  },
};
</script>

<style src="../styles/global.css" />

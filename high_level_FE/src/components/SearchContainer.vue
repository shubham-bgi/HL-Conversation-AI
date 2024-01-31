<template>
  <div class="title-search-container">
    <h1>Conversation AI</h1>
  </div>
  <div class="search-container">
    <input
      v-model="searchQuery"
      @keyup.enter="onEnter"
      type="text"
      placeholder="Enter your search query"
    />
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  name: "SearchContainer",
  emits: ["search"],
  setup(props, context) {
    const searchQuery = ref("");
    function onEnter() {
      context.emit("search", searchQuery.value);
    }
    return {
      onEnter,
      searchQuery,
    };
  },
};
</script>

<template>
  <div class="title-search-container">
    <h1>Conversation AI</h1>
  </div>
  <div class="search-container">
    <input
      @keyup.enter="$emit('search')"
      type="text"
      placeholder="Enter your search query"
    />
  </div>
</template>

<script>
export default {
  props: ["searchQuery"],
};
</script>

<template>
  <div class="item response" v-for="result in searchResults" :key="result.id">
    <p>{{ result.text }}</p>
    <br />
    <a :href="result.link" target="_blank" rel="noopener noreferrer">{{
      result.link
    }}</a>
  </div>
</template>

<script>
export default {
  props: ["searchResults"],
};
</script>

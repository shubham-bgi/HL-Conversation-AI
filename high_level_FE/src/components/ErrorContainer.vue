<template>
    <div class="item error">
      <p>{{ errorMessage }}</p>
    </div>
  </template>
  
  <script>
  export default {
    props: ['errorMessage'],
  };
  </script>
  
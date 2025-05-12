import { createApp } from 'vue'
import { createPinia } from 'pinia' // Import Pinia
import App from './App.vue'
import './style.css'

// Import Vue Flow styles
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css' // Or your own theme

const app = createApp(App)
app.use(createPinia()) // Use Pinia
app.mount('#app')
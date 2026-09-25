import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

createApp(App).mount('#app')

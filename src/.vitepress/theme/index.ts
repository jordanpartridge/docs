import DefaultTheme from 'vitepress/theme'
import PackageGrid from './PackageGrid.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PackageGrid', PackageGrid)
  },
}

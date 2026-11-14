import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker'

// Bundled workers, so the editor never fetches anything from a CDN
self.MonacoEnvironment = {
  getWorker(_workerId, label) {
    if (label === 'json') return new JsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker()
    if (label === 'typescript' || label === 'javascript') return new TsWorker()
    return new EditorWorker()
  }
}

// Files open one at a time without their project's tsconfig or node_modules,
// so type errors would be noise; syntax errors still show
for (const defaults of [
  monaco.typescript.typescriptDefaults,
  monaco.typescript.javascriptDefaults
]) {
  defaults.setDiagnosticsOptions({ noSemanticValidation: true })
}

// Arduino sketches are C++
monaco.languages.register({ id: 'cpp', extensions: ['.ino', '.pde'] })

// Matches the app's tokens in main.css
monaco.editor.defineTheme('near-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#161616',
    'editor.foreground': '#e6e6e6',
    'editor.lineHighlightBackground': '#1d1d1d',
    'editor.lineHighlightBorder': '#00000000',
    'editorLineNumber.foreground': '#5c5c5c',
    'editorLineNumber.activeForeground': '#bdbdbd',
    'editorCursor.foreground': '#ff6a1a',
    'editor.selectionBackground': '#ff6a1a40',
    'editor.inactiveSelectionBackground': '#ff6a1a24',
    'editorIndentGuide.background1': '#262626',
    'editorIndentGuide.activeBackground1': '#3a3a3a',
    'editorWidget.background': '#1b1b1b',
    'editorWidget.border': '#333333',
    'editorSuggestWidget.background': '#1b1b1b',
    'editorSuggestWidget.border': '#333333',
    'editorSuggestWidget.selectedBackground': '#2a2a2a',
    'input.background': '#161616',
    'input.border': '#333333',
    focusBorder: '#ff6a1a80',
    'scrollbarSlider.background': '#ffffff14',
    'scrollbarSlider.hoverBackground': '#ffffff24',
    'scrollbarSlider.activeBackground': '#ffffff30',
    'minimap.background': '#161616',
    'editorOverviewRuler.border': '#00000000'
  }
})

export { monaco }

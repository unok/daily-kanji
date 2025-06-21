// Wait for KanjiCanvas to be loaded before setting refPatterns
;(() => {
  function loadRefPatterns() {
    if (typeof KanjiCanvas !== 'undefined') {
      // Load the actual ref-patterns.js content
      const script = document.createElement('script')
      script.src = '/ref-patterns.js'
      document.head.appendChild(script)
    } else {
      // Retry after 100ms
      setTimeout(loadRefPatterns, 100)
    }
  }

  // Start trying to load after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRefPatterns)
  } else {
    loadRefPatterns()
  }
})()

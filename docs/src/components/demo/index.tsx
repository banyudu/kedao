import React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'

function LazyDemo () {
  return (
    <BrowserOnly fallback={<div>Loading...</div>}>
      {() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const LibComponent = require('./demo').default
        return <LibComponent />
      }}
    </BrowserOnly>
  )
}

export default LazyDemo

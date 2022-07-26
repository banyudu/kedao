import React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'
import './index.css'

const Lazy = (props: any) => {
  return (
    <BrowserOnly>
      {() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Editor = require('kedao').default
        return (
          <div className="demo">
            <Editor {...props} />
          </div>
        )
      }}
    </BrowserOnly>
  )
}

export default Lazy

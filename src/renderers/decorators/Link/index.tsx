import React, { FC } from 'react'
import '../../../components/business/LinkEditor/style.scss'
import { ContentState } from 'draft-js'

const viewLink = (event, link) => {
  // When pressing the Ctrl / command key, click to open the url in the link text
  if (event.getModifierState('Control') || event.getModifierState('Meta')) {
    const tempLink = document.createElement('a')
    tempLink.href = link
    tempLink.target = event.currentTarget.target
    tempLink.click()
  }
}

interface LinkProps {
  entityKey: string
  contentState: ContentState
  children: React.ReactNode
}

const Link: FC<LinkProps> = ({ children, entityKey, contentState }) => {
  const { href, target } = contentState.getEntity(entityKey).getData()

  return (
    <span className="kedao-link-wrap">
      <a
        onClick={(event) => viewLink(event, href)}
        className="kedao-link"
        href={href}
        target={target}
      >
        {children}
      </a>
    </span>
  )
}

export default Link

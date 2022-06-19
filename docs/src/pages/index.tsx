import React, { useEffect } from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import useBaseUrl from '@docusaurus/useBaseUrl'

export default function Home (): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  const introUrl = useBaseUrl('/docs/intro')
  useEffect(() => {
    window.location.href = introUrl
  }, [])
  return (
    <Layout
      title={siteConfig.title}
      description="Kedao is a react editor.">
      <main />
    </Layout>
  )
}

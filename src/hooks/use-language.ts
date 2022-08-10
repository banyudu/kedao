import { useAtom } from 'jotai'
import { langAtom } from '../states'

const useLanguage = () => {
  const [language] = useAtom(langAtom)
  return language
}

export default useLanguage

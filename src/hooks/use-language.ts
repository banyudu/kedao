import { useAtomValue } from 'jotai'
import { langAtom } from '../states'

const useLanguage = () => {
  const language = useAtomValue(langAtom)
  return language
}

export default useLanguage

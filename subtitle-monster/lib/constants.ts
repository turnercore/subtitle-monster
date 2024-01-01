// Exported Constants

const projectName = 'subtitle-monster'
const projectPrefix = 'sm'

// See if database is shared
const isSharedDb = process.env.SHARED_DB ? process.env.SHARED_DB : false
const hasSharedProfiles = process.env.SHARED_PROFILES
  ? process.env.SHARED_PROFILES
  : true

// Tables in DB
export const PROFILES_TABLE =
  hasSharedProfiles || !isSharedDb ? 'profiles' : projectPrefix + '_profiles'
export const SUBTITLES_TABLE = isSharedDb
  ? projectPrefix + '_subtitles'
  : 'subtitles'
export const API_KEY_TABLE = isSharedDb
  ? projectPrefix + '_api_keys'
  : 'api_keys'

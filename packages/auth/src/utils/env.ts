interface SharedTokenSource {
  id: string
  name: string
  loginUrl: string
  userInfoUrl: string
}

export const loadSharedTokenSources = (): SharedTokenSource[] => {
  const sources: SharedTokenSource[] = []
  let index = 0

  while (process.env[`SHARED_TOKEN_SOURCE_${index}_ID`]) {
    sources.push({
      id: process.env[`SHARED_TOKEN_SOURCE_${index}_ID`] as string,
      name: process.env[`SHARED_TOKEN_SOURCE_${index}_NAME`] || `Source ${index}`,
      loginUrl: process.env[`SHARED_TOKEN_SOURCE_${index}_LOGIN_URL`] as string,
      userInfoUrl: process.env[`SHARED_TOKEN_SOURCE_${index}_USER_INFO_URL`] as string,
    })
    index++
  }

  return sources
}

export const getAuthProviders = () => {
  const providers = []

  if (process.env.NEXT_PUBLIC_AUTH_SHARED_TOKEN_ENABLED === 'true') {
    providers.push('shared-token')
  }

  if (process.env.NEXT_PUBLIC_AUTH_CLERK_ENABLED === 'true') {
    providers.push('clerk')
  }

  return providers
}

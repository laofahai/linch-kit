import nextra from 'nextra'

const withNextra = nextra({})

export default withNextra({
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
  },
})

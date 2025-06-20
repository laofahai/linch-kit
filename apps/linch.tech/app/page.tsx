'use client'

import { Hero } from '../components/Hero'
import { Features } from '../components/Features'
import { ProductMatrix } from '../components/ProductMatrix'
import { SocialProof } from '../components/SocialProof'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <ProductMatrix />
      <SocialProof />
    </>
  )
}

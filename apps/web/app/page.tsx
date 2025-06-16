import { type ImageProps } from 'next/image'
import { Button } from '@flex-report/ui/shadcn'

type Props = Omit<ImageProps, 'src'> & {
  srcLight: string
  srcDark: string
}

export default function Home() {
  return (
    <div>
      <div className={'text-red-500'}>hi</div>
      <Button>hey</Button>
      <h1 className="text-3xl font-bold underline"> Hello world! </h1>
    </div>
  )
}

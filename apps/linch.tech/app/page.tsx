import Link from "next/link";
import Image from "next/image";
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t, i18n } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white font-sans">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Image src="/next.svg" alt="Linch Kit Logo" width={32} height={32} />
          <span className="font-bold text-lg tracking-tight">Linch Kit</span>
        </div>
        <nav className="flex gap-6 text-sm font-medium items-center">
          <Link href="#features" className="hover:underline">{t('nav.product')}</Link>
          <Link href="/docs" className="hover:underline">{t('nav.docs')}</Link>
          <Link href="#ecosystem" className="hover:underline">{t('nav.ecosystem')}</Link>
          <a href="https://github.com/linch-kit/linch-kit" target="_blank" rel="noopener" className="hover:underline">{t('nav.github')}</a>
          {/* 语言切换按钮 */}
          <button
            className="ml-4 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            onClick={() => i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')}
            aria-label="切换语言"
          >
            {i18n.language === 'zh' ? 'English' : '中文'}
          </button>
        </nav>
      </header>

      {/* Hero 区块 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 gap-10">
        <section className="flex flex-col items-center gap-6 max-w-2xl text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t('hero.title')}</h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
            {t('hero.subtitle')}
          </p>
          <div className="flex gap-4 justify-center mt-2">
            <Link href="/docs" className="rounded-full bg-black text-white dark:bg-white dark:text-black px-6 py-2 font-semibold text-base shadow hover:opacity-90 transition">{t('hero.cta')}</Link>
            <a href="https://github.com/linch-kit/linch-kit" target="_blank" rel="noopener" className="rounded-full border border-black dark:border-white px-6 py-2 font-semibold text-base hover:bg-gray-100 dark:hover:bg-gray-900 transition">{t('hero.github')}</a>
          </div>
        </section>

        {/* 产品特色/技术架构 */}
        <section id="features" className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 w-full max-w-4xl">
          {[0,1,2,3].map(idx => (
            <div key={t(`features.${idx}.title`)} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 flex flex-col gap-2 shadow-sm">
              <h2 className="font-bold text-lg mb-1">{t(`features.${idx}.title`)}</h2>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm">
                {t(`features.${idx}.items`, { returnObjects: true }).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>

      {/* 页脚 CTA */}
      <footer className="flex flex-col items-center gap-2 py-6 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
        <div>
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
        <div className="flex gap-4">
          <a href="https://github.com/linch-kit/linch-kit" target="_blank" rel="noopener" className="hover:underline">{t('footer.github')}</a>
          <a href="/docs" className="hover:underline">{t('footer.docs')}</a>
        </div>
      </footer>
    </div>
  );
}

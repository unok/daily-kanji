import { chromium } from 'playwright'

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function testGameApp() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })

    // ページが読み込まれるまで待機
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: join(__dirname, 'screenshots', 'menu-screen.png'),
      fullPage: true,
    })

    // 練習を始めるボタンを探す
    const startButton = await page.getByRole('button', { name: /練習を始める|始める|Start|開始/i })

    if (await startButton.isVisible()) {
      // ボタンをクリックする前のスクリーンショット
      await page.screenshot({
        path: join(__dirname, 'screenshots', 'before-click.png'),
        fullPage: true,
      })

      // ボタンをクリック
      await startButton.click()

      // クリック後の画面が更新されるのを待つ
      await page.waitForTimeout(2000)

      // クリック後のスクリーンショット
      await page.screenshot({
        path: join(__dirname, 'screenshots', 'after-click.png'),
        fullPage: true,
      })
    } else {
      // ページの内容を確認
      const _pageContent = await page.content()

      // すべてのボタンを探す
      const buttons = await page.locator('button').all()

      for (let i = 0; i < buttons.length; i++) {
        const _text = await buttons[i].textContent()
      }
    }
  } catch (error) {
    console.error('エラーが発生しました:', error)

    // エラー時のスクリーンショット
    await page.screenshot({
      path: join(__dirname, 'screenshots', 'error-screen.png'),
      fullPage: true,
    })
  } finally {
    // ブラウザを閉じる
    await browser.close()
  }
}

// スクリーンショット用のディレクトリを作成
import { mkdirSync } from 'node:fs'

try {
  mkdirSync(join(__dirname, 'screenshots'), { recursive: true })
} catch (_e) {
  // ディレクトリが既に存在する場合は無視
}

testGameApp()

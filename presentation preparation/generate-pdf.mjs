import { chromium } from 'playwright'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mdPath = path.join(__dirname, 'COMMUNITY-HERO-COMPLETE-GUIDE.md')
const htmlPath = path.join(__dirname, 'COMMUNITY-HERO-COMPLETE-GUIDE.html')
const pdfPath = path.join(__dirname, 'COMMUNITY-HERO-COMPLETE-GUIDE.pdf')

const css = `
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.55;
  color: #1a1a1a;
  max-width: 780px;
  margin: 0 auto;
  padding: 24px 32px;
}
h1 { font-size: 22pt; color: #0d4f4f; border-bottom: 2px solid #14B8A6; padding-bottom: 8px; margin-top: 32px; page-break-before: always; }
h1:first-of-type { page-break-before: avoid; }
h2 { font-size: 16pt; color: #0d4f4f; margin-top: 24px; }
h3 { font-size: 13pt; color: #333; margin-top: 18px; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; }
th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
th { background: #e8f5f3; font-weight: 600; }
tr:nth-child(even) { background: #f9f9f9; }
code { background: #f4f4f4; padding: 1px 5px; border-radius: 3px; font-size: 9.5pt; }
pre { background: #1e1e1e; color: #e8e8e8; padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 9pt; line-height: 1.4; }
pre code { background: none; color: inherit; padding: 0; }
blockquote { border-left: 4px solid #14B8A6; margin: 12px 0; padding: 8px 16px; background: #f0faf8; }
a { color: #0d6e6e; }
hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
ul, ol { padding-left: 24px; }
li { margin: 4px 0; }
strong { color: #111; }
@media print {
  body { padding: 0; }
  h1 { page-break-before: always; }
  h1:first-of-type, h2, h3 { page-break-after: avoid; }
  table, pre, blockquote { page-break-inside: avoid; }
}
`

// pandoc: md -> standalone HTML
execSync(
  `pandoc "${mdPath}" -f markdown -t html5 --standalone -o "${htmlPath}"`,
  { stdio: 'inherit' }
)

let html = fs.readFileSync(htmlPath, 'utf8')
html = html.replace('</head>', `<style>${css}</style></head>`)
fs.writeFileSync(htmlPath, html)

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await page.pdf({
  path: pdfPath,
  format: 'A4',
  margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font-size:8px;text-align:center;color:#888;padding:0 16mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
})
await browser.close()

const stats = fs.statSync(pdfPath)
console.log(`PDF generated: ${pdfPath} (${(stats.size / 1024).toFixed(0)} KB)`)

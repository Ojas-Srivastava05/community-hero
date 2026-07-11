import { chromium } from 'playwright'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mdPath = path.join(__dirname, '8-MINUTE-SPEAKER-SCRIPT.md')
const htmlPath = path.join(__dirname, '8-MINUTE-SPEAKER-SCRIPT.html')
const pdfPath = path.join(__dirname, '8-MINUTE-SPEAKER-SCRIPT.pdf')
const rootPdfPath = path.join(__dirname, '..', '8-MINUTE-SPEAKER-SCRIPT.pdf')

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

body {
  font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 10.5pt;
  line-height: 1.6;
  color: #252836;
  max-width: 780px;
  margin: 0 auto;
  padding: 24px 32px;
  background: #FEFDFB;
}

h1 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 22pt;
  color: #252836;
  border-bottom: 3px solid #E0632B;
  padding-bottom: 8px;
  margin-top: 0;
  page-break-after: avoid;
}

h2 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 14pt;
  color: #E0632B;
  margin-top: 28px;
  page-break-before: always;
  page-break-after: avoid;
  border-left: 4px solid #E0632B;
  padding-left: 10px;
}

h2:first-of-type { page-break-before: avoid; margin-top: 20px; }

h3 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 11.5pt;
  color: #252836;
  margin-top: 18px;
  page-break-after: avoid;
}

p { margin: 8px 0; }

strong { color: #111; }

blockquote {
  border-left: 4px solid #E0632B;
  margin: 14px 0;
  padding: 10px 16px;
  background: #F6F3EE;
  font-style: italic;
  color: #333;
  page-break-inside: avoid;
}

blockquote p { margin: 6px 0; }

hr {
  border: none;
  border-top: 1px solid #E8E4DE;
  margin: 20px 0;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 9.5pt;
  page-break-inside: avoid;
}

th, td {
  border: 1px solid #E8E4DE;
  padding: 6px 10px;
  text-align: left;
  vertical-align: top;
}

th {
  background: #FCE8DE;
  font-weight: 600;
}

tr:nth-child(even) { background: #F6F3EE; }

td:first-child {
  font-weight: 600;
  color: #C2410C;
  width: 22%;
  white-space: nowrap;
}

ul, ol { padding-left: 22px; margin: 8px 0; }
li { margin: 4px 0; }

em { color: #666; font-size: 9.5pt; }

.cue-intro {
  background: #FCE8DE;
  padding: 12px 16px;
  border-radius: 6px;
  margin: 12px 0;
  font-size: 10pt;
}

@media print {
  body { padding: 0; }
  h2 { page-break-before: always; }
  h2:first-of-type { page-break-before: avoid; }
  blockquote, table { page-break-inside: avoid; }
}
`

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
for (const outPath of [pdfPath, rootPdfPath]) {
  await page.pdf({
    path: outPath,
    format: 'A4',
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font-size:8px;text-align:center;color:#888;padding:0 14mm;">Community Hero · Presentation Cue Cards · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  })
}
await browser.close()

const stats = fs.statSync(pdfPath)
console.log(`PDF generated: ${pdfPath} (${(stats.size / 1024).toFixed(0)} KB)`)
console.log(`Copy: ${rootPdfPath}`)

import { chromium } from 'playwright'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mdPath = path.join(__dirname, 'GOOGLE-SLIDES-PROMPTS-COMPLETE-GUIDE.md')
const htmlPath = path.join(__dirname, 'GOOGLE-SLIDES-PROMPTS-COMPLETE-GUIDE.html')
const pdfPath = path.join(__dirname, 'GOOGLE-SLIDES-PROMPTS-COMPLETE-GUIDE.pdf')

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

body {
  font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #252836;
  max-width: 820px;
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
  margin-top: 28px;
  page-break-before: always;
}
h1:first-of-type { page-break-before: avoid; margin-top: 0; }

h2 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 15pt;
  color: #E0632B;
  margin-top: 22px;
  border-left: 4px solid #E0632B;
  padding-left: 10px;
}

h3 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 12pt;
  color: #252836;
  margin-top: 16px;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 9.5pt;
}
th, td {
  border: 1px solid #E8E4DE;
  padding: 6px 10px;
  text-align: left;
}
th {
  background: #FCE8DE;
  color: #252836;
  font-weight: 600;
}
tr:nth-child(even) { background: #F6F3EE; }

code {
  background: #FCE8DE;
  color: #C2410C;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9pt;
  font-family: 'SF Mono', Menlo, monospace;
}

pre {
  background: #252836;
  color: #F6F3EE;
  padding: 14px 16px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 8.5pt;
  line-height: 1.45;
  border-left: 4px solid #E0632B;
  white-space: pre-wrap;
  word-wrap: break-word;
}
pre code {
  background: none;
  color: inherit;
  padding: 0;
}

blockquote {
  border-left: 4px solid #E0632B;
  margin: 12px 0;
  padding: 10px 16px;
  background: #FCE8DE;
  color: #252836;
  border-radius: 0 8px 8px 0;
}

a { color: #E0632B; }

hr {
  border: none;
  border-top: 1px solid #E8E4DE;
  margin: 20px 0;
}

ul, ol { padding-left: 22px; }
li { margin: 3px 0; }

strong { color: #252836; }

@media print {
  body { padding: 0; background: white; }
  h1 { page-break-before: always; }
  h1:first-of-type, h2, h3 { page-break-after: avoid; }
  table, pre, blockquote { page-break-inside: avoid; }
  pre { font-size: 8pt; }
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
await page.pdf({
  path: pdfPath,
  format: 'A4',
  margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="width:100%;font-size:7pt;padding:0 14mm;color:#7A7F8E;font-family:sans-serif;">
      Community Hero · Google Slides Prompt Guide · Vibe2Ship 2026
    </div>`,
  footerTemplate: `
    <div style="width:100%;font-size:8pt;text-align:center;color:#E0632B;padding:0 14mm;">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>`,
})
await browser.close()

const stats = fs.statSync(pdfPath)
console.log(`PDF generated: ${pdfPath} (${(stats.size / 1024).toFixed(0)} KB)`)

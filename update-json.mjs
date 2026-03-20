import fs from 'fs'

const file = 'backend/WF-08-daily-orchestrator.json'
let json = JSON.parse(fs.readFileSync(file, 'utf8'))

const newLogic = `// Health score formula
const score = total > 0 ? Math.round(((low * 100) + (medium * 70) + (high * 30) + (oos * 5)) / total) : 50;
const health = Math.min(100, Math.max(0, score));

const today`

function replaceCode(node) {
  if (node.type === 'n8n-nodes-base.code' && node.parameters && node.parameters.jsCode) {
    if (node.parameters.jsCode.includes('problemScore')) {
      node.parameters.jsCode = node.parameters.jsCode.replace(
        /\/\/ Health score: 100[\s\S]*?const today/,
        newLogic
      )
      console.log('Replaced in node:', node.name)
    }
  }
}

json.nodes.forEach(replaceCode)

fs.writeFileSync(file, JSON.stringify(json, null, 2))
console.log('Updated JSON')

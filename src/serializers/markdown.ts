import YAML from "yaml"
import * as Y from "yjs"
import { getDeltaOperations } from "../yjs"

export function serialize(doc: Y.Doc) {
  let str = ``
  if (doc.share.size === 0) {
    return str
  } else {
    const keys = [...doc.share.keys()].filter((s) => s !== `body`).sort()
    str += `---\n`
    if (keys.length > 0) {
      // Always put the title at the top.
      if (doc.share.has(`title`)) {
        str += YAML.stringify({ title: doc.get(`title`) })
      }

      keys.forEach((key) => {
        if (key === `title`) {
          return
        } else {
          str += YAML.stringify({ [key]: doc.get(key) })
        }
      })
    }
    str += `---\n\n`

    const body = doc.getText(`body`).toString()
    str += body
    return str
  }
}

const regex = /^---\s*[\r\n]+(.*?)\s*[\r\n]+---\s*[\r\n]+(.*)/s
export function deseralize(text) {
  const match = regex.exec(text)

  if (match) {
    const frontmatter = YAML.parse(match[1])
    const body = match[2]

    return { ...frontmatter, body }
  } else {
    throw new Error(`We couldn't parse the markdown file`)
  }
}

export function applyFileUpdate(fileData, currentDoc) {
  currentDoc.transact(() => {
    Object.entries(fileData).forEach(([key, value]) => {
      // diff and apply text.
      if (typeof value === `string`) {
        const strType = currentDoc.getText(key)
        const deltaOperations = getDeltaOperations(strType.toString(), value)
        strType.applyDelta(deltaOperations)
      }

      // delete then create arrays/maps
      if (Array.isArray(value)) {
        const arrayType = currentDoc.getArray(key)
        arrayType.delete(0, arrayType.length)
        arrayType.push(value)
      } else if (typeof value === `object`) {
        const mapType = currentDoc.getMap(key)
        mapType.clear()
        Object.entries(value).forEach(([k, v]) => {
          mapType.set(k, v)
        })
      }
    })
  })
}

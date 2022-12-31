import { describe, it, expect } from "vitest"
import { serialize, deseralize, applyFileUpdate } from "../markdown"
import * as Y from "yjs"

describe(`serialize markdown`, () => {
  it(`exports a text body field by default`, () => {
    const doc = new Y.Doc()
    const bodyStr = `hello`
    const bodyType = doc.getText(`body`)
    bodyType.insert(0, bodyStr)
    expect(serialize(doc)).toEqual(`---\n---\n\n${bodyStr}`)
  })
  it(`serializes other explicitly named fields as yaml frontmatter`, () => {
    const doc = new Y.Doc()
    const bodyStr = `hello`
    const bodyType = doc.getText(`body`)

    // Text
    const titleType = doc.getText(`title`)
    titleType.insert(0, `title`)
    const authorType = doc.getText(`author`)
    authorType.insert(0, `someone`)

    // Array
    const arrayType = doc.getArray(`array`)
    arrayType.push([1, 2, `foo`])

    // Map
    const mapType = doc.getMap(`map`)
    mapType.set(`foo`, 1)
    mapType.set(`bar`, `yjs`)

    bodyType.insert(0, bodyStr)
    const serializedStr = `---
title: title
array:
  - 1
  - 2
  - foo
author: someone
map:
  foo: 1
  bar: yjs
---

${bodyStr}`

    expect(serialize(doc)).toEqual(serializedStr)
  })
})

// User defines the names of types & the allowed keys
describe(`deserialize markdown`, () => {
  it(`returns an object from a markdown string`, () => {
    const doc = new Y.Doc()
    const bodyStr = `hello`
    const bodyType = doc.getText(`body`)

    // Text
    const titleType = doc.getText(`title`)
    titleType.insert(0, `title`)
    const authorType = doc.getText(`author`)
    authorType.insert(0, `someone`)

    // Array
    const arrayType = doc.getArray(`array`)
    arrayType.push([1, 2, `foo`])

    // Map
    const mapType = doc.getMap(`map`)
    mapType.set(`foo`, 1)
    mapType.set(`bar`, `yjs`)

    bodyType.insert(0, bodyStr)

    const mdFile = serialize(doc)
    const fileData = deseralize(mdFile)
    expect(fileData).toEqual({
      body: `hello`,
      title: `title`,
      author: `someone`,
      array: [1, 2, `foo`],
      map: { foo: 1, bar: `yjs` },
    })
  })
})
describe(`apply file updates`, () => {
  it(`applies the updates from a file to its doc`, () => {
    const oldFile = `---
title: title
array:
  - 1
  - 2
  - foo
author: someone
map:
  foo: 1
  bar: yjs
---

hello`

    const newFile = `---
title: title
array:
  - 1
  - 3
author: someone2
map:
  foo: 12
  bar: ys
  zoom: true
---

helo2`

    const doc = new Y.Doc()
    const oldFileData = deseralize(oldFile)
    // Fill doc with old data.
    Object.entries(oldFileData).forEach(([key, value]) => {
      if (typeof value === `string`) {
        const strType = doc.getText(key)
        strType.insert(0, value)
      }
      if (Array.isArray(value)) {
        const arrayType = doc.getArray(key)
        arrayType.push(value)
      } else if (typeof value === `object`) {
        const mapType = doc.getMap(key)
        Object.entries(value).forEach(([k, v]) => {
          mapType.set(k, v)
        })
      }
    })

    applyFileUpdate(deseralize(newFile), doc)
    expect(serialize(doc)).toEqual(newFile)
  })
})

// Delta
// for arrays & maps — probably easiest to just replace them wholesale in a transaction.
// Or actually yeah, if the file is newer, just always delete lists/maps and write in
// new — it won't be common & they'll be pretty small here.
//
// Define types
//
// maybe just store everything on a root map — so then can just call toJSON for serialization.

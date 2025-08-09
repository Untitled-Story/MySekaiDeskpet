import { net, protocol } from 'electron'
import path from 'path'
import url from 'url'

export default async function setupProtocolHandlers(): Promise<void> {
  protocol.handle('app', (request) => {
    const requestUrl = new URL(request.url)
    if (requestUrl.host === 'get') {
      const decodedPath = decodeURIComponent(requestUrl.pathname)
      const rootDir = process.cwd()
      const safePath = path.normalize(decodedPath)
      const absolutePath = path.join(rootDir, safePath)
      const fileUrl = url.pathToFileURL(absolutePath).toString()
      try {
        return net.fetch(fileUrl)
      } catch (error) {
        console.error(`File fetch failed: ${absolutePath}`, error)
        return new Response(null, { status: 404 })
      }
    } else {
      return new Response(null, { status: 400 })
    }
  })
}

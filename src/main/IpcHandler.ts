import { ipcMain, screen } from 'electron'
import { mainWindow } from './index'

export default async function setupIpcHandlers(): Promise<void> {
  ipcMain.on('move-window', (_event, data: { x: number; y: number }): void => {
    mainWindow.setPosition(data.x, data.y)
  })

  ipcMain.handle('get-screen-size', () => {
    const winBounds = mainWindow.getBounds()
    const currentDisplay = screen.getDisplayNearestPoint({
      x: winBounds.x,
      y: winBounds.y
    })
    const { width: workWidth, height: workHeight } = currentDisplay.workAreaSize
    return { width: workWidth, height: workHeight }
  })

  ipcMain.handle('get-position', () => {
    const [x, y] = mainWindow.getPosition()
    return { x: x, y: y }
  })
}

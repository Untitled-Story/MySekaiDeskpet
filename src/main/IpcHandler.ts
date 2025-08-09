import { ipcMain } from 'electron'
import { mainWindow } from './index'

export default async function setupIpcHandlers(): Promise<void> {
  ipcMain.on('move-window', (_event, data: { x: number; y: number }): void => {
    mainWindow.setPosition(data.x, data.y)
  })
}

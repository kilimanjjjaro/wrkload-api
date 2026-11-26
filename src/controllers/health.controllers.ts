import type { RequestHandler } from 'express'
import mongoose from 'mongoose'
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_SERVICE_UNAVAILABLE
} from '../constants/index.ts'

export const health: RequestHandler = (req, res) => {
  const isDatabaseConnected =
    mongoose.connection.readyState === mongoose.ConnectionStates.connected

  if (!isDatabaseConnected) {
    res
      .status(HTTP_STATUS_SERVICE_UNAVAILABLE)
      .json({ status: 'error', database: 'disconnected' })
    return
  }

  res.status(HTTP_STATUS_OK).json({ status: 'ok', database: 'connected' })
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
  extractTrelloCallbackHash,
  initTrelloPowerUp,
  isTrelloConnectorContext,
} from './utils/trello'

if (isTrelloConnectorContext()) {
  initTrelloPowerUp()
} else {
  const callbackData = extractTrelloCallbackHash()
  const isCallbackPopup =
    typeof window !== 'undefined' &&
    window.location.pathname === '/callback' &&
    Boolean(window.opener) &&
    !window.opener.closed &&
    Boolean(callbackData)

  if (isCallbackPopup) {
    if (callbackData.token) {
      window.opener.postMessage(
        { type: 'TRELLO_AUTH_TOKEN', token: callbackData.token },
        window.location.origin
      )
    } else if (callbackData.error) {
      window.opener.postMessage(
        { type: 'TRELLO_AUTH_ERROR', error: callbackData.error },
        window.location.origin
      )
    }
    window.close()
  } else {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  }
}

// src/components/ui/AppUpdaterBanner.tsx
import { useState, useEffect, useRef } from 'react'

// The app version is injected by Vite at build time from package.json
const APP_VERSION = __APP_VERSION__

type UpdateState =
  | { status: 'idle' }
  | { status: 'downloading'; percent: number; version: string }
  | { status: 'ready'; version: string }
  | { status: 'available-android'; version: string; apkUrl: string }

/**
 * Compares two semver strings. Returns true if `remote` is newer than `local`.
 * e.g. compareSemver("2.1.0", "2.0.9") => true
 */
function isNewerVersion(remote: string, local: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number)
  const [rMaj, rMin, rPatch] = parse(remote)
  const [lMaj, lMin, lPatch] = parse(local)
  if (rMaj !== lMaj) return rMaj > lMaj
  if (rMin !== lMin) return rMin > lMin
  return rPatch > lPatch
}

export default function AppUpdaterBanner() {
  const [update, setUpdate] = useState<UpdateState>({ status: 'idle' })
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const checkedRef = useRef(false)

  const isElectron = !!(window as any).electron?.updater

  // ── Electron: Listen to IPC events sent from main process ──────────────────
  useEffect(() => {
    if (!isElectron) return
    const { updater } = (window as any).electron

    updater.onUpdateAvailable((info: { version: string }) => {
      setUpdate({ status: 'downloading', percent: 0, version: info.version })
      setVisible(true)
    })

    updater.onDownloadProgress((percent: number) => {
      setUpdate(prev =>
        prev.status === 'downloading' ? { ...prev, percent } : prev
      )
    })

    updater.onUpdateReady((info: { version: string }) => {
      setUpdate({ status: 'ready', version: info.version })
      setVisible(true)
    })
  }, [isElectron])

  // ── Android/Web: Poll GitHub Releases API ─────────────────────────────────
  useEffect(() => {
    if (isElectron) return
    if (checkedRef.current) return
    checkedRef.current = true

    const check = async () => {
      try {
        const res = await fetch(
          'https://api.github.com/repos/cooperandy2706-sketch/world-uni-learn-report/releases/latest',
          { headers: { Accept: 'application/vnd.github+json' } }
        )
        if (!res.ok) return
        const data = await res.json()
        const remoteVersion = data.tag_name as string // e.g. "v2.1.1"

        if (!isNewerVersion(remoteVersion, APP_VERSION)) return

        // Find the APK asset
        const apkAsset = data.assets?.find((a: any) =>
          a.name.endsWith('.apk')
        )
        if (!apkAsset) return

        setUpdate({
          status: 'available-android',
          version: remoteVersion,
          apkUrl: apkAsset.browser_download_url,
        })
        setVisible(true)
      } catch {
        // Silently ignore network errors — don't bother the user
      }
    }

    // Slight delay so it doesn't block initial paint
    const timer = setTimeout(check, 5000)
    return () => clearTimeout(timer)
  }, [isElectron])

  if (!visible || dismissed || update.status === 'idle') return null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .app-updater-banner {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          animation: slideDownFade 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
          width: max-content;
          max-width: min(480px, calc(100vw - 32px));
        }
        .app-updater-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #0f0a2e 0%, #1e0a6b 60%, #3b0764 100%);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 18px;
          padding: 12px 16px;
          box-shadow: 0 8px 40px rgba(94,92,230,0.45), 0 2px 8px rgba(0,0,0,0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .app-updater-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .app-updater-text {
          flex: 1;
          min-width: 0;
        }
        .app-updater-title {
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.01em;
          margin: 0 0 1px;
          white-space: nowrap;
        }
        .app-updater-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.55);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .app-updater-progress {
          height: 3px;
          background: rgba(255,255,255,0.15);
          border-radius: 99px;
          overflow: hidden;
          margin-top: 5px;
        }
        .app-updater-progress-bar {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #7c3aed, #f59e0b);
          transition: width 0.4s ease;
        }
        .app-updater-btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: none;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.15s, opacity 0.15s;
          font-family: inherit;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .app-updater-btn:active { transform: scale(0.95); }
        .app-updater-btn--primary {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: #fff;
          box-shadow: 0 4px 12px rgba(124,58,237,0.4);
        }
        .app-updater-btn--amber {
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: #fff;
          box-shadow: 0 4px 12px rgba(245,158,11,0.4);
        }
        .app-updater-dismiss {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: none;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s;
          font-family: inherit;
        }
        .app-updater-dismiss:hover { background: rgba(255,255,255,0.15); color: #fff; }
      `}</style>

      <div className="app-updater-banner" role="status" aria-live="polite">
        <div className="app-updater-inner">
          <div className="app-updater-icon">
            {update.status === 'downloading' ? '⬇️' : '🚀'}
          </div>

          <div className="app-updater-text">
            {update.status === 'downloading' && (
              <>
                <p className="app-updater-title">
                  Downloading {update.version}…
                </p>
                <p className="app-updater-sub">{update.percent}% complete — please keep the app open</p>
                <div className="app-updater-progress">
                  <div
                    className="app-updater-progress-bar"
                    style={{ width: `${update.percent}%` }}
                  />
                </div>
              </>
            )}

            {update.status === 'ready' && (
              <>
                <p className="app-updater-title">Update Ready — {update.version}</p>
                <p className="app-updater-sub">Restart now to apply the update</p>
              </>
            )}

            {update.status === 'available-android' && (
              <>
                <p className="app-updater-title">New Version {update.version}</p>
                <p className="app-updater-sub">Tap to download the latest APK</p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {update.status === 'ready' && (
            <button
              id="updater-install-btn"
              className="app-updater-btn app-updater-btn--amber"
              onClick={() => (window as any).electron.updater.installUpdate()}
            >
              ↺ Restart
            </button>
          )}

          {update.status === 'available-android' && (
            <a
              id="updater-download-btn"
              className="app-updater-btn app-updater-btn--primary"
              href={update.apkUrl}
              target="_blank"
              rel="noreferrer"
            >
              ↓ Update
            </a>
          )}

          {/* Dismiss (not shown while downloading — prevent accidental close) */}
          {update.status !== 'downloading' && (
            <button
              className="app-updater-dismiss"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss update notification"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </>
  )
}

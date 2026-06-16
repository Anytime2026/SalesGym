interface HeaderProps {
  onReset: () => void;
  muted: boolean;
  speaking: boolean;
  ttsSupported: boolean;
  onToggleMute: () => void;
}

export default function Header({
  onReset,
  muted,
  speaking,
  ttsSupported,
  onToggleMute,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__title">
        <span className="app-header__logo">営業ヒアリングロープレAI</span>
        <span className="app-header__subtitle">
          商談相手：田中金属加工株式会社 代表取締役社長 田中 誠一 様
        </span>
      </div>
      <div className="app-header__actions">
        {ttsSupported && (
          <button
            className={
              "app-header__mute" +
              (speaking && !muted ? " app-header__mute--active" : "")
            }
            onClick={onToggleMute}
            title={muted ? "読み上げをオンにする" : "読み上げをオフにする"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        )}
        <button className="app-header__reset" onClick={onReset}>
          商談をリセット
        </button>
      </div>
    </header>
  );
}

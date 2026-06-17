import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface InputBarProps {
  onSend: (text: string) => void;
  disabled: boolean;
  onBeforeListen?: () => void;
  personLabel: string;
}

export default function InputBar({
  onSend,
  disabled,
  onBeforeListen,
  personLabel,
}: InputBarProps) {
  const [text, setText] = useState("");
  const baseTextRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startedByKeyRef = useRef(false);
  const keyHeldRef = useRef(false);

  const handleSpeechResult = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      baseTextRef.current = baseTextRef.current + transcript;
      setText(baseTextRef.current);
    } else {
      setText(baseTextRef.current + transcript);
    }
  };

  const { listening, supported, start, stop } =
    useSpeechRecognition(handleSpeechResult);

  const listeningRef = useRef(listening);
  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const handleMicClick = () => {
    if (listening) {
      stop();
      startedByKeyRef.current = false;
    } else {
      onBeforeListen?.();
      start();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (listening) stop();
    onSend(trimmed);
    setText("");
    baseTextRef.current = "";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // スペースキー押している間だけ音声入力（テキストエリア未フォーカス時）
  useEffect(() => {
    if (!supported) return;

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !e.repeat &&
        !keyHeldRef.current &&
        !disabledRef.current &&
        document.activeElement !== textareaRef.current
      ) {
        e.preventDefault();
        keyHeldRef.current = true;
        if (!listeningRef.current) {
          startedByKeyRef.current = true;
          onBeforeListen?.();
          start();
        }
      }
    };

    const onKeyUp = (e: globalThis.KeyboardEvent) => {
      if (e.code === "Space" && keyHeldRef.current) {
        keyHeldRef.current = false;
        if (startedByKeyRef.current) {
          startedByKeyRef.current = false;
          stop();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [supported, start, stop, onBeforeListen]);

  return (
    <div className="input-bar-wrapper">
      <div className="input-bar">
        <textarea
          ref={textareaRef}
          className="input-bar__textarea"
          placeholder={`${personLabel}への質問を入力してください（Enterで送信、Shift+Enterで改行）`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            baseTextRef.current = e.target.value;
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
        />
        {supported && (
          <button
            type="button"
            className={
              "input-bar__mic" + (listening ? " input-bar__mic--active" : "")
            }
            onClick={handleMicClick}
            disabled={disabled}
            title={listening ? "録音を停止" : "音声入力を開始"}
          >
            {listening ? "■" : "🎤"}
          </button>
        )}
        <button
          className="input-bar__send"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
        >
          送信
        </button>
      </div>
      {supported && (
        <p className="input-bar__notice">
          ※音声入力：🎤ボタンで切り替え、またはテキスト入力欄以外でスペースキーを押している間だけ録音できます。Chrome等では音声がブラウザ提供元のサーバーで処理されます。
        </p>
      )}
    </div>
  );
}

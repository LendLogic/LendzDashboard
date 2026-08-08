// The width is the value, set on the first render. The grow-in is a CSS
// animation rather than a JS-driven width change, so the rendered bar never
// contradicts aria-valuenow — not in a background tab, in print, or in a capture.
export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="track">
      <div
        className="fill"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

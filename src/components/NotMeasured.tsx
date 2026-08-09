// An em dash alone is punctuation to a screen reader, so the phrase rides along
// hidden. Shared by the index rows, the readout and the section heading, which
// all have to make the same statement the same way.
export function NotMeasured() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not measured</span>
    </>
  )
}

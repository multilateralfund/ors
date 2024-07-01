import React from 'react'

const NOTES = {
  annual: [
    'Additional amount on disputed contributions from the United States of America.',
  ],
  summary: [
    'The bilateral assistance recorded for Australia and Canada was adjusted following approvals at the 39th meeting and taking into consideration a reconciliation carried out by the Secretariat through the progress reports submitted to the 40th meeting to read US $1,208,219 and US $6,449,438 instead of US $1,300,088 and US $6,414,880 respectively.',
    'In accordance with decisions VI/5 and XVI/39 of the meeting of the Parties to the Montreal Protocol, Turkmenistan has been reclassified as operating under Article 5 in 2004 and therefore its contribution of US $5,764 for 2005 should be disregarded.',
    'Amount netted off from outstanding contributions and are shown here for records only.',
  ],
  triennial: [
    'Additional amount on disputed contributions from the United States of America.',
  ],
}

export default function SCNotes({ type }) {
  return (
    <div className="w-full lg:max-w-[50%]">
      {NOTES[type].map((note, i) => (
        <p key={i}>
          {'*'.repeat(i + 1)} {note}
        </p>
      ))}
    </div>
  )
}

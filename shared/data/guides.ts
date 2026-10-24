export interface GuideSection {
  heading: string
  paragraphs: string[]
}

export interface Guide {
  slug: string
  title: string
  description: string
  minutes: number
  sections: GuideSection[]
}

export const guides: Guide[] = [
  {
    slug: 'average-typing-speed',
    title: 'What Is an Average Typing Speed?',
    description: 'Benchmarks for WPM by age and profession, plus what counts as fast.',
    minutes: 5,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Most adults type between 35 and 45 words per minute. Anything above 60 WPM is comfortably above average, and 80 WPM is fast for a non-professional typist.',
          'Professional typists, transcriptionists, and programmers who type daily often sit between 80 and 120 WPM. Scores above 150 WPM exist but require both technique and a lot of deliberate practice.',
        ],
      },
      {
        heading: 'Why WPM alone is misleading',
        paragraphs: [
          'A high WPM with low accuracy is not useful. Tachy reports both speed and accuracy, because real typing speed is the speed at which you produce correct text, including the time spent fixing mistakes.',
          'Raw WPM counts every keystroke, while WPM counts correct characters. Comparing the two tells you how much of your speed is being lost to errors.',
        ],
      },
      {
        heading: 'How to improve',
        paragraphs: [
          'Start with accuracy, not speed. Slow down until you can finish a 60-second test above 97% accuracy, then increase pace gradually.',
          'Practice in short daily sessions. Ten focused minutes per day beats a single two-hour session every weekend.',
        ],
      },
    ],
  },
  {
    slug: 'touch-typing-10-fingers',
    title: 'How to Learn Touch Typing With 10 Fingers',
    description: 'A practical plan for moving from looking at the keyboard to touch typing.',
    minutes: 7,
    sections: [
      {
        heading: 'Set up the home row',
        paragraphs: [
          'Place your left fingers on A S D F and your right fingers on J K L ;. The small bumps on F and J are your anchors, and your thumbs rest on the space bar.',
          'Return to this position after every key. The goal is not to move faster immediately, but to teach your hands where home is without looking.',
        ],
      },
      {
        heading: 'Learn in layers',
        paragraphs: [
          'Practice the home row first, then the top row, then the bottom row. Add one row at a time and only move on when you can type without looking for a full minute.',
          'Use words rather than random letters. Your brain remembers movement patterns better when they produce meaningful text.',
        ],
      },
      {
        heading: 'Build the habit',
        paragraphs: [
          'Cover your hands or use a keyboard cover for short sessions. Looking at your fingers resets the learning process.',
          'Aim for 10 to 15 minutes daily. If your accuracy drops below 95%, slow down until it recovers.',
        ],
      },
    ],
  },
  {
    slug: 'wpm-vs-cpm',
    title: 'WPM vs CPM: What Is the Difference?',
    description: 'How words per minute and characters per minute are measured, and when each is useful.',
    minutes: 4,
    sections: [
      {
        heading: 'Definitions',
        paragraphs: [
          'WPM divides typed characters by five to approximate a word, then divides by minutes. CPM counts characters per minute directly.',
          'Because a standard word is assumed to be five characters including a space, 60 WPM is roughly 300 CPM.',
        ],
      },
      {
        heading: 'When each metric helps',
        paragraphs: [
          'CPM is useful for data entry and transcription, where character volume matters more than word boundaries.',
          'WPM is easier to compare across tests and languages, which is why most typing tests use it. Tachy reports both correct and raw speed so you can see the difference.',
        ],
      },
    ],
  },
  {
    slug: 'five-minute-daily-drill',
    title: 'A 5-Minute Daily Typing Drill',
    description: 'A short routine that balances warm-up, speed, and accuracy.',
    minutes: 4,
    sections: [
      {
        heading: 'Minute 1: warm up',
        paragraphs: [
          'Take a 15-second or 30-second test at a comfortable pace. Do not chase a record. The goal is to wake up your hands and find the home row.',
        ],
      },
      {
        heading: 'Minutes 2–3: accuracy block',
        paragraphs: [
          'Run two 60-second tests and focus only on accuracy above 98%. If you make a mistake, correct it calmly and continue.',
        ],
      },
      {
        heading: 'Minutes 4–5: speed block',
        paragraphs: [
          'Finish with one 30-second or 60-second test slightly faster than comfortable, then one final test at normal pace. Stop while you still feel sharp.',
        ],
      },
    ],
  },
  {
    slug: 'common-typing-mistakes',
    title: 'Common Typing Mistakes and How to Fix Them',
    description: 'Fix the habits that cap your speed: looking down, tension, and rushed corrections.',
    minutes: 6,
    sections: [
      {
        heading: 'Looking at the keyboard',
        paragraphs: [
          'Looking down feels faster in the moment, but it breaks the movement loop your fingers need to build. Use a cover and accept a temporary speed drop.',
        ],
      },
      {
        heading: 'Rushing after a mistake',
        paragraphs: [
          'Most speed loss comes from panic-correcting. Make the correction deliberately, then return to rhythm. Accuracy and rhythm beat bursts of speed.',
        ],
      },
      {
        heading: 'Tension in the hands',
        paragraphs: [
          'Keep wrists neutral and shoulders relaxed. Take a short pause every few minutes. Relaxed hands move faster and fatigue less.',
        ],
      },
    ],
  },
  {
    slug: 'keyboard-layouts',
    title: 'QWERTY, Dvorak, and Colemak: Which Layout?',
    description: 'A practical comparison of the three most common keyboard layouts.',
    minutes: 5,
    sections: [
      {
        heading: 'QWERTY',
        paragraphs: [
          'QWERTY is everywhere. It is not the most efficient layout, but compatibility and years of muscle memory usually matter more than theoretical gains.',
        ],
      },
      {
        heading: 'Dvorak',
        paragraphs: [
          'Dvorak places common letters on the home row and alternates hands more evenly. Most typists take weeks to recover their old speed, and shortcuts may need remapping.',
        ],
      },
      {
        heading: 'Colemak',
        paragraphs: [
          'Colemak keeps most QWERTY shortcuts intact while improving home-row usage. It is often the easiest layout switch for programmers.',
          'Whatever you choose, commit for at least a month. Switching layouts every week prevents any of them from becoming automatic.',
        ],
      },
    ],
  },
]

export const guideMap = new Map(guides.map(guide => [guide.slug, guide]))

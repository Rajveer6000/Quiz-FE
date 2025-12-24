export const dummyQuizzes = [
  {
    id: 101,
    title: "Physics Mechanics Mastery",
    description: "Master the fundamentals of mechanics including Newton's laws, kinematics, and energy conservation.",
    price: 499,
    duration: 10, // minutes
    totalQuestions: 5,
    totalMarks: 20,
    isPurchased: false,
    questions: [
      {
        id: 1,
        text: "A ball is thrown vertically upward with a speed of 20 m/s. What is the time taken to reach maximum height? (g = 10 m/s²)",
        type: "NUMERIC",
        answer: "2",
        marks: 4
      },
      {
        id: 2,
        text: "Which of Newton's laws states that 'For every action, there is an equal and opposite reaction'?",
        type: "MCQ",
        options: [
          { id: "A", text: "First Law" },
          { id: "B", text: "Second Law" },
          { id: "C", text: "Third Law", isCorrect: true },
          { id: "D", text: "Law of Gravitation" }
        ],
        marks: 4
      },
      {
        id: 3,
        text: "The area under a Velocity-Time graph represents:",
        type: "MCQ",
        options: [
          { id: "A", text: "Acceleration" },
          { id: "B", text: "Displacement", isCorrect: true },
          { id: "C", text: "Force" },
          { id: "D", text: "Power" }
        ],
        marks: 4
      },
      {
        id: 4,
        text: "If a force of 10N acts on a body of mass 2kg, what is the acceleration produced?",
        type: "NUMERIC",
        answer: "5",
        marks: 4
      },
      {
        id: 5,
        text: "Kinetic energy is conserved in which type of collision?",
        type: "MCQ",
        options: [
          { id: "A", text: "Elastic", isCorrect: true },
          { id: "B", text: "Inelastic" },
          { id: "C", text: "Perfectly Inelastic" },
          { id: "D", text: "None of the above" }
        ],
        marks: 4
      }
    ]
  },
  {
    id: 102,
    title: "Organic Chemistry Basics",
    description: "Introductory quiz on Nomenclature, Isomerism, and GOC.",
    price: 299,
    duration: 15,
    totalQuestions: 5,
    totalMarks: 20,
    isPurchased: false,
    questions: [
      {
        id: 1,
        text: "How many sigma bonds are present in Benzene?",
        type: "NUMERIC",
        answer: "12",
        marks: 4
      },
      {
        id: 2,
        text: "Which of the following compound is aromatic?",
        type: "MCQ",
        options: [
          { id: "A", text: "Cyclobutadiene" },
          { id: "B", text: "Cyclooctatetraene" },
          { id: "C", text: "Benzene", isCorrect: true },
          { id: "D", text: "Cyclohexane" }
        ],
        marks: 4
      },
       {
        id: 3,
        text: "What is the hybridization of carbon in methane?",
        type: "MCQ",
        options: [
          { id: "A", text: "sp" },
          { id: "B", text: "sp2" },
          { id: "C", text: "sp3", isCorrect: true },
          { id: "D", text: "dsp2" }
        ],
        marks: 4
      },
       {
        id: 4,
        text: "Number of structural isomers for C4H10 is:",
        type: "NUMERIC",
        answer: "2",
        marks: 4
      },
       {
        id: 5,
        text: "Acidity order of Alkyne, Alkene, and Alkane is:",
        type: "MCQ",
        options: [
          { id: "A", text: "Alkane > Alkene > Alkyne" },
          { id: "B", text: "Alkyne > Alkene > Alkane", isCorrect: true },
          { id: "C", text: "Alkene > Alkyne > Alkane" },
          { id: "D", text: "Alkyne > Alkane > Alkene" }
        ],
        marks: 4
      }
    ]
  },
   {
    id: 103,
    title: "Mathematics: Calculus I",
    description: "Limits, Continuity, and Derivatives challenge.",
    price: 599,
    duration: 20,
    totalQuestions: 5,
    totalMarks: 20,
    isPurchased: false,
    questions: [
       {
        id: 1,
        text: "What is the derivative of sin(x)?",
        type: "MCQ",
        options: [
          { id: "A", text: "cos(x)", isCorrect: true },
          { id: "B", text: "-cos(x)" },
          { id: "C", text: "tan(x)" },
          { id: "D", text: "-sin(x)" }
        ],
        marks: 4
      },
      {
        id: 2,
        text: "Value of lim(x->0) (sin x / x) is:",
        type: "NUMERIC",
        answer: "1",
        marks: 4
      },
      {
        id: 3,
        text: "What is the slope of y = 2x + 3?",
        type: "NUMERIC",
        answer: "2",
        marks: 4
      },
      {
        id: 4,
        text: "If f(x) = x^3, find f'(2).",
        type: "NUMERIC",
        answer: "12",
        marks: 4
      },
      {
        id: 5,
        text: "The function f(x) = |x| is NOT differentiable at:",
        type: "MCQ",
        options: [
          { id: "A", text: "x = 1" },
          { id: "B", text: "x = -1" },
          { id: "C", text: "x = 0", isCorrect: true },
          { id: "D", text: "Everywhere" }
        ],
        marks: 4
      }
    ]
  },
  {
    id: 104,
    title: "Ancient History Trivia",
    description: "Explore the mysteries of ancient civilizations.",
    price: 0,
    duration: 5,
    totalQuestions: 5,
    totalMarks: 20,
    isPurchased: true, // Free quiz
    questions: [
      {
        id: 1,
        text: "Who built the Great Pyramid of Giza?",
        type: "MCQ",
        options: [
          { id: "A", text: "Khufu", isCorrect: true },
          { id: "B", text: "Khafre" },
          { id: "C", text: "Menkaure" },
          { id: "D", text: "Tutankhamun" }
        ],
        marks: 4
      },
      {
        id: 2,
        text: "Which civilization invented the wheel?",
        type: "MCQ",
        options: [
          { id: "A", text: "Egyptians" },
          { id: "B", text: "Sumerians (Mesopotamia)", isCorrect: true },
          { id: "C", text: "Indus Valley" },
          { id: "D", text: "Chinese" }
        ],
        marks: 4
      },
       {
        id: 3,
        text: "In which year did Alexander the Great die? (approx)",
        type: "NUMERIC",
        answer: "323",
         marks: 4
      },
       {
        id: 4,
        text: "The Romans spoke which language?",
        type: "MCQ",
        options: [
          { id: "A", text: "Greek" },
          { id: "B", text: "Latin", isCorrect: true },
          { id: "C", text: "Italian" },
          { id: "D", text: "French" }
        ],
        marks: 4
      },
       {
        id: 5,
        text: "How many Punic Wars were fought between Rome and Carthage?",
        type: "NUMERIC",
        answer: "3",
        marks: 4
      }
    ]
  },
  {
    id: 105,
    title: "General Knowledge 2024",
    description: "Test your awareness of current events and facts.",
    price: 99,
    duration: 8,
    totalQuestions: 5,
    totalMarks: 20,
    isPurchased: false,
    questions: [
      {
        id: 1,
        text: "Which planet is known as the Red Planet?",
        type: "MCQ",
        options: [
            { id: "A", text: "Venus" },
            { id: "B", text: "Mars", isCorrect: true },
            { id: "C", text: "Jupiter" },
            { id: "D", text: "Saturn" }
        ],
        marks: 4
      },
      {
        id: 2,
        text: "Number of continents in the world is:",
        type: "NUMERIC",
        answer: "7",
        marks: 4
      },
      {
        id: 3,
        text: "Capital of France is:",
        type: "MCQ",
        options: [
            { id: "A", text: "London" },
            { id: "B", text: "Berlin" },
            { id: "C", text: "Paris", isCorrect: true },
            { id: "D", text: "Madrid" }
        ],
        marks: 4
      },
       {
        id: 4,
        text: "How many bones are there in an adult human body?",
        type: "NUMERIC",
        answer: "206",
        marks: 4
      },
       {
        id: 5,
        text: "What is the chemical symbol for Gold?",
        type: "MCQ",
        options: [
            { id: "A", text: "Ag" },
            { id: "B", text: "Au", isCorrect: true },
            { id: "C", text: "Fe" },
            { id: "D", text: "Pb" }
        ],
        marks: 4
      }
    ]
  }
];

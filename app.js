const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const emptyState = document.getElementById('emptyState');
const questionGrid = document.getElementById('questionGrid');

const questionTemplates = [
  'What are the biggest challenges people face when trying to understand {topic}?',
  'Why do people ask about {topic} online, and what answers are they looking for?',
  'What mistakes do beginners make when learning about {topic}?',
  'How can someone get started with {topic} without spending too much time?',
  'What are the most common questions people search for about {topic}?',
  'Which tools or resources do people usually compare when researching {topic}?',
  'What would a beginner want to know first about {topic}?',
  'How is {topic} different from similar topics people often confuse it with?'
];

function buildQuestions(topic) {
  const cleanTopic = topic.trim() || 'this topic';
  return questionTemplates.map((template) => ({
    title: template.replaceAll('{topic}', cleanTopic),
    summary: 'A practical question prompt for content research, FAQ creation, or article planning.'
  }));
}

function renderQuestions(topic) {
  const questions = buildQuestions(topic);
  questionGrid.innerHTML = '';
  emptyState.style.display = questions.length ? 'none' : 'block';

  questions.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<strong>${item.title}</strong><p>${item.summary}</p>`;
    questionGrid.appendChild(card);
  });
}

generateBtn.addEventListener('click', () => {
  renderQuestions(topicInput.value);
});

copyBtn.addEventListener('click', async () => {
  const text = Array.from(questionGrid.querySelectorAll('.card strong'))
    .map((node) => node.textContent)
    .join('\n');

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = 'Copied';
    setTimeout(() => (copyBtn.textContent = 'Copy all'), 1200);
  } catch (error) {
    copyBtn.textContent = 'Copy failed';
    setTimeout(() => (copyBtn.textContent = 'Copy all'), 1200);
  }
});

renderQuestions('');

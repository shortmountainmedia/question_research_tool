const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const emptyState = document.getElementById('emptyState');
const questionGrid = document.getElementById('questionGrid');
const platformButtons = document.getElementById('platformButtons');
const countButtons = document.getElementById('countButtons');
const platformSummary = document.getElementById('platformSummary');
const countSummary = document.getElementById('countSummary');

const platformOptions = [
  { key: 'reddit', label: 'Reddit' },
  { key: 'quora', label: 'Quora' },
  { key: 'social', label: 'Social media' },
  { key: 'google', label: 'Google' },
  { key: 'bing', label: 'Bing' },
  { key: 'brave', label: 'Brave' }
];

const questionTemplates = {
  reddit: [
    'Why do Reddit users keep asking about {topic} and what answers are they actually looking for?',
    'What are the most common complaints or frustrations people share about {topic} on Reddit?',
    'What beginner mistakes do Reddit threads reveal about learning {topic}?',
    'What practical advice would a Reddit community give someone starting with {topic}?',
    'What questions do Reddit users ask when they are comparing {topic} to alternatives?'
  ],
  quora: [
    'What is the most useful answer to the question, “How does {topic} work?” on Quora?',
    'Why do Quora readers keep asking about the best way to learn {topic}?',
    'What are the most important facts people want to know before trying {topic}?',
    'How would a Quora expert explain {topic} in plain language?',
    'What are the biggest misconceptions about {topic} that Quora discussions often clarify?'
  ],
  social: [
    'What are people saying about {topic} on social media, and what do those posts reveal?',
    'Which questions about {topic} are trending in social media conversations?',
    'What concerns or opinions about {topic} appear most often in social posts?',
    'How do creators and communities usually frame {topic} in social media discussions?',
    'What would someone ask about {topic} if they were looking for quick advice online?'
  ],
  google: [
    'What are the most common Google search questions people ask about {topic}?',
    'What information do people look for first when searching for {topic} on Google?',
    'Which search intent phrases are most associated with learning {topic}?',
    'What would a Google searcher want to know before investing time in {topic}?',
    'How can an article about {topic} answer the most frequent Google search intents?'
  ],
  bing: [
    'What does a Bing-style searcher want to know about {topic}?',
    'Which question phrases show up when people search for {topic} on Bing?',
    'How can a Bing search result help someone understand {topic} faster?',
    'What are the most practical Bing-style queries tied to {topic}?',
    'What would a searcher ask about {topic} if they wanted a quick answer?'
  ],
  brave: [
    'What kind of question would a Brave searcher ask when researching {topic}?',
    'How do privacy-conscious searchers phrase questions about {topic}?',
    'What are the main concerns behind Brave search queries about {topic}?',
    'How can a content brief answer the top Brave-style questions about {topic}?',
    'What would someone ask about {topic} if they wanted a trustworthy overview?'
  ]
};

let selectedCount = 20;
let selectedPlatforms = new Set(platformOptions.map((entry) => entry.key));

function getPlatformLabels() {
  return selectedPlatforms.size === platformOptions.length
    ? ['all platforms']
    : platformOptions.filter((entry) => selectedPlatforms.has(entry.key)).map((entry) => entry.label.toLowerCase());
}

function syncPlatformButtons() {
  const allActive = selectedPlatforms.size === platformOptions.length;
  platformButtons.querySelectorAll('button').forEach((button) => {
    const key = button.dataset.platform;
    const active = key === 'all' ? allActive : selectedPlatforms.has(key);
    button.classList.toggle('active', active);
  });

  const labels = getPlatformLabels();
  platformSummary.textContent = `Using ${labels.join(', ')} for question generation.`;
}

function syncCountButtons() {
  countButtons.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.count) === selectedCount);
  });
  countSummary.textContent = `Generating ${selectedCount} question prompts.`;
}

function getActiveTemplates() {
  const activePlatforms = selectedPlatforms.size ? Array.from(selectedPlatforms) : platformOptions.map((entry) => entry.key);
  const pools = activePlatforms.flatMap((key) => questionTemplates[key] || []);

  if (!pools.length) {
    return questionTemplates.reddit;
  }

  return pools;
}

function buildQuestions(topic) {
  const cleanTopic = topic.trim() || 'this topic';
  const labels = getPlatformLabels();
  const sourceText = labels.join(', ');
  const pools = getActiveTemplates();

  return pools.slice(0, selectedCount).map((template, index) => ({
    title: template.replaceAll('{topic}', cleanTopic),
    summary: `Research prompt ${index + 1} tailored for ${sourceText}.`
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

platformButtons.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-platform]');
  if (!button) return;

  const key = button.dataset.platform;

  if (key === 'all') {
    selectedPlatforms = new Set(platformOptions.map((entry) => entry.key));
  } else {
    if (selectedPlatforms.has(key)) {
      selectedPlatforms.delete(key);
    } else {
      selectedPlatforms.add(key);
    }
  }

  syncPlatformButtons();
  renderQuestions(topicInput.value);
});

countButtons.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-count]');
  if (!button) return;

  selectedCount = Number(button.dataset.count);
  syncCountButtons();
  renderQuestions(topicInput.value);
});

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

syncPlatformButtons();
syncCountButtons();
renderQuestions('');

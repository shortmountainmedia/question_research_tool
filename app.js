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

const searchProxy = (window.location.hostname.includes('vercel.app') || window.location.hostname === 'localhost')
  ? '/api/search?q='
  : 'https://r.jina.ai/http://duckduckgo.com/html/?q=';
const searchCacheDurationMs = 60 * 60 * 1000;
const searchRequestDelayMs = 1200;

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCacheKey(platform, topic) {
  return `question-search:${platform}:${topic.trim().toLowerCase()}`;
}

function readSearchCache(platform, topic) {
  try {
    const key = getCacheKey(platform, topic);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.questions)) return null;

    const age = Date.now() - (parsed.timestamp || 0);
    return age < searchCacheDurationMs ? parsed.questions : null;
  } catch (error) {
    console.warn('Search cache read failed', error);
    return null;
  }
}

function writeSearchCache(platform, topic, questions) {
  try {
    const key = getCacheKey(platform, topic);
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), questions }));
  } catch (error) {
    console.warn('Search cache write failed', error);
  }
}

function buildSearchQuery(platform, topic) {
  const safeTopic = topic.trim() || 'this topic';

  switch (platform) {
    case 'reddit':
      return `site:reddit.com "${safeTopic}" question`;
    case 'quora':
      return `site:quora.com "${safeTopic}" question`;
    case 'social':
      return `site:twitter.com OR site:facebook.com OR site:instagram.com "${safeTopic}" question`;
    case 'google':
      return `"${safeTopic}" question site:google.com`;
    case 'bing':
      return `"${safeTopic}" question site:bing.com`;
    case 'brave':
      return `"${safeTopic}" question site:brave.com`;
    default:
      return `"${safeTopic}" question`;
  }
}

function extractQuestions(text) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const candidates = [];
  const startsWithQuestionWord = /^(why|what|how|which|when|where|who|do|can|should|is|are|will|did|does|have|has|could|would|might)/i;

  for (const line of lines) {
    const markdownMatch = line.match(/^#{1,6}\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i)
      || line.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i);

    const cleaned = (markdownMatch?.[1] || line)
      .replace(/^[-*•]\s*/, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const normalized = cleaned
      .replace(/^[\-–—]\s*/, '')
      .replace(/\?\s*$/, '?')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized || normalized.length < 8) continue;
    if (/^(Title:|URL Source:|Markdown Content:|No more results found|Suggestions|Feedback|DuckDuckGo|Image \d+)/i.test(normalized)) continue;
    if (/^(http|https):\/\//i.test(normalized)) continue;
    if (!/\?/.test(normalized) && !startsWithQuestionWord.test(normalized)) continue;

    candidates.push(normalized);
  }

  return [...new Set(candidates)].slice(0, 40);
}

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
  platformSummary.textContent = `Using ${labels.join(', ')} for real public question discovery.`;
}

function syncCountButtons() {
  countButtons.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.count) === selectedCount);
  });
  countSummary.textContent = `Generating ${selectedCount} real public questions.`;
}

async function fetchLiveQuestions(topic) {
  const activePlatforms = selectedPlatforms.size ? Array.from(selectedPlatforms) : platformOptions.map((entry) => entry.key);
  const collected = [];
  let rateLimited = false;

  for (const [index, platform] of activePlatforms.entries()) {
    try {
      const cached = readSearchCache(platform, topic);
      if (cached && cached.length) {
        collected.push(...cached);
        continue;
      }

      const query = buildSearchQuery(platform, topic);
      const url = `${searchProxy}${encodeURIComponent(query)}`;

      if (index > 0) {
        await wait(searchRequestDelayMs);
      }

      const response = await fetch(url, { cache: 'no-store' });
      if (response.status === 429 || response.status === 503) {
        rateLimited = true;
        console.warn(`Search proxy rate-limited for ${platform}`);
        continue;
      }
      if (!response.ok) continue;

      const payload = await response.json().catch(() => null);
      const text = typeof payload?.text === 'string' ? payload.text : await response.text();
      const questions = extractQuestions(text);
      if (questions.length) {
        writeSearchCache(platform, topic, questions);
      }
      collected.push(...questions);
    } catch (error) {
      console.warn(`Search failed for ${platform}`, error);
    }
  }

  return {
    questions: [...new Set(collected)].slice(0, Math.max(selectedCount, 1)),
    rateLimited
  };
}

async function renderQuestions(topic) {
  const cleanTopic = topic.trim();
  const labels = getPlatformLabels();

  questionGrid.innerHTML = '';
  emptyState.style.display = 'block';
  emptyState.innerHTML = '<p>Searching public question results from the selected platforms…</p>';

  if (!cleanTopic) {
    emptyState.innerHTML = '<p>Enter a topic and click “Generate questions” to pull real question ideas from public search results.</p>';
    return;
  }

  const { questions, rateLimited } = await fetchLiveQuestions(cleanTopic);

  questionGrid.innerHTML = '';
  emptyState.style.display = questions.length ? 'none' : 'block';
  if (rateLimited && !questions.length) {
    emptyState.innerHTML = '<p>The public search proxy is currently rate-limited. Try again in a minute or use a smaller set of platforms.</p>';
  } else {
    emptyState.innerHTML = '<p>No public question matches were found for that topic yet. Try a broader keyword or select more platforms.</p>';
  }

  questions.forEach((question, index) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<strong>${question}</strong><p>Question ${index + 1} from live public search results.</p>`;
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

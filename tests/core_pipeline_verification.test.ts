/**
 * @file core_pipeline_verification.test.ts
 * @description
 * Automated verification suite for Briefly's core product guarantees:
 * 1. High-fidelity article summarization tailored to European VCs and tech executives (38-58 words, 3-sentence executive structure, no headline repetition, concrete figures/mechanisms).
 * 2. Zero translation leakage: 100% of non-English European reporting (German, French, Spanish, Swedish, Ukrainian, etc.) translated reliably to English.
 * 3. 14-Point Editorial Quality Gate enforcement.
 * 4. Algorithmic fallback pipeline resilience.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  passesEditorialQualityGate,
  isNonEnglishArticle,
  translateTextToEnglish,
  buildExecutiveSummary,
  cleanPublisherBoilerplate,
  enforce60WordCap,
  synthesizeArticleAlgorithmic
} from '../server.ts';

describe('1. Executive Micro-Brief Summarization Quality (VC & Tech Executive Standard)', () => {
  it('should synthesize a 38-58 word executive micro-brief from substantive article content', async () => {
    const headline = 'QuantumX secures €25M Series A for fault-tolerant computing architecture';
    const body = `
      Munich-based deeptech startup QuantumX closed a €25 million Series A funding round led by HV Capital and Earlybird Venture Capital.
      The capital will accelerate fabrication of high-coherence neutral-atom processors targeting industrial simulation workflows.
      The company has already contracted with three DAX 40 automotive manufacturers to benchmark logistics optimization algorithms.
      European enterprise demand for sovereign quantum hardware has surged following recent EU semiconductor supply chain directives.
    `;

    const result = await buildExecutiveSummary(headline, body, false);

    assert.ok(result.wordCount >= 38, `Word count (${result.wordCount}) should be at least 38 words`);
    assert.ok(result.wordCount <= 58, `Word count (${result.wordCount}) should not exceed 58 words`);
    assert.match(result.summary, /[.!?]$/, 'Summary must end with complete terminal punctuation');

    // Rule 11: Summary must not repeat the headline
    const firstSentence = result.summary.split(/[.!?]\s+/)[0] || '';
    assert.ok(!firstSentence.toLowerCase().includes('quantumx secures €25m series a for fault-tolerant'), 'Summary must not echo the headline');

    // Must pass the 14-point quality gate
    const gate = passesEditorialQualityGate(headline, result.summary);
    assert.strictEqual(gate.isValid, true, `Quality gate failed: ${gate.reason}`);
  });

  it('should enforce the 3-sentence executive structure without headline echoing', async () => {
    const headline = 'Mistral AI releases sovereign enterprise inference platform';
    const body = `
      Paris-based artificial intelligence developer Mistral AI deployed a dedicated on-premises inference engine for regulated European corporations.
      The deployment architecture enables tier-one banks and healthcare conglomerates to run frontier weights in air-gapped data centers.
      Early commercial pilots with BNP Paribas demonstrated a 45% reduction in API token operating costs compared to proprietary cloud services.
      The release intensifies transatlantic competition as European scaleups demand strict data residency guarantees under the EU AI Act.
    `;

    const result = await buildExecutiveSummary(headline, body, false);
    assert.ok(result.wordCount >= 38 && result.wordCount <= 58, `Executive micro-brief length must be 38-58 words, got ${result.wordCount}`);

    const gate = passesEditorialQualityGate(headline, result.summary);
    assert.strictEqual(gate.isValid, true, `Quality gate should pass for valid executive brief: ${gate.reason}`);
  });

  it('should clean publisher boilerplate, newsletter marketing, and image credits', () => {
    const dirty = `
      Volg Silicon Canals op Google Discover. 
      Der Beitrag Allox erschien zuerst auf Trending Topics.
      Sign up for our newsletter. Reported by John Doe in Berlin.
      Ongoing coverage across the regional tech ecosystem.
      Autonomous drone developer SkySec closed a $12M seed round from Speedinvest.
      Image Credits: Unsplash. Buy One Founder Summit Ticket.
    `;
    const cleaned = cleanPublisherBoilerplate(dirty);
    assert.ok(!cleaned.includes('Google Discover'), 'Must strip Google Discover boilerplate');
    assert.ok(!cleaned.includes('erschien zuerst auf'), 'Must strip RSS cross-post notices');
    assert.ok(!cleaned.includes('Sign up for our newsletter'), 'Must strip newsletter calls to action');
    assert.ok(!cleaned.includes('Founder Summit Ticket'), 'Must strip event marketing');
    assert.ok(cleaned.includes('SkySec closed a $12M seed round'), 'Must preserve substantive reporting');
  });

  it('should enforce clean word limits with proper sentence termination', () => {
    const longText = 'Word '.repeat(80).trim() + '.';
    const capped = enforce60WordCap(longText, 50);
    assert.ok(capped.wordCount <= 50, 'Must cap words to target count');
    assert.match(capped.text, /[.!?]$/, 'Must preserve terminal punctuation');
  });
});

describe('2. Multi-Lingual Translation & Zero Foreign Leakage Guarantee', () => {
  it('should accurately detect non-English European reporting across language clusters', () => {
    // German
    const de = isNonEnglishArticle('Personalie Digicust holt Ex-PwC-Marketer Alexander Miklautz für internationales Partnergeschäft');
    assert.strictEqual(de.isNonEnglish, true, 'Should detect German headline');

    // French
    const fr = isNonEnglishArticle('La startup parisienne lève 10 millions pour décarboner l’industrie lourde');
    assert.strictEqual(fr.isNonEnglish, true, 'Should detect French headline');

    // Spanish
    const es = isNonEnglishArticle('Allox obtiene 9,4 millones de euros para avanzar en su tecnología de diseño de fármacos');
    assert.strictEqual(es.isNonEnglish, true, 'Should detect Spanish headline');

    // Swedish
    const sv = isNonEnglishArticle('Stockholmsbolaget avslöjar ny storsatsning på grön vätgas efter rekordrunda');
    assert.strictEqual(sv.isNonEnglish, true, 'Should detect Nordic headline');

    // Ukrainian / Cyrillic
    const uk = isNonEnglishArticle('Україна закупить 500 зенітних ракет для захисту інфраструктури');
    assert.strictEqual(uk.isNonEnglish, true, 'Should detect Ukrainian/Cyrillic script');

    // Greek
    const el = isNonEnglishArticle('Το νέο σπορ ρολόι της Norqain ζυγίζει μόλις 45 γραμμάρια');
    assert.strictEqual(el.isNonEnglish, true, 'Should detect Greek script');

    // English should NOT be detected as non-English
    const en = isNonEnglishArticle('London fintech Monzo reports record annual profits ahead of public market debut');
    assert.strictEqual(en.isNonEnglish, false, 'English news must be recognized as English');
  });

  it('should translate foreign reporting into 100% fluent English with zero foreign stopwords remaining', async () => {
    const germanText = 'Das Münchner Startup QuantumX hat in einer Series-A-Finanzierungsrunde 25 Millionen Euro von HV Capital eingesammelt.';
    const translated = await translateTextToEnglish(germanText);

    assert.ok(translated && translated.length > 10, 'Translation must return substantive text');
    assert.ok(/million|round|capital|raised|munich/i.test(translated), 'Translated text must contain relevant English vocabulary');

    // Zero-Tolerance Leakage Check
    const foreignCheck = isNonEnglishArticle('QuantumX Series A', translated);
    assert.strictEqual(foreignCheck.isNonEnglish, false, 'Translated text must not be flagged as foreign');

    // Assert zero German stopwords remain
    const lowerWords = translated.toLowerCase().split(/[\s,.:;!?"'()[\]{}]+/);
    const germanStopwords = ['der', 'die', 'das', 'und', 'für', 'mit', 'von', 'ein', 'eine', 'einer'];
    const lingering = lowerWords.filter(w => germanStopwords.includes(w));
    assert.strictEqual(lingering.length, 0, `Lingering foreign stopwords found: ${lingering.join(', ')}`);
  });

  it('should translate Cyrillic and Greek content with zero non-Latin script leakage', async () => {
    const greekText = 'Η νεοφυής επιχείρηση βιοτεχνολογίας συγκέντρωσε νέα κεφάλαια για κλινικές δοκιμές στην Ευρώπη.';
    const translated = await translateTextToEnglish(greekText);

    assert.ok(translated && translated.length > 10, 'Translation must return English text');
    assert.ok(!/[\u0370-\u03FF]/.test(translated), 'Translated text must not contain Greek characters');
    assert.ok(!/[\u0400-\u04FF]/.test(translated), 'Translated text must not contain Cyrillic characters');
  });
});

describe('3. 14-Point Editorial Quality Gate Verification', () => {
  const validSummary = 'Munich-based robotics developer QuantumX secured €25 million in Series A funding led by HV Capital and Earlybird. The company will deploy autonomous inspection drones across European manufacturing facilities to automate turbine maintenance. Initial commercial contracts with Siemens Energy will drive enterprise rollout in early 2027.';

  it('should accept a compliant 45-word executive micro-brief', () => {
    const gate = passesEditorialQualityGate('QuantumX raises €25M for industrial inspection robotics', validSummary);
    assert.strictEqual(gate.isValid, true, `Valid brief should pass quality gate: ${gate.reason}`);
  });

  it('should reject snippets shorter than 38 words (anti-fragment rule)', () => {
    const shortSummary = 'QuantumX raised €25 million from Earlybird to build inspection drones. The company plans to expand internationally.';
    const gate = passesEditorialQualityGate('QuantumX raises €25M', shortSummary);
    assert.strictEqual(gate.isValid, false);
    assert.match(gate.reason || '', /minimum 38 required/i);
  });

  it('should reject summaries exceeding 58 words', () => {
    const longSummary = validSummary + ' Furthermore, international expansion into Asian utility markets is slated to commence immediately following production ramp-up at the Bavarian facility.';
    const gate = passesEditorialQualityGate('QuantumX raises €25M', longSummary);
    assert.strictEqual(gate.isValid, false);
    assert.match(gate.reason || '', /exceeds 58-word limit/i);
  });

  it('should reject summaries that open by echoing or repeating the headline', () => {
    const echoedHeadline = 'Autonomous robotics startup raises €25 million Series A funding';
    const echoingSummary = 'Autonomous robotics startup raises €25 million Series A funding to expand across Europe. The capital will support engineering development at their Munich headquarters while hiring 50 distributed software architects. Commercial deployment across automotive facilities will launch next quarter.';
    const gate = passesEditorialQualityGate(echoedHeadline, echoingSummary);
    assert.strictEqual(gate.isValid, false);
    assert.match(gate.reason || '', /opens by echoing the headline/i);
  });

  it('should reject summaries with foreign stopwords (zero-tolerance policy)', () => {
    const foreignSummary = 'Munich robotics developer QuantumX holt 25 Millionen Euro für die Entwicklung von autonomen Inspektionsdrohnen in Deutschland. The capital will support distributed hiring while commercial deployment across automotive facilities will launch next quarter with Siemens Energy in Munich Germany.';
    const gate = passesEditorialQualityGate('QuantumX funding', foreignSummary);
    assert.strictEqual(gate.isValid, false);
    assert.match(gate.reason || '', /untranslated foreign vocabulary detected/i);
  });

  it('should reject summaries with Cyrillic or Greek script', () => {
    const cyrillicSummary = 'Munich deeptech developer QuantumX secured €25 million from Earlybird to scale industrial robotics. Компанія планує розгорнути автономні системи на європейських заводах для автоматизації процесів. The contract with Siemens Energy will accelerate enterprise market expansion across sovereign European utility infrastructure.';
    const gate = passesEditorialQualityGate('QuantumX funding', cyrillicSummary);
    assert.strictEqual(gate.isValid, false);
    assert.match(gate.reason || '', /Non-Latin script/i);
  });

  it('should reject multi-story digest link dumps', () => {
    const gate = passesEditorialQualityGate('#Weekly Review - +++ Distalmotion +++ StrollMe +++ Roadsurfer +++', validSummary);
    assert.strictEqual(gate.isValid, false);
    assert.match(gate.reason || '', /multi-story delimiters/i);
  });

  it('should reject template filler and PR marketing boilerplate', () => {
    const fillerSummary = 'Reported by John Doe in London, Munich robotics developer QuantumX secured €25 million in Series A funding led by HV Capital. Ongoing coverage across the regional tech ecosystem confirms commercial contracts with Siemens Energy for enterprise turbine inspection.';
    const gate = passesEditorialQualityGate('QuantumX Series A', fillerSummary);
    assert.strictEqual(gate.isValid, false);
    assert.match(gate.reason || '', /template filler phrase/i);
  });
});

describe('4. Algorithmic Fallback Pipeline Resilience', () => {
  it('should synthesize, translate, and qualify non-English articles when generative API is in fallback mode', async () => {
    const rawGermanArticle = {
      title: 'Münchner Startup sichert sich 25 Millionen Euro für grüne Wasserstoff-Technologie',
      link: 'https://example.com/german-startup-funding',
      description: 'Das Münchner CleanTech-Unternehmen HydroGen hat eine Finanzierungsrunde über 25 Millionen Euro abgeschlossen. Angeführt wird die Runde von World Fund und EQT Ventures. Das frische Kapital soll in den Bau der ersten großtechnischen Elektrolyseuranlage in Norddeutschland investiert werden, um grünen Wasserstoff für die Stahlindustrie bereitzustellen.',
      sourceName: 'Trending Topics DE',
      sourceDomain: 'trendingtopics.eu',
      pubDate: new Date().toISOString(),
      country: 'Germany'
    };

    const story = await synthesizeArticleAlgorithmic(rawGermanArticle);

    assert.ok(story, 'Synthesizer must return a valid story object');
    assert.ok(story.title && story.title.length > 10, 'Story must have a translated English title');
    assert.strictEqual(isNonEnglishArticle(story.title).isNonEnglish, false, 'Title must be translated into English');
    assert.strictEqual(isNonEnglishArticle(story.title, story.summary).isNonEnglish, false, 'Summary must be fluent English');
    assert.ok(story.wordCount >= 38 && story.wordCount <= 58, `Summary must be 38-58 words, got ${story.wordCount}`);
    assert.strictEqual(story.region, 'DACH (Germany, Austria, Switzerland)', 'Region should be DACH');
    assert.strictEqual(story.topicTag, 'Climate & CleanTech', 'Topic should be Climate & CleanTech');

    // Quality gate validation
    const gate = passesEditorialQualityGate(story.title, story.summary);
    assert.strictEqual(gate.isValid, true, `Algorithmic synthesis must pass quality gate: ${gate.reason}`);
    assert.strictEqual(story.status, 'published', 'Qualified story must be published');
  });
});

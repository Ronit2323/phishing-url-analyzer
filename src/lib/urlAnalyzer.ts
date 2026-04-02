/**
 * Phishing URL Risk Analyzer
 */

export interface RiskFlag {
  id: string;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  url: string;
  score: number;
  flags: RiskFlag[];
  isSuspicious: boolean;
}

let topDomains: string[] = [];

/* ---------------------------
   Load Top Domains
---------------------------- */

export async function loadTopDomains() {
  const res = await fetch('/top-domains.txt');
  const text = await res.text();

  topDomains = text
    .split('\n')
    .map(d => d.trim().toLowerCase())
    .filter(Boolean);
}

/* ---------------------------
   Config Lists
---------------------------- */

const SHORTENERS = [
  'bit.ly','goo.gl','t.co','tinyurl.com','is.gd','buff.ly',
  'ow.ly','bit.do','mcaf.ee','rebrand.ly','cutt.ly','shorte.st'
];

const SUSPICIOUS_KEYWORDS = [
  'login','signin','verify','account','secure','update','bank'
];

const SUSPICIOUS_TLDS = [
  'tk','xyz','ru','top','gq','ml','cf','work'
];

/* ---------------------------
   Helper
---------------------------- */

function addFlag(
  flags: RiskFlag[],
  id: string,
  label: string,
  description: string,
  severity: 'low' | 'medium' | 'high'
) {
  flags.push({ id, label, description, severity });
}

/* ---------------------------
   Levenshtein Distance
---------------------------- */

function levenshtein(a: string, b: string) {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {

      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }

    }
  }

  return matrix[b.length][a.length];
}

/* ---------------------------
   Extract Root Domain
---------------------------- */

function getRootDomain(hostname: string) {
  const parts = hostname.split('.');
  if (parts.length < 2) return hostname;
  return parts.slice(-2).join('.');
}

/* ---------------------------
   Typosquatting Detection
---------------------------- */

function detectTyposquatting(hostname: string) {

  const root = getRootDomain(hostname);
  const domainName = root.split('.')[0];

  if (domainName.length < 4) return null;

  for (const brand of topDomains) {

    const brandName = brand.split('.')[0];

    if (brandName.length < 4) continue;

    const distance = levenshtein(domainName, brandName);

    if (distance === 1 || distance === 2) {
      return brand;
    }
  }

  return null;
}

/* ---------------------------
   URL Analyzer
---------------------------- */

export function analyzeUrl(inputUrl: string): AnalysisResult {

  const flags: RiskFlag[] = [];
  let score = 0;

  try {

    let urlString = inputUrl.trim();

    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }

    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    const rootDomain = getRootDomain(hostname);
    const isPunycode = hostname.startsWith('xn--');

    /* ---------------------------
       IP Address
    ---------------------------- */

    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;

    if (ipRegex.test(hostname)) {
      addFlag(flags,'ip_address','IP Address Used',
      'Legitimate websites rarely use raw IP addresses.','high');
      score += 40;
    }

    /* ---------------------------
       Long URL
    ---------------------------- */

    if (urlString.length > 75) {
      addFlag(flags,'long_url','Very Long URL',
      'Phishing URLs are often excessively long.','medium');
      score += 15;
    }

    /* ---------------------------
       @ Symbol
    ---------------------------- */

    if (urlString.includes('@')) {
      addFlag(flags,'at_symbol','Contains @ Symbol',
      '@ can hide the real destination.','high');
      score += 30;
    }

    /* ---------------------------
       Hyphen Abuse
    ---------------------------- */

    const hyphenCount = (hostname.match(/-/g) || []).length;

    if (!isPunycode && hyphenCount > 2) {
      addFlag(flags,'multiple_hyphens','Too Many Hyphens',
      'Phishing domains often contain many hyphens.','medium');
      score += 10;
    }

    /* ---------------------------
       Too Many Subdomains
    ---------------------------- */

    const parts = hostname.split('.');

    if (parts.length > 4) {
      addFlag(flags,'too_many_subdomains','Excessive Subdomains',
      'Attackers use many subdomains to mimic brands.','medium');
      score += 15;
    }

    /* ---------------------------
       Keyword Stuffing
    ---------------------------- */

    if (
      SUSPICIOUS_KEYWORDS.some(k => hostname.includes(k)) &&
      !topDomains.includes(rootDomain)
    ) {
      addFlag(flags,'keyword_stuffing','Suspicious Keywords',
      'Domain contains phishing-related keywords.','medium');
      score += 20;
    }

    /* ---------------------------
       URL Shortener
    ---------------------------- */

    const shortenerMatch = SHORTENERS.some(short =>
      hostname === short || hostname.endsWith('.' + short)
    );

    if (shortenerMatch) {
      addFlag(flags,'shortener','URL Shortener Used',
      'Shortened URLs hide the final destination.','medium');
      score += 15;
    }

    /* ---------------------------
       HTTP Protocol
    ---------------------------- */

    if (url.protocol === 'http:') {
      addFlag(flags,'http_protocol','HTTP Protocol',
      'Website does not use HTTPS encryption.','low');
      score += 10;
    }

    /* ---------------------------
       Number Substitution
    ---------------------------- */

    if (!isPunycode && /[0-9]/.test(hostname)) {
      addFlag(flags,'number_substitution','Numbers in Domain',
      'Numbers may replace letters in typosquatting.','low');
      score += 5;
    }

    /* ---------------------------
       Unicode / Homograph
    ---------------------------- */

    if (/[^\x00-\x7F]/.test(inputUrl) || isPunycode) {
      addFlag(flags,'unicode_domain','Unicode Characters',
      'Possible homograph attack using Unicode characters.','high');
      score += 30;
    }

    /* ---------------------------
       Suspicious TLD
    ---------------------------- */

    const tld = hostname.split('.').pop();

    if (tld && SUSPICIOUS_TLDS.includes(tld)) {
      addFlag(flags,'suspicious_tld','Suspicious TLD',
      'This TLD is commonly abused in phishing campaigns.','medium');
      score += 15;
    }

    /* ---------------------------
       Typosquatting
    ---------------------------- */

    if (!shortenerMatch) {

      const typoMatch = detectTyposquatting(hostname);

      if (typoMatch) {
        addFlag(flags,'typosquatting','Possible Typosquatting',
        `Domain closely resembles "${typoMatch}".`,'high');
        score += 35;
      }

    }

  } catch {

    return {
      url: inputUrl,
      score: 100,
      flags: [{
        id: 'invalid_url',
        label: 'Invalid URL',
        description: 'The string is not a valid URL.',
        severity: 'high'
      }],
      isSuspicious: true
    };

  }

  return {
    url: inputUrl,
    score: Math.min(score,100),
    flags,
    isSuspicious: score >= 30
  };
}
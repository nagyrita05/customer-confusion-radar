/**
 * Cleans Facebook copy-paste input and extracts real comment blocks.
 * Returns cleaned comments and statistics.
 */

export interface CleaningResult {
  cleanedComments: string[];
  stats: {
    totalLines: number;
    removedMetadata: number;
    analyzedComments: number;
  };
}

// Hungarian comment indicator words - lines containing these are likely real comments
const COMMENT_INDICATOR_WORDS = [
  "szia", "szeretnék", "vennék", "mennyi", "milyen", "hol", "ár", "ára",
  "cuki", "szép", "imádom", "nagyon", "rendelés", "készítenél", "köszönöm",
  "kell", "venni", "kérek", "kérnék", "tudnál", "kapható", "eladó",
  "érdekel", "nekem", "lenne", "lehet", "mikor", "hogy", "ezt", "az",
  "is", "meg", "de", "igen", "nem", "jó", "szuper", "király", "tetszik",
  "akarok", "akarom", "kérlek", "légyszi", "privát", "privátban", "írtam",
  "üzenet", "üzentem", "rendelnék", "rendelek"
];

// Exact UI labels to remove
const EXACT_METADATA_LABELS = [
  "válasz",
  "megosztás",
  "megosztások",
  "hozzászólás",
  "hozzászólások",
  "összes megjegyzés",
  "további hozzászólások",
  "további válaszok",
  "tetszik",
  "szuper",
  "haha",
  "hú",
  "szomorú",
  "dühös",
  "mind"
];

// Patterns for metadata lines to remove
const METADATA_PATTERNS = [
  /^\d+\s*(ó|p|perc|óra|nap|hét|hónap|év)\.?$/i, // Facebook timestamps: "13 ó.", "58 p.", "2 nap"
  /^\d+\s*(ó|p|perc|óra|nap|hét|hónap|év)$/i, // Without period
  /^\d{1,2}:\d{2}/, // Time patterns like "12:34"
  /^\d{4}[-/]\d{2}[-/]\d{2}/, // Date patterns
  /^https?:\/\//, // URLs
  /^\[.*\]$/, // Bracketed content like [GIF]
  /^\[?(GIF|gif|Gif)\]?$/i, // GIF indicators
  /^\[?(image|Image|IMAGE|kép|Kép|KÉP|fotó|Fotó)\]?$/i, // Image indicators
  /^•+$/, // Bullet-only lines
  /^[•·\-–—]+$/, // Separator/bullet lines
  /^={2,}$/, // Separator lines
  /^-{2,}$/, // Separator lines
  /·\s*$/, // Lines ending with middle dot (page names)
  /^\d+$/, // Number-only lines (like counts)
  /^@\w+$/, // Username mentions alone
  /^#\w+$/, // Hashtags alone
  /^\d+\s*(k|ezer|millió)?\s*(megtekintés|like|lájk|reakció)$/i, // Engagement counts
];

// Check if a line looks like a Facebook username (appears before comments)
function looksLikeUsername(line: string): boolean {
  const trimmed = line.trim();
  
  // If it contains comment indicator words, it's not a username
  const lowerLine = trimmed.toLowerCase();
  if (COMMENT_INDICATOR_WORDS.some(word => lowerLine.includes(word))) {
    return false;
  }
  
  // If it has question mark, exclamation, or sentence-ending punctuation, likely a comment
  if (/[?!]/.test(trimmed)) return false;
  if (/[.,:;]$/.test(trimmed) && trimmed.length > 30) return false;
  
  // Username characteristics:
  // - Usually 2-4 words (first name, last name, maybe middle)
  // - No long sentences
  // - Typically capitalized words
  const words = trimmed.split(/\s+/);
  
  if (words.length >= 1 && words.length <= 4) {
    // Check if all words look like names (capitalized, no special chars)
    const allWordsLookLikeNames = words.every(word => {
      // Allow Hungarian name characters
      return /^[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]*$/.test(word) || 
             /^[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]*-[A-ZÁÉÍÓÖŐÚÜŰ]?[a-záéíóöőúüű]*$/.test(word);
    });
    
    if (allWordsLookLikeNames && trimmed.length < 40) {
      return true;
    }
  }
  
  return false;
}

// Check if a line is metadata
function isMetadata(line: string): boolean {
  const trimmed = line.trim().toLowerCase();
  
  // Empty or whitespace only
  if (!trimmed) return true;
  
  // Exact metadata labels
  if (EXACT_METADATA_LABELS.includes(trimmed)) return true;
  
  // Check patterns
  if (METADATA_PATTERNS.some(pattern => pattern.test(line.trim()))) return true;
  
  // Single bullet or dot
  if (trimmed === '•' || trimmed === '·' || trimmed === '-') return true;
  
  return false;
}

// Check if line has meaningful content (not just emojis)
function hasTextContent(line: string): boolean {
  // Remove emojis and check if there's text left
  const withoutEmoji = line.replace(/[\p{Emoji}\s]/gu, '');
  return withoutEmoji.length > 0;
}

// Patterns that strongly indicate Facebook-style copied comments
const FACEBOOK_SIGNAL_PATTERNS = [
  /^\d+\s*(ó|p|perc|óra|nap|hét|hónap|év)\.?$/im, // Relative time markers: "13 ó.", "58 p."
  /\b(tetszik|válasz|megosztás|like|reply|share)\b/i, // FB UI labels
  /^\d+\s*(k|ezer|millió)?\s*(megtekintés|like|lájk|reakció|reaction)$/im, // Reaction/engagement counts
  /·\s*$/m, // Page name lines ending with middle dot
];

// Detect whether the raw input looks like Facebook-style copied comments
function isFacebookStyle(rawInput: string): boolean {
  const lines = rawInput.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;

  // Signal 1: presence of FB-specific UI labels, timestamps, or reaction counts
  const hasFacebookSignals = FACEBOOK_SIGNAL_PATTERNS.some(pattern => pattern.test(rawInput));
  if (hasFacebookSignals) return true;

  // Signal 2: name-like header lines followed by comment text (multi-line blocks)
  let usernameFollowedByContent = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    if (looksLikeUsername(lines[i]) && !isMetadata(lines[i + 1]) && !looksLikeUsername(lines[i + 1])) {
      usernameFollowedByContent++;
    }
  }
  // If multiple name->content transitions exist, it's structured FB-style input
  if (usernameFollowedByContent >= 2) return true;

  return false;
}

// Treat each non-empty line as a separate comment (simple input format)
function cleanSimpleLines(rawInput: string): CleaningResult {
  const allLines = rawInput.split('\n');
  const totalLines = allLines.length;

  const finalComments = allLines
    .map(line => line.trim())
    .filter(line => line.length > 0 && !isMetadata(line));

  return {
    cleanedComments: finalComments,
    stats: {
      totalLines,
      removedMetadata: totalLines - finalComments.length,
      analyzedComments: finalComments.length,
    },
  };
}

export function cleanFacebookComments(rawInput: string): CleaningResult {
  // Step 1: Detect input format and route accordingly
  if (!isFacebookStyle(rawInput)) {
    return cleanSimpleLines(rawInput);
  }

  const blockResult = cleanFacebookCommentBlocks(rawInput);

  // Safe fallback: if block-based cleaning collapsed everything into 1 comment
  // but the raw input has many short non-empty lines, treat each line as a comment.
  const nonEmptyLines = rawInput
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  if (blockResult.cleanedComments.length <= 1 && nonEmptyLines.length >= 3) {
    return cleanSimpleLines(rawInput);
  }

  return blockResult;
}

function cleanFacebookCommentBlocks(rawInput: string): CleaningResult {
  const allLines = rawInput.split('\n');
  const totalLines = allLines.length;
  
  // First pass: classify each line
  type LineType = 'metadata' | 'username' | 'content' | 'emoji' | 'empty';
  
  const classifiedLines: { type: LineType; text: string }[] = allLines.map((line, index) => {
    const trimmed = line.trim();
    
    if (!trimmed) return { type: 'empty', text: '' };
    if (isMetadata(line)) return { type: 'metadata', text: trimmed };
    
    // Check for emoji-only lines
    const emojiOnlyPattern = /^[\p{Emoji}\p{Emoji_Component}\s]+$/u;
    if (emojiOnlyPattern.test(trimmed) && !hasTextContent(trimmed)) {
      return { type: 'emoji', text: trimmed };
    }
    
    // Check if this looks like a username by looking at context
    if (looksLikeUsername(trimmed)) {
      // Look ahead to see if followed by content
      for (let i = index + 1; i < allLines.length && i < index + 5; i++) {
        const nextLine = allLines[i].trim();
        if (!nextLine) continue;
        if (isMetadata(allLines[i])) continue;
        if (!looksLikeUsername(nextLine)) {
          return { type: 'username', text: trimmed };
        }
        break;
      }
    }
    
    return { type: 'content', text: trimmed };
  });
  
  // Second pass: group into comment blocks
  // A new comment starts when we see a username (indicates new person commenting)
  const commentBlocks: string[] = [];
  let currentBlock: string[] = [];
  let lastSeenUsername = false;
  
  for (let i = 0; i < classifiedLines.length; i++) {
    const { type, text } = classifiedLines[i];
    
    if (type === 'username') {
      // Save previous block if any
      if (currentBlock.length > 0) {
        commentBlocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      lastSeenUsername = true;
    } else if (type === 'content') {
      // Content line - add to current block
      currentBlock.push(text);
      lastSeenUsername = false;
    } else if (type === 'emoji') {
      if (currentBlock.length > 0) {
        // Attach emoji to current block
        currentBlock.push(text);
      } else if (lastSeenUsername) {
        // Emoji right after username = emoji-only comment
        currentBlock.push(text);
      }
      // Otherwise skip standalone emoji not attached to anything
    } else if (type === 'metadata' || type === 'empty') {
      // Metadata/empty lines don't break comment blocks on their own
      // Only usernames start new blocks
      // However, multiple consecutive metadata lines might indicate block break
      
      // Check if we have 2+ consecutive metadata/empty lines
      let consecutiveMetadata = 0;
      for (let j = i; j < classifiedLines.length; j++) {
        if (classifiedLines[j].type === 'metadata' || classifiedLines[j].type === 'empty') {
          consecutiveMetadata++;
        } else {
          break;
        }
      }
      
      // If 3+ consecutive metadata/empty lines, treat as block separator
      if (consecutiveMetadata >= 3 && currentBlock.length > 0) {
        commentBlocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
    }
  }
  
  // Don't forget the last block
  if (currentBlock.length > 0) {
    commentBlocks.push(currentBlock.join('\n'));
  }
  
  // Filter out any empty blocks
  const finalComments = commentBlocks.filter(block => block.trim().length > 0);
  
  return {
    cleanedComments: finalComments,
    stats: {
      totalLines,
      removedMetadata: totalLines - finalComments.length,
      analyzedComments: finalComments.length,
    }
  };
}

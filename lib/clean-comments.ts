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

export function cleanFacebookComments(rawInput: string): CleaningResult {
  const allLines = rawInput.split('\n');
  const totalLines = allLines.length;
  
  // First pass: mark lines as metadata, username, or potential content
  const lineTypes: ('metadata' | 'username' | 'content' | 'emoji')[] = allLines.map((line, index) => {
    const trimmed = line.trim();
    
    if (!trimmed) return 'metadata';
    if (isMetadata(line)) return 'metadata';
    
    // Check for emoji-only lines
    const emojiOnlyPattern = /^[\p{Emoji}\p{Emoji_Component}\s]+$/u;
    if (emojiOnlyPattern.test(trimmed) && !hasTextContent(trimmed)) {
      return 'emoji';
    }
    
    // Check if this looks like a username
    // Usernames typically appear before content or metadata blocks
    if (looksLikeUsername(trimmed)) {
      // Look ahead - if next non-empty line is content, this is probably a username
      for (let i = index + 1; i < allLines.length && i < index + 5; i++) {
        const nextLine = allLines[i].trim();
        if (!nextLine) continue;
        if (isMetadata(allLines[i])) continue;
        if (!looksLikeUsername(nextLine)) {
          // Next meaningful line is content, so this is a username
          return 'username';
        }
        break;
      }
    }
    
    return 'content';
  });
  
  // Second pass: group consecutive content lines into comment blocks
  const commentBlocks: string[] = [];
  let currentBlock: string[] = [];
  
  for (let i = 0; i < allLines.length; i++) {
    const lineType = lineTypes[i];
    const trimmed = allLines[i].trim();
    
    if (lineType === 'content') {
      currentBlock.push(trimmed);
    } else if (lineType === 'emoji' && currentBlock.length > 0) {
      // Attach emoji to previous block if exists
      currentBlock.push(trimmed);
    } else {
      // Non-content line - finalize current block if any
      if (currentBlock.length > 0) {
        commentBlocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      // Standalone emoji counts as its own comment
      if (lineType === 'emoji') {
        commentBlocks.push(trimmed);
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

// src/utils/remark-plugins.js

function getCalloutIcon(type) {
  switch (type) {
    case 'note':
    case 'info':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
    case 'todo':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 11 3 3 6-6"/></svg>`;
    case 'tip':
    case 'hint':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A7.5 7.5 0 0 0 5 8c0 1.3.5 2.6 1.5 3.5.7.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
    case 'important':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16.01"/></svg>`;
    case 'warning':
    case 'caution':
    case 'attention':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12" y1="17" y2="17.01"/></svg>`;
    case 'danger':
    case 'error':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16.01"/></svg>`;
    case 'quote':
    case 'cite':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 4-4 6-4 6zm10 0c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 4-4 6-4 6z"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
  }
}

function splitTextContent(text) {
  // 1. Split by wikilinks
  const wikilinkRegex = /(!?)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let lastIndex = 0;
  let match;
  const parts = [];
  
  while ((match = wikilinkRegex.exec(text)) !== null) {
    const index = match.index;
    if (index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, index) });
    }
    
    const isImage = match[1] === '!';
    const target = match[2].trim();
    const label = match[3] ? match[3].trim() : target;
    
    if (isImage) {
      const encodedTarget = encodeURIComponent(target);
      parts.push({
        type: 'html',
        value: `<img src="/attachments/${encodedTarget}" alt="${target}" class="markdown-image" />`
      });
    } else {
      const slug = target
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      parts.push({
        type: 'link',
        url: `/writeups/${slug}`,
        children: [{ type: 'text', value: label }]
      });
    }
    lastIndex = wikilinkRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  
  if (parts.length === 0) {
    parts.push({ type: 'text', value: text });
  }
  
  // 2. Split each remaining 'text' node by tags
  const finalParts = [];
  const tagRegex = /(?<!\w)#([a-zA-Z][\w/-]*)/g;
  
  for (const part of parts) {
    if (part.type !== 'text') {
      finalParts.push(part);
      continue;
    }
    
    const partText = part.value;
    let lastIdx = 0;
    let tagMatch;
    
    while ((tagMatch = tagRegex.exec(partText)) !== null) {
      const index = tagMatch.index;
      if (index > lastIdx) {
        finalParts.push({ type: 'text', value: partText.slice(lastIdx, index) });
      }
      
      const fullTag = tagMatch[0]; // e.g. #CTF/Hackthebox/Easy
      const tagName = tagMatch[1]; // e.g. CTF/Hackthebox/Easy
      
      finalParts.push({
        type: 'html',
        value: `<span class="obsidian-tag" data-tag="${tagName}">${fullTag}</span>`
      });
      
      lastIdx = tagRegex.lastIndex;
    }
    
    if (lastIdx < partText.length) {
      finalParts.push({ type: 'text', value: partText.slice(lastIdx) });
    }
  }
  
  return finalParts;
}

export function remarkRemoveMetadataBlock() {
  return (tree) => {
    if (tree.children && tree.children.length > 0) {
      const firstChild = tree.children[0];
      if (
        firstChild.type === 'code' &&
        (firstChild.lang === 'json' || firstChild.lang === 'yaml' || !firstChild.lang) &&
        firstChild.value &&
        (firstChild.value.includes('Alias:') || firstChild.value.includes('Difficulty:'))
      ) {
        tree.children.shift();
      }
    }
  };
}

export function remarkWikilinksAndTags() {
  return (tree) => {
    function walk(node) {
      if (!node.children) return;
      
      const newChildren = [];
      for (const child of node.children) {
        if (child.type === 'text') {
          const splitNodes = splitTextContent(child.value);
          newChildren.push(...splitNodes);
        } else {
          walk(child);
          newChildren.push(child);
        }
      }
      node.children = newChildren;
    }
    walk(tree);
  };
}

export function remarkCallouts() {
  return (tree) => {
    function visitBlockquotes(node) {
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child.type === 'blockquote') {
            processBlockquote(child);
          }
          visitBlockquotes(child);
        }
      }
    }
    
    function processBlockquote(node) {
      if (!node.children || node.children.length === 0) return;
      const firstChild = node.children[0];
      if (firstChild.type !== 'paragraph' || !firstChild.children || firstChild.children.length === 0) return;
      
      const firstTextNode = firstChild.children[0];
      if (firstTextNode.type !== 'text') return;
      
      const textVal = firstTextNode.value;
      const calloutHeaderRegex = /^\[!([a-zA-Z_-]+)\](?:\s*(.*))?/;
      const match = textVal.match(calloutHeaderRegex);
      if (!match) return;
      
      const type = match[1].toLowerCase();
      let title = match[2] ? match[2].trim() : '';
      
      if (!title) {
        title = type.charAt(0).toUpperCase() + type.slice(1);
      }
      
      const headerLength = match[0].length;
      firstTextNode.value = textVal.slice(headerLength).replace(/^\n+/, '');
      
      if (firstTextNode.value === '' && firstChild.children.length > 1) {
        firstChild.children.shift();
      }
      
      node.type = 'paragraph';
      node.data = node.data || {};
      node.data.hName = 'div';
      node.data.hProperties = {
        className: `callout callout-${type}`
      };
      
      const icon = getCalloutIcon(type);
      const titleHtml = `<div class="callout-title">
        <span class="callout-icon">${icon}</span>
        <span class="callout-title-text">${title}</span>
      </div>`;
      
      const contentNode = {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { className: 'callout-content' }
        },
        children: [...node.children]
      };
      
      node.children = [
        {
          type: 'html',
          value: titleHtml
        },
        contentNode
      ];
    }
    
    visitBlockquotes(tree);
  };
}

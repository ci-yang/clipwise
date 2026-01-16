/**
 * T063: Tag Editor - 標籤編輯元件
 * 📐 Figma: 44:78 | 12-edit-bookmark.html
 *
 * Features:
 * - Add new tags by typing
 * - Remove existing tags
 * - Autocomplete from existing tags
 * - Maximum 5 tags per bookmark
 */

'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TAG_CONSTRAINTS, normalizeTag, validateTag } from '@/services/tag.service';

interface Tag {
  id: string;
  name: string;
  isAiGenerated?: boolean;
}

interface TagEditorProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  suggestions?: Tag[];
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
  placeholder?: string;
}

export function TagEditor({
  tags,
  onChange,
  suggestions = [],
  isLoading = false,
  onSearch,
  className,
  placeholder = '輸入標籤名稱...',
}: TagEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);

  // Generate stable unique ID
  const generateId = useCallback(() => {
    idCounterRef.current += 1;
    return `new-tag-${idCounterRef.current}`;
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (inputValue && onSearch) {
      const timer = setTimeout(() => {
        onSearch(inputValue);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [inputValue, onSearch]);

  const addTag = (tagName: string): void => {
    const normalized = normalizeTag(tagName);
    const validation = validateTag(normalized);

    if (!validation.valid) {
      setError(validation.error || '無效的標籤');
      return;
    }

    // Check if tag already exists
    if (tags.some((t) => t.name.toLowerCase() === normalized.toLowerCase())) {
      setError('標籤已存在');
      return;
    }

    // Check max tags
    if (tags.length >= TAG_CONSTRAINTS.maxTags) {
      setError(`最多只能添加 ${TAG_CONSTRAINTS.maxTags} 個標籤`);
      return;
    }

    // Check if it's an existing suggestion
    const existingSuggestion = suggestions.find(
      (s) => s.name.toLowerCase() === normalized.toLowerCase()
    );

    if (existingSuggestion) {
      onChange([...tags, existingSuggestion]);
    } else {
      // Create a new tag with temporary ID
      onChange([
        ...tags,
        {
          id: generateId(),
          name: normalized,
          isAiGenerated: false,
        },
      ]);
    }

    setInputValue('');
    setError(null);
    setShowSuggestions(false);
  };

  const removeTag = (tagId: string): void => {
    onChange(tags.filter((t) => t.id !== tagId));
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag when backspace on empty input
      const lastTag = tags[tags.length - 1];
      if (lastTag) {
        removeTag(lastTag.id);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !tags.some((t) => t.id === s.id) && s.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Tags Container */}
      <div
        className={cn(
          'border-border bg-card focus-within:ring-primary/50 flex min-h-[44px] flex-wrap items-center gap-2 rounded-xl border p-2 focus-within:ring-2',
          error && 'border-destructive focus-within:ring-destructive/50'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Existing Tags */}
        {tags.map((tag) => (
          <span
            key={tag.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium',
              tag.isAiGenerated
                ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff]'
                : 'bg-[rgba(19,78,74,0.3)] text-[#34d399]'
            )}
          >
            {tag.name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag.id);
              }}
              className="-mr-0.5 rounded p-0.5 transition-colors hover:bg-white/10"
              aria-label={`移除標籤 ${tag.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Input */}
        {tags.length < TAG_CONSTRAINTS.maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="text-foreground placeholder:text-muted-foreground min-w-[120px] flex-1 bg-transparent text-sm outline-none"
            maxLength={TAG_CONSTRAINTS.maxLength}
          />
        )}

        {/* Loading Indicator */}
        {isLoading && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      </div>

      {/* Error Message */}
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}

      {/* Tag Count */}
      <p className="text-muted-foreground mt-1 text-xs">
        {tags.length} / {TAG_CONSTRAINTS.maxTags} 個標籤
      </p>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="border-border bg-card absolute top-full left-0 z-10 mt-1 w-full rounded-xl border p-1 shadow-lg">
          {filteredSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => {
                onChange([...tags, suggestion]);
                setInputValue('');
                setShowSuggestions(false);
              }}
              className="text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
            >
              <Plus className="text-muted-foreground h-4 w-4" />
              {suggestion.name}
            </button>
          ))}
        </div>
      )}

      {/* Create New Tag Option */}
      {showSuggestions &&
      inputValue.trim() &&
      !filteredSuggestions.some((s) => s.name.toLowerCase() === inputValue.trim().toLowerCase()) ? (
        <div className="border-border bg-card absolute top-full left-0 z-10 mt-1 w-full rounded-xl border p-1 shadow-lg">
          <button
            onClick={() => addTag(inputValue)}
            className="text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
          >
            <Plus className="text-primary h-4 w-4" />
            建立標籤 &quot;{normalizeTag(inputValue)}&quot;
          </button>
        </div>
      ) : null}
    </div>
  );
}

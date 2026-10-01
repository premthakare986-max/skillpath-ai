import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, ExternalLink, Filter, Play, CheckCircle2,
  Clock, Globe, Shield, Tag, Youtube, Sparkles, RefreshCw, AlertCircle, ArrowUpRight, X,
  Star, ThumbsUp
} from 'lucide-react';
import { Resource, YouTubeResourceItem, TopicLearningResources, RoadmapTopicsResponse, YouTubeSearchResponse } from '../../types.js';
import {
  FadeIn, CardReveal, StaggerContainer, StaggerItem,
  MotionButton
} from '../../components/common/AnimatedWrappers.js';

interface ResourcesPageProps {
  onNavigate: (path: string) => void;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = () => {
  // Official Database Documentation Resources State
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docSearch, setDocSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');

  // Real YouTube Roadmap Topics & Dynamic Search State
  const [topicResources, setTopicResources] = useState<TopicLearningResources[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [youtubeLoading, setYoutubeLoading] = useState(true);
  const [youtubeRefreshing, setYoutubeRefreshing] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  // Community Ratings and Sorting State
  const [videoSort, setVideoSort] = useState<'recommended' | 'favorites' | 'reviews' | 'latest'>('recommended');
  const [hoveredRating, setHoveredRating] = useState<{ resourceId: string; star: number } | null>(null);
  const [ratingFeedback, setRatingFeedback] = useState<{ id: string; message: string } | null>(null);

  // Manual Search State
  const [manualQuery, setManualQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeResourceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const getHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('skillpath_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Load official documentation guides from database
  useEffect(() => {
    fetch('/api/resources')
      .then(res => res.json())
      .then(d => setResources(d.resources || []))
      .catch(err => console.error('Error loading documentation:', err))
      .finally(() => setLoadingDocs(false));
  }, []);

  // 2. Load roadmap topic-wise YouTube resources
  const loadRoadmapTopics = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setYoutubeRefreshing(true);
    } else {
      setYoutubeLoading(true);
    }
    setYoutubeError(null);

    try {
      const url = new URL('/api/youtube/roadmap-topics', window.location.origin);
      if (forceRefresh) url.searchParams.set('refresh', 'true');

      const res = await fetch(url.toString(), { headers: getHeaders() });
      const data: RoadmapTopicsResponse = await res.json();

      if (data.success && data.topics && data.topics.length > 0) {
        setTopicResources(data.topics);
      } else {
        setTopicResources([]);
        if (data.message) {
          setYoutubeError(data.message);
        }
      }
    } catch (err: any) {
      console.error('Failed to load roadmap topic resources:', err);
      setYoutubeError('YouTube learning resources are temporarily unavailable.');
    } finally {
      setYoutubeLoading(false);
      setYoutubeRefreshing(false);
    }
  };

  // 3. Search YouTube for any custom topic
  const executeManualSearch = async (query: string, forceRefresh: boolean = false) => {
    const q = query.trim();
    if (!q) return;

    setSearchLoading(true);
    setYoutubeError(null);
    setIsSearching(true);
    setActiveSearchQuery(q);

    try {
      const url = new URL('/api/youtube/search', window.location.origin);
      url.searchParams.set('query', q);
      if (forceRefresh) url.searchParams.set('refresh', 'true');

      const res = await fetch(url.toString(), { headers: getHeaders() });
      const data: YouTubeSearchResponse = await res.json();

      if (data.success && data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
        if (data.message) {
          setYoutubeError(data.message);
        }
      }
    } catch (err) {
      console.error('Failed to search YouTube:', err);
      setSearchResults([]);
      setYoutubeError('YouTube learning resources are temporarily unavailable.');
    } finally {
      setSearchLoading(false);
      setYoutubeRefreshing(false);
    }
  };

  const clearSearch = () => {
    setIsSearching(false);
    setActiveSearchQuery('');
    setManualQuery('');
    setSearchResults([]);
  };

  // Initial load: check query parameters or load student roadmap topics
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('query');
    const skillParam = params.get('skill');

    if (queryParam) {
      setManualQuery(queryParam);
      executeManualSearch(queryParam);
    } else if (skillParam) {
      setManualQuery(`${skillParam} tutorial`);
      executeManualSearch(`${skillParam} tutorial`);
    } else {
      loadRoadmapTopics();
    }
  }, []);

  const handleManualSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQuery.trim()) {
      executeManualSearch(manualQuery.trim());
    }
  };

  const handleRefresh = () => {
    if (isSearching && activeSearchQuery) {
      executeManualSearch(activeSearchQuery, true);
    } else {
      loadRoadmapTopics(true);
    }
  };

  // Submit 5-star rating for a YouTube video/playlist
  const handleRateResource = async (resourceId: string, rating: number) => {
    try {
      const res = await fetch('/api/youtube/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders()
        },
        body: JSON.stringify({ resourceId, rating })
      });

      if (res.ok) {
        const data = await res.json();
        // Update topicResources state
        setTopicResources(prev =>
          prev.map(t => ({
            ...t,
            resources: t.resources.map(r =>
              r.id === resourceId
                ? {
                    ...r,
                    averageRating: data.averageRating,
                    ratingCount: data.ratingCount,
                    userRating: data.userRating
                  }
                : r
            )
          }))
        );

        // Update searchResults state if active
        setSearchResults(prev =>
          prev.map(r =>
            r.id === resourceId
              ? {
                  ...r,
                  averageRating: data.averageRating,
                  ratingCount: data.ratingCount,
                  userRating: data.userRating
                }
              : r
          )
        );

        setRatingFeedback({ id: resourceId, message: `Flagged with ${rating} ★!` });
        setTimeout(() => setRatingFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };

  // Sort resources by Community Favorites, Reviews, or Date
  const sortResources = (list: YouTubeResourceItem[]) => {
    const copy = [...list];
    if (videoSort === 'favorites') {
      return copy.sort((a, b) => {
        const scoreA = (a.averageRating || 0) * 1000 + (a.ratingCount || 0) + (a.userRating === 5 ? 500 : 0);
        const scoreB = (b.averageRating || 0) * 1000 + (b.ratingCount || 0) + (b.userRating === 5 ? 500 : 0);
        return scoreB - scoreA;
      });
    } else if (videoSort === 'reviews') {
      return copy.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
    } else if (videoSort === 'latest') {
      return copy.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    }
    return copy;
  };

  // Filter and sort topics for the view
  const visibleTopicSections = topicResources
    .filter(t => {
      if (selectedTopic === 'All') return true;
      return t.topicName.toLowerCase() === selectedTopic.toLowerCase();
    })
    .map(t => ({
      ...t,
      resources: sortResources(t.resources)
    }));

  // Filter verified documentation
  const docTypes = ['All', 'Learn', 'Practice', 'Build'];
  const docDifficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredDocs = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(docSearch.toLowerCase()) ||
      r.topic.toLowerCase().includes(docSearch.toLowerCase()) ||
      (r.skill_name && r.skill_name.toLowerCase().includes(docSearch.toLowerCase())) ||
      r.platform.toLowerCase().includes(docSearch.toLowerCase());

    const matchesType = typeFilter === 'All' || r.resource_type === typeFilter;
    const matchesDiff = diffFilter === 'All' || r.difficulty === diffFilter;

    return matchesSearch && matchesType && matchesDiff;
  });

  // Render resource card with direct YouTube links and 5-star rating system
  const renderResourceCard = (item: YouTubeResourceItem, fallbackTopic?: string) => {
    const isPlaylist = item.type === 'playlist';
    const relatedTopic = item.skillName || item.topic || fallbackTopic || 'Roadmap Topic';
    const isCommunityFavorite = (item.averageRating && item.averageRating >= 4.7) || item.userRating === 5;

    return (
      <div
        key={item.id}
        className={`rounded-2xl border bg-slate-950/80 overflow-hidden flex flex-col justify-between transition-all group backdrop-blur-sm ${
          isCommunityFavorite
            ? 'border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-500/5'
            : 'border-slate-800/90 hover:border-red-900/60'
        }`}
      >
        <div>
          {/* Real YouTube Video / Playlist Thumbnail */}
          <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                <Youtube className="h-8 w-8" />
              </div>
            )}

            {/* Community Favorite Badge */}
            {isCommunityFavorite && (
              <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 backdrop-blur-md shadow-md flex items-center gap-1 font-sans">
                <Sparkles className="h-3 w-3 fill-slate-950" />
                <span>Community Favorite</span>
              </span>
            )}
            
            {/* Real Type Badge (VIDEO or PLAYLIST) */}
            <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-md border font-mono ${
              isPlaylist
                ? 'bg-amber-950/90 text-amber-300 border-amber-600/40'
                : 'bg-black/80 text-white border-white/10'
            }`}>
              {isPlaylist ? 'PLAYLIST' : 'VIDEO'}
            </span>

            {/* Related Roadmap Topic Badge */}
            <span className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-slate-200 border border-white/10 max-w-[85%] truncate">
              {relatedTopic}
            </span>
          </div>

          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-red-400 font-medium">
              <span className="truncate flex items-center gap-1">
                <Youtube className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{item.channelTitle || 'YouTube Creator'}</span>
              </span>
              {item.publishedAt && (
                <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2 font-mono">
                  {item.publishedAt}
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug line-clamp-2 group-hover:text-red-300 transition-colors">
              {item.title}
            </h4>

            {item.description && (
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Interactive 5-Star Rating System */}
            <div className="pt-2.5 border-t border-slate-900 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isHovered = hoveredRating?.resourceId === item.id && hoveredRating.star >= star;
                    const isFilled = isHovered || (!hoveredRating && (item.userRating ? item.userRating >= star : Math.round(item.averageRating || 0) >= star));

                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating({ resourceId: item.id, star })}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => handleRateResource(item.id, star)}
                        className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                        title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`h-4 w-4 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-bold text-amber-400 ml-1.5 font-mono">
                    {item.averageRating ? item.averageRating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({item.ratingCount || 0})
                  </span>
                </div>

                {/* Quick 5-Star Flag Button */}
                <button
                  type="button"
                  onClick={() => handleRateResource(item.id, 5)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    item.userRating === 5
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                  }`}
                  title="Flag as 5-star community favorite"
                >
                  <Star className={`h-3 w-3 ${item.userRating === 5 ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>{item.userRating === 5 ? 'Flagged ★★★★★' : 'Flag High Quality'}</span>
                </button>
              </div>

              {/* Status Note / Feedback */}
              <div className="flex items-center justify-between text-[10px] min-h-[16px]">
                {ratingFeedback?.id === item.id ? (
                  <span className="text-emerald-400 font-medium">
                    ✓ {ratingFeedback.message}
                  </span>
                ) : item.userRating ? (
                  <span className="text-amber-400/90 font-medium">
                    Your rating: {item.userRating} ★
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Click a star to rate
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Direct YouTube Button (Mandatory Requirement) */}
        <div className="p-4 pt-2 border-t border-slate-900">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600/90 hover:bg-red-600 py-2.5 px-4 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all cursor-pointer min-h-[40px]"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>{isPlaylist ? 'Open Playlist' : 'Watch on YouTube'}</span>
            <ArrowUpRight className="h-3.5 w-3.5 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="py-4 sm:py-8 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 overflow-x-hidden">
      
      {/* Header */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Learning & Video Resources</h1>
            <span className="text-[10px] sm:text-xs text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40 font-semibold flex items-center gap-1">
              <Youtube className="h-3 w-3" />
              <span>Real YouTube Learning</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real educational video courses and playlists mapped directly to your personalized roadmap topics, paired with official technical documentation.
          </p>
        </div>
      </FadeIn>

      {/* ==================================================== */}
      {/* REAL YOUTUBE LEARNING SECTION (TOPIC-WISE & SEARCH) */}
      {/* ==================================================== */}
      <section className="space-y-5">
        <CardReveal className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-900 p-5 sm:p-7 shadow-xl backdrop-blur-sm space-y-6">
          
          {/* Top Control Bar: Heading & Refresh Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <span>Topic-Wise YouTube Learning</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                  Live Discovery
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {isSearching
                  ? `Search Results for "${activeSearchQuery}"`
                  : 'Roadmap Topic Courses & Playlists'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                <span>
                  {isSearching
                    ? 'Displaying real YouTube educational content for your search term'
                    : 'Automatically matched to the skills and topics on your active roadmap'}
                </span>
              </p>
            </div>

            {/* Refresh Videos Action */}
            <MotionButton
              onClick={handleRefresh}
              disabled={youtubeRefreshing || youtubeLoading || searchLoading}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer self-start md:self-auto min-h-[40px]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${youtubeRefreshing ? 'animate-spin text-red-400' : ''}`} />
              <span>{youtubeRefreshing ? 'Updating...' : 'Refresh Videos'}</span>
            </MotionButton>
          </div>

          {/* Interactive Roadmap Topic Buttons & Filter Chips */}
          <div className="space-y-3">
            {!isSearching && topicResources.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Roadmap Priorities & Topics:
                  </span>
                  {selectedTopic !== 'All' && (
                    <button
                      onClick={() => setSelectedTopic('All')}
                      className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer font-medium"
                    >
                      Show All Topics
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setSelectedTopic('All')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer min-h-[34px] ${
                      selectedTopic === 'All'
                        ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-500/25'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    All Topics
                  </button>

                  {topicResources.map((t, idx) => {
                    const isActive = selectedTopic.toLowerCase() === t.topicName.toLowerCase();
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedTopic(t.topicName)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer min-h-[34px] flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-500/25'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span>{t.topicName}</span>
                        <span className="text-[10px] opacity-70 font-mono">({t.resources.length})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sort Controls Bar with Community Favorites */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
                  <Filter className="h-3 w-3 text-slate-500" />
                  <span>Sort by:</span>
                </span>
                {[
                  { id: 'recommended', label: 'Recommended' },
                  { id: 'favorites', label: '⭐ Community Favorites' },
                  { id: 'reviews', label: 'Most Reviewed' },
                  { id: 'latest', label: 'Latest' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setVideoSort(s.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[32px] ${
                      videoSort === s.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {videoSort === 'favorites' && (
                <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-xl font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Showing student-flagged high-quality videos & 5-star community favorites first</span>
                </div>
              )}
            </div>

            {/* Search YouTube Bar */}
            <form onSubmit={handleManualSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Search any topic (e.g. React Hooks, DSA for placement, Docker)..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none min-h-[42px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <MotionButton
                  type="submit"
                  disabled={searchLoading || !manualQuery.trim()}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-semibold text-white shadow-sm shadow-red-500/20 transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                >
                  <Youtube className="h-3.5 w-3.5" />
                  <span>{searchLoading ? 'Searching...' : 'Search YouTube'}</span>
                </MotionButton>

                {isSearching && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center"
                    title="Return to Roadmap Topics"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ==================================================== */}
          {/* SEARCH RESULTS VIEW (WHEN SEARCHING MANUALLY) */}
          {/* ==================================================== */}
          {isSearching ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  YouTube Results for &ldquo;{activeSearchQuery}&rdquo;
                </h3>
                <button
                  onClick={clearSearch}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>&larr; Back to Roadmap Topics</span>
                </button>
              </div>

              {searchLoading ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-red-500 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Finding learning resources...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8 text-center space-y-2">
                  <Youtube className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No YouTube learning resources found for this topic.</p>
                  <p className="text-xs text-slate-500">Try searching with broader or alternative keywords.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {sortResources(searchResults).map((item) => renderResourceCard(item, activeSearchQuery))}
                </div>
              )}
            </div>
          ) : (
            /* ==================================================== */
            /* TOPIC-WISE ROADMAP RESOURCES VIEW */
            /* ==================================================== */
            <div className="space-y-8 pt-2">
              {youtubeLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="h-7 w-7 animate-spin text-red-500 mx-auto" />
                  <p className="text-sm text-slate-200 font-medium">Finding learning resources for your roadmap...</p>
                  <p className="text-xs text-slate-500">Retrieving real courses and playlists directly from YouTube</p>
                </div>
              ) : youtubeError ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-6 sm:p-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    YouTube learning resources are temporarily unavailable.
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                    We encountered an issue discovering learning content. Please retry or search for specific topics above.
                  </p>
                  <div className="pt-2">
                    <MotionButton
                      onClick={() => loadRoadmapTopics(true)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors cursor-pointer min-h-[40px]"
                    >
                      Retry Discovery
                    </MotionButton>
                  </div>
                </div>
              ) : visibleTopicSections.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8 text-center space-y-2">
                  <Youtube className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No YouTube learning resources found for this topic.</p>
                  <p className="text-xs text-slate-500">Click &quot;Show All Topics&quot; above to view available roadmap courses.</p>
                </div>
              ) : (
                /* Topic-Wise Sections */
                visibleTopicSections.map((topicItem, tIdx) => (
                  <div key={tIdx} className="space-y-3 pb-6 border-b border-slate-800/80 last:border-b-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          <span>{topicItem.topicName}</span>
                        </h3>
                        {topicItem.phaseTitle && (
                          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-mono">
                            {topicItem.phaseTitle}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {topicItem.resources.filter(r => r.type === 'video').length} videos · {topicItem.resources.filter(r => r.type === 'playlist').length} playlists
                      </span>
                    </div>

                    {topicItem.resources.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">
                        No YouTube learning resources found for this topic.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {topicItem.resources.map((res) => renderResourceCard(res, topicItem.topicName))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </CardReveal>
      </section>

      {/* ==================================================== */}
      {/* VERIFIED OFFICIAL GUIDES (PRESERVED DOCUMENTATION) */}
      {/* ==================================================== */}
      <section className="space-y-6 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Verified Documentation & Official Guides</h2>
              <span className="text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">Official Only</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Curated official documentation and practical challenges for every skill in your roadmap. Zero invented links.
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search by topic, skill, platform..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none min-h-[42px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {docTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] cursor-pointer ${
                    typeFilter === t ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {docDifficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] cursor-pointer ${
                    diffFilter === d ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Official Resources Cards Grid */}
        {loadingDocs ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading resources...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
            <BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No verified resources match your filter.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the search terms or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDocs.map((res) => (
              <CardReveal
                key={res.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-700 transition-all backdrop-blur-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                      {res.resource_type}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {res.platform}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight leading-snug">{res.title}</h3>
                  <p className="mt-1 text-xs text-slate-400 font-mono">Skill: {res.skill_name || 'Web'}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{res.duration_minutes} min</span>
                    </span>
                    <span className="text-slate-300 font-medium">{res.difficulty}</span>
                    <span className="text-emerald-400">{res.is_free ? 'Free' : 'Paid'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800">
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 px-4 text-xs font-semibold text-white transition-colors min-h-[40px]"
                  >
                    <span>Open Official Guide</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </a>
                </div>
              </CardReveal>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
